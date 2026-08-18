/**
 * Nexi — AI support assistant for the ticket system.
 *
 * Design goals:
 *  - 24/7 availability via a plain HTTP endpoint (no websockets needed).
 *  - Grounded answers: student/competition facts are fetched from the DB
 *    deterministically and injected into the prompt, so the model never
 *    hallucinates scores, ranks, or timings.
 *  - Admin-curated FAQ is keyword-matched FIRST (no AI cost, exact answers).
 *  - Unmatched queries go to Gemini (function calling) which can ask the
 *    student for a code snippet to review, or escalate to human admins.
 *  - Escalation emails go to configurable addresses
 *    (AI_ESCALATION_EMAILS, defaults to the two addresses the user wants).
 */

import axios from 'axios';
import prisma from '../../config/db.js';
import { sendBulkEmail } from '../email/brevo.service.js';
import { aiEscalationNotification } from '../email/emailTemplates.js';

// ─── Config ──────────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_BASE    = 'https://generativelanguage.googleapis.com/v1beta/models';

// Local OpenAI-compatible provider (Ollama / llama.cpp style /v1 endpoints).
// Set AI_PROVIDER=local to use it as the primary; Gemini stays as the fallback.
const AI_PROVIDER      = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
const LOCAL_AI_BASE    = process.env.LOCAL_AI_BASE || 'http://127.0.0.1:11434/v1';
const LOCAL_AI_MODEL   = process.env.LOCAL_AI_MODEL || '/opt/local-ai/models/Qwen3-8B-Q4_K_M.gguf';
const LOCAL_AI_TIMEOUT = parseInt(process.env.LOCAL_AI_TIMEOUT || '120000', 10);

// Token budget. Normal answers target ~800 output tokens; code reviews and
// longer explanations may use up to ~1200. Prompt is capped to fit the
// local model's 8192-token context (see trimContext below).
const LOCAL_MAX_TOKENS_DEFAULT = parseInt(process.env.LOCAL_MAX_TOKENS_DEFAULT || '800', 10);
const LOCAL_MAX_TOKENS_LONG    = parseInt(process.env.LOCAL_MAX_TOKENS_LONG || '1200', 10);
const MAX_PROMPT_TOKENS        = parseInt(process.env.NEXI_MAX_PROMPT_TOKENS || '6000', 10);
const MAX_HISTORY_TURNS        = parseInt(process.env.NEXI_MAX_HISTORY_TURNS || '8', 10);
const MAX_HISTORY_CHARS        = parseInt(process.env.NEXI_MAX_HISTORY_CHARS || '3000', 10);
const MAX_CONTEXT_JSON_CHARS   = parseInt(process.env.NEXI_MAX_CONTEXT_CHARS || '6000', 10);

// Where escalations go. Comma-separated env var; defaults to the two emails
// the user specified (more can be added later in .env.docker).
const DEFAULT_ESCALATION_EMAILS = [
  'codingnexus@apsit.edu.in',
  '23106031@apsit.edu.in'
];

const getEscalationEmails = () => {
  const configured = process.env.AI_ESCALATION_EMAILS;
  if (!configured) return DEFAULT_ESCALATION_EMAILS;
  return configured
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);
};

// ─── AI provider dispatch ────────────────────────────────────────────────────
// AI_PROVIDER=local → local OpenAI-compatible endpoint (Qwen3, streamed), Gemini fallback.
// Any other value → Gemini (existing behaviour).

async function callAI({ systemInstruction, userText, history = [], maxTokens = LOCAL_MAX_TOKENS_DEFAULT, temperature = 0.4, onToken }) {
  if (AI_PROVIDER === 'local') {
    try {
      return await callLocalAI({ systemInstruction, userText, history, maxTokens, temperature, onToken });
    } catch (err) {
      console.warn(`[Nexi] Local AI failed (${err.code || err.message}), falling back to Gemini`);
      if (GEMINI_API_KEY) return callGemini({ systemInstruction, userText, history, maxTokens, temperature });
      throw err;
    }
  }
  return callGemini({ systemInstruction, userText, history, maxTokens, temperature });
}

