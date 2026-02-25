# ✅ FRONTEND TESTING CHECKLIST

## Everything is Ready! Here's What to Test:

---

## 🔐 Step 1: Admin Creates Competition

### Login as Admin
1. Go to admin dashboard
2. Navigate to **Competitions** section
3. Click **"Create Competition"**

### Fill Competition Details
```
✅ Title: "Test Competition 1"
✅ Description: "This is a test competition"
✅ Difficulty: Medium
✅ Start Time: [Current time]
✅ End Time: [1 hour from now]
✅ Duration: 60 minutes
```

### Add Problem with Test Cases

**Problem 1: Two Sum**
```javascript
Title: "Two Sum"
Description: "Find two numbers that add up to target"
Difficulty: Easy
Points: 100

Function Name: twoSum
Parameters: 
  - name: nums, type: int[]
  - name: target, type: int

Return Type: int[]

Test Cases:
1. Input: "[2,7,11,15], 9"
   Output: "[0, 1]"      ⚠️ Note: JSON format with spaces!
   Hidden: false
   
2. Input: "[3,2,4], 6"
   Output: "[1, 2]"
   Hidden: false
   
3. Input: "[3,3], 6"
   Output: "[0, 1]"
   Hidden: true

Constraints:
  - 2 <= nums.length <= 10^4
  - -10^9 <= nums[i] <= 10^9
```

### ✅ Expected Result
- Competition created successfully
- Shows in competitions list
- Problems visible with test cases

---

## 👨‍🎓 Step 2: Student Views Competition

### Login as Student
1. Go to student dashboard
2. Navigate to **Competitions** section
3. You should see "Test Competition 1"

### ✅ Expected Result
```
✅ Competition is listed
✅ Shows: Title, Difficulty, Start/End times
✅ "Register" button visible (if not already registered)
✅ Can click to view details
```

---

## 📝 Step 3: Student Registers & Solves

### Register for Competition
1. Click **"Register"** button
2. Confirm registration

### Open Competition
1. Click on competition to start
2. You should see:
   - Problem list on left
   - Code editor in center
   - Problem description on right

### Write Solution
```python
# Select language: Python
def twoSum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
```

### Test Code (Optional)
1. Click **"Run Code"** button
2. Should show: "2/2 test cases passed" (only visible ones)
3. Can see actual vs expected output

### ✅ Expected Result
```
✅ Code editor works
✅ Language selector works (Python, C++, Java, JavaScript, C)
✅ "Run Code" tests visible test cases only
✅ Shows pass/fail for each visible test case
✅ "Save Solution" button saves code locally
✅ "Submit All" button appears when ready
```

---

## 🚀 Step 4: Student Submits Final Solution

### Submit Solutions
1. Click **"Submit All Solutions"** button
2. Confirm submission (WARNING: One-time only!)
3. Wait for processing...

### ✅ Expected Results - FRONTEND
```
✅ Success message: "Submitted X/Y solutions successfully! 🎉"
✅ Redirected or shown completion screen
✅ Can view results page
```

### ✅ Expected Results - DATABASE

**Check in your database:**

**CompetitionSubmission table:**
```sql
SELECT * FROM "CompetitionSubmission" 
WHERE "competitionId" = '[your-competition-id]' 
ORDER BY "submittedAt" DESC;

Expected fields:
✅ id: [uuid]
✅ competitionId: [uuid]
✅ userId: [student-uuid]
✅ totalScore: [calculated after judging]
✅ status: "pending" → then "completed"
✅ submittedAt: [timestamp]
```

**ProblemSubmission table:**
```sql
SELECT * FROM "ProblemSubmission" 
WHERE "competitionSubmissionId" = '[submission-id]';

Expected fields:
✅ id: [uuid]
✅ competitionSubmissionId: [uuid]
✅ problemId: [problem-uuid]
✅ userId: [student-uuid]
✅ code: [the actual code submitted]
✅ language: "python"
✅ score: [0-100, calculated after judging]
✅ maxScore: 100
✅ testsPassed: [number]
✅ totalTests: 3 (2 visible + 1 hidden)
✅ status: "pending" → "accepted" or "wrong-answer"
✅ testResults: [JSON with all test case results]
✅ executionTime: [ms]
✅ memoryUsed: [KB]
✅ judgedAt: [timestamp after Judge0 execution]
```

