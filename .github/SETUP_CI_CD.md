# Coding Nexus — CI/CD & Local Dev Setup Guide

## Quick Start — Local Development (Your Laptop)

```bash
git clone https://github.com/ashish1git/CodingNexus.git
cd CodingNexus

# Create your local env file
cp .env.local.example .env.local
# Edit .env.local — fill in Cloudinary, Brevo, and JWT_SECRET values

# Start everything (app + database + Judge0 + Redis)
docker compose -f docker-compose.dev.yml up -d --build

# Apply database migrations
docker compose -f docker-compose.dev.yml exec app npx prisma migrate deploy

# Open http://localhost:3000
```

What runs locally:
- `codingnexus-db` — PostgreSQL (port 5432)
- `codingnexus-judge0-server` — Judge0 code execution (port 2358)
- `codingnexus-judge0-workers` — Code execution workers
- `codingnexus-judge0-db` — Judge0's PostgreSQL
- `codingnexus-judge0-redis` — Judge0's Redis queue
- `codingnexus-app` — Your Express + Vite app (port 3000)

---

## Production CI/CD Setup

This section walks you through setting up automated deployment from GitHub
to your production server. Once set up, every `git push` to `main` automatically
deploys the latest code.

---

## Architecture Overview

```
Your Laptop                    GitHub                       Production Server
─────────────                  ──────                       ────────────────
git push main ──────────▶  CI: Build + Lint            202.179.85.68 (college machine)
                              │                           │
                              │  (if CI passes)           │
                              ▼                           ▼
                           CD: SSH into server     docker compose build
                              │                    docker compose up -d app
                              │                    health check
                              ▼
                           ✅ Deployed
```

---

## Step 1: SSH Key — Let GitHub Access Your Server

GitHub Actions needs to SSH into your server `202.179.85.68` to deploy code.
It does this using an SSH key pair (like a digital lock + key).

### What's happening (simple version):
- You create a lock (public key) + key (private key)
- You put the lock on your server → server trusts anyone holding the key
- You give the key to GitHub → GitHub can now enter the server
- Nobody else can enter because only GitHub has the key

### Do these commands on YOUR LAPTOP (not the server):

```bash
# 1. Create the key pair (run once, takes 2 seconds)
ssh-keygen -t ed25519 -f ~/.ssh/codingnexus-deploy -N "" -C "github-actions"

# This creates two files:
#   ~/.ssh/codingnexus-deploy       ← PRIVATE KEY (secret, give to GitHub)
#   ~/.ssh/codingnexus-deploy.pub   ← PUBLIC KEY (lock, put on server)

# 2. Copy the public key to your server
#    You'll be asked for the server password once:
ssh-copy-id -i ~/.ssh/codingnexus-deploy.pub apsit@202.179.85.68

# 3. Test it works:
ssh -i ~/.ssh/codingnexus-deploy apsit@202.179.85.68 "echo SSH works"
# Should print: SSH works

# 4. Show the private key (you'll paste this into GitHub):
cat ~/.ssh/codingnexus-deploy
```

### What to paste into GitHub:

The output of `cat ~/.ssh/codingnexus-deploy` will look like:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...(many lines of random characters)...
Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8fHx8fHx8fHx8fHx8fHx8fHx8fHw==
-----END OPENSSH PRIVATE KEY-----
```

Copy the **entire output** (all lines, including the BEGIN and END lines) and paste it as the `SSH_PRIVATE_KEY` secret in GitHub.

## Step 2: Add All Secrets to GitHub

Go to: **GitHub → your repo → Settings → Secrets and variables → Actions**
Click **"New repository secret"** and add each one below.

### Connection (4 secrets)

| Secret Name | Value |
|---|---|
| `SERVER_HOST` | `202.179.85.68` |
| `SERVER_USER` | `apsit` |
| `SSH_PRIVATE_KEY` | Output of `cat ~/.ssh/codingnexus-deploy` (the ENTIRE output from Step 1) |
| `APP_DIR` | `/home/apsit/projects/codingnexus/Mcodingnexus` |

### Database (1 secret)

| Secret Name | Value |
|---|---|
| `DATABASE_URL` | `postgresql://sumit:sumit123@localhost:5432/sumitdb` |

