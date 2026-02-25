# Judge0 Connection in CodingNexus

## Location: `server/routes/competition.js`

---

## 1. Configuration (Lines 1-20)

```javascript
import axios from 'axios';

// Judge0 Configuration
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://4.247.146.10';

// Language mapping for Judge0
const LANGUAGE_MAP = {
  'c': 50,            // C (GCC 9.2.0)
  'cpp': 54,          // C++ (GCC 9.2.0)
  'java': 62,         // Java (OpenJDK 13.0.1)
  'python': 71,       // Python (3.8.1)
  'javascript': 63    // JavaScript (Node.js 12.14.0)
};
```

**What it does:**
- ✅ Reads Judge0 URL from environment variable or uses default IP: `http://4.247.146.10`
- ✅ Maps language names (python, cpp, etc.) to Judge0 language IDs
- ✅ Uses axios for HTTP requests to Judge0

---

## 2. Submission Entry Point (Lines 454-555)

**Route:** `POST /competitions/:id/submit`

What happens:
1. Student submits code
2. System creates `CompetitionSubmission` record
3. Creates `ProblemSubmission` records for each problem
4. **Calls `executeJudge0Submissions()` asynchronously** (doesn't wait)
5. Returns immediately to student

```javascript
// Line 553: Async call - Judge0 runs in background
executeJudge0Submissions(competitionSubmission.id, validSubmissions, competition.problems);
```

---

## 3. Judge0 Execution Function (Lines 556-750)

**Function:** `async function executeJudge0Submissions(submissionId, problemSubmissions, problems)`

### Step-by-step what it does:

**A. For each problem submission:**
```javascript
for (const submission of problemSubmissions) {
  // 1. Get problem details
  const problem = problems.find(p => p.id === submission.problemId);
  
  // 2. Get language ID for Judge0
  const languageId = LANGUAGE_MAP[submission.language.toLowerCase()];
  
  // 3. Mark submission as "judging"
  await prisma.problemSubmission.update({
    data: { status: 'judging' }
  });
```

**B. For each test case in a problem:**
```javascript
for (let i = 0; i < testCases.length; i++) {
  const testCase = testCases[i];
  
  // 1. Wrap code if function-based (uses wrapCodeForExecution)
  let executableCode = submission.code;
  if (problem.parameters && problem.functionName) {
    executableCode = wrapCodeForExecution(
      submission.code,
      submission.language,
      problem,
      testCase
    );
  }
```

**C. Send to Judge0:**
```javascript
const judge0Response = await axios.post(
  `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
  {
    source_code: executableCode,           // The code to execute
    language_id: languageId,               // 71 for Python, 54 for C++, etc.
    stdin: testCase.input || '',           // For stdin-based problems
    expected_output: testCase.output || '', // What we expect
    cpu_time_limit: problem.timeLimit || 2,     // seconds
    memory_limit: problem.memoryLimit || 128000 // KB
  },
  {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000  // 30 second timeout
  }
);
```

**D. Evaluate results:**
```javascript
const result = judge0Response.data;
const stdout = (result.stdout || '').trim();
const expected = (testCase.output || '').trim();
const passed = stdout === expected && result.status?.id === 3; // 3 = Accepted

// Collect test results
testResults.push({
  testCase: i + 1,
  input: testCase.input,
  expectedOutput: expected,
  actualOutput: stdout,
  passed,
  time: result.time,
  memory: result.memory,
  status: result.status?.description || 'Unknown',
  stderr: result.stderr,
  compile_output: result.compile_output
});
```

**E. Update database with results:**
```javascript
// Calculate score
const scorePercentage = testCases.length > 0 
  ? (totalPassed / testCases.length) 
  : 0;
const finalScore = Math.round(scorePercentage * submission.maxScore);

// Determine status
let finalStatus = 'wrong-answer';
if (totalPassed === testCases.length) finalStatus = 'accepted';
else if (totalResults.some(t => t.status === 'Time Limit Exceeded')) finalStatus = 'tle';
else if (totalResults.some(t => t.status === 'Runtime Error')) finalStatus = 'runtime-error';

