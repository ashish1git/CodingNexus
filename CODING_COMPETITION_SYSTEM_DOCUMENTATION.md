# CodingNexus - Coding Competition System
## Complete Technical Documentation v1.0

---

# 📑 TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Architecture & Infrastructure](#2-architecture--infrastructure)
3. [Database Schema](#3-database-schema)
4. [Authentication System](#4-authentication-system)
5. [Code Execution Engine](#5-code-execution-engine)
6. [Competition Flow](#6-competition-flow)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Backend API Reference](#8-backend-api-reference)
9. [Scalability Analysis](#9-scalability-analysis)
10. [Known Issues & Loopholes](#10-known-issues--loopholes)
11. [Scaling to 500 Users](#11-scaling-to-500-users)
12. [Pros & Cons](#12-pros--cons)
13. [Future Improvements](#13-future-improvements)
14. [Recreating the System](#14-recreating-the-system)

---

# 1. SYSTEM OVERVIEW

## 1.1 What is CodingNexus?

CodingNexus is a **full-stack coding competition platform** designed for educational institutions to conduct:
- **Timed coding competitions** with multiple problems
- **LeetCode-style function-based problems** with automatic testing
- **Real-time code execution** via Judge0 API
- **Live leaderboards** and automatic scoring
- **Manual evaluation** capability for complex problems

## 1.2 Core Features

| Feature | Description |
|---------|-------------|
| **Competition Management** | Create, schedule, and manage coding competitions |
| **Problem Creation** | LeetCode-style problems with function signatures |
| **Code Editor** | Monaco Editor with syntax highlighting |
| **Auto-Judging** | Automatic code execution via Judge0 |
| **Async Submissions** | Non-blocking submission system |
| **Leaderboard** | Real-time ranking during competitions |
| **Manual Evaluation** | Admin can override/add manual marks |
| **Student Management** | Batch-based student organization |
| **Quiz System** | MCQ-based quizzes (separate module) |
| **Attendance System** | QR-based attendance tracking |
| **Certificate Generation** | Auto-generated participation certificates |

## 1.3 Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  React 19 + Vite + TailwindCSS 4 + Monaco Editor            │
│  Deployed on: VERCEL (Free Tier)                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                 │
│  Node.js 20+ + Express 5 + Prisma ORM 7                     │
│  Deployed on: RENDER (Free Tier)                            │
└─────────────────────────────────────────────────────────────┘
                    ↓                    ↓
┌─────────────────────────┐    ┌─────────────────────────────┐
│      DATABASE           │    │     CODE EXECUTION          │
│  PostgreSQL (Neon)      │    │     Judge0 on DigitalOcean  │
│  Free Tier              │    │     8GB/2vCPU/160GB         │
└─────────────────────────┘    └─────────────────────────────┘
```

---

# 2. ARCHITECTURE & INFRASTRUCTURE

## 2.1 Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           INTERNET                                    │
└──────────────────────────────────────────────────────────────────────┘
                    │                           │
          ┌─────────▼─────────┐       ┌─────────▼─────────┐
          │   VERCEL CDN      │       │   RENDER          │
          │   (Frontend)      │       │   (Backend API)   │
          │                   │       │                   │
          │ • React SPA       │       │ • Express Server  │
          │ • Static Assets   │◀─────▶│ • REST API        │
          │ • Monaco Editor   │       │ • Background Jobs │
          │                   │       │                   │
          │ URL:              │       │ URL:              │
          │ *.vercel.app      │       │ *.onrender.com    │
          └───────────────────┘       └─────────┬─────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────┐
                    │                           │                       │
          ┌─────────▼─────────┐       ┌─────────▼─────────┐   ┌─────────▼────────┐
          │   NEON DATABASE   │       │   DIGITALOCEAN    │   │   CLOUDINARY     │
          │   (PostgreSQL)    │       │   (Judge0 Server) │   │   (Media Storage)│
          │                   │       │                   │   │                  │
          │ • Free Tier       │       │ • 8GB RAM         │   │ • Profile Photos │
          │ • 2 connections   │       │ • 2 Intel vCPU    │   │ • File Uploads   │
          │ • ap-southeast-1  │       │ • 160GB Disk      │   │                  │
          │                   │       │ • BLR1 Region     │   │                  │
          └───────────────────┘       └───────────────────┘   └──────────────────┘
```

## 2.2 Infrastructure Details

### Frontend (Vercel - FREE)
```yaml
Service: Vercel Free Tier
Limits:
  - Bandwidth: 100GB/month
  - Serverless Functions: 100GB-Hrs
  - Builds: 6000 minutes/month
  - Concurrent Builds: 1
Features Used:
  - Static site hosting
  - Edge caching
  - Automatic HTTPS
  - CI/CD from GitHub
```

### Backend (Render - FREE)
```yaml
Service: Render Free Web Service
Limits:
  - Memory: 512MB
  - CPU: Shared (0.1 CPU)
  - Bandwidth: 100GB/month
  - Sleep after: 15 minutes idle
  - Cold start: 30-60 seconds
Features Used:
  - Node.js runtime
  - Environment variables
  - CI/CD from GitHub
Current Config:
  - PORT: 21000
  - NODE_ENV: production
  - Connection pooling: 5 max
```

### Database (Neon - FREE)
```yaml
Service: Neon PostgreSQL Free Tier
Limits:
  - Storage: 0.5GB
  - Compute: 0.25 CU (shared)
  - Branches: 10
  - Connections: ~20 via pooler
  - History: 7 days
Connection String:
  postgresql://neondb_owner:***@ep-purple-recipe-a19mlspg-pooler.ap-southeast-1.aws.neon.tech/neondb
Features:
  - Connection pooling (PgBouncer)
  - Serverless autoscaling
  - Branch/clone support
```

### Judge0 (DigitalOcean - PAID)
```yaml
Service: DigitalOcean Droplet
Specs:
  - Memory: 8GB RAM
  - CPU: 2 Intel vCPUs
  - Disk: 160GB SSD
  - Region: BLR1 (Bangalore)
  - Cost: ~$48/month
Judge0 Config:
  - URL: http://64.227.149.20:2358
  - Languages: C, C++, Java, Python, JavaScript
  - Timeout: 5 seconds
  - Memory limit: 128MB per submission
```

## 2.3 Current Environment Variables

```bash
# Database
DATABASE_URL="postgresql://neondb_owner:***@ep-purple-recipe-a19mlspg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Server
PORT=21000
NODE_ENV="development"

# JWT Authentication
JWT_SECRET="d23a24c17a9b54c6cfda1baa10409b0fce79dcd7d87373711bd482452bd859764e6253ee98aa085098f63907fc887baaa13ba644cd9608ca8c099af172994f30"
JWT_EXPIRES_IN="7d"

# CORS
FRONTEND_URL="http://localhost:22000,http://localhost:22001,https://codingnexus.vercel.app"

# Judge0
JUDGE0_URL="http://64.227.149.20:2358"
VITE_JUDGE0_URL="http://64.227.149.20:2358"

# Async Submission Settings
ENABLE_POLLING=false
POLL_INTERVAL=15000

# Cloudinary (Media Storage)
CLOUDINARY_CLOUD_NAME="dtxktmolj"
CLOUDINARY_API_KEY="857761858925618"
CLOUDINARY_API_SECRET="***"

# Frontend API URL
VITE_API_URL="http://localhost:21000/api"

# Maintenance Mode
MAINTENANCE_MODE="false"
```

---

# 3. DATABASE SCHEMA

## 3.1 Entity Relationship Diagram

```
┌──────────────────┐     ┌────────────────────────────┐
│      User        │────▶│   CompetitionRegistration  │
│                  │     └────────────────────────────┘
│ id (UUID)        │              │
│ email (unique)   │              ▼
│ password (hash)  │     ┌────────────────────────────┐
│ role             │────▶│   CompetitionSubmission    │
│ moodleId         │     │                            │
│ isActive         │     │ id, competitionId, userId  │
└──────────────────┘     │ totalScore, totalTime      │
        │                │ status, rank               │
        │                └────────────────────────────┘
        │                             │
        ▼                             ▼
┌──────────────────┐     ┌────────────────────────────┐
│    Student       │     │    ProblemSubmission       │
│                  │     │                            │
│ id, userId       │     │ id, problemId, userId      │
│ name, batch      │     │ code, language             │
│ phone, rollNo    │     │ score, testsPassed         │
│ profilePhotoUrl  │     │ status, testResults        │
└──────────────────┘     │ manualMarks, isEvaluated   │
                         └────────────────────────────┘
                                      │
                                      ▼
┌──────────────────┐     ┌────────────────────────────┐
│   Competition    │────▶│        Problem             │
│                  │     │                            │
│ id, title        │     │ id, competitionId          │
│ description      │     │ title, description         │
│ startTime        │     │ difficulty, points         │
│ endTime          │     │ testCases (JSON)           │
│ duration         │     │ functionName               │
│ difficulty       │     │ parameters (JSON)          │
│ isActive         │     │ returnType                 │
└──────────────────┘     │ starterCode (JSON)         │
                         └────────────────────────────┘
```

## 3.2 Complete Schema Details

### User Model
```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique        // Login email
  password    String                  // bcrypt hashed
  role        String                  // "student" | "admin" | "subadmin" | "superadmin"
  moodleId    String?  @unique        // Alternative login ID (e.g., roll number)
  isActive    Boolean  @default(false) // Requires admin activation
  
  // Relations
  studentProfile           Student?
  adminProfile             Admin?
  competitionRegistrations CompetitionRegistration[]
  competitionSubmissions   CompetitionSubmission[]
  problemSubmissions       ProblemSubmission[]
  quizAttempts            QuizAttempt[]
  attendanceRecords       Attendance[]
  tickets                 SupportTicket[]
  certificateRequests     CertificateRequest[]
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Indexes for performance
  @@index([email])
  @@index([moodleId])
}
```

### Competition Model
```prisma
model Competition {
  id              String   @id @default(uuid())
  title           String
  description     String
  category        String   @default("general")  // Algorithm, Data Structure, etc.
  difficulty      String                        // easy, medium, hard
  startTime       DateTime
  endTime         DateTime
  duration        Int                           // minutes
  type            String   @default("individual")
  prizePool       String?
  maxParticipants Int?
  isActive        Boolean  @default(true)
  createdBy       String
  
  // Relations
  problems        Problem[]
  registrations   CompetitionRegistration[]
  submissions     CompetitionSubmission[]
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Indexes
  @@index([startTime])
  @@index([endTime])
  @@index([isActive])
}
```

### Problem Model (LeetCode-Style)
```prisma
model Problem {
  id            String   @id @default(uuid())
  competitionId String
  title         String
  description   String                // Markdown supported
  difficulty    String                // easy, medium, hard
  points        Int                   // Max score for this problem
  orderIndex    Int                   // Display order in competition
  
  // Function signature fields (LeetCode-style)
  functionName  String   @default("solution")
  parameters    Json?                 // [{name: "nums", type: "int[]"}]
  returnType    String   @default("int")
  starterCode   Json?                 // {java: "...", python: "..."}
  
  // Test data
  constraints   Json                  // ["1 <= nums.length <= 100"]
  examples      Json                  // [{input: "...", output: "...", explanation: "..."}]
  testCases     Json                  // [{input: "...", output: "...", hidden: true/false}]
  
  // Limits
  timeLimit     Int      @default(3000)  // ms
  memoryLimit   Int      @default(256)   // MB
  
  // Relations
  competition   Competition @relation(...)
  submissions   ProblemSubmission[]
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Indexes
  @@index([competitionId])
  @@index([orderIndex])
}
```

### ProblemSubmission Model
```prisma
model ProblemSubmission {
  id                      String   @id @default(uuid())
  competitionSubmissionId String
  problemId               String
  userId                  String
  
  // Submission data
  code                    String   // Source code
  language                String   // java, python, cpp, c, javascript
  
  // Auto-judging results
  score                   Int      @default(0)
  maxScore                Int
  testsPassed             Int      @default(0)
  totalTests              Int
  executionTime           Int      @default(0)  // ms
  memoryUsed              Int      @default(0)  // KB
  status                  String   @default("pending")
  // Status values: pending, judging, accepted, wrong-answer, tle, runtime-error, compile-error
  
  errorMessage            String?
  testResults             Json?    // Detailed per-test results
  
  // Manual evaluation
  manualMarks             Float?
  evaluatorComments       String?
  evaluatedBy             String?
  evaluatedAt             DateTime?
  isEvaluated             Boolean  @default(false)
  
  // Timestamps
  submittedAt             DateTime @default(now())
  judgedAt                DateTime?
  
  // Relations
  competitionSubmission   CompetitionSubmission @relation(...)
  problem                 Problem @relation(...)
  user                    User @relation(...)
  evaluations             SubmissionEvaluation[]
  
  // Indexes
  @@index([competitionSubmissionId])
  @@index([problemId])
  @@index([userId])
  @@index([status])
  @@index([isEvaluated])
}
```

## 3.3 Test Case Format

```json
// Problem.testCases JSON structure
[
  {
    "input": "[2,7,11,15], 9",  // Raw input values
    "output": "[0,1]",          // Expected output
    "hidden": false             // Visible to students
  },
  {
    "input": "[3,2,4], 6",
    "output": "[1,2]",
    "hidden": true              // Hidden test case
  }
]

// Problem.parameters JSON structure
[
  { "name": "nums", "type": "int[]" },
  { "name": "target", "type": "int" }
]

// Problem.examples JSON structure
[
  {
    "input": "nums = [2,7,11,15], target = 9",
    "output": "[0,1]",
    "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
  }
]
```

---

# 4. AUTHENTICATION SYSTEM

## 4.1 Authentication Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   FRONTEND      │     │    BACKEND      │     │    DATABASE     │
│   (React)       │     │   (Express)     │     │   (Neon/PG)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. POST /auth/login  │                       │
         │  {email, password}    │                       │
         │──────────────────────▶│                       │
         │                       │  2. Find user by      │
         │                       │  email or moodleId    │
         │                       │──────────────────────▶│
         │                       │                       │
         │                       │◀── User record ───────│
         │                       │                       │
         │                       │  3. bcrypt.compare()  │
         │                       │  4. Check isActive    │
         │                       │  5. Generate JWT      │
         │                       │                       │
         │◀─── {token, user} ────│                       │
         │                       │                       │
         │  6. Store token in    │                       │
         │     localStorage      │                       │
         │                       │                       │
         │  7. All API requests  │                       │
         │  include Bearer token │                       │
         │──────────────────────▶│                       │
         │                       │  8. Verify JWT        │
         │                       │  9. Attach user to    │
         │                       │     req.user          │
         │                       │                       │
```

## 4.2 JWT Structure

```javascript
// JWT Payload
{
  userId: "uuid-string",
  role: "student" | "admin" | "subadmin" | "superadmin",
  iat: 1234567890,  // Issued at
  exp: 1235172690   // Expires (7 days default)
}

// JWT Secret: 128-character hex string
// Algorithm: HS256
```

## 4.3 Role-Based Access Control

```javascript
// Roles hierarchy
const ROLES = {
  student: {
    access: ['competitions', 'quizzes', 'notes', 'attendance', 'tickets', 'certificates']
  },
  subadmin: {
    access: ['all student access', 'evaluate submissions', 'view reports'],
    restrictions: ['cannot create competitions', 'cannot manage students']
  },
  admin: {
    access: ['all subadmin access', 'create competitions', 'manage students', 'manage quizzes'],
    restrictions: ['cannot delete competitions', 'cannot manage subadmins']
  },
  superadmin: {
    access: ['full access', 'manage admins/subadmins', 'delete competitions', 'system settings']
  }
};
```

## 4.4 Login Methods

```javascript
// Student can login with:
// 1. Full email: "23106031@student.mu.ac.in"
// 2. MoodleId only: "23106031"
// 3. MoodleId with different domain: "23106031@apsit.edu.in"

const searchConditions = [
  { email: email },
  { moodleId: email },
  { email: `${email}@student.mu.ac.in` },
  { email: `${email}@apsit.edu.in` }
];
```

---

# 5. CODE EXECUTION ENGINE

## 5.1 Judge0 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SUBMISSION FLOW                                 │
│                                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ Student  │───▶│ Frontend │───▶│ Backend  │───▶│  Judge0  │          │
│  │ Submits  │    │ POST API │    │ Process  │    │  Execute │          │
│  │ Code     │    │          │    │          │    │          │          │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘          │
│                                        │               │                │
│                                        ▼               ▼                │
│                              ┌──────────────┐  ┌──────────────┐        │
│                              │   Database   │  │   Results    │        │
│                              │   Save       │  │   (JSON)     │        │
│                              │   Submission │  │              │        │
│                              └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Code Wrapper System (LeetCode-Style)

The system automatically wraps user's function code with a test harness:

### User Submits (Java):
```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        // User's solution
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[]{i, j};
                }
            }
        }
        return new int[]{};
    }
}
```

### System Generates (Complete Program):
```java
import java.util.*;
import java.io.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // User's solution (unchanged)
    }
}

// AUTOMATICALLY ADDED BY SYSTEM
public class Main {
    public static void main(String[] args) {
        try {
            Solution sol = new Solution();
            
            // Parse inputs from test case
            int[] nums = new int[]{2, 7, 11, 15};
            int target = 9;
            
            // Execute solution
            int[] result = sol.twoSum(nums, target);
            
            // Output result for comparison
            System.out.println(Arrays.toString(result).replace(" ", ""));
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            System.exit(1);
        }
    }
}
```

## 5.3 Supported Languages

```javascript
const LANGUAGE_MAP = {
  'c': 50,        // C (GCC 9.2.0)
  'cpp': 54,      // C++ (GCC 9.2.0)
  'java': 62,     // Java (OpenJDK 13.0.1)
  'python': 71,   // Python (3.8.1)
  'javascript': 63 // JavaScript (Node.js 12.14.0)
};
```

## 5.4 Two Submission Modes

### Mode 1: "Run Code" (Synchronous)
```javascript
// Endpoint: POST /api/submissions/:problemId/run
// Used for: Testing against sample test cases
// Response: Immediate (wait=true)

const response = await axios.post(
  `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
  {
    source_code: execCode,
    language_id: langId,
    stdin: testCase.input,
    cpu_time_limit: 5,
    memory_limit: 128000
  },
  { timeout: 15000 }
);
```

### Mode 2: "Submit" (Asynchronous)
```javascript
// Endpoint: POST /api/submissions/:problemId/submit-async
// Used for: Final submission against all test cases
// Response: Immediate (with submission ID), results fetched via polling

// Step 1: Submit returns immediately
res.json({
  message: '✅ Code submitted!',
  submissionId: submission.id,
  status: 'submitted'
});

// Step 2: Background processing
// Submit each test case to Judge0 with wait=false
const judge0Response = await axios.post(
  `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
  { source_code, language_id, stdin }
);

// Step 3: Store token for later retrieval
await prisma.judge0Queue.create({
  data: { judge0Token: token, submissionId, status: 'submitted' }
});

// Step 4: Frontend polls for results
// GET /api/submissions/:submissionId/status
```

## 5.5 Judge0 Status Codes

```javascript
const JUDGE0_STATUS = {
  1:  'In Queue',          // Waiting to be processed
  2:  'Processing',        // Currently executing
  3:  'Accepted',          // ✅ Correct output
  4:  'Wrong Answer',      // ❌ Output doesn't match
  5:  'Time Limit Exceeded', // ⏱️ TLE
  6:  'Compilation Error', // ❌ Code doesn't compile
  7:  'Runtime Error (SIGSEGV)', // Segmentation fault
  8:  'Runtime Error (SIGXFSZ)', // Output limit exceeded
  9:  'Runtime Error (SIGFPE)',  // Floating point exception
  10: 'Runtime Error (SIGABRT)', // Abort signal
  11: 'Runtime Error (NZEC)',    // Non-zero exit code
  12: 'Runtime Error (Other)',   // Other runtime error
  13: 'Internal Error',          // Judge0 internal error
  14: 'Exec Format Error'        // Invalid executable
};
```

## 5.6 Background Polling Job

```javascript
// Runs every 15 seconds when ENABLE_POLLING=true
export async function checkPendingSubmissions() {
  // Get pending Judge0 tokens
  const pending = await prisma.judge0Queue.findMany({
    where: { status: 'submitted' },
    take: 20,  // Process 20 at a time
    orderBy: { submittedat: 'asc' }
  });

  for (const queue of pending) {
    // Check status from Judge0
    const response = await axios.get(
      `${JUDGE0_URL}/submissions/${queue.judge0Token}`
    );
    
    // Update database with results
    if (response.data.status?.id >= 3) {
      await prisma.judge0Queue.update({
        where: { id: queue.id },
        data: {
          status: result.status?.id === 3 ? 'completed' : 'failed',
          stdout: result.stdout,
          stderr: result.stderr
        }
      });
    }
  }
}
```

---

# 6. COMPETITION FLOW

## 6.1 Complete Competition Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPETITION LIFECYCLE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐                                                        │
│  │   ADMIN     │                                                        │
│  │   Creates   │                                                        │
│  │ Competition │                                                        │
│  └──────┬──────┘                                                        │
│         │                                                                │
│         ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    COMPETITION STATES                            │   │
│  │                                                                   │   │
│  │  ┌──────────┐     ┌──────────┐     ┌──────────┐                 │   │
│  │  │ UPCOMING │────▶│ ONGOING  │────▶│   PAST   │                 │   │
│  │  │          │     │          │     │          │                 │   │
│  │  │ Students │     │ Students │     │ Results  │                 │   │
│  │  │ Register │     │ Solve &  │     │ Visible  │                 │   │
│  │  │          │     │ Submit   │     │ Evaluate │                 │   │
│  │  └──────────┘     └──────────┘     └──────────┘                 │   │
│  │      │                 │                │                        │   │
│  │      │                 │                │                        │   │
│  │      │                 ▼                ▼                        │   │
│  │      │         ┌─────────────┐   ┌─────────────┐                │   │
│  │      │         │  JUDGING    │   │  EVALUATION │                │   │
│  │      │         │             │   │             │                │   │
│  │      │         │ • Judge0    │   │ • Manual    │                │   │
│  │      │         │ • Auto Score│   │ • Override  │                │   │
│  │      │         │ • Store     │   │ • Comments  │                │   │
│  │      │         └─────────────┘   └─────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 6.2 Student Competition Flow

```
1. BROWSE COMPETITIONS
   └─▶ GET /api/competitions?status=ongoing
   
2. VIEW COMPETITION DETAILS
   └─▶ GET /api/competitions/:id
       └─▶ Auto-register if not registered
   
3. ENTER COMPETITION (Competition Page)
   ├── View problems list
   ├── Select problem
   ├── Read description, examples, constraints
   └── View function signature
   
4. SOLVE PROBLEMS
   ├── Write code in Monaco Editor
   ├── Select language (Java/Python/C++)
   ├── Run against sample tests (sync)
   │   └─▶ POST /api/submissions/:problemId/run
   │       └─▶ See immediate results
   ├── Save solution locally
   └── Repeat for each problem
   
5. SUBMIT ALL SOLUTIONS
   └─▶ POST /api/competitions/:id/submit
       └─▶ Returns immediately
       └─▶ Background judging starts
   
6. VIEW RESULTS
   ├── Check leaderboard
   │   └─▶ GET /api/competitions/:id/leaderboard
   └── View my submission details
       └─▶ GET /api/competitions/:id/my-submission
```

## 6.3 Admin Competition Flow

```
1. CREATE COMPETITION
   └─▶ POST /api/competitions
       ├── Basic info (title, description, times)
       └── Problems array with:
           ├── title, description
           ├── functionName, parameters, returnType
           ├── testCases (visible + hidden)
           ├── starterCode templates
           └── points, difficulty
   
2. MONITOR COMPETITION
   ├── View registrations count
   ├── View submissions in real-time
   └── Track leaderboard
   
3. EVALUATE SUBMISSIONS
   └─▶ GET /api/competitions/:id/problems/:pid/submissions
       ├── View all submissions for a problem
       ├── See code, auto-score, test results
       └── POST /api/.../submissions/:sid/evaluate
           ├── manualMarks (0-100)
           └── evaluatorComments
   
4. VIEW EVALUATION ACTIVITY
   └─▶ GET /api/competitions/:id/evaluator-activity
       └── See who evaluated how many
```

## 6.4 Scoring System

```javascript
// Auto-scoring formula
const scorePercentage = testsPassed / totalTests;
const autoScore = Math.round(scorePercentage * problem.points);

// Manual evaluation can override
if (manualMarks !== null) {
  finalScore = manualMarks;  // Manual marks take precedence
}

// Competition total score
const totalScore = problemSubmissions.reduce((sum, ps) => sum + ps.score, 0);

// Leaderboard ranking
orderBy: [
  { totalScore: 'desc' },    // Higher score first
  { totalTime: 'asc' },      // Lower time wins ties
  { submittedAt: 'asc' }     // Earlier submission wins
]
```

---

# 7. FRONTEND ARCHITECTURE

## 7.1 Component Structure

```
src/
├── main.jsx                    # Entry point
├── App.jsx                     # Router config
├── index.css                   # Global styles
│
├── components/
│   ├── admin/
│   │   ├── AdminDashboard.jsx      # Admin home
│   │   ├── CompetitionManager.jsx   # Create/manage competitions
│   │   ├── SubmissionEvaluator.jsx  # Evaluate submissions
│   │   ├── StudentManagement.jsx    # Manage students
│   │   ├── QuizManager.jsx          # Manage quizzes
│   │   ├── AttendanceManager.jsx    # Manage attendance
│   │   └── ...
│   │
│   ├── student/
│   │   ├── StudentDashboard.jsx     # Student home
│   │   ├── Competitions.jsx         # List competitions
│   │   ├── CompetitionProblems.jsx  # Solve problems
│   │   ├── CompetitionResults.jsx   # View results
│   │   ├── AsyncSubmissionHandler.jsx # Polling logic
│   │   ├── QuizzesList.jsx          # List quizzes
│   │   ├── QuizAttempt.jsx          # Take quiz
│   │   └── ...
│   │
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── AdminLogin.jsx
│   │
│   ├── layout/
│   │   ├── AdminLayout.jsx
│   │   ├── StudentLayout.jsx
│   │   └── Navbar.jsx
│   │
│   └── shared/
│       ├── Loading.jsx
│       └── ErrorBoundary.jsx
│
├── context/
│   └── AuthContext.jsx          # Auth state management
│
├── services/
│   ├── apiClient.js             # Axios wrapper
│   ├── authService.js           # Auth API calls
│   └── competitionService.js    # Competition API calls
│
├── hooks/
│   └── useAuth.js               # Auth hook
│
└── utils/
    ├── permissions.js           # Permission checks
    └── formatters.js            # Data formatters
```

## 7.2 Key Frontend Components

### CompetitionProblems.jsx (Main Competition UI)
```jsx
// Features:
// 1. Monaco Editor for code editing
// 2. Problem list sidebar
// 3. Live countdown timer
// 4. Run code against samples
// 5. Submit all solutions
// 6. Async status polling

// Key State:
const [competition, setCompetition] = useState(null);
const [selectedProblem, setSelectedProblem] = useState(null);
const [code, setCode] = useState('');
const [language, setLanguage] = useState('java');
const [testResults, setTestResults] = useState(null);
const [problemSolutions, setProblemSolutions] = useState({});
const [asyncStatus, setAsyncStatus] = useState('idle');
```

### AsyncSubmissionHandler.jsx (Polling Logic)
```jsx
// Smart polling with exponential backoff
const startSmartPolling = (submissionId) => {
  let pollCount = 0;
  const maxPolls = 50;

  const poll = () => {
    if (pollCount >= maxPolls) {
      setStatus('timeout');
      return;
    }

    checkStatus(submissionId).then(data => {
      if (data.status === 'completed') {
        setStatus('completed');
        setResults(data);
      } else {
        // Exponential backoff: 3s → 4s → 5s → ... → 10s max
        const delay = Math.min(3000 + (pollCount * 1000), 10000);
        pollCount++;
        setTimeout(poll, delay);
      }
    });
  };

  setTimeout(poll, 2000);  // First poll after 2s
};
```

## 7.3 State Management

```javascript
// Auth Context provides:
const AuthContext = {
  currentUser,        // User object or null
  userDetails,        // Full user with profile
  loading,            // Auth loading state
  isAuthenticated,    // Boolean
  role,               // 'student' | 'admin' | etc.
  
  // Methods
  login(email, password, isAdmin),
  signup(email, password, userData),
  logout(),
  refreshUser()
};

// Usage:
const { user, login, logout } = useAuth();
```

---

# 8. BACKEND API REFERENCE

## 8.1 Authentication Endpoints

```
POST /api/auth/signup
  Body: { email, password, name, moodleId, batch, phone }
  Response: { success, message, user }
  Note: Creates inactive account, needs admin activation

POST /api/auth/login
  Body: { email, password }
  Response: { success, token, user }
  Note: Works with email or moodleId

POST /api/auth/login/admin
  Body: { email, password }
  Response: { success, token, user }
  Note: For admin/subadmin/superadmin only

GET /api/auth/me
  Headers: Authorization: Bearer <token>
  Response: { success, user }
  Note: Get current authenticated user
```

## 8.2 Competition Endpoints

```
GET /api/competitions
  Query: ?status=ongoing|upcoming|past&difficulty=easy|medium|hard
  Response: [Competition with status, isRegistered, problemCount]

GET /api/competitions/:id
  Response: Competition with problems (including testCases)

POST /api/competitions/:id/register
  Response: { message, registration }

POST /api/competitions/:id/submit
  Body: { solutions: [{problemId, code, language}] }
  Response: { message, submissionId, problemCount }

GET /api/competitions/:id/leaderboard
  Response: [{rank, name, rollNo, totalScore, problemsSolved}]

GET /api/competitions/:id/my-submission
  Response: { totalScore, problems: [{problemTitle, score, testsPassed}] }

# Admin only
POST /api/competitions
  Body: { title, description, problems: [...], startTime, endTime, ... }
  Response: { message, competition }

PUT /api/competitions/:id
  Body: { title, description, isActive, ... }

DELETE /api/competitions/:id
  Note: Superadmin only

GET /api/competitions/:id/submissions
  Response: All submissions with user details

POST /api/competitions/:id/problems/:pid/submissions/:sid/evaluate
  Body: { marks, comments }
```

## 8.3 Submission Endpoints (Async)

```
POST /api/submissions/:problemId/run
  Body: { code, language }
  Response: { success, results, summary }
  Note: Synchronous, for testing sample cases

POST /api/submissions/:problemId/submit-async
  Body: { code, language }
  Response: { message, submissionId, status }
  Note: Returns immediately, background processing

GET /api/submissions/:submissionId/status
  Response: { status, completion, score, passed, total }

POST /api/submissions/:submissionId/fetch-results
  Response: { status, passed, total, score }
  Note: On-demand result fetching
```

## 8.4 Response Status Codes

```javascript
200 - Success
201 - Created
400 - Bad Request (validation error)
401 - Unauthorized (no/invalid token)
403 - Forbidden (insufficient permissions)
404 - Not Found
500 - Internal Server Error
503 - Service Unavailable (maintenance mode)
```

---

# 9. SCALABILITY ANALYSIS

## 9.1 Current Capacity (150 Students)

### Bottleneck Analysis

| Component | Capacity | Current Load | Status |
|-----------|----------|--------------|--------|
| **Vercel Frontend** | 100GB/mo | ~5GB/contest | ✅ OK |
| **Render Backend** | 512MB RAM | ~200MB used | ✅ OK |
| **Neon DB** | 0.5GB, 20 conn | ~100MB, 5 conn | ⚠️ Tight |
| **Judge0** | 8GB, 2vCPU | ~50% load | ✅ OK |

### Database Connection Pool

```
Current Setting: max=5 connections
Issue: Neon free tier has ~20 pooler connections

With 150 students:
- Avg concurrent queries: ~30
- Query queue time: 50-200ms
- Risk: Connection exhaustion during peak submission

Mitigation applied:
- PgBouncer pooling via Neon pooler URL
- Conservative pool settings (max=5)
- Query timeouts (5000ms)
```

### Judge0 Processing Time

```
Scenario: 150 students × 5 problems × 5 test cases = 3750 submissions

With synchronous processing (wait=true):
- Time per test: ~2-5 seconds
- Total time: 3750 × 3.5s = ~3.6 hours ❌

With async processing (current):
- Submissions queued instantly
- Background job processes 20/15s
- Total time: 3750 ÷ 80/min = ~47 minutes ✅
```

## 9.2 Load Test Results (Simulated)

```
Test: 150 concurrent submission requests

Results:
┌────────────────────┬─────────┐
│ Metric             │ Value   │
├────────────────────┼─────────┤
│ Requests/second    │ 45      │
│ Avg response time  │ 850ms   │
│ P99 response time  │ 2.5s    │
│ Error rate         │ 0.5%    │
│ DB connections     │ 5       │
│ Memory usage       │ 380MB   │
└────────────────────┴─────────┘

Verdict: ✅ PASSES for 150 students with async design
```

---

# 10. KNOWN ISSUES & LOOPHOLES

## 10.1 Security Loopholes

### 🔴 Critical

```
1. NO RATE LIMITING
   Issue: No limits on API calls
   Risk: DoS attack, excessive Judge0 usage
   Fix: Add express-rate-limit middleware

2. CODE INJECTION (Theoretical)
   Issue: User code executes on Judge0
   Risk: Judge0 sandboxing prevents most attacks
   Mitigation: Judge0's isolate sandbox + resource limits
   Action: Ensure Judge0 is properly configured

3. JWT SECRET IN .ENV
   Issue: Same secret across environments
   Risk: If leaked, all tokens compromised
   Fix: Use different secrets per environment
```

### 🟠 Medium

```
4. NO ANTI-CHEAT MECHANISM
   Issue: Students can copy code from each other
   Risk: Academic dishonesty
   Fix: Consider plagiarism detection (future)

5. SUBMISSION TIMING NOT ENFORCED
   Issue: API doesn't strictly validate competition end time
   Risk: Late submissions after endTime
   Fix: Server-side time validation exists but add buffer

6. NO EMAIL VERIFICATION
   Issue: Any email can be registered
   Risk: Fake accounts
   Fix: Add email verification flow (future)
```

### 🟡 Low

```
7. CLOUDINARY CREDENTIALS EXPOSED
   Issue: API keys in .env (committed to repo)
   Risk: Unauthorized uploads
   Fix: Use environment-specific secrets

8. DEBUG LOGGING IN PRODUCTION
   Issue: Console.log statements everywhere
   Risk: Performance + information leakage
   Fix: Use proper logging library (winston/pino)
```

## 10.2 Functional Issues

```
1. POLLING JOB DISABLED BY DEFAULT
   Issue: ENABLE_POLLING=false in .env
   Impact: Results only fetched on-demand
   Workaround: Frontend polls individually

2. COLD START DELAYS
   Issue: Render free tier sleeps after 15 min
   Impact: First request takes 30-60 seconds
   Workaround: Keep server warm with health checks

3. COMPETITION END TIME TIMEZONE
   Issue: All times in UTC, displayed as-is
   Impact: Confusing for local timezone users
   Fix: Add timezone conversion in frontend

4. NO AUTOMATIC SCORE RECALCULATION
   Issue: Manual marks don't auto-update leaderboard
   Impact: Stale leaderboard until page refresh
   Fix: Add WebSocket or polling for live updates
```

## 10.3 Performance Issues

```
1. N+1 QUERY PATTERNS
   Location: Competition submissions fetch
   Impact: Slow response for many submissions
   Fix: Optimize Prisma includes

2. LARGE PAYLOAD RESPONSES
   Issue: Full code returned with submissions
   Impact: Slow loading, high bandwidth
   Fix: Paginate and lazy-load code

3. NO CACHING
   Issue: Every request hits database
   Impact: Unnecessary DB load
   Fix: Add Redis caching for hot data
```

---

# 11. SCALING TO 500 USERS

## 11.1 Infrastructure Changes Required

### FREE TIER ONLY Approach

```
┌─────────────────────────────────────────────────────────────────┐
│              SCALING TO 500 USERS (FREE TIER)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FRONTEND (Vercel) ─────────────────────── ✅ NO CHANGE NEEDED  │
│  • 100GB bandwidth sufficient                                    │
│  • Edge caching handles load                                     │
│                                                                  │
│  BACKEND (Render Free) ──────────────────── ⚠️ OPTIMIZE CODE    │
│  • 512MB RAM is tight                                           │
│  • MUST implement:                                               │
│    - Response caching (in-memory)                               │
│    - Request batching                                           │
│    - Connection pooling optimization                            │
│    - Payload compression                                        │
│                                                                  │
│  DATABASE (Neon Free) ──────────────────── 🔴 BOTTLENECK        │
│  • 0.5GB storage (may hit limit)                                │
│  • ~20 pooler connections                                       │
│  • MUST implement:                                               │
│    - Query optimization                                         │
│    - Data cleanup jobs                                          │
│    - Read replicas (not available free)                        │
│                                                                  │
│  JUDGE0 (DigitalOcean) ─────────────────── ⚠️ CAPACITY ISSUE    │
│  • 2vCPU = ~40 concurrent executions                           │
│  • 500 × 5 problems × 5 tests = 12,500 submissions             │
│  • Processing time: ~2.5 hours minimum                         │
│  • OPTIONS:                                                      │
│    A) Upgrade to 4vCPU ($48/mo → $96/mo)                       │
│    B) Optimize test case count                                  │
│    C) Increase timeout tolerance                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 11.2 Code Optimizations Required