**Sample testResults JSON:**
```json
[
  {
    "testCase": 1,
    "input": "[2,7,11,15], 9",
    "expectedOutput": "[0, 1]",
    "actualOutput": "[0, 1]",
    "passed": true,
    "time": 0.025,
    "memory": 4088,
    "status": "Accepted"
  },
  {
    "testCase": 2,
    "input": "[3,2,4], 6",
    "expectedOutput": "[1, 2]",
    "actualOutput": "[1, 2]",
    "passed": true,
    "time": 0.024,
    "memory": 4016,
    "status": "Accepted"
  },
  {
    "testCase": 3,
    "passed": true,
    "time": 0.028,
    "memory": 4068,
    "status": "Accepted"
  }
]
```

---

## 📊 Step 5: View Results

### Student Views Own Results
1. Go to **"My Submissions"** or **Competition Results** page
2. Should see submission details

### ✅ Expected Display
```
✅ Overall Status: "Completed" or "Judging"
✅ Total Score: e.g., "100/100"
✅ Problems Solved: e.g., "1/1"
✅ Submission Time: [timestamp]
✅ Execution Time: [total ms]

For each problem:
✅ Problem Title: "Two Sum"
✅ Status: "Accepted" (green) or "Wrong Answer" (red)
✅ Score: "100/100"
✅ Tests Passed: "3/3"
✅ Your Code: [displayed with syntax highlighting]
✅ Test Results: 
   - Test 1: ✅ Passed
   - Test 2: ✅ Passed
   - Test 3: ✅ Passed (Hidden - no input/output shown)
```

---

## 🔍 Step 6: Admin Views Submissions

### Admin Dashboard
1. Go to **Competitions**
2. Click on "Test Competition 1"
3. Click **"View Submissions"**

### ✅ Expected Display
```
✅ List of all student submissions
✅ For each submission:
   - Student Name
   - Total Score
   - Status
   - Submission Time
   - "View Code" button
✅ Can expand to see all problem submissions
✅ Can see student's code
✅ Can manually evaluate if needed
```

---

## 🗄️ Step 7: Verify Database Persistence

### Run These Queries

**1. Check Competition Created:**
```sql
SELECT id, title, "startTime", "endTime", "createdAt" 
FROM "Competition" 
ORDER BY "createdAt" DESC LIMIT 1;
```

**2. Check Problems Created:**
```sql
SELECT id, title, "testCases", "competitionId" 
FROM "Problem" 
WHERE "competitionId" = '[competition-id]';
```

**3. Check Student Registration:**
```sql
SELECT * FROM "CompetitionRegistration" 
WHERE "competitionId" = '[competition-id]';
```

**4. Check Submissions:**
```sql
SELECT * FROM "CompetitionSubmission" 
WHERE "competitionId" = '[competition-id]';
```

**5. Check Problem Solutions:**
```sql
SELECT 
  ps.id,
  ps.code,
  ps.language,
  ps.score,
  ps."testsPassed",
  ps."totalTests",
  ps.status,
  ps."testResults"::text
FROM "ProblemSubmission" ps
JOIN "CompetitionSubmission" cs ON ps."competitionSubmissionId" = cs.id
WHERE cs."competitionId" = '[competition-id]';
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: Test Cases Fail Even with Correct Code
**Problem:** Output format mismatch
**Solution:** Ensure expected output uses JSON format with spaces:
- ✅ `"[0, 1]"` (correct - JSON with spaces)
- ❌ `"[0,1]"` (wrong - no spaces)

### Issue 2: "Judging" Status Stuck
**Problem:** Judge0 workers not processing
**Solution:** 
```bash
# Check Judge0 workers
curl http://64.227.149.20:2358/workers

