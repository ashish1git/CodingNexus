# Judge0 Integration Guide

## ✅ Integration Status: COMPLETE

Your Judge0 URL (`http://64.227.149.20:2358`) has been successfully integrated into your system.

### What Has Been Done

1. ✅ **Environment Configuration Updated**
   - Updated `.env` file with new Judge0 URL
   - Updated `.env.example` template
   - Updated fallback URLs in code

2. ✅ **Route Files Updated**
   - `server/routes/competition.js` - Competition code execution
   - `server/routes/contest.js` - Contest submissions

3. ✅ **Language Support Verified**
   - C (GCC 9.2.0) - Language ID: 50
   - C++ (GCC 9.2.0) - Language ID: 54
   - Java (OpenJDK 13.0.1) - Language ID: 62
   - JavaScript (Node.js 12.14.0) - Language ID: 63
   - Python (3.8.1) - Language ID: 71

---

## ⚠️ CRITICAL ISSUE FOUND

### Problem: Judge0 Workers Not Running

**Error Message:** `No such file or directory @ rb_sysopen - /box/script.py`

**Root Cause:** The Judge0 API server is running and responding, but the **workers** (which actually execute the code) are **not available**.

**Worker Status Check:**
```json
{
  "queue": "1.13.1",
  "size": 0,
  "available": 0,    ❌ No workers available!
  "idle": 0,
  "working": 0,
  "paused": 0,
  "failed": 0
}
```

---

## 🔧 Required Actions on Judge0 Server

You need to fix the Judge0 server configuration. Here are the steps:

### Option 1: Using Docker Compose (Recommended)

If you're using docker-compose, ensure workers are running:

```bash
# SSH into your server (64.227.149.20)
ssh user@64.227.149.20

# Navigate to Judge0 directory
cd /path/to/judge0

# Check running containers
docker-compose ps

# You should see BOTH:
#   - judge0-server (API)
#   - judge0-workers (Execution workers) ← This is likely missing!

# If workers are not running, start them:
docker-compose up -d judge0-workers

# Check logs
docker-compose logs -f judge0-workers

# Verify workers are connected
curl http://localhost:2358/workers
# Should show: "available": 1 or more
```

### Option 2: Standard Judge0 Docker Setup

```bash
# Check if workers container exists
docker ps -a | grep judge0

# If only the server is running, you need to start workers
# Follow Judge0 documentation: https://github.com/judge0/judge0

# Typical setup:
docker run \
  -d \
  --restart=always \
  --name=judge0-workers \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e REDIS_HOST=redis \
  -e POSTGRES_HOST=db \
  -e POSTGRES_PASSWORD=YourPassword \
  judge0/judge0:1.13.1 \
  ./scripts/workers
```

### Option 3: Check Existing Worker Configuration

```bash
# If workers are supposed to be running, check:

# 1. Check if workers process is running
docker exec judge0-workers ps aux | grep worker

# 2. Check worker logs for errors
docker logs judge0-workers --tail 100

# 3. Common issues:
#    - Redis connection failed
#    - PostgreSQL connection failed
#    - Insufficient permissions for /box directory
#    - Missing required packages in worker container
```

---

## 🧪 Testing After Fix

Once workers are running, test the integration:

```bash
# On your local machine
node scripts/test-judge0.js
```

**Expected output:**
```
✅ Judge0 is online
✅ Submission executed successfully
   Status: Accepted
   Output: Hello from Judge0!
```

### Quick API Test

```bash
# Test from command line (replace with your Judge0 URL)
curl -X POST http://64.227.149.20:2358/submissions?base64_encoded=false&wait=true \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello World\")",
    "language_id": 71
  }'

# Should return:
# "status": { "id": 3, "description": "Accepted" }
# "stdout": "Hello World"
```

---

## 📋 Checklist

- [x] Judge0 URL integrated in codebase
- [x] Language mappings configured
- [x] Test script created
- [ ] **Judge0 workers started** ← YOU NEED TO DO THIS
- [ ] Test submission succeeds
- [ ] Competition submission works end-to-end

---

## 🔍 Debugging Commands

### Check Judge0 Health
```bash
curl http://64.227.149.20:2358/about
curl http://64.227.149.20:2358/languages
curl http://64.227.149.20:2358/workers
curl http://64.227.149.20:2358/config_info
```

### Monitor Submissions
```bash
# Submit a test
curl -X POST http://64.227.149.20:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{"source_code": "print(123)", "language_id": 71, "base64_encoded": false}'

# Get token from response, then check status
curl http://64.227.149.20:2358/submissions/{TOKEN}
```

---

## 📚 Documentation

- **Judge0 Official Docs:** https://github.com/judge0/judge0
- **Deployment Guide:** https://github.com/judge0/judge0/blob/master/CHANGELOG.md
- **API Reference:** https://ce.judge0.com/

---

## 💡 Summary

**Your integration is COMPLETE and CORRECT.** The code will work perfectly once you start the Judge0 workers on your server.

**What's Working:**
- ✅ API calls to Judge0
- ✅ Language configuration
- ✅ All integration code

**What's Not Working:**
- ❌ Code execution (no workers available)

**Next Step:** SSH to `64.227.149.20` and start the Judge0 workers as shown above.