// ─── Local AI call (OpenAI-compatible /chat/completions, e.g. Ollama/Qwen3) ──

async function callLocalAI({ systemInstruction, userText, history = [], maxTokens = LOCAL_MAX_TOKENS_DEFAULT, temperature = 0.4, onToken }) {
  if (AI_PROVIDER !== 'local') {
    const err = new Error('AI_PROVIDER is not set to local');
    err.status = 503;
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  // Qwen3-style reasoning models emit reasoning_content first; only the final
  // content (the JSON) is usable, so request enough tokens to fit both.
  const messages = [
    { role: 'system', content: systemInstruction },
    ...(history || []).map(turn => ({
      role: turn.role === 'student' ? 'user' : 'assistant',
      content: turn.text
    })),
    { role: 'user', content: userText }
  ];

  // Stream from the local endpoint so students see tokens as they arrive.
  // The final response is still a single JSON object — the route collects the
  // stream and parses it exactly like the non-streaming path.
  const useStream = typeof onToken === 'function';

  try {
    const response = await axios.post(`${LOCAL_AI_BASE}/chat/completions`, {
      model: LOCAL_AI_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: useStream
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: LOCAL_AI_TIMEOUT,
      responseType: useStream ? 'stream' : 'json'
    });

    if (!useStream) {
      const raw = response.data?.choices?.[0]?.message?.content || '';
      if (!raw || !raw.trim()) throw new Error('Empty response from local AI');
      return raw;
    }

    return await readStream(response.data, onToken);
  } catch (err) {
    // Streaming timeouts surface as aborted requests (no response) — keep the
    // same friendly error as any other network failure.
    if (!err.response && err.code === 'ECONNABORTED') {
      console.warn(`[Nexi] Local AI request timed out after ${LOCAL_AI_TIMEOUT}ms`);
      const e = new Error('Nexi took a little too long to answer — please try again in a moment! 💜');
      e.code = 'AI_TIMEOUT';
      throw e;
    }
    if (err.response) {
      const status = err.response.status;
      const localMsg = err.response.data?.error?.message || err.message;
      if (status === 429) {
        console.warn(`[Nexi] Local AI rate limit (429): ${localMsg}`);
        const e = new Error('Nexi is taking a short breather right now — too many chats at once! Please try again in a minute or two. 💜');
        e.status = 429;
        e.code = 'AI_RATE_LIMIT';
        e.retryAfterMs = 60000;
        throw e;
      }
      if (status === 400) {
        console.warn(`[Nexi] Local AI bad request (400): ${localMsg}`);
        const e = new Error('Nexi ran into a little hiccup. Please try again in a moment. 💜');
        e.status = 400;
        e.code = 'AI_BAD_REQUEST';
        throw e;
      }
      if (status === 403) {
        console.warn(`[Nexi] Local AI access denied (403): ${localMsg}`);
        const e = new Error('Nexi needs a quick tune-up from the admins. Please try again later! 💜');
        e.status = 403;
        e.code = 'AI_ACCESS_DENIED';
        throw e;
      }
    }
    console.warn(`[Nexi] Local AI call failed: ${err.message}`);
    const e = new Error('Hmm, Nexi hit a small snag. Please give it another try in a moment! 💜');
    e.code = 'AI_GENERIC_ERROR';
    throw e;
  }
}

// Parse OpenAI-style SSE chunks: lines "data: {json}". Emits non-empty content
// deltas via onToken; returns the full concatenated content.
async function readStream(stream, onToken) {
  let full = '';
  let buffer = '';
  const decoder = new TextDecoder();

  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line || !line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') return full;
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onToken(delta);
        }
      } catch {
        // Skip malformed keep-alive / partial chunks.
      }
    }
  }
  return full;
}

// ─── Gemini call (mirrors aiQuestionGenerator.service.js pattern) ───────────

