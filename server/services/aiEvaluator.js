import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'; // Latest Gemini - fast, free, smart

// Gemini Direct API support
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const USE_GEMINI_DIRECT = process.env.USE_GEMINI_DIRECT === 'true';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

/**
 * Detect if code uses Python builtins that trivially solve the task
 */
function usesBuiltinShortcut(code, language) {
  if (!/python/i.test(language)) return false;
  
  const BUILTIN_PATTERNS = [
    /\bmax\s*\(/i,
    /\bmin\s*\(/i,
    /\breversed\s*\(/i,
    /\.reverse\s*\(/i,
    /\.sort\s*\(/i,
    /\[::\s*-\s*1\s*\]/,  // slicing reverse [::-1]
    /\bsorted\s*\(/i,
  ];
  
  return BUILTIN_PATTERNS.some(pattern => pattern.test(code));
}

/**
 * Detect if code is likely hardcoded (no algorithm)
 */
function isLikelyHardcoded(code) {
  // Check for algorithmic constructs
  const hasLoop = /\b(for|while|foreach)\b/i.test(code);
  const hasCondition = /\b(if|else|switch|case)\b/i.test(code);
  const hasIndexing = /\[[^\]]+\]/.test(code) && /\w+\s*\[/.test(code);
  const hasFunctionDef = /\b(def|function|void|int|public|private)\s+\w+\s*\(/i.test(code);
  
  // If has any algorithmic construct, not hardcoded
  if (hasLoop || hasCondition || hasIndexing || hasFunctionDef) return false;
  
  // Check if it's just a literal print
  const hasLiteralArray = /\[[0-9\s,\-]+\]/.test(code);
  const hasPrint = /(print\(|console\.log\(|cout\s*<<|System\.out\.println\()/.test(code);
  
  return hasLiteralArray && hasPrint;
}

const SYSTEM_PROMPT = `You are a code evaluation judge for student programming assignments.

GRADING CRITERIA (Total: 10 marks):
- Logic Correctness: 2 marks (basic logic implementation)
- Syntax Correctness: 2 marks (slight differences acceptable, not strict)
- Output Correctness: 3 marks (we're lenient - test cases weren't working properly)
- Language Bonus/Penalty: 
  * Java/C++: +2-3 marks bonus (depending on overall correctness)
  * Python with everything correct: +1 mark bonus
  * Python with direct built-in functions (max, min, reverse, sorted, slicing [::-1]): -1 mark penalty

IMPORTANT DETECTION RULES:
- HARDCODED: If code only prints a literal value/array with NO algorithm (no loops, conditions, indexing), mark Logic=0
- BUILTIN ABUSE: Python code using max(), min(), reversed(), .reverse(), .sort(), sorted(), [::-1] for the main task gets -1 penalty
- We prioritize Java and C++, but most students submitted in Python
- NOT strict on test case matching - we're checking basic logic
- Accept hardcoded examples ONLY if a general algorithm is present
- Accept slightly non-optimized code
- Slight syntax variations are acceptable

STRICT OUTPUT FORMAT (MANDATORY):
Your response MUST be EXACTLY in this format (keep it concise):

Code Review:
[1-2 line analysis - max 120 chars]

Marks (lenient):
Logic correctness: X/2 (brief reason)
Syntax correctness: X/2 (brief reason)
Output correctness: X/3 (brief reason)
[Language] bonus: +X (brief reason)

Total: X/10

Remarks:
"[One sentence summary - max 150 chars]"

{"marks": X, "remarks": "[Copy the entire feedback above]"}

CRITICAL RULES:
1. Keep Code Review to 1-2 short lines ONLY (max 120 chars)
2. Each marks line should be ONE line with brief reason in parentheses
3. Remarks sentence must be ≤150 characters
4. Total feedback should be 50-200 words MAX
5. MUST end with JSON on last line
6. Be CONCISE - do not write essays or long explanations
7. Detect hardcoded solutions (no algorithm) and mark Logic=0
8. Detect Python builtin abuse and apply -1 penalty`;


/**
 * Evaluate student code using DeepSeek AI via OpenRouter
 * @param {string} code - The student's code
 * @param {string} language - Programming language (java, cpp, python, etc)
 * @param {string} problemTitle - The problem/question title
 * @param {string} problemDescription - Problem description/requirements
 * @returns {Promise<{marks: number, remarks: string}>}
 */
export async function evaluateCodeWithAI(code, language, problemTitle, problemDescription) {
  // Use Gemini Direct API if configured
  if (USE_GEMINI_DIRECT && GEMINI_API_KEY) {
    return evaluateWithGeminiDirect(code, language, problemTitle, problemDescription);
  }
  
  // Fallback to OpenRouter
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your-openrouter-api-key-here') {
    throw new Error('OpenRouter API key not configured');
  }

  const userPrompt = `PROBLEM: ${problemTitle}
DESCRIPTION: ${problemDescription || 'Evaluate based on code logic'}
LANGUAGE: ${language.toUpperCase()}
CODE:
\`\`\`${language}
${code}
\`\`\`

DETECTION HINTS FOR YOU:
- Hardcoded check: ${isLikelyHardcoded(code) ? 'WARNING: Code appears hardcoded (no algorithm detected)' : 'Algorithm constructs detected'}
- Builtin usage: ${usesBuiltinShortcut(code, language) ? 'WARNING: Python builtin detected (apply -1 penalty)' : 'No problematic builtins'}

Evaluate concisely following the EXACT format. Keep brief. End with JSON.`;

  try {
    console.log('🔄 Making API call to:', OPENROUTER_BASE_URL);
    console.log('📝 Model:', MODEL);
    console.log('📊 Code length:', code?.length || 0);
    
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.1, // Very low for consistent, concise grading
        max_tokens: 2000 // High limit for reasoning models (they think first, then answer)
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'CodingNexus Code Evaluator'
        },
        timeout: 10000 // 10 second timeout for reliability
      }
    );

    console.log('✅ API Response received');
    console.log('Response status:', response.status);
    console.log('Response data keys:', Object.keys(response.data || {}));
    console.log('Choices count:', response.data?.choices?.length || 0);
    
    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
      console.error('❌ Invalid API response structure:', JSON.stringify(response.data, null, 2));
      throw new Error('Invalid API response - no choices returned');
    }

    // Log the entire first choice to see structure
    console.log('First choice finish_reason:', response.data.choices[0].finish_reason);
    
    const firstChoice = response.data.choices[0];
    let aiResponse = '';
    
    // Standard models use 'content' field
    if (firstChoice.message?.content) {
      aiResponse = firstChoice.message.content;
      console.log('✓ Using content field');
    } else if (firstChoice.message?.reasoning) {
      // DeepSeek reasoning models (if user overrides to use them)
      aiResponse = firstChoice.message.reasoning;
      console.log('✓ Using reasoning field');
    } else if (firstChoice.text) {
      aiResponse = firstChoice.text;
      console.log('✓ Using text field');
    } else {
      console.error('❌ Cannot find content in response. Available fields:', Object.keys(firstChoice.message || {}));
      throw new Error('No content in API response');
    }
    let evaluation;
    let detailedFeedback = null;

    // Log the FULL AI response for debugging
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('FULL AI Response:');
    console.log(aiResponse);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Response length:', aiResponse.length);
    console.log('Response type:', typeof aiResponse);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Try to parse as JSON directly
      evaluation = JSON.parse(aiResponse);
      console.log('✓ Parsed as pure JSON:', evaluation);
    } catch (parseError) {
      console.log('⚠ Not pure JSON, attempting fallback extraction...');
      
      // Try to extract JSON from markdown code blocks
      const jsonBlockMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonBlockMatch) {
        try {
          evaluation = JSON.parse(jsonBlockMatch[1].trim());
          console.log('✓ Extracted from code block');
        } catch (e) {
          evaluation = null;
        }
      }
      
      // Try to find ANY JSON object with marks field
      if (!evaluation) {
        const allJsonMatches = aiResponse.match(/\{[^{}]*"marks"[^{}]*\}/g);
        if (allJsonMatches && allJsonMatches.length > 0) {
          for (let i = allJsonMatches.length - 1; i >= 0; i--) {
            try {
              evaluation = JSON.parse(allJsonMatches[i]);
              console.log(`✓ Found JSON object #${allJsonMatches.length - i}`);
              
              // Extract text BEFORE the JSON as remarks (remove the JSON line)
              const textBeforeJson = aiResponse.substring(0, aiResponse.indexOf(allJsonMatches[i])).trim();
              if (textBeforeJson) {
                evaluation.remarks = textBeforeJson;
                console.log('✓ Using text before JSON as remarks');
              }
              break;
            } catch (e) {
              continue;
            }
          }
        }
      }
      
      // Last resort: extract marks via regex, use text before JSON
      if (!evaluation) {
        console.log('⚠ Regex extraction fallback...');
        const marksMatch = aiResponse.match(/["']?marks["']?\s*:\s*(\d+(?:\.\d+)?)/i);
        
        // Try to find where JSON starts and use text before it
        const jsonStartMatch = aiResponse.match(/\{.*"marks"/);
        let remarks = aiResponse.trim();
        if (jsonStartMatch) {
          const textBeforeJson = aiResponse.substring(0, aiResponse.indexOf(jsonStartMatch[0])).trim();
          if (textBeforeJson) {
            remarks = textBeforeJson;
          }
        }
        
        evaluation = {
          marks: marksMatch ? parseFloat(marksMatch[1]) : 5,
          remarks: remarks
        };
        
        console.log('⚠ Using text before JSON as remarks, marks:', evaluation.marks);
      }
    }

    // Validate marks
    if (typeof evaluation.marks !== 'number' || isNaN(evaluation.marks)) {
      console.warn('⚠ Invalid marks, defaulting to 5');
      evaluation.marks = 5;
    }
    if (evaluation.marks < 0) evaluation.marks = 0;
    if (evaluation.marks > 10) evaluation.marks = 10;

    // Ensure remarks exists
    if (!evaluation.remarks || typeof evaluation.remarks !== 'string' || evaluation.remarks.trim() === '') {
      console.warn('⚠ No remarks found, using AI response');
      evaluation.remarks = aiResponse.trim() || 'Evaluated by AI';
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('FINAL RESULT:');
    console.log('Marks:', evaluation.marks);
    console.log('Remarks length:', evaluation.remarks.length);
    console.log('Remarks preview:', evaluation.remarks.substring(0, 200));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      marks: evaluation.marks,
      remarks: evaluation.remarks,
      aiModel: MODEL,
      evaluatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ AI Evaluation Error:');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('API Response Status:', error.response.status);
      console.error('API Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from API');
      console.error('Request details:', error.config?.url);
    } else {
      console.error('Error setting up request:', error.message);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    throw new Error(`AI evaluation failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Batch evaluate multiple submissions with real-time progress callback
 * @param {Array} submissions - Array of {code, language, problemTitle, problemDescription}
 * @param {Function} onProgress - Callback function(result, index, total) called after each evaluation
 * @returns {Promise<Array>} Array of evaluation results
 */
export async function batchEvaluateCode(submissions, onProgress = null) {
  const results = [];
  const total = submissions.length;
  
  for (let i = 0; i < submissions.length; i++) {
    const submission = submissions[i];
    try {
      const result = await evaluateCodeWithAI(
        submission.code,
        submission.language,
        submission.problemTitle,
        submission.problemDescription
      );
      
      const evaluationResult = {
        submissionId: submission.id,
        ...result,
        success: true
      };
      
      results.push(evaluationResult);
      
      // Call progress callback immediately after each evaluation
      if (onProgress) {
        await onProgress(evaluationResult, i + 1, total);
      }
      
      // Minimal delay to avoid rate limiting
      if (i < submissions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, USE_GEMINI_DIRECT ? 1000 : 5000)); // 1s for Gemini, 5s for OpenRouter
      }
    } catch (error) {
      const errorResult = {
        submissionId: submission.id,
        success: false,
        error: error.message
      };
      
      results.push(errorResult);
      
      // Call progress callback for errors too
      if (onProgress) {
        await onProgress(errorResult, i + 1, total);
      }
    }
  }
  
  return results;
}

/**
 * Evaluate using Gemini Direct API (no rate limits!)
 */
async function evaluateWithGeminiDirect(code, language, problemTitle, problemDescription) {
  const userPrompt = `PROBLEM: ${problemTitle}
DESCRIPTION: ${problemDescription || 'Evaluate based on code logic'}
LANGUAGE: ${language.toUpperCase()}
CODE:
\`\`\`${language}
${code}
\`\`\`

DETECTION HINTS FOR YOU:
- Hardcoded check: ${isLikelyHardcoded(code) ? 'WARNING: Code appears hardcoded (no algorithm detected)' : 'Algorithm constructs detected'}
- Builtin usage: ${usesBuiltinShortcut(code, language) ? 'WARNING: Python builtin detected (apply -1 penalty)' : 'No problematic builtins'}

Evaluate concisely following the EXACT format. Keep brief. End with JSON.`;

  try {
    console.log('🔄 Using Gemini Direct API');
    console.log('📝 Model:', GEMINI_MODEL);
    console.log('📊 Code length:', code?.length || 0);

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `${SYSTEM_PROMPT}\n\n${userPrompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('✅ Gemini API Response received');
    
    const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!aiResponse) {
      console.error('❌ No content in Gemini response');
      throw new Error('No content in Gemini API response');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('GEMINI Response:');
    console.log(aiResponse);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Parse response (same logic as OpenRouter)
    let evaluation;
    
    try {
      evaluation = JSON.parse(aiResponse);
      console.log('✓ Parsed as pure JSON');
    } catch (parseError) {
      console.log('⚠ Not pure JSON, extracting...');
      
      // Try to find JSON object
      const jsonMatch = aiResponse.match(/\{[^{}]*"marks"[^{}]*\}/);
      if (jsonMatch) {
        try {
          evaluation = JSON.parse(jsonMatch[0]);
          console.log('✓ Found JSON object');
          
          // Extract text BEFORE the JSON as remarks (remove the JSON line)
          const textBeforeJson = aiResponse.substring(0, aiResponse.indexOf(jsonMatch[0])).trim();
          if (textBeforeJson) {
            evaluation.remarks = textBeforeJson;
            console.log('✓ Using text before JSON as remarks');
          }
        } catch (e) {
          evaluation = null;
        }
      }
      
      if (!evaluation) {
        console.log('⚠ Using full response as remarks');
        const marksMatch = aiResponse.match(/["']?marks["']?\s*:\s*(\d+(?:\.\d+)?)/i);
        evaluation = {
          marks: marksMatch ? parseFloat(marksMatch[1]) : 5,
          remarks: aiResponse.trim()
        };
      }
    }

    // Validate marks
    if (typeof evaluation.marks !== 'number' || isNaN(evaluation.marks)) {
      console.warn('⚠ Invalid marks, defaulting to 5');
      evaluation.marks = 5;
    }
    if (evaluation.marks < 0) evaluation.marks = 0;
    if (evaluation.marks > 10) evaluation.marks = 10;

    if (!evaluation.remarks || typeof evaluation.remarks !== 'string' || evaluation.remarks.trim() === '') {
      console.warn('⚠ No remarks, using AI response');
      evaluation.remarks = aiResponse.trim() || 'Evaluated by AI';
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('FINAL RESULT:');
    console.log('Marks:', evaluation.marks);
    console.log('Remarks length:', evaluation.remarks.length);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      marks: evaluation.marks,
      remarks: evaluation.remarks,
      aiModel: GEMINI_MODEL,
      evaluatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Gemini API Error:');
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('API Response Status:', error.response.status);
      console.error('API Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    throw new Error(`Gemini evaluation failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

export default {
  evaluateCodeWithAI,
  batchEvaluateCode
};
