import axios from 'axios';

// ─── Config (mirrors aiEvaluator.js pattern) ────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_BASE    = 'https://generativelanguage.googleapis.com/v1beta/models';

// ─── Placement Categories (topic taxonomy + style hints) ─────────────────────
// Used to guide the model toward realistic TCS/Wipro/Infosys-style questions.

export const PLACEMENT_CATEGORIES = {
  quantitative: {
    topics: [
      'Number System', 'HCF & LCM', 'Percentages', 'Profit & Loss',
      'Simple & Compound Interest', 'Ratio & Proportion', 'Averages',
      'Time & Work', 'Time, Speed & Distance', 'Boats & Streams',
      'Pipes & Cisterns', 'Mixtures & Alligations', 'Probability',
      'Permutations & Combinations', 'Clocks & Calendars',
      'Problems on Ages', 'Area, Volume & Surface Area',
      'Data Interpretation (Tables, Bar Graphs, Pie Charts)'
    ],
    style: 'Practical numerical problems with real-world scenarios. Numbers should be realistic — percentages use amounts like 2500, 48000; ages like 24, 36; speeds like 45, 60, 80 km/hr; profit amounts like ₹12,500 or ₹2,40,000.'
  },
  logical: {
    topics: [
      'Blood Relations', 'Direction Sense', 'Syllogisms',
      'Seating Arrangements', 'Puzzles', 'Coding-Decoding',
      'Series Completion', 'Analogies', 'Venn Diagrams',
      'Data Sufficiency', 'Statement & Assumptions', 'Odd One Out',
      'Cube & Dice', 'Non-Verbal Reasoning'
    ],
    style: 'Pure logic problems — minimal calculation, maximum deduction. Use family-tree deduction for blood relations, multi-turn direction paths ending with shortest-distance questions, linear/circular seating with 4-5 conditions, 2-statement-2-conclusion syllogisms.'
  },
  verbal: {
    topics: [
      'Reading Comprehension', 'Sentence Correction', 'Fill in the Blanks',
      'Synonyms & Antonyms', 'Para Jumbles', 'Spotting Errors',
      'Sentence Completion', 'Cloze Test', 'Idioms & Phrases',
      'Active-Passive Voice', 'Direct-Indirect Speech'
    ],
    style: 'Standard English language assessment used by IT service companies. RC passages should be ~100-150 words with 2 inference-based questions. Sentence correction focuses on subject-verb agreement, parallelism, modifiers.'
  },
  technical: {
    topics: [
      'C Programming Basics', 'Data Structures', 'OOP Concepts',
      'DBMS & SQL', 'Operating Systems', 'Computer Networks',
      'Software Engineering', 'Pseudo-code Analysis', 'Compiler Output Prediction'
    ],
    style: 'CS fundamentals tested in campus placement technical rounds. Focus on pseudo-code output prediction with loops, pointer/output questions in C, time complexity identification, DBMS/SQL query output, OS scheduling basics.'
  }
};

// ─── Prompt Templates ────────────────────────────────────────────────────────
// Placement-focused: mirrors TCS NQT, Infosys, Wipro, Accenture, Capgemini patterns.
// Centralised here so routes/controllers never embed raw prompt strings.

