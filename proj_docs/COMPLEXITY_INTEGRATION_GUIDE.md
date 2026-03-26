# Time and Space Complexity Integration Guide

## Overview

This guide explains how to integrate time and space complexity evaluation into your Judge0-based LeetCode-style programming platform. The system automatically analyzes submissions to estimate Big O complexity and provides efficiency metrics.

---

## Architecture Components

### 1. **Complexity Analyzer** (`server/utils/complexityAnalyzer.js`)

The core analysis engine that estimates complexity from execution metrics.

#### Key Functions:

- **`analyzeTimeComplexity(testCases, problem)`**
  - Analyzes execution time patterns across test cases
  - Compares input size ratios to time ratios
  - Estimates O(1), O(log n), O(n), O(n log n), O(n²), O(n³), O(2^n)
  - Returns complexity estimate with confidence score

- **`analyzeSpaceComplexity(testCases, problem)`**
  - Similar to time complexity but for memory usage

- **`generateComplexityReport(submission, problem)`**
  - Creates comprehensive report including both time and space complexity
  - Rates efficiency (optimal, suboptimal, etc.)
  - Provides execution metrics and suggestions

#### How It Works:

```
1. Extract time/memory data from test cases
2. Estimate input size from test case inputs
3. Calculate growth ratios between consecutive test cases
4. Match patterns to complexity classes:
   - O(1):      Growth ratio ≈ 1
   - O(n):      Growth ratio ≈ input_ratio
   - O(n log n): Growth ratio ≈ input_ratio * log(input_ratio)
   - O(n²):     Growth ratio ≈ input_ratio²
   - etc.
5. Vote on most likely complexity (need 2+ matching ratios)
6. Return estimate with confidence percentage
```

---

## Integration with Competition Submission Handler

### Updated Competition.js Flow:

```javascript
// 1. Enhanced Judge0 payload with limits
const judge0Payload = {
  source_code: executableCode,
  language_id: languageId,
  cpu_time_limit: problem.timeLimit / 1000,  // Convert ms to seconds
  memory_limit: problem.memoryLimit * 1024   // Convert MB to KB
};
```

### 2. Extraction and Storage:

```javascript
// Judge0 returns metrics
{
  time: "0.005",        // Execution time in seconds
  memory: 456,          // Memory used in KB
  status: {...},        // Compilation/execution status
  stdout: "..."         // Output
}

// Stored in testResults array
testResults.push({
  testCase: i + 1,
  input: testCase.input,
  time: result.time,           // Key metric for analysis
  memory: result.memory,       // Key metric for analysis
  expectedOutput: expected,
  actualOutput: stdout,
  passed: passed,
  inputSize: estimateInputSize(testCase.input)  // Calculated for analysis
});
```

### 3. Complexity Analysis (After All Tests):

```javascript
// Only analyze accepted solutions
if (finalStatus === 'accepted' && testResults.length >= 2) {
  const complexityAnalysis = generateComplexityReport(
    { testResults },
    problem
  );
  
  // Store complexity data with submission
  await prisma.problemSubmission.update({
    where: { id: submission.id },
    data: {
      testResults: enrichedTestResults,
      errorMessage: `Complexity: ${complexityAnalysis.timeComplexity?.estimated}`
    }
  });
}
```

---

## Database Changes

### Problem Model (schema.prisma)
Already includes these fields:
```prisma
timeLimit     Int    @default(3000)   // milliseconds
memoryLimit   Int    @default(256)    // megabytes
expectedComplexity String?            // e.g., "O(n log n)"
```

### ProblemSubmission Model
Already captures:
```prisma
executionTime    Int    @default(0)   // milliseconds
memoryUsed       Int    @default(0)   // KB
testResults      Json?                // Includes time/memory per test case
```

### Migration (if adding expectedComplexity):
```sql
ALTER TABLE "Problem" ADD COLUMN "expectedComplexity" VARCHAR;
```

---

## API Endpoints

### 1. Get Complexity Metrics for a Submission

**Endpoint:**
```
GET /competitions/:competitionId/submissions/:submissionId/complexity
```

**Authentication:** Required (own submission or admin)

**Response:**
```json
{
  "submissionId": "uuid",
  "problemId": "uuid",
  "problemTitle": "Two Sum",
  "language": "python",
  "status": "accepted",
  "testsPassed": 10,
  "totalTests": 10,
  "executionTime": 45,
  "memoryUsed": 2048,
  "complexity": {
    "canEvaluate": true,
    "timeComplexity": {
      "estimated": "O(n)",
      "confidence": 95,
      "rationale": "Estimated from 10 test case comparisons"
    },
    "spaceComplexity": {
      "estimated": "O(1)",
      "confidence": 100
    },
    "executionMetrics": {
      "maxTime": 0.008,
      "maxMemory": 3072,
      "avgTime": 0.0045,
      "avgMemory": 2048
    },
    "efficiencyRating": "optimal"
  },
  "submittedAt": "2026-03-26T10:30:00Z",
  "judgedAt": "2026-03-26T10:35:00Z"
}
```

