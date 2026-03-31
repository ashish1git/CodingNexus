# PRE-TEST COMPLEXITY CHECK - Visual Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      SUBMISSION Flow                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ User Submits │
│   O(n²) code │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ POST /api/competition/:id/submit         │
│ - Code stored                            │
│ - Status: pending                        │
└──────────────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ executeJudge0Submissions() [ASYNC]       │
│ - Language validation                    │
│ - Status: judging                        │
└──────────────┬───────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  ⭐ PRE-TEST COMPLEXITY CHECK (NEW!)                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. Analyze code using AST                                  │ │
│  │    detectLoops() → 2 nested loops detected                 │ │
│  │    calculateTimeComplexity() → O(n²)                       │ │
│  │                                                             │ │
│  │ 2. Get expected complexity from problem                    │ │
│  │    expectedComplexity = O(n)                               │ │
│  │                                                             │ │
│  │ 3. Compare: O(n²) vs O(n)                                  │ │
│  │    predictTLE(O(n²), { expectedComplexity: O(n) })         │ │
│  │    → willTLE: true, severity: 'critical'                   │ │
│  │                                                             │ │
│  │ 4. Decision:                                               │ │
│  │    Severity === 'critical' ?                               │ │
│  │    → YES: BLOCK ❌ Skip test cases                          │ │
│  │    → NO: CONTINUE ✅ Run test cases                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─┬───────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ PATH A: CRITICAL TLE DETECTED                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ❌ UPDATE DATABASE                                           │ │
│ │    status = 'tle'                                           │ │
│ │    errorMessage = 'Time Limit Exceeds...'                   │ │
│ │    judgedAt = now()                                         │ │
│ │    testResults = [{ preTLEDetection: true }]                │ │
│ │                                                             │ │
│ │ 🚫 SKIP TEST CASE LOOP (continue to next)                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─┬───────────────────────────────────────────────────────────────┘
  │
  └─ Goes to FINAL RESULT
  
┌─────────────────────────────────────────────────────────────────┐
│ PATH B: OK / HIGH SEVERITY (ALLOW EXECUTION)                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✅ RUN TEST CASES NORMALLY                                   │ │
│ │    ├─ Test Case 1 → Passed / Failed                         │ │
│ │    ├─ Test Case 2 → Passed / Failed                         │ │
│ │    └─ Test Case N → Passed / Failed                         │ │
│ │                                                             │ │
│ │ OPTIONALLY: Run complexity analysis after tests             │ │
│ │ (existing feature for efficiency scoring)                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─┬───────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│  FINAL RESULT                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ UPDATE DATABASE                                             │ │
│  │  - status = 'accepted' | 'wrong-answer' | 'tle'            │ │
│  │  - testResults = all results                               │ │
│  │  - score = calculation                                     │ │
│  │  - judgedAt = now()                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─┬───────────────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────┐
│  Show to User        │
│  ✓ or ✗ Result      │
└──────────────────────┘
```

## Timeline Comparison

### BEFORE (Old System - Runtime Metrics Only)

```
TIME →
0ms    User submits O(n²) code
│
├─ 100ms   Compilation ✓
│
├─ 100ms   Test Case 1 → Timeout ⚠️
│
├─ 3000ms  Test Case 2 → Timeout ⚠️
│
│          ...more timeouts...
│
└─ 30000ms Judge0 finally returns TLE error 😞

User sees: "Your solution exceeded time limit"
User thinking: "But I thought my O(n) solution was good? 
               Why did it timeout after 30 seconds?? 🤔"
```

### AFTER (New System - AST + Pre-Test Check)

```
TIME →
0ms    User submits O(n²) code
│
├─ 100ms   Compilation ✓
│
├─ 50ms    ⭐ AST Complexity Analysis
│          - Detect: 2 nested loops
│          - Calculate: O(n²)
│          - Compare: O(n²) vs O(n) expected
│          - Decision: CRITICAL TLE → BLOCK
│
└─ 150ms   Total: Error shown immediately! ✅

