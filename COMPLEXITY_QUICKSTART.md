# Quick Start: Implementing Time/Space Complexity Evaluation

## 🎯 What This Implementation Does

Automatically analyzes submitted code to estimate Big O time and space complexity based on execution metrics from Judge0.

```
Input Code → Judge0 Executes → Measures Time/Memory → Analyzes Patterns → Estimates O(n), O(n²), etc.
```

---

## 📦 Files Added/Modified

### New Files Created:

1. **`server/utils/complexityAnalyzer.js`** (350 lines)
   - Core complexity analysis engine
   - Estimates Big O notation from execution metrics
   - Exports: `analyzeTimeComplexity()`, `analyzeSpaceComplexity()`, `generateComplexityReport()`

2. **`server/utils/complexityDisplay.js`** (380 lines)
   - Frontend helper utilities
   - Formatting, colors, comparisons, suggestions
   - Exports: `getComplexityColor()`, `formatExecutionTime()`, `getOptimizationSuggestions()`, etc.

3. **`proj_docs/COMPLEXITY_INTEGRATION_GUIDE.md`** (Comprehensive documentation)

### Modified Files:

1. **`server/routes/competition.js`**
   - **Added imports**: Complexity analyzer functions
   - **Line ~632**: Added `cpu_time_limit` and `memory_limit` to Judge0 payload
   - **Line ~730**: Added complexity analysis logic after test execution
   - **Lines 1285-1400**: Added 3 new API endpoints for complexity metrics

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Verify Files Exist

```bash
ls -la server/utils/complexityAnalyzer.js
ls -la server/utils/complexityDisplay.js
grep -n "cpu_time_limit" server/routes/competition.js
```

### Step 2: Check Database Schema

Verify these fields exist in `Problem` model in `schema.prisma`:

```prisma
timeLimit     Int    @default(3000)   // milliseconds
memoryLimit   Int    @default(256)    // megabytes
```

If not present, add them and run migration:

```bash
npx prisma migrate dev --name add_problem_limits
```

### Step 3: Create a Test Problem

```javascript
// Using your API or database tool
const problem = {
  competitionId: "...",
  title: "Simple Sum",
  description: "Add two numbers",
  difficulty: "Easy",
  points: 10,
  timeLimit: 2000,        // 2 seconds
  memoryLimit: 256,       // 256 MB
  testCases: [
    { input: "1 1", output: "2" },
    { input: "5 10", output: "15" },
    { input: "100 200", output: "300" }
  ]
};
```

### Step 4: Submit a Solution

```bash
curl -X POST http://localhost:3000/competitions/:id/submit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "problems": [{
      "problemId": "...",
      "code": "a, b = map(int, input().split())\nprint(a + b)",
      "language": "python"
    }]
  }'
```

### Step 5: View Complexity Metrics

```bash
# Get complexity for a submission
curl http://localhost:3000/competitions/:competitionId/submissions/:submissionId/complexity \
  -H "Authorization: Bearer <token>"

# Get complexity analysis for all submissions of a problem (admin only)
curl http://localhost:3000/competitions/:competitionId/problems/:problemId/complexity-analysis \
  -H "Authorization: Bearer <token>"
```

---

## 📊 How It Works

### Algorithm:

1. **Extract Metrics**: Collect time and memory from each test case execution

2. **Estimate Input Size**: Parse test case input to determine `n`:
   ```
   "n:100\n..." → n = 100
   "5 3 2 1 4" → n = 5 numbers
   "..." → n = length/10
   ```

3. **Calculate Ratios**: For consecutive test cases:
   ```
   Test 1: input_size=10, time=0.001s
   Test 2: input_size=20, time=0.002s
   Ratio: input grew 2x, time grew 2x → Could be O(n)
   
   Test 2: input_size=20, time=0.002s
   Test 3: input_size=40, time=0.008s
   Ratio: input grew 2x, time grew 4x → Could be O(n²)
   ```

4. **Pattern Matching**: Compare to expected ratios:
   - O(1): ratio ≈ 1
   - O(n): ratio ≈ 2
   - O(n²): ratio ≈ 4
   - O(n log n): ratio ≈ 2 × log(2)
   - etc.

5. **Vote**: If 2+ ratios match same complexity → estimate it

6. **Confidence**: (matching_votes / total_ratios) × 100%

### Example Output:

```json
{
  "estimated": "O(n)",
  "confidence": 95,
  "rationale": "Estimated from 3 test case comparisons (95% agreement)",
  "ratios": [
    { "inputRatio": 2.0, "timeRatio": 2.15, "estimated": "O(n)" },
    { "inputRatio": 2.0, "timeRatio": 1.98, "estimated": "O(n)" },
    { "inputRatio": 1.5, "timeRatio": 1.52, "estimated": "O(n)" }
  ]
}
```

---

## 🔌 API Reference

### Get Submission Complexity

