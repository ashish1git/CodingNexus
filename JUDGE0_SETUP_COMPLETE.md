# Judge0 & Frontend Setup Complete Guide

## 🔴 CURRENT STATUS: Judge0 Not Running

Judge0 server at `http://64.227.149.20:2358` is **NOT responding**.

### Fix Judge0 (DigitalOcean Server)

SSH into your server and run:

```bash
ssh root@64.227.149.20

# Navigate to Judge0 directory
cd /path/to/judge0  # Usually docker/judge0 or similar

# Check status
docker ps -a | grep judge0

# If containers are stopped, restart them
docker-compose up -d

# Check if running
docker ps | grep judge0

# View logs if there's an issue
docker-compose logs -f judge0

# If port 2358 is in use by something else
sudo netstat -tulpn | grep 2358
# Kill the process if needed: sudo kill -9 <PID>

# Restart completely if needed
docker-compose down
docker-compose up -d
```

---

## ✅ Frontend Data Structure for Creating Competitions

When creating a coding competition from your admin dashboard, use this structure:

### Required Fields:

```javascript
{
  // Competition Basic Info
  title: "Test Competition",
  description: "Description here",
  category: "programming/algorithms/etc",
  difficulty: "easy/medium/hard",
  
  // Timing (ISO 8601 dates)
  startTime: "2026-02-15T10:00:00Z",
  endTime: "2026-02-15T12:00:00Z",
  duration: 120, // minutes
  
  // Settings
  prizePool: 5000,
  maxParticipants: 100,
  type: "individual",
  isActive: true,
  
  // Problems (Array of problem objects)
  problems: [
    {
      title: "Problem Title",
      description: "Full problem description",
      difficulty: "easy",
      points: 100,
      orderIndex: 0,
      
      // Input/Output examples (shown to students)
      examples: [
        {
          input: "5 3",
          output: "8",
          explanation: "5 + 3 = 8"
        }
      ],
      
      // Constraints
      constraints: [
        "-10^9 <= a, b <= 10^9"
      ],
      
      // Actual Test Cases (for judging)
      testCases: [
        {
          input: "5 3",        // IMPORTANT: Space-separated, NOT comma-separated
          output: "8",         // Just the output value
          hidden: false        // false = visible to students, true = final verdict only
        },
        {
          input: "-10 7",
          output: "-3",
          hidden: false
        },
        {
          input: "1000000 2000000",
          output: "3000000",
          hidden: true         // Hidden test for final scoring
        }
      ],
      
      // Time & Memory Limits
      timeLimit: 2,            // seconds
      memoryLimit: 256000,     // KB (256 MB)
      
      // For function-based problems (leave null for complete programs)
      functionName: null,
      parameters: null,
      returnType: null,
      
      // Starter code (optional)
      starterCode: {
        java: "import java.io.*;\n...",
        python: "# Your code here",
        cpp: "#include <iostream>\n...",
        c: "#include <stdio.h>\n...",
        javascript: "// Your code here"
      }
    }
  ]
}
```

---

## 🎯 Key Rules for Frontend

### 1. Test Case Input Format
- **SPACE-SEPARATED**: `"5 3"` ✅
- **NOT COMMA-SEPARATED**: `"5, 3"` ❌
- Multiple lines: `"5 3\n10 20"` (use \n for multiple inputs)

### 2. Test Case Output Format
- **NO EXTRA SPACES**: `"8"` ✅
- **NO NEWLINES**: `"8\n"` ❌
- Trailing whitespace is trimmed automatically

### 3. Hidden vs Visible Test Cases
```javascript
// Visible test (students see input/output)
{ input: "5 3", output: "8", hidden: false }

// Hidden test (only used for final verdict)
{ input: "1000000 2000000", output: "3000000", hidden: true }
```

### 4. Maximum Test Cases
- Recommended: 5-10 test cases per problem
- Visible: 3-5 test cases
- Hidden: 2-5 test cases