# Should show available > 0
# If not, restart workers on server
```

### Issue 3: Submission Not Saved
**Problem:** Database connection issue
**Solution:**
- Check `.env` has correct `DATABASE_URL`
- Ensure Prisma client is generated: `npx prisma generate`
- Check server logs for errors

### Issue 4: Code Not Executing
**Problem:** Judge0 timeout or error
**Solution:**
- Increase timeLimit in problem config (default: 2 seconds)
- Check Judge0 logs for specific errors
- Verify language ID is correct (Python: 71, C++: 54, etc.)

---

## ✅ Final Verification Checklist

After testing, verify ALL of these:

### Database
- [ ] Competition record exists in `Competition` table
- [ ] Problem record(s) exist in `Problem` table with `testCases`
- [ ] Registration exists in `CompetitionRegistration` table
- [ ] Submission exists in `CompetitionSubmission` table
- [ ] Problem submission(s) exist in `ProblemSubmission` table
- [ ] ProblemSubmission has:
  - [ ] Actual code in `code` field
  - [ ] Language in `language` field
  - [ ] Score calculated in `score` field
  - [ ] Test results in `testResults` JSON field
  - [ ] Status updated to "accepted" or "wrong-answer"
  - [ ] `judgedAt` timestamp set after Judge0 execution

### Frontend
- [ ] Admin can create competitions with test cases
- [ ] Student can see competitions list
- [ ] Student can register for competition
- [ ] Student can write code in editor
- [ ] Student can run code to test (visible test cases)
- [ ] Student can submit solutions
- [ ] Student sees success message after submission
- [ ] Student can view detailed results
- [ ] Admin can view all submissions
- [ ] Hidden test cases don't show input/output to students

### Integration
- [ ] Judge0 executes code successfully
- [ ] Test results are accurate (correct pass/fail)
- [ ] Scores calculated correctly (proportional to tests passed)
- [ ] Execution times recorded
- [ ] Memory usage recorded
- [ ] Status transitions: pending → judging → accepted/wrong-answer

---

## 📞 If Something Doesn't Work

1. **Check Backend Logs:**
   ```bash
   # Look for errors during submission
   # Should see: "🚀 Starting Judge0 execution for submission..."
   # Then: "✅ Problem X: Y/Z tests passed"
   ```

2. **Check Judge0 Status:**
   ```bash
   node scripts/quick-test-judge0.js
   ```

3. **Check Database:**
   ```sql
   -- Recent submissions
   SELECT * FROM "CompetitionSubmission" 
   ORDER BY "submittedAt" DESC LIMIT 5;
   
   -- Recent problem submissions
   SELECT * FROM "ProblemSubmission" 
   ORDER BY "submittedAt" DESC LIMIT 10;
   ```

4. **Manual Test:**
   ```bash
   # Test Judge0 directly
   curl -X POST http://64.227.149.20:2358/submissions?wait=true \
     -H "Content-Type: application/json" \
     -d '{"source_code":"print(123)","language_id":71}'
   ```

---

## 🎉 SUCCESS CRITERIA

**You'll know everything works when:**

1. ✅ Admin creates competition → Shows in database
2. ✅ Student registers → CompetitionRegistration created
3. ✅ Student submits code → CompetitionSubmission created
4. ✅ Backend processes → ProblemSubmission created with code
5. ✅ Judge0 executes → testResults JSON populated
6. ✅ Status updates → "pending" → "accepted"
7. ✅ Student sees results → Score, tests passed, execution time
8. ✅ Admin sees submissions → All student codes and scores

**Database proof:**
```sql
SELECT 
  u.email,
  cs."totalScore",
  cs.status,
  cs."submittedAt",
  ps.code,
  ps.language,
  ps.score,
  ps."testsPassed",
  ps."totalTests",
  ps."testResults"
FROM "CompetitionSubmission" cs
JOIN "User" u ON cs."userId" = u.id
JOIN "ProblemSubmission" ps ON ps."competitionSubmissionId" = cs.id
WHERE cs."competitionId" = '[your-competition-id]';
```

If all these fields have data, **EVERYTHING IS WORKING!** 🚀

---

**Go ahead and test on frontend - Everything is ready!** ✨
