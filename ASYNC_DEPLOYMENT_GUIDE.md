# Async Submission System - Deployment & Operations Guide

## System Architecture

```
Student Submits Code (Frontend)
    ↓
POST /api/submissions/:problemId/submit-async (No Wait)
    ↓
✅ IMMEDIATE Response: "Code Submitted!"
    ↓
Backend Async Processing (Background)
    ├─ Submits to Judge0 with wait=false
    ├─ Gets token immediately  
    └─ Saves token to database
    ↓
Frontend Polling (Smart)
    ├─ Status check: GET /api/submissions/:submissionId/status
    ├─ Exponential backoff (3s, 4s, 5s... up to 10s)
    └─ Stops when results ready
    ↓
Results Displayed to Student
```

## Database Status - FIXED ✅

| Issue | Status | Solution |
|-------|--------|----------|
| Connection Pool Exhaustion | ✅ FIXED | Reduced max connections from 20 to 5 |
| Slow Connections | ✅ FIXED | Timeout: 3 seconds (fail fast) |
| Polling Spam | ✅ FIXED | **Disabled by default** (see below) |
| Stale Connections | ✅ FIXED | Auto-recycle after 100 uses |
| On-Demand Fallback | ✅ ADDED | New endpoint for manual result fetching |

## Deployment Configurations

### Production (Render Free Tier) - RECOMMENDED

**File**: `.env`

```bash
# Disable background polling (free tier)
ENABLE_POLLING=false

# Other settings
NODE_ENV=production
PORT=21000
DATABASE_URL=your_neon_url
```

**Why disabled?**
- Render free tier: dyno sleeps after 15 min inactivity
- Neon free tier: limited connection pool
- Polling every 10s × 200 students = 2000 requests/hour = database overload
- **Better approach**: On-demand fetching (students refresh to check status)