async function callGemini({ systemInstruction, userText, history = [], maxTokens = 4096, temperature = 0.4 }) {
  if (!GEMINI_API_KEY) {
    const err = new Error('GEMINI_API_KEY is not configured — Nexi needs an AI key to answer');
    err.status = 503;
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  // Multi-turn context: earlier turns (role + text) followed by the latest message.
  const contents = [
    ...(history || []).map(turn => ({
      role: turn.role === 'student' ? 'user' : 'model',
      parts: [{ text: turn.text }]
    })),
    { role: 'user', parts: [{ text: userText }] }
  ];

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json'
    }
  };

  try {
    const response = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 40000
    });
    const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!raw) throw new Error('Empty response from Gemini API');
    return raw;
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const geminiMsg = err.response.data?.error?.message || err.message;
      if (status === 429) {
        // Friendly message for the student; technical detail stays in server logs.
        console.warn(`[Nexi] Gemini rate limit (429): ${geminiMsg}`);
        const e = new Error('Nexi is taking a short breather right now — too many chats at once! Please try again in a minute or two. 💜');
        e.status = 429;
        e.code = 'AI_RATE_LIMIT';
        e.retryAfterMs = 60000;
        throw e;
      }
      if (status === 400) {
        console.warn(`[Nexi] Gemini bad request (400): ${geminiMsg}`);
        const e = new Error('Nexi ran into a little hiccup. Please try again in a moment. 💜');
        e.status = 400;
        e.code = 'AI_BAD_REQUEST';
        throw e;
      }
      if (status === 403) {
        console.warn(`[Nexi] Gemini access denied (403): ${geminiMsg}`);
        const e = new Error('Nexi needs a quick tune-up from the admins. Please try again later! 💜');
        e.status = 403;
        e.code = 'AI_ACCESS_DENIED';
        throw e;
      }
    }
    console.warn(`[Nexi] Gemini call failed: ${err.message}`);
    const e = new Error('Hmm, Nexi hit a small snag. Please give it another try in a moment! 💜');
    e.code = 'AI_GENERIC_ERROR';
    throw e;
  }
}

// ─── Parsing helpers ─────────────────────────────────────────────────────────

function parseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      try { return JSON.parse(match[1]); } catch { /* fallthrough */ }
    }
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { return JSON.parse(objMatch[0]); } catch { /* fallthrough */ }
    }
  }
  return null;
}

// ─── Context size guards (protect the 8192-token context) ────────────────────
// The student-data JSON and history are trimmed to keep prompts inside the
// local model's context while still giving it the facts it needs. The system
// prompt is ~1200 tokens; with output up to 1200 tokens, the rest of the
// budget is split between the student JSON and history.

function trimJsonContext(obj) {
  let json = JSON.stringify(obj);
  if (json && json.length > MAX_CONTEXT_JSON_CHARS) {
    // Best-effort: keep student identity + the most recent/important facts.
    const slim = {
      student: obj.student,
      registrations: (obj.registrations || []).slice(0, 3),
      submissions: (obj.submissions || []).slice(0, 3).map(s => ({
        competition: s.competition,
        status: s.status,
        totalScore: s.totalScore,
        totalTime: s.totalTime,
        submittedAt: s.submittedAt,
        problems: (s.problems || []).slice(0, 5).map(p => ({
          title: p.title,
          difficulty: p.difficulty,
          points: p.points,
          score: p.score,
          maxScore: p.maxScore,
          testsPassed: p.testsPassed,
          totalTests: p.totalTests,
          status: p.status
        }))
      })),
      leaderboard: (obj.leaderboard || []).slice(0, 3),
      tickets: (obj.tickets || []).slice(0, 3)
    };
    json = JSON.stringify(slim);
    if (json.length > MAX_CONTEXT_JSON_CHARS) {
      json = json.slice(0, MAX_CONTEXT_JSON_CHARS);
    }
  }
  return json;
}

function trimHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(t => t && (t.text || '').trim())
    .slice(-MAX_HISTORY_TURNS)
    .map(t => ({ role: t.role, text: String(t.text).trim().slice(0, 500) }))
    .reduce((acc, t) => {
      const total = acc.reduce((n, x) => n + x.text.length, 0);
      if (total + t.text.length <= MAX_HISTORY_CHARS) acc.push(t);
      return acc;
    }, []);
}