```http
GET /competitions/{competitionId}/submissions/{submissionId}/complexity
Authorization: Bearer <token>
```

**Response:**
```json
{
  "complexity": {
    "canEvaluate": true,
    "timeComplexity": {
      "estimated": "O(n)",
      "confidence": 95,
      "rationale": "Estimated from 3 test case comparisons"
    },
    "spaceComplexity": { "estimated": "O(1)", "confidence": 100 },
    "executionMetrics": {
      "maxTime": 0.008,
      "maxMemory": 2048,
      "avgTime": 0.0045,
      "avgMemory": 1200
    }
  },
  "status": "accepted",
  "testsPassed": 10,
  "executionTime": 45
}
```

### Get Problem Complexity Analysis (Admin)

```http
GET /competitions/{competitionId}/problems/{problemId}/complexity-analysis
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "statistics": {
    "totalAcceptedSubmissions": 25,
    "complexityDistribution": {
      "O(1)": 2,
      "O(n)": 20,
      "O(n²)": 3
    },
    "averageExecutionTime": 52
  },
  "submissions": [
    {
      "userName": "John",
      "timeComplexity": "O(n)",
      "executionTime": 45,
      "confidenceScore": 95
    }
  ]
}
```

### Get Competition Complexity Report (Admin)

```http
GET /competitions/{competitionId}/complexity-report
Authorization: Bearer <admin_token>
```

---

## 🎨 Frontend Integration

### React Example:

```jsx
import { formatComplexityReport, getOptimizationSuggestions } from '@/utils/complexityDisplay';

function SubmissionCard({ submission }) {
  const report = formatComplexityReport(submission.complexity);
  
  return (
    <div>
      <h3>Complexity: {report.timeComplexity.emoji} {report.timeComplexity.estimated}</h3>
      <p>Confidence: {report.timeComplexity.confidence}%</p>
      
      {report.suggestions.map((s, i) => <p key={i}>{s}</p>)}
    </div>
  );
}
```

### Display Helpers:

```javascript
import {
  getComplexityColor,
  formatExecutionTime,
  formatMemory,
  getOptimizationSuggestions
} from '@/utils/complexityDisplay';

// Color visualization
const color = getComplexityColor('O(n)');  // '#3b82f6'

// Format numbers
formatExecutionTime(45);    // "45.00 ms"
formatMemory(2048);         // "2.00 MB"

// Get suggestions
getOptimizationSuggestions('O(n²)', 'O(n)');
// ["⚠️ Your solution has O(n²)...", "💡 Consider..."]
```

---

## 📝 Test Cases Strategy

For accurate complexity analysis, **vary test case sizes**:

```javascript
testCases: [
  { input: "n:10\n...", output: "..." },    // Small
  { input: "n:100\n...", output: "..." },   // Medium
  { input: "n:1000\n...", output: "..." },  // Large
  { input: "n:10000\n...", output: "..." }  // Very large
]
```

**Why?** Larger size differences make patterns clearer:
- 2x input size, 2x time → O(n)
- 2x input size, 4x time → O(n²)
- 10x input size, ~3.3x time → O(n log n)

---

## ⚡ Troubleshooting

### Problem: Getting "unknown" complexity

**Cause:** Not enough diverse test cases

**Fix:** Add test cases with 2-4x size increases:
```
Input size: 10, 50, 250, 1250  // Each is 5x previous
```

### Problem: Wrong complexity detected

**Cause:** Input size not estimated correctly

**Fix:** Make input sizes obvious:
```
"n:100\n..." instead of "..." (ambiguous)
```

### Problem: API returns 403

**Cause:** Not authorized

**Fix:** Complexity endpoints require:
- Own submission for individual view
- Admin role for aggregate analysis

---

## 🧪 Manual Testing

```javascript
// Test the analyzer directly in Node.js
import { analyzeTimeComplexity } from './server/utils/complexityAnalyzer.js';

const testResults = [
  { time: 0.001, memory: 100, input: 'n:10' },
  { time: 0.002, memory: 200, input: 'n:20' },
  { time: 0.004, memory: 400, input: 'n:40' }
];

const analysis = analyzeTimeComplexity(testResults);
console.log(analysis);
// { estimated: 'O(n)', confidence: 100... }
```

---

## 📈 Next Steps

1. **Add Expected Complexity**: Set `expectedComplexity` field on problems
2. **Frontend Display**: Show badges with colors and emojis
3. **Leaderboard Enhancement**: Sort by efficiency
4. **Student Hints**: Guide towards optimal solutions
5. **Analytics Dashboard**: Teacher view of algorithm trends

---

## 📚 Files to Review

- `proj_docs/COMPLEXITY_INTEGRATION_GUIDE.md` - Detailed documentation
- `server/utils/complexityAnalyzer.js` - Core implementation
- `server/utils/complexityDisplay.js` - Frontend utilities
- `server/routes/competition.js` - Integration points