User sees: "Time Limit Exceeds - Your algorithm is O(n²) 
           but expected O(n). Try using a HashMap!"
User thinking: "Oh! I need O(n)! Let me optimize..." 🚀
```

**Time Saved: ~29.85 seconds per failed submission! ⚡**

## Decision Tree

```
          [Code Submitted]
                 │
                 ▼
        [Language Supported?]
            │         │
           YES        NO
            │         │
            ▼         ▼
     [Analyze AST]  [Compile Error]
            │
            ▼
    [Get Expected   
     Complexity?]
        │       │
       YES     NO → [Run Tests Normally] ✓
        │
        ▼
   [Compare:
    Detected vs
    Expected?]
        │
        ├─ EQUAL/BETTER → [OK - Run Tests] ✓
        │
        ├─ WORSE but CLOSE → [HIGH severity - RUN] ⚠️
        │
        └─ MUCH WORSE → [CRITICAL] ✗
                          │
                          ▼
                    [Block Execution]
                    [Mark as TLE]
                    [Show Error]
                          │
                          ▼
                    [Skip to next]
```

## Code Complexity Detection Examples

### Example 1: Simple Addition

```javascript
function add(a, b) {
  return a + b;
}
```

**Analysis:**
- Loops detected: 0
- Complexity: O(1) ✓
- Decision: OK → Run tests

---

### Example 2: Linear Search

```javascript
function search(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}
```

**Analysis:**
- Loops detected: 1
- Nesting depth: 1
- Complexity: O(n) ✓
- Decision: Check against expected

---

### Example 3: Bubble Sort (Nested Loops)

```javascript
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}
```

**Analysis:**
- Loops detected: 2
- Nesting depth: 2
- Complexity: O(n²)
- Decision: If expected O(n) → CRITICAL BLOCK ❌

---

### Example 4: Recursive Fibonacci

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

**Analysis:**
- Loops detected: 0
- Recursion: Yes, binary tree branches
- Complexity: O(2^n) 🔴
- Decision: CRITICAL BLOCK for most problems ❌

---

### Example 5: HashMap + Single Loop

```javascript
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (map.has(target - nums[i])) {
      return [map.get(target - nums[i]), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
```

**Analysis:**
- Loops detected: 1
- Data structures: Map
- Complexity: O(n) ✓
- Decision: If expected O(n) → OK ✅

---

## Integration Points

### 1. **Submission Endpoint**
```javascript
POST /api/competition/:id/submit
↓
// Calls executeJudge0Submissions() asynchronously
// Pre-test check happens here
```

### 2. **Database Updates**
```javascript
prisma.problemSubmission.update({
  data: {
    status: 'tle',  // Pre-test blocks set this
    testResults: [{ preTLEDetection: true }]
  }
})
```

### 3. **Frontend Display**
```
If submission.status === 'tle' && 
   submission.testResults[0].preTLEDetection === true:
   Show: "⏱️ Time Limit Exceeds (Pre-Test Check)"
```

---

## Configuration

**For Admin: Set on Problem Creation**

```json
{
  "title": "Two Sum",
  "description": "Find two numbers that sum to target",
  "expectedComplexity": "O(n)",      // ← Triggers pre-test check
  "expectedSpace": "O(n)",
  "timeLimit": 1000,                 // milliseconds
  "memoryLimit": 256,                // MB
  "testCases": [...]
}
```

**For User: No Configuration Needed**
- Automatic detection
- Immediate feedback
- No opt-in required

---

## Logging Output Example

```
🔎 PRE-TEST COMPLEXITY CHECK for Problem two-sum
📊 Detected Complexity: O(n²) (Loops: 2, Recursion: false)
🎯 Expected Complexity: O(n)
⚠️  TLE Prediction: willTLE=true, severity=critical, reason=Your O(n²) solution is significantly slower than the required O(n)
❌ BLOCKING TEST EXECUTION: Detected O(n²) (critical TLE risk)
✓ Problem two-sum: TLE error recorded, skipping test cases
```

This provides complete transparency for debugging and monitoring.
