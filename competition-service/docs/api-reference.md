# Competition Service — API Reference

Base URL: `http://localhost:3001/api/competitions`
All endpoints (except `/server-time` and the health check) require `Authorization: Bearer <token>`.

---

## Health Check

### GET /health
Returns service status.

**Response:**
```json
{ "status": "ok", "service": "competition-service", "timestamp": "2026-08-20T..." }
```

---

## Student Endpoints

### GET /api/competitions
List competitions with optional filters.

**Auth:** Required (any role)  
**Query Params:** `status` (ongoing | upcoming | past), `difficulty`

---

### GET /api/competitions/server-time
Returns server time for client countdown sync. No auth required.

**Response:** `{ "serverTime": "2026-08-20T..." }`

---

### GET /api/competitions/:id
Get a single competition with its problems.

**Auth:** Required (any role)

---

### GET /api/competitions/:id/timer
Timer sync — calibrates client clock against server time.

**Auth:** Required

---

### GET /api/competitions/:id/my-submission
Get the current user's submission details for a competition.

**Auth:** Required

---

### GET /api/competitions/:id/leaderboard
Get the competition leaderboard.

**Auth:** Required

---

### POST /api/competitions/:id/register
Register the current user for a competition.

**Auth:** Required

---

### POST /api/competitions/:id/submit
Submit solutions for all problems. Triggers Judge0 evaluation.

**Auth:** Required  
**Body:** `{ solutions: [...], violationLog: [...] }`

---

### PUT /api/competitions/:id/save-code
Auto-save draft code for a problem.

**Auth:** Required  
**Body:** `{ problemId, code, language }`

---

### POST /api/competitions/:id/problems/:problemId/acknowledge-review
Student acknowledges an evaluator's review (clears notification).

**Auth:** Required

---

### DELETE /api/competitions/:id/drafts
Clear all draft codes for the current user in a competition.

**Auth:** Required

---

## Admin Endpoints

All admin endpoints require role `admin`, `subadmin`, or `superadmin`.

### POST /api/competitions
Create a new competition.

**Auth:** admin/subadmin/superadmin + `manageCompetitions` permission  
**Body:** Competition object with problems array

---

### PUT /api/competitions/:id
Update an existing competition.

**Auth:** admin/subadmin/superadmin + `manageCompetitions` permission

---

### DELETE /api/competitions/:id
Delete a competition.

**Auth:** admin/subadmin/superadmin + `deleteCompetitions` permission

---

### GET /api/competitions/:id/submissions
Get all student submissions for a competition.

**Auth:** admin/subadmin/superadmin + `viewCompetitionSubmissions` permission

---

### PUT /api/competitions/:id/submissions/:submissionId/incomplete
Mark a submission as incomplete so the student can resubmit.

**Auth:** admin/subadmin/superadmin + `manageCompetitionSubmissions` permission

---

### GET /api/competitions/:id/problems
Get all problems for a competition (for evaluation panel).

**Auth:** admin/subadmin/superadmin + `evaluateCompetitionSubmissions` permission

---

### GET /api/competitions/:competitionId/problems/:problemId/submissions
Get all student submissions for a specific problem.

**Auth:** admin/subadmin/superadmin + `evaluateCompetitionSubmissions` permission

---

### POST /api/competitions/:competitionId/problems/:problemId/submissions/:submissionId/evaluate
Save a manual evaluation for a submission.

**Auth:** admin/subadmin/superadmin + `evaluateCompetitionSubmissions` permission  
**Body:** `{ marks, comments }`

---

### GET /api/competitions/:competitionId/problems/:problemId/submissions/:submissionId/history
Get evaluation history for a submission.

**Auth:** admin/subadmin/superadmin + `evaluateCompetitionSubmissions` permission

---

### GET /api/competitions/:competitionId/evaluations
Get all evaluations for a competition.

**Auth:** admin/subadmin/superadmin + `evaluateCompetitionSubmissions` permission

---

### GET /api/competitions/:competitionId/evaluator-activity
Get evaluator activity summary.

**Auth:** admin/subadmin/superadmin + `evaluateCompetitionSubmissions` permission

---

## Error Responses

All errors follow the same shape:

```json
{
  "success": false,
  "error": "Human-readable message"
}
```

| HTTP Status | Meaning |
|-------------|---------|
| 401 | No token / invalid token |
| 403 | Insufficient role or permission |
| 404 | Resource not found |
| 500 | Internal server error |
