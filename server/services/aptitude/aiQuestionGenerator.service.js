import axios from 'axios';

// ─── Config (mirrors aiEvaluator.js pattern) ────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
const GEMINI_BASE    = 'https://generativelanguage.googleapis.com/v1beta/models';

// ─── Prompt Templates ────────────────────────────────────────────────────────
// Centralised here so routes/controllers never embed raw prompt strings.
// Exported so they can be read/stored by API consumers.

export const PROMPT_TEMPLATES = {
  // Used to generate N variations from one or more seed questions.
  // Token-optimised: single system instruction + minimal user payload.
  GENERATE_VARIATIONS: {
    systemInstruction: `You are an expert aptitude question designer for competitive exams.
Your job: given seed questions, produce NEW variations that:
1. Test the SAME concept and skill
2. Change numbers, names, scenarios, or phrasing — not the underlying logic
3. Are clearly MCQ with exactly 4 options (A, B, C, D)
4. Have one unambiguously correct answer
5. Include a concise explanation (≤2 sentences) showing the solution method
6. Match the difficulty of the seed

OUTPUT FORMAT — respond with ONLY a valid JSON array, no markdown, no prose:
[
  {
    "question": "...",
    "options": [
      {"label": "A", "text": "..."},
      {"label": "B", "text": "..."},
      {"label": "C", "text": "..."},
      {"label": "D", "text": "..."}
    ],
    "correctOption": "A",
    "explanation": "...",
    "difficulty": "easy|medium|hard",
    "concept": "brief concept tag e.g. time-and-work"
  }
]`,

    // userPayload is a function — call it to produce the user message string.
    // Kept minimal: only seeds + count go to the model, never full DB objects.
    userPayload: ({ seeds, count, category, difficulty }) => {
      const seedBlock = seeds.map((s, i) =>
        `Q${i + 1}: ${s.question}\nOptions: ${JSON.stringify(s.options)}\nAnswer: ${s.correctOption}\nExplanation: ${s.explanation || 'N/A'}`
      ).join('\n\n');

      return `Generate exactly ${count} new MCQ variation(s).
Category: ${category || 'general aptitude'}
Target difficulty: ${difficulty || 'same as seeds'}

SEED QUESTION(S):
${seedBlock}

Rules:
- Do NOT repeat any seed question verbatim
- Keep the same underlying concept / formula
- Vary numbers, scenario, or phrasing meaningfully
- Return ONLY the JSON array`;
    }
  },

  // Used to generate brand-new questions for a topic from scratch.
  // Fewer tokens: no seed block needed.
  GENERATE_FROM_TOPIC: {
    systemInstruction: `You are an expert aptitude question designer for competitive exams.
Generate original MCQ questions for a given topic and difficulty.

OUTPUT FORMAT — respond with ONLY a valid JSON array, no markdown, no prose:
[
  {
    "question": "...",
    "options": [
      {"label": "A", "text": "..."},
      {"label": "B", "text": "..."},
      {"label": "C", "text": "..."},
      {"label": "D", "text": "..."}
    ],
    "correctOption": "A",
    "explanation": "...",
    "difficulty": "easy|medium|hard",
    "concept": "brief concept tag"
  }
]`,

    userPayload: ({ topic, category, difficulty, count }) =>
      `Generate exactly ${count} original MCQ question(s).
Topic: ${topic}
Category: ${category || 'general aptitude'}
Difficulty: ${difficulty || 'medium'}
Return ONLY the JSON array.`
  }
};

// ─── Internal: call Gemini Direct API ───────────────────────────────────────

async function callGemini({ systemInstruction, userText, maxTokens = 2048 }) {
  if (!GEMINI_API_KEY) {
    const err = new Error('GEMINI_API_KEY is not configured');
    err.status = 503;
    throw err;
  }

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ parts: [{ text: userText }] }],
    generationConfig: {
      temperature: 0.7,          // some creativity, still coherent
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json'  // ask Gemini to return JSON directly
    }
  };

  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000
  });

  const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!raw) throw new Error('Empty response from Gemini API');
  return raw;
}

// ─── Internal: parse and validate the model's JSON output ───────────────────