// Save results
await prisma.problemSubmission.update({
  where: { id: submission.id },
  data: {
    status: finalStatus,
    score: finalScore,
    testsPassed: totalPassed,
    executionTime: Math.round(totalTime),
    memoryUsed: totalMemory,
    testResults: testResults,
    judgedAt: new Date()
  }
});
```

---

## 4. Judge0 Status Codes

Judge0 returns status IDs:
```
1 = In Queue
2 = Processing
3 = Accepted ✓
4 = Wrong Answer ✗
5 = Time Limit Exceeded ✗
6 = Compilation Error ✗
7 = Runtime Error ✗
8 = System Error
```

---

## 5. Code Wrapping (Lines 600-615)

For function-based problems, code is wrapped before sending to Judge0:

```javascript
if (problem.parameters && problem.functionName) {
  executableCode = wrapCodeForExecution(
    submission.code,
    submission.language,
    problem,
    testCase
  );
}
```

**Location:** `server/utils/codeWrapper.js`

Converts this (what student writes):
```python
def solution(nums):
    return nums[0]
```

Into this (what Judge0 executes):
```python
import json

def solution(nums):
    return nums[0]

if __name__ == "__main__":
    result = solution([1,2,3])
    print(json.dumps(result))
```

---

## 6. Final Update (Lines 720-745)

After all problems are judged:

```javascript
// Update competition submission with total score
const totalScore = updatedSubmissions.reduce((sum, s) => sum + s.score, 0);
const totalTime = updatedSubmissions.reduce((sum, s) => sum + s.executionTime, 0);

await prisma.competitionSubmission.update({
  where: { id: submissionId },
  data: {
    status: 'completed',
    totalScore: totalScore,
    totalTime: totalTime
  }
});
```

---

## Complete Flow Diagram

```
Student Submit Code
        ↓
POST /competitions/:id/submit
        ↓
Create CompetitionSubmission record
Create ProblemSubmission records (status: pending)
        ↓
executeJudge0Submissions() [ASYNC - returns immediately]
        ↓
For each problem:
  ├─ Wrap code (if function-based)
  ├─ For each test case:
  │  ├─ axios.post() → Judge0
  │  ├─ Judge0 executes code
  │  ├─ Returns: stdout, status, time, memory
  │  ├─ Compare output vs expected
  │  └─ Add to testResults[]
  ├─ Calculate score (testsPassed / totalTests × maxScore)
  ├─ Determine status (accepted/wrong-answer/tle/compile-error/runtime-error)
  └─ Update ProblemSubmission with results
        ↓
Update CompetitionSubmission with total score & time
        ↓
Complete! Student can view results in leaderboard
```

---

## Key Points

| Aspect | Details |
|--------|---------|
| **Judge0 Server** | `http://4.247.146.10` (configurable via env var) |
| **Execution** | Asynchronous - returns to student immediately |
| **Languages** | C (50), C++ (54), Java (62), Python (71), JavaScript (63) |
| **Test Cases** | Runs all test cases for each problem |
| **Code Wrapper** | Wraps function-based code before sending to Judge0 |
| **Results** | Score, status, time, memory, test details saved to DB |
| **Leaderboard** | Based on totalScore and totalTime |

---

## Environment Variable

Set this in your `.env`:
```
JUDGE0_URL=http://4.247.146.10
```

Or it defaults to that IP if not set.

---

## File Locations Summary

| Component | File | Lines |
|-----------|------|-------|
| **Configuration** | `server/routes/competition.js` | 1-20 |
| **Submission Entry** | `server/routes/competition.js` | 454-555 |
| **Judge0 Execution** | `server/routes/competition.js` | 556-750 |
| **Code Wrapping** | `server/utils/codeWrapper.js` | Full file |
| **Database Queries** | `server/routes/competition.js` | Prisma calls throughout |
