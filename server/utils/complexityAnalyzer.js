/**
 * Complexity Analyzer
 * Estimates Big O time and space complexity from execution metrics
 * 
 * Used to evaluate LeetCode-style problem submissions
 */

/**
 * Estimate Big O complexity from execution times
 * Analyzes the relationship between input size and execution time
 * 
 * @param {Array} testCases - Array of test cases with {input, time, memory}
 * @param {Object} problem - Problem metadata with constraints
 * @returns {Object} Complexity analysis with estimated O notation
 */
export function analyzeTimeComplexity(testCases, problem = {}) {
  // Analyze time patterns across test cases
  const timeMetrics = extractTimeMetrics(testCases);
  
  if (!timeMetrics || timeMetrics.length < 2) {
    return {
      estimated: 'unknown',
      confidence: 0,
      rationale: 'Insufficient test data for complexity analysis'
    };
  }

  // Calculate ratios between consecutive test case times
  const timeRatios = calculateTimeRatios(timeMetrics);
  
  // Estimate complexity based on growth patterns
  const complexity = estimateComplexity(timeRatios, timeMetrics);

  return complexity;
}

/**
 * Estimate Big O space complexity from memory usage
 * 
 * @param {Array} testCases - Array of test cases with memory metrics
 * @param {Object} problem - Problem metadata
 * @returns {Object} Space complexity analysis
 */
export function analyzeSpaceComplexity(testCases, problem = {}) {
  const memoryMetrics = extractMemoryMetrics(testCases);
  
  if (!memoryMetrics || memoryMetrics.length < 1) {
    return {
      estimated: 'unknown',
      confidence: 0,
      rationale: 'Insufficient memory data'
    };
  }

  const memoryRatios = calculateMemoryRatios(memoryMetrics);
  const complexity = estimateMemoryComplexity(memoryRatios, memoryMetrics);

  return complexity;
}

/**
 * Extract time data from test cases
 * Tries to infer input size from test case data
 */
function extractTimeMetrics(testCases) {
  return testCases
    .filter(tc => tc.time && tc.time > 0)
    .map((tc, idx) => ({
      testCaseNum: idx + 1,
      time: parseFloat(tc.time),
      input: tc.input,
      inputSize: estimateInputSize(tc.input),
      memoryUsed: tc.memory || 0
    }))
    .sort((a, b) => a.inputSize - b.inputSize);
}

/**
 * Extract memory data from test cases
 */
function extractMemoryMetrics(testCases) {
  return testCases
    .filter(tc => tc.memory && tc.memory > 0)
    .map((tc, idx) => ({
      testCaseNum: idx + 1,
      memory: tc.memory,
      input: tc.input,
      inputSize: estimateInputSize(tc.input)
    }))
    .sort((a, b) => a.inputSize - b.inputSize);
}

/**
 * Estimate input size from test case input
 * Heuristics:
 * - Count of numbers
 * - Length of string
 * - Parse n from "n: <value>" format
 */