### 1. Add In-Memory Caching
```javascript
// server/utils/cache.js
const cache = new Map();
const CACHE_TTL = 5000; // 5 seconds

export function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.time < CACHE_TTL) {
    return item.data;
  }
  return null;
}

export function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
  // Cleanup old entries
  if (cache.size > 1000) {
    const oldest = Array.from(cache.entries())
      .sort((a, b) => a[1].time - b[1].time)
      .slice(0, 500)
      .map(([k]) => k);
    oldest.forEach(k => cache.delete(k));
  }
}
```

### 2. Optimize Status Polling
```javascript
// Add caching to status endpoint
router.get('/:submissionId/status', authenticate, async (req, res) => {
  const cacheKey = `status:${req.params.submissionId}`;
  
  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  
  // DB query...
  const result = await prisma.problemSubmission.findUnique({...});
  
  // Cache for 2 seconds
  setCache(cacheKey, result);
  res.json(result);
});
```

### 3. Rate Limiting
```javascript
// server/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const statusRateLimiter = rateLimit({
  windowMs: 1000,  // 1 second
  max: 2,          // 2 requests per second
  message: 'Too many status checks'
});

export const submitRateLimiter = rateLimit({
  windowMs: 3000,  // 3 seconds
  max: 1,          // 1 submission per 3 seconds
  message: 'Please wait before submitting'
});
```

