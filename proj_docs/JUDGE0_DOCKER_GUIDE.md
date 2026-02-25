# Judge0 Docker Setup & Commands Guide

## 🐳 Current Status

**Judge0 URL:** `http://64.227.149.20:2358`

### Quick Status Check
```bash
# From your local machine
curl http://64.227.149.20:2358/about
curl http://64.227.149.20:2358/workers
```

**Current Issue:** Workers are NOT running (empty array `[]`)

---

## 🔧 Docker Commands (Run on Server)

### SSH into Server
```bash
ssh user@64.227.149.20
```

### Check Docker Status

```bash
# List all running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Check Judge0 specific containers
docker ps | grep judge0

# Expected containers:
#   - judge0-server (API server)
#   - judge0-workers (Code execution workers) ← THIS IS MISSING!
#   - judge0-db (PostgreSQL)
#   - judge0-redis (Redis cache)
```

### Start Judge0 Stack

If using docker-compose:

```bash
# Navigate to Judge0 directory
cd /path/to/judge0

# Start all services
docker-compose up -d

# Start only workers
docker-compose up -d judge0-workers

# Check status
docker-compose ps
```

If using standalone Docker:

```bash
# Start workers container
docker start judge0-workers

# Or run new workers container
docker run -d \
  --name judge0-workers \
  --restart always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e REDIS_HOST=your-redis-host \
  -e POSTGRES_HOST=your-db-host \
  -e POSTGRES_PASSWORD=your-password \
  judge0/judge0:1.13.1 \
  ./scripts/workers
```

### Monitor Workers

```bash
# View worker logs (real-time)
docker-compose logs -f judge0-workers

# View last 100 lines
docker-compose logs --tail=100 judge0-workers

# Check if workers are processing
docker-compose exec judge0-workers ps aux

# Check worker process
docker-compose exec judge0-workers top
```

### Troubleshooting

```bash
# Restart workers
docker-compose restart judge0-workers

# Restart entire stack
docker-compose restart

# Stop and remove workers, then recreate
docker-compose stop judge0-workers
docker-compose rm -f judge0-workers
docker-compose up -d judge0-workers

# Check worker environment variables
docker-compose exec judge0-workers env

# Check Redis connection
docker-compose exec judge0-workers redis-cli -h redis ping

# Check PostgreSQL connection
docker-compose exec judge0-workers pg_isready -h db
```

### View Logs

```bash
# All services
docker-compose logs --tail=50

# Only errors
docker-compose logs --tail=50 | grep -i error

# Only workers
docker-compose logs judge0-workers

# Follow logs (Ctrl+C to exit)
docker-compose logs -f
```

### Health Checks

```bash
# Check Redis
docker-compose exec redis redis-cli ping
# Should return: PONG

# Check PostgreSQL
docker-compose exec db pg_isready
# Should return: accepting connections

# Check API
curl http://localhost:2358/about

# Check workers (from inside server)
curl http://localhost:2358/workers
# Should NOT be empty array
```

---

## 📋 Typical Judge0 docker-compose.yml

Your Judge0 setup should have something like this:

```yaml
version: '3.7'

services:
  judge0-server:
    image: judge0/judge0:1.13.1
    volumes:
      - ./judge0.conf:/judge0.conf:ro
    ports:
      - "2358:2358"
    privileged: true
    restart: always
    depends_on:
      - db
      - redis

  judge0-workers:
    image: judge0/judge0:1.13.1
    command: ["./scripts/workers"]
    volumes:
      - ./judge0.conf:/judge0.conf:ro
    privileged: true
    restart: always
    depends_on:
      - db
      - redis

  db:
    image: postgres:13
    environment:
      POSTGRES_PASSWORD: YourSecurePassword
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:6
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

---

## 🎯 Step-by-Step Fix

### Step 1: Locate Judge0 Installation
```bash
# Find docker-compose.yml
find / -name "docker-compose.yml" 2>/dev/null | grep judge0

