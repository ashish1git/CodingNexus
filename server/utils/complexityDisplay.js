/**
 * Complexity Display Helpers
 * Utility functions for displaying Big O complexity in the frontend
 * 
 * Usage in React:
 * import { ComplexityBadge, getComplexityColor, formatExecutionTime } from '@/utils/complexityDisplay';
 */

/**
 * Complexity hierarchy for comparison
 * Used to determine if a solution is efficient or not
 */
export const COMPLEXITY_HIERARCHY = [
  'O(1)',
  'O(log n)',
  'O(n)',
  'O(n log n)',
  'O(n²)',
  'O(n³)',
  'O(2^n)'
];

/**
 * Get color for a complexity class
 * Green for efficient, yellow for moderate, red for inefficient
 */
export function getComplexityColor(complexity) {
  const colorMap = {
    'O(1)': '#10b981',        // Emerald - Excellent
    'O(log n)': '#06b6d4',    // Cyan - Very Good
    'O(n)': '#3b82f6',        // Blue - Good
    'O(n log n)': '#8b5cf6',  // Violet - Acceptable
    'O(n²)': '#f59e0b',       // Amber - Poor
    'O(n³)': '#ef4444',       // Red - Very Poor
    'O(2^n)': '#7c2d12',      // Dark Red - Unacceptable
    'unknown': '#6b7280'      // Gray - Unknown
  };
  
  return colorMap[complexity] || colorMap['unknown'];
}

/**
 * Get descriptive name for complexity
 */
export function getComplexityDescription(complexity) {
  const descriptions = {
    'O(1)': 'Constant Time',
    'O(log n)': 'Logarithmic',
    'O(n)': 'Linear',
    'O(n log n)': 'Linear Logarithmic',
    'O(n²)': 'Quadratic',
    'O(n³)': 'Cubic',
    'O(2^n)': 'Exponential',
    'unknown': 'Unknown'
  };
  
  return descriptions[complexity] || 'Unknown';
}

/**
 * Compare two complexities
 * @returns 'better' | 'worse' | 'equal'
 */
export function compareComplexities(complexity1, complexity2) {
  const idx1 = COMPLEXITY_HIERARCHY.indexOf(complexity1);
  const idx2 = COMPLEXITY_HIERARCHY.indexOf(complexity2);
  
  if (idx1 === -1 || idx2 === -1) return 'unknown';
  if (idx1 < idx2) return 'better';
  if (idx1 > idx2) return 'worse';
  return 'equal';
}

/**
 * Format execution time for display
 */
export function formatExecutionTime(milliseconds) {
  if (milliseconds === undefined || milliseconds === null) return 'N/A';
  
  if (milliseconds < 1) {
    return (milliseconds * 1000).toFixed(2) + ' μs';
  } else if (milliseconds < 1000) {
    return milliseconds.toFixed(2) + ' ms';
  } else {
    return (milliseconds / 1000).toFixed(2) + ' s';
  }
}

/**
 * Format memory in kilobytes
 */
export function formatMemory(kilobytes) {
  if (kilobytes === undefined || kilobytes === null) return 'N/A';
  
  if (kilobytes === 0) return '0 KB';
  if (kilobytes < 1024) {
    return kilobytes.toFixed(0) + ' KB';
  } else if (kilobytes < 1024 * 1024) {
    return (kilobytes / 1024).toFixed(2) + ' MB';
  } else {
    return (kilobytes / (1024 * 1024)).toFixed(2) + ' GB';
  }
}

/**
 * Determine efficiency rating
 */
export function getEfficiencyRating(submission, expectedComplexity) {
  if (!expectedComplexity || submission.timeComplexity === 'unknown') {
    return 'unrated';
  }
  
  const comparison = compareComplexities(submission.timeComplexity, expectedComplexity);
  
  if (comparison === 'better') return 'excellent';
  if (comparison === 'equal') return 'optimal';
  if (comparison === 'worse') return 'suboptimal';
  
  return 'unrated';
}

/**
 * Get emoji for complexity
 */
export function getComplexityEmoji(complexity) {
  const emojiMap = {
    'O(1)': '⚡',           // Lightning - Constant
    'O(log n)': '📈',      // Up chart - Logarithmic
    'O(n)': '📊',          // Bar chart - Linear
    'O(n log n)': '📉',    // Down chart - N log N
    'O(n²)': '⚠️',         // Warning - Quadratic
    'O(n³)': '🔴',         // Red circle - Cubic
    'O(2^n)': '💥',        // Explosion - Exponential
    'unknown': '❓'        // Question - Unknown
  };
  
  return emojiMap[complexity] || '❓';
}

/**
 * React Component: Complexity Badge (JSX)
 * Returns JSX for a complexity badge
 */