### 5. Points per Problem
- Set `points: 100` for each problem
- Student score = (passed_tests / total_tests) * points

---

## 🔧 Supporting Languages

Judge0 CE supports these languages via their Language IDs:

| Language    | ID  | Supported |
|-------------|-----|-----------|
| C           | 50  | ✅        |
| C++         | 54  | ✅        |
| Java        | 62  | ✅        |
| JavaScript  | 63  | ✅        |
| Python      | 71  | ✅        |

---

## 📋 Student Submission Flow

1. **Student registers** → Registration saved in DB
2. **Student writes code** → Stored locally in browser
3. **Student clicks "Run"** → Frontend tests with VISIBLE test cases only
4. **Student clicks "Submit"** → Backend tests with ALL test cases (visible + hidden)
5. **Judge0 executes** → Code compiled and run against all tests
6. **Score calculated** → (passed_tests / total_tests) * problem_points
7. **Result saved** → Code, score, test results stored in database

---

## 🚀 After Judge0 is Back Online

Run this test to verify everything works:

```bash
node scripts/test-judge0-full-validation.js
```

Expected output:
```
✅ ALL 10 TESTS PASSED! Judge0 is working perfectly.
```

---

## 📱 Frontend Checklist Before Launch

- [ ] Create competition form accepts correct data structure
- [ ] Test case inputs are SPACE-SEPARATED (not comma)
- [ ] Test case outputs have no extra whitespace
- [ ] Hidden test cases marked correctly
- [ ] At least 3 visible + 2 hidden test cases per problem
- [ ] Time/Memory limits set appropriately
- [ ] Starter code provided for each language
- [ ] Judge0 URL in .env is correct: `VITE_JUDGE0_URL=http://64.227.149.20:2358`
- [ ] Auto-registration works when student enters competition
- [ ] Run button tests visible test cases only
- [ ] Submit button tests all test cases (including hidden)
- [ ] Score calculation: (passed/total) * points

---

## 💾 Database Schema for Storing Submissions

Already implemented! Check `prisma/schema.prisma`:

```prisma
model CompetitionSubmission {
  id                    String    @id @default(cuid())
  competitionId         String
  userId                String
  status                String    // "pending", "judging", "completed"
  totalScore            Int       @default(0)
  totalTime             Float     @default(0)
  
  problemSubmissions    ProblemSubmission[]
  submittedAt           DateTime  @default(now())
  
  @@unique([competitionId, userId])
}

model ProblemSubmission {
  id                    String    @id @default(cuid())
  competitionSubmissionId String
  problemId             String
  userId                String
  
  code                  String    // Actual submitted code
  language              String    // "java", "cpp", "python", etc
  
  score                 Int       @default(0)
  maxScore              Int
  testsPassed           Int       @default(0)
  totalTests            Int
  
  testResults           Json      // Array of test case results
  status                String    // "accepted", "wrong-answer", "runtime-error", etc
  
  executionTime         Float?
  memoryUsed            Int?
  
  submittedAt           DateTime  @default(now())
  judgedAt              DateTime?
  
  @@unique([competitionSubmissionId, problemId])
}
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Unknown error" in test results
**Solution:** Check test case output format - ensure no extra spaces or newlines

### Issue 2: Java compilation error about class name
**Solution:** Java wrapper automatically changes class name to "Main" - fixed! ✅

### Issue 3: Timeout errors
**Solution:** Increase timeLimit (e.g., from 2 to 5 seconds)

### Issue 4: Judge0 shows 0 workers available
**Solution:** This is a display bug. Judge0 still works. Verify by running tests.

---

## Next Steps

1. **Fix Judge0 server** using SSH commands above
2. **Create competition** using the data structure provided
3. **Add 5-7 test cases** (3 visible, 2-4 hidden)
4. **Test with "Run" button** (visible tests only)
5. **Submit solution** (all tests including hidden)
6. **Verify results** in database and UI

Good luck! 🚀