function estimateInputSize(input) {
  if (!input) return 1;
  
  const inputStr = String(input);
  
  // Try to find "n = X" or "n: X" pattern
  const nMatch = inputStr.match(/n\s*[:=]\s*(\d+)/i);
  if (nMatch) {
    return parseInt(nMatch[1]);
  }
  
  // Try to find single number at start of input
  const numMatch = inputStr.match(/^(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    if (num > 0 && num < 1000000) return num;
  }
  
  // Count whitespace-separated numbers
  const numbers = inputStr.trim().split(/\s+/).filter(x => /^\d+$/.test(x));
  if (numbers.length > 0) {
    const maxNum = Math.max(...numbers.map(Number));
    if (maxNum > 0 && maxNum < 1000000) return maxNum;
  }
  
  // Default: use string length as proxy
  return Math.max(1, Math.ceil(inputStr.length / 10));
}

/**
 * Calculate time growth ratios between consecutive test cases
 */
function calculateTimeRatios(metrics) {
  const ratios = [];
  
  for (let i = 1; i < metrics.length; i++) {
    const prev = metrics[i - 1];
    const curr = metrics[i];
    
    // Avoid division by zero
    if (prev.time === 0) continue;
    
    const inputRatio = curr.inputSize / prev.inputSize;
    const timeRatio = curr.time / prev.time;
    
    ratios.push({
      inputRatio,
      timeRatio,
      complexity: estimateComplexityFromRatio(inputRatio, timeRatio)
    });
  }
  
  return ratios;
}

/**
 * Calculate memory growth ratios
 */
function calculateMemoryRatios(metrics) {
  const ratios = [];
  
  for (let i = 1; i < metrics.length; i++) {
    const prev = metrics[i - 1];
    const curr = metrics[i];
    
    if (prev.memory === 0) continue;
    
    const inputRatio = curr.inputSize / prev.inputSize;
    const memoryRatio = curr.memory / prev.memory;
    
    ratios.push({
      inputRatio,
      memoryRatio,
      complexity: estimateComplexityFromRatio(inputRatio, memoryRatio)
    });
  }
  
  return ratios;
}

/**
 * Estimate complexity class from input/time ratio
 * 
 * If input grows by factor X and time grows by factor Y:
 * - Y ≈ 1: O(1)
 * - Y ≈ X: O(n)
 * - Y ≈ X*log(X): O(n log n)
 * - Y ≈ X²: O(n²)
 * - Y ≈ X³: O(n³)
 * - Y ≈ 2^X: O(2^n)
 */
function estimateComplexityFromRatio(inputRatio, growthRatio) {
  // Handle edge cases
  if (inputRatio <= 1) return null;
  if (growthRatio === undefined || growthRatio === null) return null;
  
  const logRatio = Math.log(inputRatio);
  
  // Expected ratios for different complexities:
  // O(1): 1
  // O(log n): log(X)
  // O(n): X
  // O(n log n): X * log(X)
  // O(n²): X²
  // O(n³): X³
  // O(2^n): 2^X
  
  const expectedRatios = {
    'O(1)': 1,
    'O(log n)': Math.log(inputRatio),
    'O(n)': inputRatio,
    'O(n log n)': inputRatio * Math.log(inputRatio),
    'O(n²)': inputRatio * inputRatio,
    'O(n³)': inputRatio * inputRatio * inputRatio,
    'O(2^n)': Math.pow(2, inputRatio)
  };
  
  // Find closest match with tolerance of ±30%
  let bestMatch = 'unknown';
  let bestError = Infinity;
  
  Object.entries(expectedRatios).forEach(([complexity, expected]) => {
    if (expected === 0) return;
    
    const error = Math.abs(growthRatio - expected) / Math.max(expected, growthRatio);
    
    if (error < bestError) {
      bestError = error;
      bestMatch = complexity;
    }
  });
  
  // Only accept matches with reasonable confidence
  if (bestError > 0.5) {
    bestMatch = 'unknown';
  }
  
  return {
    complexity: bestMatch,
    error: bestError,
    expected: expectedRatios[bestMatch] || 0,
    actual: growthRatio
  };
}

/**
 * Estimate overall time complexity from ratio analysis
 */
function estimateComplexity(ratios, timeMetrics) {
  if (!ratios || ratios.length === 0) {
    return {
      estimated: 'unknown',
      confidence: 0,
      rationale: 'No comparable test cases'
    };
  }

  // Histogram of complexity estimates
  const complexityVotes = {};
  let validVotes = 0;

  ratios.forEach(ratio => {
    if (ratio.complexity && ratio.complexity.complexity !== 'unknown') {
      const c = ratio.complexity.complexity;
      complexityVotes[c] = (complexityVotes[c] || 0) + 1;
      validVotes++;
    }
  });

  // If no confident votes, return unknown
  if (validVotes === 0) {
    return {
      estimated: 'unknown',
      confidence: 0,
      rationale: 'Complexity patterns unclear from test data',
      metrics: timeMetrics
    };
  }

  // Get most voted complexity
  const [estimated, votes] = Object.entries(complexityVotes).reduce(
    (best, [complexity, count]) => count > best[1] ? [complexity, count] : best,
    ['unknown', 0]
  );

  const confidence = votes / validVotes;

  return {
    estimated,
    confidence: Math.round(confidence * 100),
    votes,
    totalAnalyzed: ratios.length,
    rationale: `Estimated from ${ratios.length} test case comparisons (${Math.round(confidence * 100)}% agreement)`,
    metrics: timeMetrics,
    ratios: ratios.map(r => ({
      inputRatio: r.inputRatio.toFixed(2),
      timeRatio: r.timeRatio.toFixed(3),
      estimated: r.complexity.complexity
    }))
  };
}

/**
 * Estimate overall space complexity
 */
function estimateMemoryComplexity(ratios, memoryMetrics) {
  if (!ratios || ratios.length === 0) {
    return {
      estimated: 'unknown',
      confidence: 0,
      rationale: 'No comparable memory data'
    };
  }

  const complexityVotes = {};
  let validVotes = 0;

  ratios.forEach(ratio => {
    if (ratio.complexity && ratio.complexity.complexity !== 'unknown') {
      const c = ratio.complexity.complexity;
      complexityVotes[c] = (complexityVotes[c] || 0) + 1;
      validVotes++;
    }
  });

  if (validVotes === 0) {
    return {
      estimated: 'unknown',
      confidence: 0,
      rationale: 'Memory complexity patterns unclear'
    };
  }

  const [estimated, votes] = Object.entries(complexityVotes).reduce(
    (best, [complexity, count]) => count > best[1] ? [complexity, count] : best,
    ['unknown', 0]
  );

  const confidence = votes / validVotes;

  return {
    estimated,
    confidence: Math.round(confidence * 100),
    rationale: `Estimated from ${ratios.length} memory comparisons`,
    metrics: memoryMetrics
  };
}

/**
 * Generate a comprehensive complexity report
 */
export function generateComplexityReport(submission, problem) {
  if (!submission.testResults || submission.testResults.length < 2) {
    return {
      canEvaluate: false,
      reason: 'Insufficient test results for analysis (need at least 2 test cases)'
    };
  }

  const timeanalysis = analyzeTimeComplexity(submission.testResults, problem);
  const spaceAnalysis = analyzeSpaceComplexity(submission.testResults, problem);

  // Determine if solution is efficient
  let efficiencyRating = 'unknown';
  if (timeanalysis.estimated !== 'unknown' && problem.expectedComplexity) {
    if (timeanalysis.estimated === problem.expectedComplexity) {
      efficiencyRating = 'optimal';
    } else {
      // Try to compare complexities
      const complexityOrder = [
        'O(1)',
        'O(log n)',
        'O(n)',
        'O(n log n)',
        'O(n²)',
        'O(n³)',
        'O(2^n)'
      ];
      
      const estimatedIdx = complexityOrder.indexOf(timeanalysis.estimated);
      const expectedIdx = complexityOrder.indexOf(problem.expectedComplexity);
      
      if (estimatedIdx < expectedIdx) {
        efficiencyRating = 'better-than-expected';
      } else if (estimatedIdx > expectedIdx) {
        efficiencyRating = 'worse-than-expected';
      }
    }
  }

  return {
    canEvaluate: true,
    timeComplexity: timeanalysis,
    spaceComplexity: spaceAnalysis,
    efficiencyRating,
    expectedComplexity: problem.expectedComplexity || 'not-specified',
    executionMetrics: {
      maxTime: Math.max(...(submission.testResults || []).map(t => parseFloat(t.time) || 0)),
      maxMemory: Math.max(...(submission.testResults || []).map(t => t.memory || 0)),
      avgTime: submission.testResults.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0) / submission.testResults.length,
      avgMemory: submission.testResults.reduce((sum, t) => sum + (t.memory || 0), 0) / submission.testResults.length
    }
  };
}

