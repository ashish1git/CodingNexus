# PRE-TEST COMPLEXITY CHECK - Complete Implementation

## Overview

The **Pre-Test Complexity Check** is a new feature that analyzes code complexity **immediately after compilation**, BEFORE running test cases. This prevents wasting time on inefficient algorithms (like running O(n²) solutions against large inputs when O(n) is required).

## How It Works

### Execution Flow

```
1. User submits code
         ↓
2. Code is queued for Judge0 execution (executeJudge0Submissions)
         ↓
3. Language validated ✓
         ↓
4. ⭐ PRE-TEST COMPLEXITY CHECK (NEW)
   ├─ Analyze code using AST
   ├─ Detect loops, recursion, data structures
   ├─ Calculate Big O complexity
   ├─ Compare with expectedComplexity
   └─ If CRITICAL TLE risk → BLOCK & mark as TLE
         ↓
5. EITHER:
   Option A: CRITICAL TLE → No test cases run, error shown
   Option B: OK or HIGH risk → Continue to test cases
```

## Implementation Details

### File: `server/routes/competition.js`

**Location:** Lines 669-726 in `executeJudge0Submissions()`

**Function Sequence:**

```javascript
// 1. Analyze submitted code
preTestComplexityAnalysis = analyzeCodeComplexity(
  submission.code, 
  submission.language
);
// Returns: { timeComplexity: 'O(n²)', loops: 2, hasRecursion: false, ... }

// 2. Predict TLE risk
preTLEPrediction = predictTLE(
  preTestComplexityAnalysis.timeComplexity,
  problem
);
// Returns: { willTLE: true, severity: 'critical', reason: '...', ... }

// 3. If CRITICAL, block execution
if (preTLEPrediction.willTLE && preTLEPrediction.severity === 'critical') {
  await prisma.problemSubmission.update({
    where: { id: submission.id },
    data: {
      status: 'tle',
      errorMessage: `⏱️ Time Limit Exceeds\n...`,
      testResults: [{ preTLEDetection: true, ... }]
    }
  });
  skipTestCases = true;  // Skip test case loop
}

// 4. Skip back to next submission if TLE
if (skipTestCases) continue;
```

### Dependencies

**Imported Functions:**
- `analyzeCodeComplexity(code, language)` - From `astComplexityAnalyzer.js`
- `predictTLE(complexity, problem)` - Defined below in same file (line ~1884)

**Database Updates:**
- Prisma `problemSubmission.update()` with status='tle'

## Behavior Scenarios

### Scenario 1: O(n²) Code vs O(n) Expected ✗

**Input:**
```javascript
// Two Sums - Brute Force
function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {        // ← Loop 1
    for (let j = i + 1; j < nums.length; j++) {   // ← Loop 2 (nested)
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}
```

**Detection:**
```
🔎 PRE-TEST COMPLEXITY CHECK for Problem two-sum
📊 Detected Complexity: O(n²) (Loops: 2, Recursion: false)
🎯 Expected Complexity: O(n)
⚠️  TLE Prediction: willTLE=true, severity=critical
❌ BLOCKING TEST EXECUTION: Detected O(n²) (critical TLE risk)
```

**Result:**
```json
{
  "status": "tle",
  "errorMessage": "⏱️ Time Limit Exceeds\n\nYour algorithm has complexity O(n²), but the expected solution is O(n).\n\nReason: Your O(n²) solution is significantly slower than the required O(n)\n\nRecommendation: Optimize your algorithm to use a HashMap for O(n) lookup",
  "testResults": [{
    "error": "⏱️ Time Limit Exceeds...",
    "detectedComplexity": "O(n²)",
    "expectedComplexity": "O(n)",
    "preTLEDetection": true
  }]
}
```

**Console Output:**
```
✓ Problem two-sum: TLE error recorded, skipping test cases
```

### Scenario 2: O(n) Code vs O(n) Expected ✓

**Input:**
```javascript
// Two Sums - HashMap Approach
function twoSum(nums, target) {
  const map = new Map();              // ← Data structure detected
  for (let i = 0; i < nums.length; i++) {  // ← Loop 1
    if (map.has(target - nums[i])) {
      return [map.get(target - nums[i]), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
```

**Detection:**
```
🔎 PRE-TEST COMPLEXITY CHECK for Problem two-sum
📊 Detected Complexity: O(n) (Loops: 1, Recursion: false)
🎯 Expected Complexity: O(n)
⚠️  TLE Prediction: willTLE=false, severity=info
✅ Complexity check passed - proceeding with test cases
```