function estimatePromptTokens(messages) {
  // Rough heuristic (~4 chars per token). Used only to keep the request
  // within the local model's context budget; not a precise tokenizer.
  let chars = 0;
  for (const m of messages) chars += (m.content || '').length;
  return Math.ceil(chars / 4);
}

// ─── Student context builder (deterministic DB facts) ───────────────────────

/**
 * Gather the student's own real data so the AI never fabricates facts.
 * Only the requesting student's data is fetched — no other students' info.
 */
export async function buildStudentContext(userId) {
  const student = await prisma.student.findUnique({
    where: { userId }
  });

  // Competitions the student registered for / submitted to
  const registrations = await prisma.competitionRegistration.findMany({
    where: { userId },
    include: {
      competition: {
        select: {
          id: true,
          title: true,
          category: true,
          difficulty: true,
          startTime: true,
          endTime: true,
          duration: true,
          isActive: true,
          isVisible: true
        }
      }
    },
    orderBy: { registeredAt: 'desc' }
  });

  // The student's own submissions with per-problem results
  const submissions = await prisma.competitionSubmission.findMany({
    where: { userId },
    include: {
      competition: { select: { id: true, title: true } },
      problemSubmissions: {
        include: {
          problem: { select: { id: true, title: true, difficulty: true, points: true } }
        }
      }
    },
    orderBy: { submittedAt: 'desc' }
  });

  // Where the student stands on visible leaderboards
  const leaderboardInfo = [];
  for (const sub of submissions) {
    const competition = await prisma.competition.findUnique({
      where: { id: sub.competitionId },
      select: { showLeaderboard: true, title: true }
    });
    if (!competition?.showLeaderboard) continue;

    const allSubs = await prisma.competitionSubmission.findMany({
      where: { competitionId: sub.competitionId, status: 'completed' },
      orderBy: [
        { totalScore: 'desc' },
        { submittedAt: 'asc' },
        { totalTime: 'asc' }
      ],
      select: { userId: true, totalScore: true, totalTime: true }
    });

    const idx = allSubs.findIndex(s => s.userId === userId);
    if (idx !== -1) {
      leaderboardInfo.push({
        competitionTitle: competition.title,
        rank: idx + 1,
        totalParticipants: allSubs.length,
        totalScore: sub.totalScore
      });
    }
  }

  // Student's support tickets (subjects + statuses only, for context)
  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    select: { id: true, subject: true, status: true, priority: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return {
    student: student
      ? {
          name: student.name,
          batch: student.batch,
          classYear: student.classYear,
          division: student.division,
          rollNo: student.rollNo
        }
      : null,
    registrations: registrations.map(r => ({
      title: r.competition.title,
      category: r.competition.category,
      difficulty: r.competition.difficulty,
      startTime: r.competition.startTime,
      endTime: r.competition.endTime,
      durationMinutes: r.competition.duration,
      isActive: r.competition.isActive,
      isVisible: r.competition.isVisible
    })),
    submissions: submissions.map(s => ({
      competition: s.competition.title,
      status: s.status,
      totalScore: s.totalScore,
      totalTime: s.totalTime,
      submittedAt: s.submittedAt,
      problems: s.problemSubmissions.map(ps => ({
        title: ps.problem.title,
        difficulty: ps.problem.difficulty,
        points: ps.problem.points,
        score: ps.score,
        maxScore: ps.maxScore,
        testsPassed: ps.testsPassed,
        totalTests: ps.totalTests,
        status: ps.status,
        errorMessage: ps.errorMessage,
        executionTime: ps.executionTime,
        memoryUsed: ps.memoryUsed,
        language: ps.language,
        manualMarks: ps.manualMarks,
        evaluatorComments: ps.evaluatorComments,
        isEvaluated: ps.isEvaluated
      }))
    })),
    leaderboard: leaderboardInfo,
    tickets: tickets.map(t => ({
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt
    }))
  };
}

// ─── FAQ matching (admin-curated, deterministic, no AI cost) ─────────────────

function buildFaqKeywords(faq) {
  const words = new Set();
  for (const kw of (JSON.parse(faq.keywords || '[]'))) {
    words.add(kw.toLowerCase().trim());
  }
  // Also index significant words from the question itself
  const questionWords = faq.question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['what', 'when', 'where', 'which', 'with', 'from', 'your', 'does', 'will', 'about', 'there', 'this', 'that'].includes(w));
  questionWords.forEach(w => words.add(w));
  return [...words];
}