# Or check common locations
ls /opt/judge0/
ls /home/*/judge0/
ls /var/www/judge0/
```

### Step 2: Check Configuration
```bash
cd /path/to/judge0
cat docker-compose.yml
```

### Step 3: Start Workers
```bash
docker-compose up -d judge0-workers
```

### Step 4: Verify Workers Started
```bash
# Should see judge0-workers container
docker ps | grep workers

# Check logs for errors
docker-compose logs judge0-workers

# Test from API
curl http://localhost:2358/workers
# Should return: [{"queue":"1.13.1","size":0,"available":1,...}]
```

### Step 5: Test Submission
```bash
curl -X POST http://localhost:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello\")",
    "language_id": 71,
    "base64_encoded": false,
    "wait": true
  }'

# Should return status "Accepted" with output "Hello"
```

---

## 🚨 Common Issues

### Issue 1: Workers Container Missing
**Symptom:** `docker ps` doesn't show judge0-workers

**Fix:**
```bash
docker-compose up -d judge0-workers
```

### Issue 2: Workers Exit Immediately
**Symptom:** Container starts but exits within seconds

**Fix:**
```bash
# Check exit reason
docker-compose logs judge0-workers

# Common causes:
# - Redis connection failed
# - Database connection failed
# - Configuration file missing
# - Permission issues
```

### Issue 3: Redis Connection Failed
**Symptom:** Logs show "Could not connect to Redis"

**Fix:**
```bash
# Verify Redis is running
docker ps | grep redis

# Check Redis hostname in config
docker-compose exec judge0-workers env | grep REDIS

# Start Redis if stopped
docker-compose up -d redis
```

### Issue 4: Database Connection Failed
**Symptom:** Logs show "Could not connect to PostgreSQL"

**Fix:**
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Start if stopped
docker-compose up -d db

# Check connection
docker-compose exec db pg_isready
```

### Issue 5: Permission Denied (/box directory)
**Symptom:** Submissions fail with "Permission denied"

**Fix:**
```bash
# Workers need privileged mode
# In docker-compose.yml, ensure:
privileged: true
```

---

## 🧪 Testing Commands

### Test from Local Machine
```powershell
# PowerShell
node scripts/evaluate-judge0-docker.js
node scripts/test-judge0-comprehensive.js
```

### Test from Server
```bash
# Simple test
curl -X POST http://localhost:2358/submissions?wait=true \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(123)","language_id":71}'
```

---

## 📊 Monitoring

### Real-time Worker Activity
```bash
# Watch worker count
watch -n 1 'curl -s http://localhost:2358/workers | jq'

# Monitor logs
docker-compose logs -f judge0-workers | grep -i "processing\|completed\|error"
```

### Performance Metrics
```bash
# Container stats
docker stats judge0-workers

# System resources
docker-compose exec judge0-workers top
```

---

## 🔐 Security Notes

1. **Never expose Judge0 API publicly without authentication**
   - Use reverse proxy (nginx)
   - Add API key authentication
   - Rate limiting

2. **Firewall Configuration**
   ```bash
   # Allow only from your application server
   ufw allow from YOUR_APP_SERVER_IP to any port 2358
   ```

3. **Keep Judge0 Updated**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

---

## 📚 Resources

- **Judge0 GitHub:** https://github.com/judge0/judge0
- **Documentation:** https://github.com/judge0/judge0/blob/master/README.md
- **API Docs:** https://ce.judge0.com/
- **Discord:** Join Judge0 community for support

---

## ✅ Verification Checklist

- [ ] SSH access to server working
- [ ] Docker and docker-compose installed
- [ ] Judge0 server responding to API calls
- [ ] Redis container running
- [ ] PostgreSQL container running
- [ ] **Workers container running** ← CRITICAL!
- [ ] Workers available (not 0)
- [ ] Test submission succeeds
- [ ] Integration tests pass

---

## 🎯 Next Steps

1. SSH to your server: `ssh user@64.227.149.20`
2. Navigate to Judge0 directory
3. Run: `docker-compose up -d judge0-workers`
4. Check: `curl http://localhost:2358/workers`
5. Test locally: `node scripts/evaluate-judge0-docker.js`

Once workers are running, your system will be fully operational! 🚀