export function ComplexityBadge({ complexity, confidence, size = 'md' }) {
  const color = getComplexityColor(complexity);
  const description = getComplexityDescription(complexity);
  const emoji = getComplexityEmoji(complexity);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };
  
  return (
    `<span 
      class="inline-flex items-center gap-2 rounded-lg font-semibold transition-all ${sizeClasses[size]}"
      style="background-color: ${color}20; color: ${color}; border: 1px solid ${color}"
      title="${description}${confidence ? ` (${confidence}% confidence)` : ''}"
    >
      <span>${emoji}</span>
      <span>${complexity}</span>
      ${confidence ? `<span class="text-xs opacity-75">(${confidence}%)</span>` : ''}
    </span>`
  );
}

/**
 * Create a complexity comparison table data
 */
export function createComplexityComparisonData(submissions) {
  return submissions.map(submission => ({
    userId: submission.userId,
    userName: submission.userName,
    timeComplexity: submission.timeComplexity,
    spaceComplexity: submission.spaceComplexity,
    executionTime: submission.executionTime,
    memory: submission.memoryUsed,
    efficiency: getEfficiencyRating(submission, 'O(n)'),
    confidence: submission.confidenceScore
  }));
}

/**
 * Get recommendations for improving complexity
 */
export function getOptimizationSuggestions(currentComplexity, expectedComplexity) {
  if (!expectedComplexity) {
    return [];
  }
  
  const comparison = compareComplexities(currentComplexity, expectedComplexity);
  
  if (comparison === 'better') {
    return [
      '✅ Great job! Your solution is more efficient than expected.',
      '💡 Consider documenting your approach for others to learn from.'
    ];
  }
  
  if (comparison === 'equal') {
    return [
      '✅ Perfect! Your solution matches the expected complexity.',
      '💡 This is an optimal solution for the given problem.'
    ];
  }
  
  if (comparison === 'worse') {
    const suggestions = [
      `⚠️ Your solution has ${currentComplexity} complexity but expected is ${expectedComplexity}.`,
      '💡 Consider using more efficient data structures or algorithms.',
      '🤔 Think about:'
    ];
    
    // Add specific suggestions based on complexity
    if (currentComplexity === 'O(n²)' && expectedComplexity === 'O(n log n)') {
      suggestions.push('  • Using sorting instead of nested loops');
      suggestions.push('  • Implementing a hash map for O(1) lookups');
    } else if (currentComplexity === 'O(2^n)') {
      suggestions.push('  • Using dynamic programming with memoization');
      suggestions.push('  • Reducing problem to polynomial time');
    }
    
    return suggestions;
  }
  
  return [];
}

/**
 * Format complexity report for display
 */
export function formatComplexityReport(report) {
  if (!report.canEvaluate) {
    return {
      status: 'unavailable',
      message: report.reason || 'Complexity analysis not available'
    };
  }

  return {
    status: 'available',
    timeComplexity: {
      estimated: report.timeComplexity?.estimated,
      description: getComplexityDescription(report.timeComplexity?.estimated),
      confidence: report.timeComplexity?.confidence,
      emoji: getComplexityEmoji(report.timeComplexity?.estimated)
    },
    spaceComplexity: {
      estimated: report.spaceComplexity?.estimated,
      description: getComplexityDescription(report.spaceComplexity?.estimated),
      emoji: getComplexityEmoji(report.spaceComplexity?.estimated)
    },
    executionMetrics: {
      maxTime: formatExecutionTime(report.executionMetrics?.maxTime),
      maxMemory: formatMemory(report.executionMetrics?.maxMemory),
      avgTime: formatExecutionTime(report.executionMetrics?.avgTime),
      avgMemory: formatMemory(report.executionMetrics?.avgMemory)
    },
    efficiencyRating: report.efficiencyRating,
    suggestions: getOptimizationSuggestions(
      report.timeComplexity?.estimated,
      report.expectedComplexity
    )
  };
}

/**
 * Complexity Level Badge (simple string-based)
 */
export function getComplexityLevel(complexity) {
  const levels = {
    'O(1)': '⭐⭐⭐⭐⭐',
    'O(log n)': '⭐⭐⭐⭐',
    'O(n)': '⭐⭐⭐',
    'O(n log n)': '⭐⭐',
    'O(n²)': '⭐',
    'O(n³)': '⭐',
    'O(2^n)': '💀',
    'unknown': '❓'
  };
  
  return levels[complexity] || '❓';
}

export default {
  getComplexityColor,
  getComplexityDescription,
  compareComplexities,
  formatExecutionTime,
  formatMemory,
  getEfficiencyRating,
  getComplexityEmoji,
  getOptimizationSuggestions,
  formatComplexityReport,
  getComplexityLevel,
  createComplexityComparisonData,
  COMPLEXITY_HIERARCHY,
  ComplexityBadge
};