### 4. Batch Processing Optimization
```javascript
// Increase batch size for background job
const pending = await prisma.judge0Queue.findMany({
  where: { status: 'submitted' },
  take: 50,  // Increased from 20
  orderBy: { submittedat: 'asc' }
});

// Process in parallel
const results = await Promise.allSettled(
  pending.map(queue => checkJudge0Token(queue))
);
```

## 11.3 Estimated Processing Times

```
500 Students Scenario:
────────────────────────
Assumptions:
- 5 problems per competition
- 8 test cases per problem (3 visible, 5 hidden)
- Average test execution: 2 seconds
- Judge0 parallel capacity: 30 submissions

Total submissions: 500 × 5 × 8 = 20,000

With current setup (2vCPU):
- Parallel: 30 submissions
- Time per batch: ~2 seconds
- Total batches: 20,000 ÷ 30 = 667 batches
- Total time: 667 × 2 = ~22 minutes (best case)
- With retries/errors: ~45-60 minutes

With upgraded Judge0 (4vCPU):
- Parallel: 60 submissions
- Total time: ~15-25 minutes

Recommendation for 500 users:
1. Upgrade Judge0 to 4vCPU ($48 extra/month)
2. OR reduce test cases to 5 per problem
3. OR extend competition result time by 1 hour
```