### 2. Get Complexity Analysis for a Problem (All Submissions)

**Endpoint:**
```
GET /competitions/:competitionId/problems/:problemId/complexity-analysis
```

**Authentication:** Required (admin/subadmin only)

**Response:**
```json
{
  "problemId": "uuid",
  "problemTitle": "Two Sum",
  "difficulty": "Easy",
  "submissions": [
    {
      "userId": "uuid",
      "userName": "John Doe",
      "language": "python",
      "timeComplexity": "O(n)",
      "spaceComplexity": "O(n)",
      "executionTime": 45,
      "memoryUsed": 2048,
      "confidenceScore": 95
    }
  ],
  "statistics": {
    "totalAcceptedSubmissions": 25,
    "complexityDistribution": {
      "O(1)": 2,
      "O(n)": 20,
      "O(n²)": 3
    },
    "averageExecutionTime": 52,
    "averageMemory": 2200,
    "problemConstraints": {
      "timeLimit": 3000,
      "memoryLimit": 256,
      "expectedComplexity": "O(n)"
    }
  }
}
```

### 3. Get Competition-Wide Complexity Report

**Endpoint:**
```
GET /competitions/:competitionId/complexity-report
```

**Authentication:** Required (admin/subadmin only)

**Response:**
```json
{
  "competitionId": "uuid",
  "competitionTitle": "Coding Marathon 2026",
  "totalProblems": 5,
  "problems": [
    {
      "problemId": "uuid",
      "title": "Two Sum",
      "difficulty": "Easy",
      "acceptedSubmissions": 25,
      "complexityDistribution": {
        "O(n)": 20,
        "O(n²)": 5
      },
      "mostCommonComplexity": "O(n)"
    }
  ]
}
```

---

## Frontend Display (complexityDisplay.js)

Utility functions for rendering complexity information:

### Display Functions:

```javascript
// Get color for complexity visualization
getComplexityColor('O(n)')  // Returns: '#3b82f6'

// Get descriptive name
getComplexityDescription('O(n log n)')  // Returns: 'Linear Logarithmic'

// Format time (handles microseconds, milliseconds, seconds)
formatExecutionTime(45)       // Returns: '45.00 ms'
formatExecutionTime(0.005)    // Returns: '5.00 μs'
formatExecutionTime(1500)     // Returns: '1.50 s'

// Format memory (handles KB, MB, GB)
formatMemory(2048)            // Returns: '2.00 MB'
formatMemory(512)             // Returns: '512 KB'

// Compare two complexities
compareComplexities('O(n)', 'O(n²)')  // Returns: 'better'

// Get efficiency rating
getEfficiencyRating(submission, 'O(n)')  // Returns: 'optimal'

// Get optimization suggestions
getOptimizationSuggestions('O(n²)', 'O(n log n)')
// Returns: [
//   "⚠️ Your solution has O(n²) complexity...",
//   "💡 Consider using more efficient data structures...",
//   "🤔 Think about:",
//   "  • Using sorting instead of nested loops"
// ]
```

### React Integration Example:

