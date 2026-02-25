# Contest Submission System - Testing Guide

## Overview
This backend implements a strict contest submission system with Judge0 integration.

## API Endpoints

### 1. Submit Code (Student)
```bash
POST /api/contest/submit
Authorization: Bearer <student_token>

Body:
{
  "sourceCode": "your code here",
  "languageId": 71  // 50=C, 54=C++, 62=Java, 71=Python
}

Response:
{
  "success": true,
  "message": "Submission received successfully. Results will be available in 20-30 minutes.",
  "submission": {
    "token": "abc123-xyz789",
    "language": "Python (3.8.1)",
    "submittedAt": "2026-01-08T10:30:00.000Z",
    "estimatedResultsAt": "2026-01-08T10:50:00.000Z"
  }
}
```

### 2. Get All Results (Admin/After Contest)
```bash
GET /api/contest/results
Authorization: Bearer <token>

Response:
{
  "success": true,
  "totalSubmissions": 150,
  "completed": 148,
  "pending": 2,
  "results": [
    {
      "userId": "user-123",
      "language": "Python (3.8.1)",
      "status": "Accepted",
      "verdict": "Accepted",
      "time": "0.05",
      "memory": 3456,
      "submittedAt": "2026-01-08T10:30:00.000Z"
    }
  ]
}
```

### 3. Get My Result (Student)
```bash
GET /api/contest/my-result
Authorization: Bearer <student_token>

Response:
{
  "success": true,
  "submission": {
    "language": "Python (3.8.1)",
    "submittedAt": "2026-01-08T10:30:00.000Z",
    "status": "Accepted",
    "verdict": "Accepted",
    "time": "0.05",
    "memory": 3456
  }
}
```

### 4. Get Contest Stats (Admin)
```bash
GET /api/contest/stats
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "stats": {
    "totalSubmissions": 150,
    "maxAllowedSubmissions": 200,
    "remainingSlots": 50,
    "languageBreakdown": {
      "Python (3.8.1)": 80,
      "C++ (GCC 9.2.0)": 45,
      "Java (OpenJDK 13.0.1)": 15,
      "C (GCC 9.2.0)": 10
    }
  }
}
```

## Testing with cURL

### Test 1: Submit Code (should work once)
```bash
# Get your auth token first by logging in
TOKEN="your_jwt_token_here"

# Submit Python code
curl -X POST http://localhost:5000/api/contest/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "print(\"Hello World\")",
    "languageId": 71
  }'
```

### Test 2: Try to submit again (should reject)
```bash
# Same request - should return 403 Forbidden
curl -X POST http://localhost:5000/api/contest/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "print(\"Second try\")",
    "languageId": 71
  }'
```

### Test 3: Try invalid language (should reject)
```bash
curl -X POST http://localhost:5000/api/contest/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "console.log(\"test\")",
    "languageId": 63
  }'
```

### Test 4: Get my result
```bash
curl http://localhost:5000/api/contest/my-result \
  -H "Authorization: Bearer $TOKEN"
```

### Test 5: Get all results (wait 20-30 min after submissions)
```bash
curl http://localhost:5000/api/contest/results \
  -H "Authorization: Bearer $TOKEN"
```

### Test 6: Check contest stats
```bash
curl http://localhost:5000/api/contest/stats \
  -H "Authorization: Bearer $TOKEN"
```

## Testing Judge0 Directly

### Check available languages
```bash
curl http://4.247.146.10/languages
```

### Test submission
```bash
curl -X POST http://4.247.146.10/submissions?base64_encoded=false&wait=false \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello Judge0\")",
    "language_id": 71
  }'
```

### Check submission result (use token from above)
```bash
curl http://4.247.146.10/submissions/{token}?base64_encoded=false
```

## Production Checklist

### Database Migration
Replace in-memory Map with Prisma:

1. Create ContestSubmission model in `prisma/schema.prisma`:
```prisma
model ContestSubmission {
  id            String   @id @default(uuid())
  userId        String
  contestId     String   // if you have multiple contests
  judge0Token   String   @unique
  languageId    Int
  sourceCode    String   @db.Text
  status        String   @default("queued")
  result        Json?
  time          Float?
  memory        Int?
  submittedAt   DateTime @default(now())
  gradedAt      DateTime?
  
  user          User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, contestId]) // One submission per user per contest
  @@index([contestId])
}
```

2. Run migration:
```bash
npx prisma migrate dev --name add_contest_submissions
```

3. Replace Map operations in `server/routes/contest.js` with Prisma queries (see TODO comments)

### Security Enhancements
- [ ] Add rate limiting (express-rate-limit)
- [ ] Add contest start/end time validation
- [ ] Add admin-only middleware to `/results` and `/stats`
- [ ] Validate source code size limits
- [ ] Add CSRF protection
- [ ] Use environment variable for Judge0 API key if needed

### Monitoring
- [ ] Add logging (winston or pino)
- [ ] Set up error tracking (Sentry)
- [ ] Monitor Judge0 API availability
- [ ] Track submission queue depth
- [ ] Alert on high failure rates

## Troubleshooting

### "Judge0 submission failed"
- Check if Judge0 is running: `curl http://4.247.146.10/languages`
- Check Docker containers on VM: `docker ps`
- Check Judge0 logs: `docker-compose logs judge0`

### "You have already submitted"
- This is expected behavior (one submission per user)
- Clear in-memory Map with server restart for testing
- Or implement admin endpoint to reset submissions

### Results stuck in "Processing"
- Judge0 worker might be slow or crashed
- Check worker container: `docker-compose logs worker`
- Increase WORKER_CONCURRENCY in docker-compose.yml
- Scale workers: `docker-compose up -d --scale worker=3`

## Architecture Notes

### Why async submissions?
- Judge0 compilation/execution can take 5-30 seconds per submission
- With 200 students, synchronous blocking would take 16-100 minutes sequentially
- Async + workers allows parallel processing in background

### Why polling instead of webhooks?
- Simpler architecture (no public webhook endpoint needed)
- More reliable for batch processing
- Acceptable for 20-30 minute delay requirement
- Can be triggered by cron job or manual admin action

### Where to add leaderboard?
See comments in `/api/contest/results` endpoint:
- Calculate scores from results
- Sort by score DESC, time ASC
- Store in Redis sorted set for real-time updates
- Push to frontend via WebSocket/SSE
