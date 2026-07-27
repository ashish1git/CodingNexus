# ════════════════════════════════════════════════════════════
# Coding Nexus — System Architecture
# ════════════════════════════════════════════════════════════

---

## Infrastructure Diagram

```
                          INTERNET
                             │
                    202.179.85.68 (Public IP)
                             │
                    ┌────────┴────────┐
                    │  System Nginx   │  /etc/nginx/conf.d/codingnexus.conf
                    │  port 80, 443   │  Proxies /api/* → 127.0.0.1:3000
                    │  (apt package)  │  Serves static files from dist_nginx/
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │  Docker: app    │  codingnexus-app (host networking)
                    │  port 3000      │  Node.js Express server
                    │  env_file:      │  Prisma ORM → PostgreSQL
                    │  .env.docker    │  Brevo email, Cloudinary, JWT
                    └───┬───┬───┬─────┘
                        │   │   │
              ┌─────────┘   │   └──────────┐
              ▼             ▼              ▼
     ┌────────────┐ ┌───────────┐ ┌──────────────┐
     │ PostgreSQL │ │  Judge0   │ │  Cloudinary   │
     │ localhost  │ │ localhost │ │  dtxktmolj    │
     │ :5432      │ │ :2358     │ │  (SaaS)       │
     └────────────┘ └───────────┘ └──────────────┘

Judge0 runs as Docker containers:
  - judge0-v1131-server-1   (port 2358)
  - judge0-v1131-workers-1  (code execution)
  - judge0-v1131-workers-2  (code execution)
  - judge0-v1131-db-1       (PostgreSQL for Judge0)
  - judge0-v1131-redis-1    (job queue)
```

---

## Files and Their Roles

```
Mcodingnexus/
├── Dockerfile              Blueprint: how to build the app image
├── docker-compose.yml      Operating manual: how to run the container
├── nginx.conf              Docker nginx config (redundant — system nginx active)
├── .env                    Build-time Vite vars (4 lines, non-secret, git-tracked)
├── .env.docker             Runtime secrets (60 lines, gitignored, single source of truth)
├── .env.example            Template for new developers (placeholders, git-tracked)
├── healthcheck.sh          One-command system health check
│
├── server/                 Backend (Node.js + Express)
│   ├── index.js            Server entry point
│   ├── routes/             API route handlers
│   ├── services/           Business logic
│   │   ├── email/brevo.service.js   Dual-key email with fallback
│   │   ├── aiEvaluator.js           Code evaluation via Gemini/OpenRouter
│   │   └── aptitude/                Aptitude question generation
│   ├── middleware/upload.js          Cloudinary file uploads
│   └── prisma/                      Database schema
│
├── src/                    Frontend (React + Vite)
│   ├── components/         UI components
│   └── services/           Frontend services (Cloudinary upload, etc.)
│
├── dist_nginx/             Static files for system nginx
├── .github/                GitHub CI/CD
│   └── workflows/
│       ├── ci.yml           Build + Lint on every push/PR
│       └── deploy.yml       Deploy to production on push to main
└── docs/                   Docusaurus documentation site
```

---

## Environment Variable Flow

```
Developer's laptop:
  cp .env.example .env.docker
  Fill in secrets → docker compose up -d
  (NEVER commit .env.docker)

GitHub Actions (deploy.yml):
  Reads GitHub Secrets
  SSH into server
  Writes .env.docker from secrets
  docker compose up -d

Production Container:
  env_file: .env.docker → all 40+ runtime vars
  Shell env has ZERO effect on container
```

---

## Key Design Decisions

1. **Docker + host networking**: App uses `network_mode: host` for simplicity — it
   shares the host's network stack so `localhost:5432` (PostgreSQL) and
   `localhost:2358` (Judge0) are directly accessible without Docker DNS.

2. **System nginx, not Docker nginx**: The `nginx` package installed via `apt`
   on the host handles port 80/443. Config is at `/etc/nginx/conf.d/codingnexus.conf`.
   The Docker nginx container exists as a backup but is unused (port conflict).

3. **Dual Brevo keys**: Primary (`codingnexus@apsit.edu.in`) handles normal traffic.
   If it hits daily quota (300 emails on free tier), secondary (`ashishapsit@gmail.com`)
   takes over automatically. Both senders are verified in Brevo dashboard.

4. **.env.docker as single source**: All configuration lives in one gitignored file.
   Docker Compose uses `env_file: .env.docker` — no shell env var can override.
   This prevents the "shell pollution" bug that broke the system.

5. **Healthcheck**: Container auto-health-checks every 30 seconds via
   `curl http://localhost:3000/api/health`. Docker marks it unhealthy if it fails.

---

## Key URLs

| What | URL |
|---|---|
| Production | https://codingnexus.apsit.edu.in |
| API (direct) | http://localhost:3000/api |
| Judge0 | http://localhost:2358 |
| Brevo Dashboard | https://app.brevo.com |
| Cloudinary Console | https://console.cloudinary.com |
| GitHub Repo | https://github.com/ashish1git/CodingNexus |