**How students get results:**
1. Submit code → "✅ Submitted!" modal
2. Frontend polls with exponential backoff
3. When timeout, can use: "Check Results" button to fetch on-demand
4. Results are stored in Judge0 forever (tokens don't expire)

### Enterprise (Paid Tiers) - OPTIONAL

**File**: `.env`

```bash
# Enable background polling (paid tier)
ENABLE_POLLING=true
POLL_INTERVAL=30000  # More conservative: 30 seconds instead of 10

NODE_ENV=production
PORT=21000
DATABASE_URL=your_dedicated_db_url
```

**Benefits:**
- Automatic results without user refresh
- Better UX for students
- Only viable with connection pooling service like PgBouncer

## What Happens When...

### Database Goes Down (Production)

✅ **Submissions are SAFE**
- Code is sent to Judge0 immediately
- Token is saved (even if save fails) - Judge0 keeps it
- Results are recoverable later

❌ **Polling job stops**
- Only if enabled
- Frontend falls back to on-demand fetching
- Students can refresh to check status

✅ **On-demand endpoint still works**
- Fetches directly from Judge0
- Doesn't require database connection
- Button: "Manually check results"

### Student Takes Test After 3 Days

✅ **Judge0 tokens persist**
- Judge0 never deletes results
- Tokens are valid permanently
- Can fetch results even weeks later

✅ **On-demand endpoint works**
- Queries Judge0 by token
- Returns results from 3 days ago
- Students can see old results anytime

✅ **No data loss**
- Code stored in database
- Judge0 tokens stored in database
- Results retrievable even if polling disabled

## Monitoring & Health Checks

### Health Check Endpoint

```bash
GET /api/health
```

**Returns:**
```json
{
  "status": "healthy",
  "database": "healthy",
  "timestamp": "2026-02-14T10:00:00Z"
}
```

### Database Health

```javascript
import prisma, { checkDatabaseHealth } from './server/config/db.js';

const health = await checkDatabaseHealth();
// { status: 'healthy', timestamp: ... }
```

## Scaling for 200 Students

### Scenario: 200 students submit simultaneously

**With polling DISABLED (Recommended)**
- ✅ All 200 submissions saved to Judge0 immediately
- ✅ All 200 tokens stored in database
- ✅ Each student sees "Submitted!" within 2-3 seconds
- ✅ Students poll on-demand (no server load)
- ✅ Backend uses only 5 database connections

**Estimated load:**
- Database: ~5 connections × 20 queries = low load
- Judge0: 200 submissions/minute = well within limits
- Render: No background job drains = server stays awake

### Scenario: With polling ENABLED on free tier

- ❌ Polling job checks every 10 seconds
- ❌ 200 students × polling every 10s = 2000 queries/hour
- ❌ Neon free tier: 100 connections max, shared pool
- ❌ Render free tier: Spins up dyno every check
- ❌ **Result: Database overload, timeouts, 503 errors**

## .env Configuration Guide

```bash
# REQUIRED
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=21000
NODE_ENV=development|production

# OPTIONAL - Polling Configuration
ENABLE_POLLING=false              # Disabled for free tier
POLL_INTERVAL=15000              # 15 seconds (only if enabled)

# OPTIONAL - Judge0 Integration
JUDGE0_URL=http://64.227.149.20:2358  # Custom Judge0 instance
```

## Testing Before Deployment

```bash
# Test database connection
node test-db-connection.mjs
# Output: ✅ All database tests passed!

# Test async endpoints
curl -X POST http://localhost:21000/api/submissions/test-problem/submit-async \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"code":"print(1)","language":"python"}'
# Response: { "submissionId": "...", "status": "submitted" }

# Test health check
curl http://localhost:21000/api/health
# Response: { "status": "healthy", "database": "healthy" }
```

## Deployment Checklist

- [ ] Set `ENABLE_POLLING=false` in production `.env`
- [ ] Verify database connection: `node test-db-connection.mjs`
- [ ] Test async submission endpoints
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Vercel
- [ ] Monitor Judge0Queue table for submissions
- [ ] Set up uptime monitoring (optional health check endpoint)
- [ ] Create "Check Results" button for manual result fetching

## Troubleshooting

### "Database connection unavailable"

**Cause**: Neon or Render database is down/unreachable

**Solution:**
- Check `.env` DATABASE_URL is correct
- Verify Neon database is not in sleep state
- Verify Render has network access to Neon
- On-demand endpoint may still work (tries Judge0 directly)

### "Polling job not running"

**Expected behavior** on free tier. To enable:

```bash
# Set in .env
ENABLE_POLLING=true
POLL_INTERVAL=30000  # More conservative for free tier
```

### Students see "Processing..." for too long

**Options:**
1. Increase polling frequency (if enabled)
2. Add "Manually Check" button that calls `/fetch-results`
3. Upgrade to paid database tier

### "Too many connections" error

**Cause**: Database connection pool is exhausted

**Solution:**
- Server auto-limits to 5 concurrent connections
- Check if multiple server instances running
- Restart Render dyno to reset connections
- Use PgBouncer for connection pooling (paid feature)

## Performance Metrics (Expected)

### With polling DISABLED (Recommended)

- Submission response time: 100-200ms
- Status check time: 50-100ms (if cached)
- Database queries per submission: 2-3
- Average Judge0 queue time: 2-5 seconds
- Backend CPU usage: <5% idle, <20% during submission spike
- Database connections: 1-5 (max 5)

### With polling ENABLED on free tier

- Polling requests per hour: 2000+
- Database connection pool: Exhausted
- Backend CPU: 100% (constant polling)
- Judge0 rate limit: At risk
- **Not recommended** for free tier

## Support & Questions

If students face issues:
1. Check if polling is enabled (may be slow)
2. Have them refresh page to retry polling
3. Provide on-demand fetch endpoint as fallback
4. Check database status via health endpoint
5. Verify Judge0 is online

---

**Last Updated**: February 14, 2026
**Status**: Production Ready ✅
**Tested With**: Neon PostgreSQL + Judge0 CE + Render + Vercel