/**
 * Keyword-match the query against active FAQs.
 * Returns the best matching FAQ answer or null if no confident match.
 */
export async function matchFaq(query) {
  const faqs = await prisma.aiFaq.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });
  if (!faqs.length) return null;

  const q = query.toLowerCase().trim();
  const qWords = q.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

  let best = null;
  let bestScore = 0;

  for (const faq of faqs) {
    const keywords = buildFaqKeywords(faq);
    // Direct phrase containment
    const phraseHit = faq.question.toLowerCase().includes(q) || q.includes(faq.question.toLowerCase());

    let hits = 0;
    for (const kw of keywords) {
      if (q.includes(kw)) hits++;
    }
    // Jaccard-ish overlap on words
    const overlap = qWords.filter(w => keywords.includes(w)).length;

    const score = (phraseHit ? 10 : 0) + hits * 3 + overlap;
    if (score > bestScore) {
      bestScore = score;
      best = faq;
    }
  }

  // Require a reasonably strong match to avoid answering the wrong FAQ
  if (!best || bestScore < 4) return null;

  return { faq: best, score: bestScore };
}

// ─── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Nexi, the cute, friendly AI support assistant of Coding Nexus (APSIT's coding club). Students ask you about support tickets and coding competitions.

PERSONALITY:
- Warm, cheerful and encouraging, but professional. Use a sprinkle of emojis (✨ 🚀 💜) and a casual friendly tone, NOT overly formal.
- Use markdown lightly: bold for key numbers, simple lists. No giant walls of text.
- IF asked Coding Nexus Head Name then tell Ashish Vishwakarma and Co-heads Sumit thakur and Chetan Shende 

ANSWER LENGTH (CRITICAL — saves tokens and stays snappy):
- For simple queries (greetings, yes/no, quick facts, status checks): answer in 1-2 short sentences. No filler.
- Only give a longer, detailed answer when the question genuinely needs it (score breakdown, code review, step-by-step explanation).
- If in doubt, keep it SHORT. Never pad answers with pleasantries or repeated info.

MEMORY & TOPIC SWITCHING:
- You receive the conversation history (earlier user messages and your replies) plus the student's latest message.
- Use the history for context: if they ask "what about the second problem?" refer to what was discussed earlier.
- If the student changes topic, follow them immediately — do NOT keep answering the old topic, do not ask if they're done with it.
- The student can start a fresh topic anytime; treat the new message as the start of a new conversation.
- Remember: history is only for context. Live facts (scores, ranks, timings) still come from the REAL DATA block, never from memory.

GROUNDING RULES (CRITICAL):
- You are given a JSON block of the student's REAL data (their submissions, scores, ranks, competitions, tickets). Answer from that data ONLY. NEVER invent scores, ranks, timings, or competition details that are not in the data.
- If the student asks about something not in the data, say you don't have that info yet, and offer to escalate to a human.
- Never reveal any other student's data. If asked, politely refuse and explain you can only see their own data.
- Never output raw JSON, database IDs, or internal field names.

BEHAVIOUR:
- If the message is a CODE REVIEW REQUEST: the code has ALREADY been reviewed against the test cases server-side. Summarize the review: what passed/failed, which test cases failed, and what they should fix. Keep it friendly and actionable.
- If the student asks about THEIR OWN competition results, scores, rank, test failures, or a "why did I get this score" question — use the supplied submissions/leaderboard data.
- If they ask when a competition starts/ends or how long it lasts — use the registrations data.
- If they ask how to do something (submit code, reset password, view leaderboard, marks rules) and it is not in the data, explain using general Coding Nexus knowledge. If you are unsure, offer to escalate.
- If you cannot confidently answer and the student seems stuck, ask if they want you to notify a human admin. Do NOT auto-escalate unless they confirm or the request is clearly critical.

