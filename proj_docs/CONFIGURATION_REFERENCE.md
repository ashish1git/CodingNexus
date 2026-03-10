# Configuration Files Reference - No Hardcoding

This document explains all configuration files and how to properly customize them without hardcoding values.

---

## 🎯 Configuration Hierarchy

```
GitHub Secrets (highest priority)
        ↓
.env.docker file (local overrides)
        ↓
docker-compose.yml (defaults)
        ↓
nginx.conf (production values)
        ↓
Dockerfile (build-time defaults)
```

---

## 📋 File Configuration Guide

### 1. **docker-compose.yml** - Container Orchestration

**What's configured:**
- Port mappings: `80:80`, `443:443`, `3000:3000` (hardcoded but sensible defaults)
- Volume paths: `./nginx.conf`, `./dist`, `./ssl` (relative to project root)
- Service names: `app`, `nginx`, `codingnexus-network` (Docker internal, don't change)
- Database host: `host.docker.internal` (works for Docker on all platforms)

**What's NOT hardcoded:**
- ✅ All environment variables come from `.env.docker` or GitHub Secrets
- ✅ Secrets are never committed (in .gitignore)
- ✅ Service dependencies with health checks
- ✅ Networking is dynamic

**To customize ports:**
```yaml
ports:
  - "8080:3000"        # Change host port to 8080
  - "8000:80"          # Change nginx HTTP to 8000
  - "8443:443"         # Change nginx HTTPS to 8443
```

**To customize paths:**
```yaml
volumes:
  - /custom/path/nginx.conf:/etc/nginx/nginx.conf:ro
  - /custom/path/dist:/usr/share/nginx/html:ro
  - /custom/path/ssl:/etc/nginx/ssl:ro
```

---

### 2. **.env.docker** - Environment Variables Template

**Purpose:** Template file that shows all available configuration options
**Location:** Project root (in `.gitignore` - never commits secrets)

**Usage:**
- Copy to actual deployment server as `.env.docker`
- Fill in real values from GitHub Secrets
- Load via `env_file: .env.docker` in docker-compose

**Key sections:**
- ✅ Database URL (configurable: host/port/credentials)
- ✅ JWT Secret (must be generated per environment)
- ✅ Frontend URLs (per environment - dev/staging/prod)
- ✅ Third-party APIs (Cloudinary, Judge0, Brevo)
- ✅ Feature flags (polling, maintenance mode)

**Example production setup:**
```bash
# On server, create .env.docker with:
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@10.0.0.5:5432/codingnexus
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com
# ... etc
```

---

### 3. **nginx.conf** - Production Web Server

**What's hardcoded (sensible defaults):**
```nginx
upstream app {
    server app:3000;      # Docker compose service name (required)
}

listen 80;                # HTTP port
listen 443 ssl http2;     # HTTPS port
client_max_body_size 50M; # File upload limit
rate limiting: 10r/s, 30r/s  # Request limits
proxy timeouts: 60s each  # Connection timeouts
```

**What's NOT hardcoded:**
- ✅ SSL certificate paths (just need files in `./ssl` directory)
- ✅ Domain (uses `$host` variable - dynamic)
- ✅ Rate limiting is conservative defaults
- ✅ Proxy headers are standard (X-Real-IP, X-Forwarded-*, etc)

**To customize SSL paths:**
```nginx
# Edit these two lines:
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;

# Just copy your certs to ./ssl/cert.pem and ./ssl/key.pem
```

**To adjust rate limiting:**
```nginx
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;  # Change to 20r/s if needed
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;      # Change to 60r/s if needed
```

**To change file upload limit:**
```nginx
client_max_body_size 100M;  # Increase from 50M to 100M
```

---

### 4. **Dockerfile** - Container Image Build

**What's NOT hardcoded:**
```dockerfile
ARG VITE_API_BASE_URL
ARG VITE_API_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL:-https://api.yourdomain.com}
ENV VITE_API_URL=${VITE_API_URL:-https://api.yourdomain.com}
```

✅ These come from Docker build arguments in `deploy-docker.yml`
✅ Can be overridden at build time
✅ Defaults are fallbacks only

**To customize build args:**
```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://my-api.com \
  --build-arg VITE_API_URL=https://my-api.com \
  .
```

---

### 5. **.github/workflows/deploy-docker.yml** - CI/CD Pipeline

**What's hardcoded:** Nothing. All values come from GitHub Secrets

**Required secrets:**
```
SERVER_HOST              # Your server IP or domain
SERVER_USER              # SSH user (ubuntu, root, etc)
SSH_PRIVATE_KEY          # Private SSH key
DATABASE_URL             # PostgreSQL connection string
JWT_SECRET               # App JWT secret
FRONTEND_URL             # Frontend domain(s)
VITE_API_URL             # API endpoint URL
CLOUDINARY_*             # File upload credentials
BREVO_API_KEY            # Email service
JUDGE0_URL               # Code execution service
```

**Set secrets on GitHub:**
1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add each secret

---

## 🗂️ File Locations on Server

```
~/codingnexus/                    # APP_DIRECTORY from secrets
├── docker-compose.yml            # ← loaded from git
├── Dockerfile                     # ← loaded from git
├── nginx.conf                     # ← loaded from git
├── .env.docker                    # ← CREATED by CI/CD (not in git)
├── nginx/
├── dist/                          # ← frontend build output
├── server/                        # ← backend code
├── prisma/                        # ↑ all loaded from git
└── ssl/                           # ← SSL certs (NOT in git)
    ├── cert.pem                   # Copy your cert here
    └── key.pem                    # Copy your key here
```

---

## ✅ Checklist - No Hardcoding

- [ ] **docker-compose.yml** - Uses env vars for secrets ✓
- [ ] **.env.docker** - Template only, real values from GitHub Secrets ✓
- [ ] **nginx.conf** - Uses standard defaults, no secrets ✓
- [ ] **Dockerfile** - Build args from deployment workflow ✓
- [ ] **Deploy workflow** - All values from GitHub Secrets ✓
- [ ] **SSL certs** - In ./ssl/ directory (not in git) ✓
- [ ] **.env files** - All in .gitignore ✓
- [ ] **Secrets** - Never committed to repository ✓

---

## 🔐 Security Best Practices

1. **GitHub Secrets** (most secure)
   - All sensitive values stored here
   - Encrypted at rest
   - Only visible to authorized workflows

2. **.env.docker template** (example only)
   - Shows required variables
   - Contains placeholder values
   - Never contains real secrets

3. **Database credentials**
   - Use environment variable: `DATABASE_URL`
   - Never hardcode in config files
   - Use `host.docker.internal` for Docker → server connection

4. **SSL certificates**
   - Copy to `./ssl/` directory
   - Never commit to git
   - Referenced by nginx.conf (not hardcoded path)

5. **JWT Secret**
   - Generate unique per environment: `openssl rand -base64 32`
   - Store in GitHub Secrets
   - Passed via environment variable

---

## 🚀 Deployment Examples

### Example 1: Change rate limiting for load testing

Edit `nginx.conf`:
```nginx
limit_req_zone $binary_remote_addr zone=general:10m rate=100r/s;  # Increase from 10r/s
limit_req_zone $binary_remote_addr zone=api:10m rate=200r/s;      # Increase from 30r/s
```

Then redeploy:
```bash
git add nginx.conf
git commit -m "Increase rate limits for load testing"
git push origin main
```

### Example 2: Change file upload size

Edit `nginx.conf`:
```nginx
client_max_body_size 200M;  # Increase from 50M
```

Redeploy → CI/CD handles it automatically

### Example 3: Adjust database connection on server

No files to edit! Just update GitHub Secret `DATABASE_URL` and redeploy.

---

## 📚 Summary

| Component | Customization | Hardcoding |
|-----------|--------------|-----------|
| Ports | docker-compose.yml | ❌ None (sensible defaults) |
| Domains | GitHub Secrets | ✅ Dynamic via env vars |
| Secrets/Certs | GitHub Secrets + ./ssl | ✅ None in git |
| Rate limiting | nginx.conf | ⚠️ Conservative defaults |
| Timeouts | nginx.conf | ⚠️ Reasonable defaults |
| Database | .env.docker + Secrets | ✅ Via DATABASE_URL |
| API URLs | GitHub Secrets | ✅ All configurable |