/**
 * ⭐ NEW: Determine efficiency rating by comparing actual vs expected complexity
 */
export function determineEfficiencyRating(actualTime, actualSpace, expectedTime, expectedSpace) {
  const timeComparison = compareComplexities(actualTime, expectedTime);
  const spaceComparison = expectedSpace ? compareComplexities(actualSpace, expectedSpace) : 'not-specified';

  let overallRating = 'unknown';
  
  if (expectedTime) {
    if (timeComparison === 'equal') {
      overallRating = 'optimal';
    } else if (timeComparison === 'better') {
      overallRating = 'excellent';
    } else if (timeComparison === 'worse') {
      overallRating = 'suboptimal';
    }
  }

  return {
    overall: overallRating,
    time: {
      actual: actualTime,
      expected: expectedTime,
      comparison: timeComparison
    },
    space: {
      actual: actualSpace,
      expected: expectedSpace,
      comparison: spaceComparison
    }
  };
}

/**
 * ⭐ NEW: Compare two complexity classes
 * Returns: 'better' | 'equal' | 'worse' | 'unknown'
 */
export function compareComplexities(actual, expected) {
  if (!expected || actual === 'unknown' || expected === 'unknown') {
    return 'unknown';
  }

  if (actual === expected) return 'equal';

  const COMPLEXITY_ORDER = [
    'O(1)',
    'O(log n)',
    'O(n)',
    'O(n log n)',
    'O(n²)',
    'O(n³)',
    'O(2^n)'
  ];

  const actualIdx = COMPLEXITY_ORDER.indexOf(actual);
  const expectedIdx = COMPLEXITY_ORDER.indexOf(expected);

  if (actualIdx === -1 || expectedIdx === -1) {
    return 'unknown';
  }

  return actualIdx < expectedIdx ? 'better' : 'worse';
}

/**
 * ⭐ NEW: Calculate efficiency score (0-100)
 */