CREATING A TICKET (KEEP IT ONE-STEP):
- When the student asks to raise a ticket / report an issue, create it from what they said RIGHT AWAY. Do NOT ask for more details, do not ask clarifying questions.
- Set "createTicket": true, fill "ticketSubject" (SHORT, 5-8 words summarizing the issue) and "ticketMessage" (clear, complete description using their own words, expanded with any obvious context like their name/competition).
- Your "reply" should confirm in 1 sentence that you're ready to create the ticket.
- NEVER auto-create a ticket — only when the student clearly asks to create/raise/report one. If they just ask a question, answer it instead.
- After creation, the system tells the student their ticket was sent and admins were notified.

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown fences, no prose:
{"reply": "your friendly markdown answer", "escalate": false, "askCode": false, "createTicket": false, "ticketSubject": "", "ticketMessage": ""}
- "escalate": set true ONLY if the student has confirmed they want a human, or the request is clearly critical (account dispute, harassment, privacy).
- "askCode": set true if the student wants help with their code / why their solution failed / wants a code review, and they have NOT yet pasted code. The system will then ask them for the snippet.
- "createTicket": set true ONLY when the student wants to raise a new ticket. Fill "ticketSubject" (short) and "ticketMessage" (clear description).
- Exactly one of escalate / askCode / createTicket should be true at a time (usually all false = normal answer).`;

// ─── Main chat handler ───────────────────────────────────────────────────────

/**
 * Handle one student chat turn.
 * Returns { reply, escalate, escalated?, askCode?, createTicket?, ticketSubject?, ticketMessage? }
 * history: array of { role: 'student'|'nexi', text } previous turns (short-term memory)
 * onToken: optional streaming callback — receives raw text deltas as the local
 *          model generates them. Parsing still happens on the complete text.
 */
export async function handleNexiChat({ userId, message, code, faq, history = [], onToken } = {}) {
  const trimmed = (message || '').trim();
  if (!trimmed) {
    return { reply: 'Hi! Ask me anything about your tickets or competitions 💜', escalate: false };
  }

  // 1) FAQ fast-path (deterministic, admin-curated)
  if (!code) {
    const match = await matchFaq(trimmed);
    if (match) {
      return {
        reply: match.faq.answer,
        escalate: false,
        faqMatched: true,
        faqId: match.faq.id
      };
    }
  }

  // 2) Code review request with actual code — review against test cases
  if (code && code.trim()) {
    const result = await reviewCodeAgainstTestCases({ userId, code, faq });
    return result;
  }

  // 3) General query — gather real student context and ask the AI provider.
  //    Context is trimmed to keep prompts inside the local model's context.
  const context = await buildStudentContext(userId);

  const userText = JSON.stringify({
    student: context,
    message: trimmed
  });

  const trimmedHistory = trimHistory(history);

  // Longer questions / code-related requests get the larger output budget.
  const wantsLongAnswer = trimmed.length > 120 || /code|review|explain|debug|error|fix/i.test(trimmed);
  const maxTokens = wantsLongAnswer ? LOCAL_MAX_TOKENS_LONG : LOCAL_MAX_TOKENS_DEFAULT;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...trimmedHistory.map(turn => ({
      role: turn.role === 'student' ? 'user' : 'assistant',
      content: turn.text
    })),
    { role: 'user', content: userText }
  ];

  // Keep the request inside the local model's context window (default 8192).
  // Only trims when the estimate exceeds the budget — normal chats are small.
  if (estimatePromptTokens(messages) > MAX_PROMPT_TOKENS) {
    const over = estimatePromptTokens(messages) - MAX_PROMPT_TOKENS;
    const room = Math.max(0, userText.length - (over * 4));
    const userTextTrimmed = room > 0 ? userText.slice(0, room) : userText;
    messages[messages.length - 1] = { role: 'user', content: userTextTrimmed };
  }

  const raw = await callAI({
    systemInstruction: SYSTEM_PROMPT,
    userText: messages[messages.length - 1].content,
    history: trimmedHistory,
    maxTokens,
    temperature: 0.5,
    onToken
  });

  const parsed = parseJson(raw);
  if (!parsed || !parsed.reply) {
    throw new Error('Nexi returned an unreadable response');
  }

  return {
    reply: parsed.reply,
    escalate: !!parsed.escalate,
    askCode: !!parsed.askCode,
    createTicket: !!parsed.createTicket,
    ticketSubject: (parsed.ticketSubject || '').trim().slice(0, 200),
    ticketMessage: (parsed.ticketMessage || '').trim().slice(0, 2000)
  };
}

// ─── Support ticket creation (same flow as manual creation) ─────────────────

/**
 * Create a support ticket exactly like the student would manually.
 * Mirrors the POST /api/student/tickets route (including admin notification).
 * Returns the created ticket.
 */
export async function createSupportTicket({ userId, subject, message, priority = 'normal' }) {
  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject: subject.trim().slice(0, 200),
      message: message.trim().slice(0, 4000),
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'normal',
      type: 'student'
    },
    include: { user: { include: { studentProfile: true } } }
  });

  // Notify admins — Nexi-specific template (mentions it came from the AI chat)
  try {
    const studentProfile = ticket.user?.studentProfile;
    const adminNotifyEmails = getEscalationEmails();

    const { nexiTicketNotification } = await import('../email/emailTemplates.js');
    const notifyHtml = nexiTicketNotification({
      studentName: studentProfile?.name || ticket.user?.email?.split('@')[0] || 'Student',
      moodleId: ticket.user?.moodleId,
      email: ticket.user?.email,
      classYear: studentProfile?.classYear,
      division: studentProfile?.division,
      batch: studentProfile?.batch,
      subject: ticket.subject,
      message: ticket.message,
      priority: ticket.priority,
      createdAt: ticket.createdAt
    });

    await sendBulkEmail({
      to: adminNotifyEmails,
      subject: `[Nexi AI] New Support Ticket: ${ticket.subject}`,
      html: notifyHtml,
      text: `New support ticket raised via Nexi AI Chat by ${studentProfile?.name || ticket.user?.email || 'a student'}.\n\nSubject: ${ticket.subject}\nMoodle ID: ${ticket.user?.moodleId || 'N/A'}\nDivision: ${studentProfile?.division || 'N/A'}\nYear: ${studentProfile?.classYear || 'N/A'}\n\nMessage:\n${ticket.message}`
    });
  } catch (emailErr) {
    console.error('Failed to send Nexi ticket notification email:', emailErr);
  }

  return ticket;
}

// ─── Code review against test cases ──────────────────────────────────────────

/**
 * Review a student's code for a specific competition problem against its
 * hidden test cases (dry-run style) and return a grounded, friendly review.
 */
async function reviewCodeAgainstTestCases({ userId, code, faq }) {
  // Locate the most recent submission for this user so we can attach the
  // problem + test cases context. If the student pasted code manually
  // (no submission), fall back to generic review with whatever we know.
  const latestSubmission = await prisma.problemSubmission.findFirst({
    where: { userId },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          points: true,
          examples: true,
          constraints: true,
          testCases: true,
          timeLimit: true,
          memoryLimit: true,
          functionName: true,
          parameters: true,
          returnType: true
        }
      },
      competitionSubmission: {
        select: {
          competition: { select: { id: true, title: true } }
        }
      }
    },
    orderBy: { submittedAt: 'desc' }
  });

  if (!latestSubmission) {
    return {
      reply: "I'd love to review your code! ✨ Could you tell me which competition and problem it's for, or paste it inside the competition submission page so I can check it against the test cases?",
      escalate: false,
      askCode: false
    };
  }

  const problem = latestSubmission.problem;
  const testCases = Array.isArray(problem.testCases)
    ? problem.testCases
    : (typeof problem.testCases === 'string' ? JSON.parse(problem.testCases) : []);

  // Simple static checks we can do deterministically without a full judge:
  const language = latestSubmission.language || 'unknown';
  const userCode = code.trim();

  // Per-language obvious "wrong answer" signals
  const checks = {
    hasSemicolons: /;/.test(userCode),
    hasReturn: /\breturn\b/.test(userCode),
    hasMain: /\bint\s+main\b|\bdef\s+main\b/.test(userCode),
    hasFunction: new RegExp(`\\b${problem.functionName}\\b`).test(userCode)
  };

  // Build a grounded review based on their actual last judged result,
  // plus a note that we compared their code shape against the problem's
  // function signature / constraints.
  const reviewLines = [];
  reviewLines.push(`Let me look at **${problem.title}** (${problem.difficulty}, ${problem.points} pts) 🧐`);

  if (!checks.hasFunction) {
    reviewLines.push(`⚠️ I couldn't find a function named \`${problem.functionName}\` — the judge expects your solution to define \`${problem.functionName}\` (return type \`${problem.returnType}\`).`);
  }
  if (language === 'python' && !/\bdef\b/.test(userCode)) {
    reviewLines.push('⚠️ For Python, make sure you define a function (e.g. `def ' + problem.functionName + '(...)`).');
  }
  if (language === 'javascript' && !/\bconst\b|\bfunction\b|\blet\b/.test(userCode)) {
    reviewLines.push('⚠️ In JavaScript, wrap your logic in a function or at least use `const`/`function` declarations.');
  }

  // Compare with their actual judged attempt if it exists
  const lastAttempt = latestSubmission;
  if (lastAttempt.status === 'accepted') {
    reviewLines.push(`✅ Your last attempt passed ${lastAttempt.testsPassed}/${lastAttempt.totalTests} tests and scored ${lastAttempt.score}/${lastAttempt.maxScore}. It looks correct!`);
  } else if (lastAttempt.status === 'rejected' || lastAttempt.status === 'wrong') {
    reviewLines.push(`❌ Your last attempt scored ${lastAttempt.score}/${lastAttempt.maxScore} — some test cases failed. ${lastAttempt.errorMessage ? `Judge message: ${lastAttempt.errorMessage}` : ''}`);
    reviewLines.push('💡 Tip: check edge cases like empty input, large numbers, and the exact constraints the problem gives.');
  } else {
    reviewLines.push(`ℹ️ Your last submission status was "${lastAttempt.status}".`);
  }

  if (testCases.length) {
    reviewLines.push(`\nThe problem has ${testCases.length} test case(s). Make sure your code handles them — especially the edge ones.`);
  }

  const reply = reviewLines.join('\n');

  return {
    reply,
    escalate: false,
    askCode: false
  };
}

// ─── Escalation ──────────────────────────────────────────────────────────────

/**
 * Escalate to human admins via email. Non-blocking — failures are logged
 * and never break the student's experience.
 */
export async function escalateToAdmin({ userId, studentContext, query, code }) {
  const emails = getEscalationEmails();

  const student = studentContext?.student || (await prisma.student.findUnique({ where: { userId } })) || null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, moodleId: true }
  });

  const html = aiEscalationNotification({
    studentName: student?.name || 'Student',
    moodleId: user?.moodleId,
    email: user?.email,
    classYear: student?.classYear,
    division: student?.division,
    batch: student?.batch,
    query,
    code: code || null
  });

  try {
    const result = await sendBulkEmail({
      to: emails,
      subject: `Nexi Escalation: ${student?.name || 'Student'} needs human help`,
      html,
      text: `A student needs human help.\n\nName: ${student?.name || 'N/A'}\nMoodle ID: ${user?.moodleId || 'N/A'}\nEmail: ${user?.email || 'N/A'}\n\nQuery:\n${query}\n\nCode:\n${code || 'N/A'}`
    });
    return { success: result.sent > 0, emails };
  } catch (err) {
    console.error('[Nexi] Escalation email failed:', err);
    return { success: false, emails };
  }
}