**Result:**
- Proceeds to test case execution normally
- No TLE error

### Scenario 3: No Expected Complexity Set ℹ️

**Detection:**
```
🔎 PRE-TEST COMPLEXITY CHECK for Problem x
📊 Detected Complexity: O(n log n) (Loops: 1, Recursion: false)
ℹ️  No expectedComplexity set for problem - proceeding with test cases
```

**Result:**
- Proceeds to test case execution normally
- Complexity is noted in logs but doesn't affect execution

### Scenario 4: HIGH Severity TLE (Warning)

**Detection:**
```
📊 Detected Complexity: O(n²)
🎯 Expected Complexity: O(n²)
⚠️  TLE Prediction: willTLE=true, severity=high
⚠️  HIGH severity TLE risk but allowing execution...
```

**Result:**
- **Proceeds with test cases** (not blocked)
- User may experience TLE during test execution
- Allows learning opportunity

## Complexity Comparison Matrix

| Detected | Expected | Will TLE | Severity |Result |
|----------|----------|----------|----------|--------|
| O(1)     | O(1)     | false    | info     | ✅ OK  |
| O(n)     | O(n)     | false    | info     | ✅ OK  |
| O(n²)    | O(n)     | TRUE     | **critical** | ❌ BLOCKED |
| O(n²)    | O(n²)    | false    | info     | ✅ OK  |
| O(n²)    | O(n log n) | TRUE    | **critical** | ❌ BLOCKED |
| O(n log n) | O(n)   | true     | high     | ⚠️ WARN |
| O(2^n)   | O(n)     | TRUE     | **critical** | ❌ BLOCKED |

## Error Message Format

When TLE is detected and execution is blocked, the user sees:

```
⏱️ Time Limit Exceeds

Your algorithm has complexity O(n²), but the expected solution is O(n).

Reason: Your O(n²) solution is significantly slower than the required O(n)

Recommendation: Optimize your algorithm to use a HashMap for O(n) lookup
```

## Production Deployment

### Docker Build Status
- ✅ Image rebuilt: `mcodingnexus-app` (sha256:1c1cad8bb...)
- ✅ Container running: `codingnexus-app` (port 3000, healthy)
- ✅ Code deployed: Pre-test check active

### Testing the Implementation

**Option 1: Direct Function Test**
```bash
node debug-ast-analyzer.mjs
```
Output shows complexity detection working for nested loops.

**Option 2: Full Submission Test**
```bash
# Submit solution via frontend or API
# Check Problem Submission table for:
# - status = 'tle' (if critical TLE detected)
# - errorMessage contains "Time Limit Exceeds"
# - testResults.preTLEDetection = true
```

**Option 3: Check Docker Logs**
```bash
docker logs codingnexus-app | grep "PRE-TEST COMPLEXITY CHECK"
```

Shows real-time complexity analysis being triggered.

## Key Features

###1. **Immediate Feedback**
- No waiting for test cases to timeout
- Error shown before tests run

### 2. **User Learning**
- HIG severity warnings allow execution (learning opportunity)
- CRITICAL severity blocks execution (prevents frustration)

### 3. **Non-Blocking Failure**
- If complexity analysis fails, execution continues
- Safety net prevents breaking existing functionality

### 4. **Comparative Analysis**
- Shows detected vs expected complexity
- Explains the difference
- Provides optimization suggestion

### 5. **Flexible Configuration**
- Admin can set `expectedComplexity` per problem
- If not set, just logs complexity (no blocking)
- Can be toggled off by setting severity threshold

## Configuration

In Problem table, set:
```json
{
  "expectedComplexity": "O(n)",
  "timeLimit": 1000,
  "memoryLimit": 256,
  "testCases": [...]
}
```

When expectedComplexity is set, pre-test check is active.

## Future Enhancements

1. **Admin Dashboard**
   - View TLE blocks per problem
   - Adjust severity thresholds
   - See which algorithms are being submitted

2. **Hint System**
   - Suggest algorithms when TLE detected
   - Link to learning resources

3. **Analytics**
   - Track success rate with pre-test check
   - Measure time savings

4. **Confidence Scoring**
   - Allow submission despite CRITICAL if user confirms
   - Track override patterns

## Summary

The Pre-Test Complexity Check transforms the user experience from:

❌ **Before**: "I submitted my code, it compiled, now running test cases... TIMEOUT after 30 seconds 😞"

✅ **After**: "I submitted my code, compilation phase detected my O(n²) solution, but expected O(n). Error shown immediately. Now I can optimize and resubmit! 🚀"