function parseGeneratedQuestions(raw) {
  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch {
    // Strip markdown fences if the model ignored responseMimeType
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      try { parsed = JSON.parse(match[1]); } catch { parsed = null; }
    }
    // Last resort: find the array
    if (!parsed) {
      const arrMatch = raw.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        try { parsed = JSON.parse(arrMatch[0]); } catch { parsed = null; }
      }
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Model did not return a JSON array of questions');
  }

  // Validate + normalise each item
  return parsed.map((q, i) => {
    if (!q.question || !Array.isArray(q.options) || !q.correctOption) {
      throw new Error(`Generated question at index ${i} is missing required fields`);
    }
    if (!['A', 'B', 'C', 'D'].includes(q.correctOption)) {
      throw new Error(`Generated question at index ${i} has invalid correctOption: ${q.correctOption}`);
    }
    if (q.options.length !== 4) {
      throw new Error(`Generated question at index ${i} must have exactly 4 options`);
    }
    return {
      question:      q.question.trim(),
      options:       q.options.map(o => ({ label: o.label, text: String(o.text).trim() })),
      correctOption: q.correctOption,
      explanation:   (q.explanation || '').trim(),
      difficulty:    q.difficulty || 'medium',
      concept:       q.concept    || null,
    };
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate variations of existing seed question(s).
 *
 * @param {object[]} seeds   - Array of seed questions: { question, options, correctOption, explanation }
 * @param {object}   opts    - { count, category, difficulty }
 * @returns {Promise<object[]>} Generated questions (without correctOption stripped — caller decides)
 */
export async function generateVariations(seeds, { count = 3, category, difficulty } = {}) {
  if (!Array.isArray(seeds) || seeds.length === 0) {
    const err = new Error('At least one seed question is required');
    err.status = 400;
    throw err;
  }
  if (seeds.length > 5) {
    const err = new Error('Maximum 5 seed questions per request');
    err.status = 400;
    throw err;
  }

  const clampedCount = Math.min(10, Math.max(1, count));
  const tpl          = PROMPT_TEMPLATES.GENERATE_VARIATIONS;

  console.log(`[aiQuestionGenerator] generateVariations: ${seeds.length} seed(s) → ${clampedCount} variation(s)`);

  const raw = await callGemini({
    systemInstruction: tpl.systemInstruction,
    userText:          tpl.userPayload({ seeds, count: clampedCount, category, difficulty }),
    maxTokens:         clampedCount * 220  // ~220 tokens per question keeps bill low
  });

  const questions = parseGeneratedQuestions(raw);

  // Trim to exactly what was asked — model may overshoot
  return questions.slice(0, clampedCount);
}

/**
 * Generate fresh questions for a topic from scratch.
 *
 * @param {object} opts - { topic, category, difficulty, count }
 * @returns {Promise<object[]>}
 */
export async function generateFromTopic({ topic, category, difficulty = 'medium', count = 5 } = {}) {
  if (!topic || !topic.trim()) {
    const err = new Error('topic is required');
    err.status = 400;
    throw err;
  }

  const clampedCount = Math.min(10, Math.max(1, count));
  const tpl          = PROMPT_TEMPLATES.GENERATE_FROM_TOPIC;

  console.log(`[aiQuestionGenerator] generateFromTopic: "${topic}" × ${clampedCount}`);

  const raw = await callGemini({
    systemInstruction: tpl.systemInstruction,
    userText:          tpl.userPayload({ topic, category, difficulty, count: clampedCount }),
    maxTokens:         clampedCount * 220
  });

  const questions = parseGeneratedQuestions(raw);
  return questions.slice(0, clampedCount);
}

/**
 * Batch: generate variations for multiple seeds in parallel (max 3 concurrent).
 * Used when an admin wants to expand a full test at once.
 *
 * @param {object[]} seeds       - Full list of seed questions
 * @param {object}   opts        - { variationsPerSeed, category, difficulty }
 * @returns {Promise<object[]>}  - Flat array of all generated questions
 */
export async function batchGenerateVariations(seeds, { variationsPerSeed = 2, category, difficulty } = {}) {
  if (!Array.isArray(seeds) || seeds.length === 0) {
    const err = new Error('seeds array is required');
    err.status = 400;
    throw err;
  }
  if (seeds.length > 20) {
    const err = new Error('Maximum 20 seeds per batch request');
    err.status = 400;
    throw err;
  }

  const CONCURRENCY = 3;
  const results     = [];

  // Process in chunks of CONCURRENCY to avoid hammering the API
  for (let i = 0; i < seeds.length; i += CONCURRENCY) {
    const chunk = seeds.slice(i, i + CONCURRENCY);

    const chunkResults = await Promise.allSettled(
      chunk.map(seed =>
        generateVariations([seed], { count: variationsPerSeed, category, difficulty })
      )
    );

    for (const r of chunkResults) {
      if (r.status === 'fulfilled') {
        results.push(...r.value);
      } else {
        console.error('[aiQuestionGenerator] batch chunk failed:', r.reason?.message);
      }
    }

    // Brief pause between chunks — Gemini free tier: 15 RPM
    if (i + CONCURRENCY < seeds.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}