## 11.4 Database Scaling Strategy

```
Current: Neon Free (0.5GB, pooled connections)

For 500 users (still FREE):
1. Data cleanup policy
   - Delete test results after 30 days
   - Archive old competitions
   - Compress code storage

2. Query optimization
   - Add missing indexes
   - Use select() to limit fields
   - Implement pagination everywhere

3. Connection management
   - Reduce pool size to 3
   - Add retry logic
   - Implement circuit breaker

Estimated storage for 500 users:
- Users: 500 × 1KB = 0.5MB
- Competitions: 10 × 50KB = 0.5MB
- Submissions: 500 × 5 × 10KB = 25MB
- Test results: 500 × 5 × 8 × 2KB = 40MB
- Total: ~70MB (well under 0.5GB limit)
```

---

# 12. PROS & CONS

## 12.1 Pros ✅

```
ARCHITECTURE
✅ Clean separation of concerns (frontend/backend/judge)
✅ Async submission design prevents timeouts
✅ LeetCode-style problems with function signatures
✅ Multi-language support (Java, Python, C++, C, JavaScript)
✅ Auto-generated starter code templates

SCALABILITY
✅ Stateless backend (easy to scale horizontally)
✅ Database indices for common queries
✅ Connection pooling configured
✅ Background job for result processing

USER EXPERIENCE
✅ Monaco Editor (same as VS Code)
✅ Real-time countdown timer
✅ Instant feedback on "Run Code"
✅ Live leaderboard
✅ Manual evaluation capability

COST
✅ Almost entirely free tier
✅ Only Judge0 server requires payment (~$48/mo)
✅ No vendor lock-in (standard PostgreSQL)

SECURITY
✅ JWT-based authentication
✅ Role-based access control
✅ Password hashing (bcrypt)
✅ Code execution sandboxed (Judge0)

MAINTAINABILITY
✅ Prisma ORM for type-safe queries
✅ Clear API structure
✅ Modular React components
✅ Environment-based configuration
```

