# Docker Troubleshooting Quick Reference

## Port Binding Corrupted After `docker compose up -d --build`

**Symptom:** API calls return `text/html` instead of JSON. Frontend SPA fallback catches the request because the backend port isn't exposed.

**Check:**
```bash
docker port codingnexus-app
# If empty or missing 3000/tcp -> 0.0.0.0:3000, port binding is broken
```

**Root Cause:** The container's `NetworkSettings.Ports` becomes empty after a conflict (e.g., host port already in use during container start). Docker doesn't recover the binding on its own.

**Fix:**
```bash
docker stop codingnexus-app
docker rm codingnexus-app
cd /home/apsit/projects/codingnexus/Mcodingnexus
docker compose up -d app
```

**Quick diagnostic commands:**
```bash
# Check if container is exposing ports
docker port codingnexus-app

# Check host port binding state
docker inspect codingnexus-app --format '{{json .NetworkSettings.Ports}}'

# Test endpoint locally
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```