export const PROMPT_TEMPLATES = {
  GENERATE_VARIATIONS: {
    systemInstruction: `You are an expert placement aptitude coach designing questions for TCS NQT, Infosys, Wipro, Accenture, Capgemini, Cognizant, and similar IT company placement exams.

Your job: given seed questions, produce NEW variations that:
1. Test the SAME concept and skill — change numbers, names, scenarios without altering the underlying logic
2. Are realistic placement-level MCQs with exactly 4 options (A, B, C, D)
3. Have one unambiguously correct answer
4. Include a DETAILED step-by-step explanation showing the complete solution method
5. If a shortcut/trick exists for the concept, include it in the explanation marked with [TRICK]: prefix
6. Match the difficulty of the seed (easy/medium/hard — where hard ≈ TCS NQT advanced section)
7. Use real-world phrasing (company context, daily scenarios) not textbook math-only wording
8. Use realistic numbers: percentages with amounts like 2500, 48000; ages like 24, 36; speeds like 45, 60, 80 km/hr

EXPLANATION FORMAT — Always include BOTH:
Step 1, Step 2, ... (numbered steps showing the complete solution)
[TRICK]: (if applicable) mention any shortcut formula or mental-math technique.

OUTPUT — respond with ONLY a valid JSON array, no markdown, no prose:
[
  {
    "question": "...",
    "options": [{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}],
    "correctOption": "B",
    "explanation": "Step 1: ...\nStep 2: ...\n[TRICK]: ...",
    "difficulty": "medium",
    "concept": "concept-tag",
    "category": "quantitative"
  }
]`,

    userPayload: ({ seeds, count, category, difficulty }) => {
      const seedBlock = seeds.map((s, i) =>
        `Q${i + 1}: ${s.question}\nOptions: ${JSON.stringify(s.options)}\nAnswer: ${s.correctOption}\nExplanation: ${s.explanation || 'N/A'}`
      ).join('\n\n');

      const catGuidance = PLACEMENT_CATEGORIES[category];
      const styleHint = catGuidance ? `\nCategory style guide: ${catGuidance.style}` : '';

      return `Generate exactly ${count} new MCQ variation(s) for placement exam practice.
Category: ${category || 'quantitative'}
Target difficulty: ${difficulty || 'same as seeds'}${styleHint}

SEED QUESTION(S):
${seedBlock}

Rules:
- Do NOT repeat any seed question verbatim
- Keep the same underlying concept / formula
- Vary numbers significantly and use realistic placement-style numbers
- Include DETAILED numbered step-by-step explanation and [TRICK]: if shortcut exists
- Return ONLY the JSON array`;
    }
  },

  GENERATE_FROM_TOPIC: {
    systemInstruction: `You are an expert placement aptitude coach designing questions for TCS NQT, Infosys, Wipro, Accenture, Capgemini, Cognizant, and similar IT company placement exams.

Generate original, placement-relevant MCQ questions. Your questions should feel like they came from a real campus placement paper — practical, well-worded, and testing concepts that actually appear in these exams.

CRITICAL GUIDELINES:
1. Exactly 4 options (A, B, C, D) with ONE unambiguously correct answer
2. Realistic numbers — percentages use amounts like 2500, 48000; ages like 24, 36, 48; speeds like 45, 60, 80 km/hr
3. DETAILED step-by-step explanation showing every calculation step (numbered Step 1, Step 2, ...)
4. Include [TRICK]: prefix with a shortcut formula or mental-math trick if one exists for that concept
5. Difficulty must match: easy (single-step, concept recall), medium (multi-step, common in TCS/Wipro), hard (multi-concept, Infosys advanced)
6. Question phrasing should mirror real exam patterns — practical scenarios, company contexts, daily situations

QUANTITATIVE — focus on:
- Profit & Loss with mixed percentages, successive discounts
- Time & Work with efficiency ratios, alternate-day work patterns
- Time/Speed/Distance with relative speed, average speed traps
- Percentages with election-based problems, population growth
- Simple/Compound Interest with principal calculation, rate-finding
- Ratio & Proportion with three-way splits, age problems
- Averages with weighted averages, replaced-member problems
- Mixtures with replacement scenarios, alligation method
- Data Interpretation table/chart-based multi-question sets

LOGICAL — focus on:
- Blood Relations with family-tree deduction (give 3-4 relation clues)
- Direction Sense with multi-turn paths ending with shortest-distance question
- Seating Arrangements with linear/circular, given 4-5 conditions
- Syllogisms with 2 statements + 2 conclusions (test validity)
- Coding-Decoding with letter shifting, number coding patterns
- Series Completion with mixed patterns (alpha-numeric)
- Puzzles with arrangement + ordering constraints

VERBAL — focus on:
- Reading Comprehension with 100-150 word passage + inference questions
- Sentence Correction with grammar rules (subject-verb, parallelism)
- Para Jumbles with logical flow reconstruction
- Synonyms/Antonyms with contextual usage

TECHNICAL — focus on:
- Pseudo-code output prediction with loops and conditions
- Data Structure time complexity identification
- DBMS/SQL query output prediction
- C programming pointer/output questions
- OS scheduling/deadlock basics

EXPLANATION FORMAT (always both):
Step 1: (calculation/reasoning)
Step 2: ...
Step N: final answer derivation
[TRICK]: (shortcut formula, memory aid, or mental-math technique if applicable)

OUTPUT — respond with ONLY a valid JSON array, no markdown, no prose:
[
  {
    "question": "...",
    "options": [{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}],
    "correctOption": "B",
    "explanation": "Step 1: ...\nStep 2: ...\n[TRICK]: ...",
    "difficulty": "medium",
    "concept": "concept-tag",
    "category": "quantitative"
  }
]`,

    userPayload: ({ topic, category, difficulty, count }) => {
      const catGuidance = PLACEMENT_CATEGORIES[category || 'quantitative'];
      const topicList = catGuidance ? `\nRelevant topics in this category: ${catGuidance.topics.slice(0, 8).join(', ')}` : '';
      const styleHint = catGuidance ? `\nStyle: ${catGuidance.style}` : '';

      return `Generate exactly ${count} original placement-style MCQ question(s).

Topic: ${topic}
Category: ${category || 'quantitative'}
Difficulty: ${difficulty || 'medium'}${topicList}${styleHint}

CRITICAL: Make these feel like REAL placement exam questions. Use practical scenarios, realistic numbers, and detailed numbered step-by-step explanations. If a shortcut trick exists for the concept, include [TRICK]: prefix.

Return ONLY the JSON array.`;
    }
  }
};