export function calculateEfficiencyScore(efficiencyRating) {
  const timeScore = getComparisonScore(efficiencyRating.time.comparison);
  const spaceScore = efficiencyRating.space.expected 
    ? getComparisonScore(efficiencyRating.space.comparison)
    : timeScore;

  // Weighted: time 70%, space 30%
  return Math.round((timeScore * 0.7) + (spaceScore * 0.3));
}

/**
 * ⭐ NEW: Get score for a comparison result
 */
function getComparisonScore(comparison) {
  switch (comparison) {
    case 'better': return 100;
    case 'equal': return 100;
    case 'worse': return 60;
    case 'not-specified': return 70;
    case 'unknown': return 50;
    default: return 0;
  }
}

/**
 * ⭐ NEW: Get optimization suggestions based on complexity comparison
 */
export function getOptimizationSuggestions(actualComplexity, expectedComplexity) {
  if (!expectedComplexity) {
    return ['No expected complexity specified for this problem.'];
  }

  const comparison = compareComplexities(actualComplexity, expectedComplexity);
  const suggestions = [];

  if (comparison === 'better') {
    suggestions.push('✅ Excellent! Your solution is MORE efficient than expected.');
    suggestions.push('💡 Consider sharing your approach for others to learn from.');
    return suggestions;
  }

  if (comparison === 'equal') {
    suggestions.push('✅ Perfect! Your solution matches the expected complexity.');
    suggestions.push('💡 This is an optimal solution for the given problem.');
    return suggestions;
  }

  if (comparison === 'worse') {
    suggestions.push(`⚠️ Your solution is ${actualComplexity} but expected is ${expectedComplexity}.`);
    suggestions.push('💡 Try to optimize your approach!');

    // Specific suggestions based on actual vs expected
    if (actualComplexity === 'O(n²)' && expectedComplexity === 'O(n log n)') {
      suggestions.push('💡 Consider: Use sorting + two-pointer technique');
      suggestions.push('💡 Or: Implement hash map for O(1) lookups');
    } else if (actualComplexity === 'O(n²)' && expectedComplexity === 'O(n)') {
      suggestions.push('💡 Consider: Using a hash map instead of nested loops');
      suggestions.push('💡 Or: Implement a single-pass algorithm');
    } else if (actualComplexity === 'O(n³)') {
      suggestions.push('💡 Consider: Reduce nesting levels');
      suggestions.push('💡 Or: Use dynamic programming for memoization');
    } else if (actualComplexity === 'O(2^n)') {
      suggestions.push('💡 Try: Dynamic programming approach');
      suggestions.push('💡 Or: Greedy algorithm or mathematical pattern');
    }
  }

  if (comparison === 'unknown') {
    suggestions.push('❓ Could not compare complexities - insufficient data');
  }

  return suggestions;
}

/**
 * ⭐ NEW: Generate efficiency report for a submission
 */
export function generateEfficiencyReport(submission, problem) {
  if (!submission.testResults || submission.testResults.length < 2) {
    return {
      canEvaluate: false,
      reason: 'Insufficient test results for efficiency analysis'
    };
  }

  const timeAnalysis = analyzeTimeComplexity(submission.testResults, problem);
  const spaceAnalysis = analyzeSpaceComplexity(submission.testResults, problem);

  const efficiencyRating = determineEfficiencyRating(
    timeAnalysis.estimated,
    spaceAnalysis.estimated,
    problem.expectedComplexity,
    problem.expectedSpace
  );

  const efficiencyScore = calculateEfficiencyScore(efficiencyRating);

  const suggestions = getOptimizationSuggestions(
    timeAnalysis.estimated,
    problem.expectedComplexity
  );

  return {
    canEvaluate: true,
    efficiency: {
      overall: efficiencyRating.overall,
      score: efficiencyScore,
      suggestions: suggestions
    },
    timeComplexity: {
      actual: timeAnalysis.estimated,
      expected: problem.expectedComplexity,
      comparison: efficiencyRating.time.comparison,
      confidence: timeAnalysis.confidence
    },
    spaceComplexity: {
      actual: spaceAnalysis.estimated,
      expected: problem.expectedSpace,
      comparison: efficiencyRating.space.comparison,
      confidence: spaceAnalysis.confidence
    },
    executionMetrics: {
      maxTime: Math.max(...(submission.testResults || []).map(t => parseFloat(t.time) || 0)),
      maxMemory: Math.max(...(submission.testResults || []).map(t => t.memory || 0)),
      avgTime: submission.testResults.reduce((sum, t) => sum + (parseFloat(t.time) || 0), 0) / submission.testResults.length,
      avgMemory: submission.testResults.reduce((sum, t) => sum + (t.memory || 0), 0) / submission.testResults.length
    }
  };
}

export { estimateInputSize };
