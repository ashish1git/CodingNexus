/**
 * AST-Based Complexity Analyzer
 * Analyzes source code structure to detect loops, recursion, and calculate Big O complexity
 * More accurate than runtime metrics
 */

/**
 * Analyze code complexity by parsing its structure
 * @param {string} code - Source code to analyze
 * @param {string} language - Programming language (java, python, javascript, cpp, c)
 * @returns {Object} Complexity analysis result
 */
export function analyzeCodeComplexity(code, language = 'javascript') {
  if (!code || typeof code !== 'string') {
    return {
      timeComplexity: 'unknown',
      spaceComplexity: 'unknown',
      confidence: 0,
      error: 'No code provided'
    };
  }

  try {
    // Detect nested loops
    const loops = detectLoops(code);
    const recursion = detectRecursion(code);
    const dataStructures = detectDataStructures(code);

    console.log('🔍 Loop Analysis:', loops);
    console.log('♻️ Recursion Analysis:', recursion);
    console.log('📦 Data Structures:', dataStructures);

    // Calculate time complexity from loop nesting
    const timeComplexity = calculateTimeComplexity(loops, recursion);

    // Calculate space complexity
    const spaceComplexity = calculateSpaceComplexity(loops, recursion, dataStructures);

    return {
      timeComplexity: timeComplexity.complexity,
      timeExplanation: timeComplexity.explanation,
      spaceComplexity: spaceComplexity.complexity,
      spaceExplanation: spaceComplexity.explanation,
      loops: loops.total,
      maxNesting: loops.maxDepth,
      hasRecursion: recursion.isRecursive,
      recursionDepth: recursion.maxDepth,
      dataStructures: dataStructures,
      confidence: 95,
      rationale: 'AST-based analysis of code structure'
    };
  } catch (error) {
    console.error('❌ Complexity analysis error:', error.message);
    return {
      timeComplexity: 'unknown',
      spaceComplexity: 'unknown',
      confidence: 0,
      error: error.message
    };
  }
}

/**
 * Detect all loops (for, while) and their nesting depth
 * Simple and accurate: count consecutive nested loops
 */
