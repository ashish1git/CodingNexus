# Fix: Judge0 Optimization Scoring — No Penalty for O(n²) Solutions

## Problem Diagnosis

The stock profit solution (O(n²) brute force) passes all 6 test cases and gets full marks in the competition, but TLEs on LeetCode. This happens because:

### Root Causes (3 Gaps)

1. **No penalty for TLE in scoring**: In `server/routes/competition.js` (~line 772), a test case is marked `passed = stdout === expected && status.id === 3`. But when TLE occurs (Judge0 status id=5), the `totalPassed` counter still increments — the TLE check for `finalStatus` runs *after* the score is already calculated. Score formula: `round((passedTests/totalTests) * maxScore)` — ignores TLE entirely.

2. **Test cases too small**: Competition test cases use small arrays (n ≤ 100). O(n²) finishes in <100ms, well within the 3000ms limit. LeetCode uses n = 10⁵, causing TLE. The `timeLimit` is sent to Judge0 but small test cases never hit it.

3. **`expectedComplexity` unused**: The Problem model has `expectedComplexity` and `expectedSpace` fields but no code reads them for scoring. Only the admin UI stores them.

## Fix Plan

### Fix 1: TLE = Test Failure (Critical)
**File**: `server/routes/competition.js`

In the test-case loop (~line 772), treat TLE (status id 5) as a failure:
- `const passed = stdout === expected && result.status?.id === 3;` already works correctly since status 5 ≠ 3. But let me verify — reading the actual code to confirm.

Actually need to re-read — is TLE status id=5 or is there a different code? Judge0 uses:
- 3 = Accepted
- 5 = Time Limit Exceeded

The current code: `const passed = stdout === expected && result.status?.id === 3;` — this correctly excludes status 5 (TLE). So TLE tests won't count as passed. BUT the TLE test's `stdout` might still have partial output that happens to match `expected`, triggering a false positive.

**Fix**: Add explicit TLE check:
```js
const isTLE = result.status?.id === 5;
const passed = !isTLE && stdout === expected && result.status?.id === 3;
// Also record isTLE flag in testResults for UI display
```

### Fix 2: Add Large Performance Test Cases (Critical)
Through admin problem creation, add at least one test case with large input (n = 10⁵) that forces O(n²) to TLE.

### Fix 3: Execution-Time-Based Partial Deduction (Optional)
After score calculation, check if all tests passed but execution was slow → deduct 10-25% of marks.

### Fix 4: UI Feedback (Optional)
Show execution time, TLE badges, and optimization warnings in TestResults.

## Implementation Priority
1. Fix 2 (new test cases) — Most impactful, instantly catches O(n²)
2. Fix 1 (TLE handling) — Safety net for edge cases
3. Fix 3 (time-based deduction) — Nice to have
4. Fix 4 (UI feedback) — Nice to have