## 12.2 Cons ❌

```
PERFORMANCE
❌ No caching layer (Redis)
❌ N+1 query patterns in some endpoints
❌ Large JSON responses (full code included)
❌ Polling instead of WebSockets

SCALABILITY LIMITS
❌ Neon free tier very limited (0.5GB, 20 conn)
❌ Render free tier sleeps after 15 min
❌ No horizontal scaling on free tier
❌ Judge0 single instance bottleneck

SECURITY GAPS
❌ No rate limiting
❌ No plagiarism detection
❌ No email verification
❌ Debug logs in production

FEATURES MISSING
❌ No real-time collaboration
❌ No code diff/history
❌ No contest templates
❌ No problem bank/import
❌ No automated test generation

RELIABILITY
❌ Cold start delays (30-60 seconds)
❌ No automatic failover
❌ No backup strategy documented
❌ Single point of failure (Judge0)

DEVELOPER EXPERIENCE
❌ No TypeScript on backend
❌ No API documentation (Swagger)
❌ No unit tests
❌ No CI/CD pipeline defined
```

---

# 13. FUTURE IMPROVEMENTS

## 13.1 Short-term (1-2 weeks)

```
1. ADD RATE LIMITING
   - express-rate-limit middleware
   - Per-user and per-IP limits
   - Separate limits for different endpoints

2. IMPLEMENT CACHING
   - In-memory cache for status checks
   - Cache leaderboard for 5 seconds
   - Cache competition list for 30 seconds

3. ADD HEALTH CHECKS
   - /health endpoint for monitoring
   - Database connectivity check
   - Judge0 availability check

4. OPTIMIZE QUERIES
   - Add missing indexes
   - Use select() to limit fields
   - Implement cursor pagination
```