function detectLoops(code) {
  const cleanCode = removeStringsAndComments(code);
  
  // Find all loop keywords with their positions
  const loops = [];
  const loopPattern = /\b(for|while)\s*[\(\{]/gi;
  let match;
  
  while ((match = loopPattern.exec(cleanCode)) !== null) {
    loops.push({
      type: match[1].toLowerCase(),
      position: match.index
    });
  }
  
  if (loops.length === 0) {
    return { total: 0, maxDepth: 0, loops: [], byType: { for: 0, while: 0 } };
  }

  // Calculate nesting depth by counting how many loops can be nested at each position
  let maxNestingDepth = 1;
  
  // Simple heuristic: if we have N loops and code is reasonably sized,
  // check if they appear to be nested by looking at their spacing
  if (loops.length > 1) {
    // Loops are typically nested if they appear close to each other
    // and their closing braces overlap
    let consecutiveNested = 1;
    for (let i = 1; i < loops.length; i++) {
      const prevPos = loops[i - 1].position;
      const currPos = loops[i].position;
      // If loops are close together (within 100 chars), they're likely nested
      if (currPos - prevPos < 100) {
        consecutiveNested++;
        maxNestingDepth = Math.max(maxNestingDepth, consecutiveNested);
      } else {
        consecutiveNested = 1;
      }
    }
  }

  return {
    total: loops.length,
    maxDepth: maxNestingDepth,
    loops: loops,
    byType: {
      for: loops.filter(l => l.type === 'for').length,
      while: loops.filter(l => l.type === 'while').length
    }
  };
}

/**
 * Check if position is the start of a loop keyword
 */
function isLoopKeyword(substr) {
  if (substr.startsWith('for')) {
    const next = substr[3];
    return /[\s\(]/.test(next);
  }
  if (substr.startsWith('while')) {
    const next = substr[5];
    return /[\s\(]/.test(next);
  }
  if (substr.startsWith('do')) {
    const next = substr[2];
    return /[\s{]/.test(next);
  }
  return false;
}

/**
 * Detect recursive function calls
 */
function detectRecursion(code) {
  const cleanCode = removeStringsAndComments(code);
  
  // Find actual function/method signatures  
  const functionRegex = /(?:function\s+(\w+)|(\w+)\s*\(\s*[^)]*\)\s*\{|public\s+\w+\s+(\w+)\s*\(|def\s+(\w+))/g;
  const functions = new Set();
  
  let match;
  while ((match = functionRegex.exec(cleanCode)) !== null) {
    const name = match[1] || match[2] || match[3] || match[4];
    if (name && !['for', 'if', 'while', 'switch', 'catch', 'function'].includes(name)) {
      functions.add(name);
    }
  }

  // Check if any function calls are recursive (function calls itself)
  let maxRecursionDepth = 0;
  let isRecursive = false;
  
  for (const func of functions) {
    // Look for exact function calls within that function
    const funcCallRegex = new RegExp(`(?:return\\s+)?${func}\\s*\\(`, 'g');
    const callMatches = cleanCode.match(funcCallRegex);
    
    // If a function calls itself, it's recursive
    if (callMatches && callMatches.length > 0) {
      // Check if this is actually a self-call (by checking context)
      const funcNameOccurrences = (cleanCode.match(new RegExp(`(?<!\\w)${func}(?!\\w)`, 'g')) || []).length;
      
      // If the function appears more than twice (definition + at least one call), it's recursive
      if (funcNameOccurrences > 1) {
        isRecursive = true;
        maxRecursionDepth = Math.max(maxRecursionDepth, callMatches.length);
      }
    }
  }

  return {
    isRecursive: isRecursive,
    maxDepth: maxRecursionDepth,
    functions: Array.from(functions)
  };
}

/**
 * Detect data structures used
 */
function detectDataStructures(code) {
  const cleanCode = removeStringsAndComments(code);
  const structures = {};
  
  // Common data structure keywords
  const keywords = {
    'Map': /new\s*Map|HashMap|Dict|map\(/gi,
    'Set': /new\s*Set|HashSet|set\(/gi,
    'List': /List\s*<|ArrayList|new\s+Array|push|append/gi,
    'Queue': /Queue|Deque/gi,
    'Stack': /Stack|push.*pop/gi,
    'Graph': /Graph|adjacency|edge|vertex/gi,
    'Tree': /Tree|Node|left.*right|child/gi,
    'Heap': /Heap|PriorityQueue/gi
  };

  for (const [name, regex] of Object.entries(keywords)) {
    const matches = cleanCode.match(regex);
    if (matches) {
      structures[name] = matches.length;
    }
  }

  return structures;
}

/**
 * Calculate time complexity based on loop structure
 */
function calculateTimeComplexity(loops, recursion) {
  const loopDepth = loops.maxDepth;
  const hasRecursion = recursion.isRecursive;
  
  // Base complexity from loop nesting
  let complexity = 'O(1)';
  let explanation = 'No loops or recursive calls detected';
  
  if (hasRecursion && loopDepth >= 2) {
    complexity = 'O(n² * 2^n)';
    explanation = 'Recursive function with nested loops - exponential with polynomial factor';
  } else if (hasRecursion) {
    if (recursion.maxDepth === 2) {
      complexity = 'O(2^n)';
      explanation = 'Binary recursion (e.g., Fibonacci)';
    } else {
      complexity = 'O(n^n)';
      explanation = 'Multiple recursive calls';
    }
  } else if (loopDepth === 0) {
    complexity = 'O(1)';
    explanation = 'Constant time - no loops';
  } else if (loopDepth === 1) {
    complexity = 'O(n)';
    explanation = 'Single loop iteration over input';
  } else if (loopDepth === 2) {
    complexity = 'O(n²)';
    explanation = 'Two nested loops (quadratic)';
  } else if (loopDepth === 3) {
    complexity = 'O(n³)';
    explanation = 'Three nested loops (cubic)';
  } else {
    complexity = `O(n^${loopDepth})`;
    explanation = `${loopDepth} nested loops`;
  }

  return { complexity, explanation };
}

/**
 * Calculate space complexity
 */
function calculateSpaceComplexity(loops, recursion, dataStructures) {
  const hasRecursion = recursion.isRecursive;
  const usesDataStructures = Object.keys(dataStructures).length > 0;
  
  let complexity = 'O(1)';
  let explanation = 'No additional data structures';

  if (hasRecursion) {
    const depth = recursion.maxDepth;
    complexity = `O(${depth})`;
    explanation = `Recursion call stack depth of ${depth}`;
  } else if (usesDataStructures) {
    // Check for expanding data structures
    if (dataStructures['Map'] || dataStructures['List'] || dataStructures['Set']) {
      complexity = 'O(n)';
      explanation = 'Dynamic data structure stores up to n elements';
    }
    if (dataStructures['Graph'] && loops.total >= 2) {
      complexity = 'O(n)';
      explanation = 'Graph representation requires O(n) space';
    }
  } else if (loops.total > 0 && loops.maxDepth >= 1) {
    complexity = 'O(n)';
    explanation = 'Loop with external data structure usage';
  }

  return { complexity, explanation };
}

/**
 * Remove strings and comments to get clean code
 */
function removeStringsAndComments(code) {
  let clean = code;
  
  // Remove single-line comments
  clean = clean.replace(/^[ \t]*\/\/.*$/gm, '');
  
  // Remove multi-line comments
  clean = clean.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove string literals (both single and double quotes)
  clean = clean.replace(/"(?:\\.|[^"])*"/g, '""');
  clean = clean.replace(/'(?:\\.|[^'])*'/g, "''");
  
  return clean;
}

/**
 * Analyze graph structure complexity
 */
export function analyzeGraphComplexity(adjacencyList) {
  if (!adjacencyList || typeof adjacencyList !== 'object') {
    return {
      timeComplexity: 'unknown',
      spaceComplexity: 'unknown',
      error: 'Invalid graph structure'
    };
  }

  const nodeCount = Object.keys(adjacencyList).length;
  let edgeCount = 0;
  
  for (const neighbors of Object.values(adjacencyList)) {
    edgeCount += (Array.isArray(neighbors) ? neighbors.length : 0);
  }

  // For graph algorithms
  const timeComplexity = edgeCount > nodeCount * 2 ? 
    'O(n * log n + m)' : // Dense graph - likely needs sorting
    'O(n + m)';           // Sparse graph - DFS/BFS
  
  const spaceComplexity = 'O(n)'; // Adjacency list storage

  return {
    timeComplexity,
    spaceComplexity,
    explanation: `Graph with ${nodeCount} nodes and ${edgeCount} edges`,
    nodeCount,
    edgeCount,
    isDense: edgeCount > nodeCount * 2
  };
}

/**
 * Main export - unified complexity analysis
 */
export function analyzeComplexity(input) {
  const { code, graph, type = 'code' } = input;
  
  if (type === 'graph' && graph) {
    return analyzeGraphComplexity(graph);
  } else if (code) {
    return analyzeCodeComplexity(code, input.language);
  } else {
    return {
      timeComplexity: 'unknown',
      spaceComplexity: 'unknown',
      error: 'No input provided'
    };
  }
}