### JWT (1 secret)

| Secret Name | Value |
|---|---|
| `JWT_SECRET` | `d23a24c17a9b54c6cfda1baa10409b0fce79dcd7d87373711bd482452bd859764e6253ee98aa085098f63907fc887baaa13ba644cd9608ca8c099af172994f30` |

### Cloudinary (3 secrets)

| Secret Name | Where to find the value |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | From server: `grep CLOUDINARY_CLOUD_NAME .env.docker` |
| `CLOUDINARY_API_KEY` | From server: `grep CLOUDINARY_API_KEY .env.docker` |
| `CLOUDINARY_API_SECRET` | From server: `grep CLOUDINARY_API_SECRET .env.docker` |

### Brevo Email (4 secrets)

| Secret Name | Where to find the value |
|---|---|
| `BREVO_API_KEY` | From server: `grep BREVO_API_KEY .env.docker` (first line only) |
| `BREVO_API_KEY_SECONDARY` | From server: `grep BREVO_API_KEY_SECONDARY .env.docker` |
| `EMAIL_FROM` | From server: `grep EMAIL_FROM= .env.docker` |
| `EMAIL_FROM_SECONDARY` | From server: `grep EMAIL_FROM_SECONDARY .env.docker` |

### Frontend (1 secret)

| Secret Name | Value |
|---|---|
| `FRONTEND_URL` | `https://codingnexus.apsit.edu.in` |

### AI (Optional — leave empty if not using)

| Secret Name | Default |
|---|---|
| `USE_GEMINI_DIRECT` | `false` |
| `GEMINI_API_KEY` | (leave empty for now) |
| `OPENROUTER_API_KEY` | (leave empty for now) |
| `OPENROUTER_MODEL` | (leave empty for now) |

---

## Step 3: Push and Verify

```bash
git add .
git commit -m "ci: proper CI/CD pipeline with Docker deploy"

git push origin main
```

Go to **GitHub → Actions** — you should see "CI" and "Deploy" running.

CI finishes first (build + lint). If CI passes, Deploy starts automatically
(SSH into server, write .env.docker, rebuild, restart container, health check).

---

## How It Works — Exact Sequence

When you `git push main`:

1. **CI pipeline runs** (`.github/workflows/ci.yml`)
   - Installs dependencies → generates Prisma → runs ESLint → builds frontend
   - If CI fails, deploy is blocked

2. **Deploy pipeline runs** (`.github/workflows/deploy.yml`)
   - GitHub Actions SSHes into `202.179.85.68` as `apsit`
   - `git fetch origin && git reset --hard origin/main` (pull latest code)
   - **Writes `.env.docker`** from GitHub Secrets (single source of truth)
   - **Writes `.env`** with build-time Vite vars only
   - `docker compose build --no-cache app` (build fresh image)
   - `docker compose stop app && docker compose rm -f app && docker compose up -d app`
   - Waits for container to be healthy
   - Runs health check + Judge0 check
   - Reports success/failure

---

## Troubleshooting

| Problem | Check |
|---|---|
| SSH connection refused | Is `202.179.85.68` accessible from internet? Is SSH key added to server's `~/.ssh/authorized_keys`? |
| Container won't start | SSH into server, run `docker logs codingnexus-app --tail 50` |
| Secrets not loading | Verify secret names EXACTLY match (case-sensitive) |
| Health check fails | `curl http://localhost:3000/api/health` on server |

---

## Maintenance

- **Rotate secrets**: Update in both GitHub Secrets AND `.env.docker` on the server
- **Add new env vars**: Add to deploy.yml (write section), add to GitHub Secrets, add to `.env.example`
- **Manual deploy**: Go to GitHub Actions → Deploy (Docker) → "Run workflow"