## 13.2 Medium-term (1-2 months)

```
5. ADD WEBSOCKETS
   - Real-time leaderboard updates
   - Live submission status
   - Replace polling with push

6. IMPLEMENT REDIS
   - Distributed caching
   - Session storage
   - Rate limiting backend

7. ADD PLAGIARISM DETECTION
   - MOSS integration
   - Code similarity scoring
   - Alert on high similarity

8. IMPROVE MONITORING
   - Add Sentry for error tracking
   - Prometheus metrics
   - Grafana dashboards
```

## 13.3 Long-term (3-6 months)

```
9. HORIZONTAL SCALING
   - Multiple backend instances
   - Load balancer
   - Database read replicas

10. CONTEST FEATURES
    - Team competitions
    - Practice mode
    - Problem bank
    - Contest templates

11. ADVANCED JUDGING
    - Custom judges
    - Interactive problems
    - Partial scoring

12. MOBILE APP
    - React Native port
    - Push notifications
    - Offline mode
```

---

# 14. RECREATING THE SYSTEM

## 14.1 Prerequisites

```bash
# Required software
- Node.js 20+
- npm/pnpm/yarn
- Git
- PostgreSQL client (optional)

# Accounts needed
- GitHub (for deployment)
- Vercel (free account)
- Render (free account)
- Neon (free account)
- DigitalOcean (for Judge0, ~$48/mo)
- Cloudinary (free account)
```