```jsx
import { getComplexityColor, formatExecutionTime, ComplexityBadge, formatComplexityReport } from '@/utils/complexityDisplay';

function SubmissionDetails({ submission, problem }) {
  const report = formatComplexityReport(submission.complexity);
  
  return (
    <div>
      <h3>Complexity Analysis</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Time Complexity */}
        <div>
          <h4>Time Complexity</h4>
          <span 
            style={{
              backgroundColor: getComplexityColor(report.timeComplexity.estimated) + '20',
              color: getComplexityColor(report.timeComplexity.estimated),
              padding: '8px 12px',
              borderRadius: '6px'
            }}
          >
            {report.timeComplexity.emoji} {report.timeComplexity.estimated}
            <p className="text-xs mt-1">
              {report.timeComplexity.confidence}% confidence
            </p>
          </span>
        </div>
        
        {/* Space Complexity */}
        <div>
          <h4>Space Complexity</h4>
          <span 
            style={{
              backgroundColor: getComplexityColor(report.spaceComplexity.estimated) + '20',
              color: getComplexityColor(report.spaceComplexity.estimated),
              padding: '8px 12px',
              borderRadius: '6px'
            }}
          >
            {report.spaceComplexity.emoji} {report.spaceComplexity.estimated}
          </span>
        </div>
      </div>
      
      {/* Optimization Suggestions */}
      {report.suggestions.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded">
          {report.suggestions.map((suggestion, idx) => (
            <p key={idx} className="text-sm">{suggestion}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Problem Setup for Complexity Analysis

### 1. Create Problem with Complexity Limits

```javascript
// Example: Create a problem expecting O(n) solution
const problem = await prisma.problem.create({
  data: {
    competitionId: "...",
    title: "Two Sum",
    description: "Find two numbers that add up to target",
    difficulty: "Easy",
    points: 100,
    timeLimit: 3000,        // 3 seconds
    memoryLimit: 256,       // 256 MB
    expectedComplexity: "O(n)",  // Hash map solution
    testCases: [
      {
        input: "2\n1 2 3\n3",
        output: "0 1",
        hidden: false
      }
      // ... more test cases
    ]
  }
});
```

### 2. Test Cases Strategy

**Important:** For accurate complexity analysis, include test cases of varying sizes:

```javascript
testCases: [
  // Small input
  { input: "n:5\n...", output: "..." },
  
  // Medium input
  { input: "n:100\n...", output: "..." },
  
  // Large input (for TLE/memory detection)
  { input: "n:10000\n...", output: "..." },
  
  // Edge cases
  { input: "n:1\n...", output: "..." }
]
```

The analyzer needs at least 2 test cases to estimate complexity. More varied sizes = higher confidence.

---

## Performance Impact

### Overhead:

- **Complexity Analysis:** ~50-100ms per submission
- **Memory:** Minimal (stores analysis in testResults JSON)
- **Database:** No new queries needed (uses existing testResults)

### Optimization:

- Analysis runs async in background (doesn't block user)
- Caching could implement for frequently accessed reports

---

## Troubleshooting

### Analysis Returns "unknown":

```
Possible causes:
1. Fewer than 2 test cases with different input sizes
2. Test cases execute too quickly (< 1ms) - noise in measurements
3. Test case inputs not properly sized (estimateInputSize returns same value)

Solutions:
→ Add more diverse test cases
→ Use larger input sizes
→ Ensure consistent scaling in test case sizes
```

### Wrong Complexity Estimate:

```
If analysis incorrectly identifies O(n²) as O(n):

1. Check input size estimation logic
2. Verify test case sizes follow exponential scaling pattern
3. Look at individual ratios in complexityAnalysis.ratios array

Manually specify expectedComplexity on problem for guidance.
```

### Memory Analysis Not Working:

Same as time complexity - need diverse test case sizes to detect patterns.

---

## Example: Complete Submission Flow

```javascript
// 1. Student submits code
POST /competitions/:id/submit {
  problems: [
    {
      problemId: "...",
      code: "def twoSum(nums, target)...",
      language: "python"
    }
  ]
}

// 2. System wraps code, creates Judge0 payload with limits
{
  source_code: "...",
  language_id: 71,
  cpu_time_limit: 3.0,        // From problem.timeLimit
  memory_limit: 262144,        // From problem.memoryLimit
  stdin: "..."
}

// 3. Judge0 executes and returns metrics
{
  stdout: "0 1",
  time: "0.005",
  memory: 2048,
  status: { id: 3, description: "Accepted" }
}

// Store in testResults:
{
  time: "0.005",
  memory: 2048,
  input: "...",
  expectedOutput: "0 1",
  actualOutput: "0 1",
  passed: true
}

// 4. After all test cases, analyze complexity
complexityAnalysis = analyzeTimeComplexity([
  { time: 0.002, memory: 1024 },
  { time: 0.005, memory: 2048 },
  { time: 0.012, memory: 4096 }
])
// Result: "O(1)" confidence 100% (memory grows linearly but time stays constant)

// 5. Frontend displays:
// "Excellent solution! O(1) space complexity"
```

---

## Future Enhancements

1. **Algorithm Pattern Recognition**: Identify specific algorithms (sorting, DP, BFS, etc.)
2. **Cross-Language Comparison**: Compare Python vs C++ vs Java submissions
3. **Leaderboard by Complexity**: Rank submissions by efficiency
4. **Complexity Hints**: Guide students towards more efficient approaches
5. **Historical Trending**: Track complexity improvements over competition
6. **Benchmarking**: Compare against expert solutions

---

## References

- Judge0 API: https://judge0.com
- Big O Notation: https://en.wikipedia.org/wiki/Big_O_notation
- Complexity Analysis: https://www.geeksforgeeks.org/analysis-of-algorithms/