// ─── Internal: call Gemini Direct API with retry logic ─────────────────────

async function callGemini({ systemInstruction, userText, maxTokens = 8192 }, retryCount = 0) {
  const MAX_RETRIES = 3;

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
      temperature: 0.7,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json'
    }
  };

  try {
    const response = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 35000
    });

    const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!raw) throw new Error('Empty response from Gemini API');
    return raw;
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const geminiMsg = err.response.data?.error?.message || err.response.data?.error || err.message;

      if (status === 429) {
        // Extract retry delay from RetryInfo (more reliable than message parsing)
        const retryInfo = err.response.data?.error?.details?.find(
          d => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
        );
        const retrySeconds = retryInfo
          ? parseFloat(retryInfo.retryDelay.replace('s', ''))
          : null;

        if (retrySeconds !== null && !isNaN(retrySeconds) && retrySeconds < 120 && retryCount < MAX_RETRIES) {
          // RPM rate limit — retry after the specified delay
          const delay = Math.max(retrySeconds * 1000, 2000);
          console.log(`[callGemini] RPM 429, retrying in ${(delay/1000).toFixed(1)}s (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return callGemini({ systemInstruction, userText, maxTokens }, retryCount + 1);
        }

        // True daily quota exhaustion or retries exhausted
        const e = new Error(`AI service quota exhausted (429). ${geminiMsg}`);
        e.status = 429;
        e.isPermanentQuota = true;  // distinguish from RPM 429
        throw e;
      }
      if (status === 400) {
        const e = new Error(`AI service bad request (400): ${geminiMsg}`);
        e.status = 400;
        throw e;
      }
      if (status === 403) {
        const e = new Error(`AI service access denied (403): ${geminiMsg}`);
        e.status = 403;
        throw e;
      }
    }
    throw err;
  }
}

// ─── Internal: parse and validate the model's JSON output ───────────────────

function parseGeneratedQuestions(raw) {
  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      try { parsed = JSON.parse(match[1]); } catch { parsed = null; }
    }
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
      category:      q.category   || null,
    };
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate variations of existing seed question(s).
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
    maxTokens:         clampedCount * 2000  // each question with detailed explanation needs ~1500+ tokens
  });

  const questions = parseGeneratedQuestions(raw);
  return questions.slice(0, clampedCount);
}

/**
 * Generate fresh questions for a topic from scratch.
 */
export async function generateFromTopic({ topic, category, difficulty = 'medium', count = 5 } = {}) {
  if (!topic || !topic.trim()) {
    const err = new Error('topic is required');
    err.status = 400;
    throw err;
  }

  const clampedCount = Math.min(30, Math.max(1, count));
  const tpl          = PROMPT_TEMPLATES.GENERATE_FROM_TOPIC;

  console.log(`[aiQuestionGenerator] generateFromTopic: "${topic}" × ${clampedCount}`);

  const raw = await callGemini({
    systemInstruction: tpl.systemInstruction,
    userText:          tpl.userPayload({ topic, category, difficulty, count: clampedCount }),
    maxTokens:         clampedCount * 2500  // each question with detailed explanation needs ~1500+ tokens
  });

  const questions = parseGeneratedQuestions(raw);
  return questions.slice(0, clampedCount);
}

/**
 * Batch: generate variations for multiple seeds in parallel (max 3 concurrent).
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

    if (i + CONCURRENCY < seeds.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}