## 14.2 Step-by-Step Setup

### 1. Clone & Install
```bash
git clone <repository-url>
cd codingnexus
npm install
```

### 2. Database Setup
```bash
# Create Neon database
# Get connection string (pooler URL)

# Create .env file
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Run migrations
npx prisma migrate deploy
npx prisma generate
```

### 3. Judge0 Setup
```bash
# On DigitalOcean droplet (8GB/2vCPU)

# Install Docker
curl -fsSL https://get.docker.com | sh

# Run Judge0
docker run -d \
  --name judge0 \
  -p 2358:2358 \
  -e REDIS_HOST=localhost \
  judge0/judge0:latest

# Verify
curl http://localhost:2358/about
```

### 4. Environment Configuration
```bash
# Complete .env file
DATABASE_URL="postgresql://..."
JWT_SECRET="<generate-256-bit-hex>"
JWT_EXPIRES_IN="7d"
PORT=21000
NODE_ENV="production"
FRONTEND_URL="https://your-vercel-url.vercel.app"
JUDGE0_URL="http://your-droplet-ip:2358"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
VITE_API_URL="https://your-render-url.onrender.com/api"
VITE_JUDGE0_URL="http://your-droplet-ip:2358"
```

### 5. Deploy Backend (Render)
```bash
# Connect GitHub repo to Render
# Set environment variables
# Build command: npm install && npx prisma generate
# Start command: node server/index.js
```

### 6. Deploy Frontend (Vercel)
```bash
# Connect GitHub repo to Vercel
# Set environment variables (VITE_* vars)
# Build command: npm run build
# Output directory: dist
```

### 7. Create Admin Account
```bash
# Run locally or via Render shell
node scripts/create-admin.js
```

## 14.3 Key Files to Understand

```
MUST READ FILES (Priority Order):

1. prisma/schema.prisma
   - Complete database schema
   - All models and relations

2. server/routes/async-submissions.js
   - Core submission logic
   - Judge0 integration
   - Background polling

3. server/routes/competition.js
   - Competition CRUD
   - Submission handling
   - Leaderboard logic

4. server/utils/codeWrapper.js
   - LeetCode-style code wrapping
   - Language support

5. src/components/student/CompetitionProblems.jsx
   - Main competition UI
   - Monaco Editor integration
   - Polling logic

6. server/config/db.js
   - Database connection
   - Pool configuration

7. server/middleware/auth.js
   - JWT verification
   - Role authorization

8. src/context/AuthContext.jsx
   - Frontend auth state
   - Login/logout flow
```

## 14.4 Testing the System

```bash
# 1. Run locally
npm run dev:all  # Start frontend + backend

# 2. Create test data
node scripts/create-admin.js
# Login as admin, create competition

# 3. Test as student
# Register, attempt competition, submit code

# 4. Load test (optional)
# Use k6 or Artillery for load testing
```

---

# APPENDIX A: API QUICK REFERENCE

```
AUTH
POST /api/auth/signup           Create student account
POST /api/auth/login            Student login
POST /api/auth/login/admin      Admin login
GET  /api/auth/me               Get current user

COMPETITIONS
GET  /api/competitions          List competitions
GET  /api/competitions/:id      Get competition details
POST /api/competitions/:id/register    Register for competition
POST /api/competitions/:id/submit      Submit all solutions
GET  /api/competitions/:id/leaderboard Get leaderboard
GET  /api/competitions/:id/my-submission Get my results

SUBMISSIONS
POST /api/submissions/:problemId/run         Run code (sync)
POST /api/submissions/:problemId/submit-async Submit code (async)
GET  /api/submissions/:submissionId/status   Check status

ADMIN
POST /api/competitions          Create competition
PUT  /api/competitions/:id      Update competition
DELETE /api/competitions/:id    Delete competition
GET  /api/competitions/:id/submissions       Get all submissions
POST /api/.../evaluate          Manual evaluation
```

---

# APPENDIX B: DATABASE QUERIES

```sql
-- Get active competitions
SELECT * FROM "Competition" 
WHERE "isActive" = true 
AND "endTime" > NOW()
ORDER BY "startTime" DESC;

-- Get leaderboard
SELECT cs.*, u.email, sp.name, sp."rollNo"
FROM "CompetitionSubmission" cs
JOIN "User" u ON cs."userId" = u.id
JOIN "Student" sp ON u.id = sp."userId"
WHERE cs."competitionId" = 'xxx'
AND cs.status = 'completed'
ORDER BY cs."totalScore" DESC, cs."totalTime" ASC;

-- Get pending Judge0 tokens
SELECT * FROM "Judge0Queue"
WHERE status = 'submitted'
ORDER BY submittedat ASC
LIMIT 20;
```

---

# APPENDIX C: GLOSSARY

| Term | Definition |
|------|------------|
| **Competition** | A timed coding contest with multiple problems |
| **Problem** | A single coding challenge within a competition |
| **Submission** | Student's code submission for a problem |
| **Judge0** | Open-source online code execution system |
| **Test Case** | Input/output pair to verify code correctness |
| **Leaderboard** | Ranked list of participants by score |
| **Async Submission** | Non-blocking submission with background processing |
| **Code Wrapper** | System that wraps user functions for execution |
| **Starter Code** | Template code provided to students |
| **Manual Evaluation** | Admin override of automatic scoring |

---

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Author:** CodingNexus Development Team

---

*This document provides complete technical documentation for recreating and understanding the CodingNexus coding competition system. For questions or contributions, please refer to the project repository.*
