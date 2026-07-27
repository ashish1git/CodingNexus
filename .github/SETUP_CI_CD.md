# Coding Nexus — CI/CD Setup Guide

This guide walks you through setting up automated deployment from GitHub
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

## Step 1: Generate SSH Key for GitHub Actions

Run this on your **local laptop** (NOT the server):

```bash
# Generate a dedicated deploy key
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/codingnexus-deploy -N ""

# Copy the public key to the server
ssh-copy-id -i ~/.ssh/codingnexus-deploy.pub apsit@202.179.85.68
```

Now your server allows login from this key. Verify:

```bash
ssh -i ~/.ssh/codingnexus-deploy.pub apsit@202.179.85.68 "echo SSH works"
```

---

## Step 2: Add GitHub Secrets

Go to: **GitHub → Your Repo → Settings → Secrets and variables → Actions**

Click **"New repository secret"** and add each of these:

### Connection Secrets (MANDATORY)

| Secret Name | Value | Example |
|---|---|---|
| `SERVER_HOST` | Server hostname/IP | `202.179.85.68` |
| `SERVER_USER` | SSH username | `apsit` |
| `SSH_PRIVATE_KEY` | **ENTIRE** private key file content | `cat ~/.ssh/codingnexus-deploy` |
| `APP_DIR` | Path to project on server | `/home/apsit/projects/codingnexus/Mcodingnexus` |

**Important for `SSH_PRIVATE_KEY`:**
```bash
# Run this on your laptop and paste the ENTIRE output into the secret:
cat ~/.ssh/codingnexus-deploy
```
Include everything including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`.

### Database

| Secret Name | Value | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://sumit:sumit123@localhost:5432/sumitdb` |

### JWT

| Secret Name | Value |
|---|---|
| `JWT_SECRET` | Your JWT signing secret (64-char hex string) |

### Cloudinary

| Secret Name | Value |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | `dtxktmolj` |
| `CLOUDINARY_API_KEY` | `857761858925618` |
| `CLOUDINARY_API_SECRET` | `LUUTr5swZFAzsu1F3jUOq0TBU94` |

### Brevo Email (Dual Keys)

| Secret Name | Value |
|---|---|
| `BREVO_API_KEY` | Primary Brevo key for `codingnexus@apsit.edu.in` |
| `BREVO_API_KEY_SECONDARY` | Fallback Brevo key for `ashishapsit@gmail.com` |
| `EMAIL_FROM` | `codingnexus@apsit.edu.in` |
| `EMAIL_FROM_SECONDARY` | `ashishapsit@gmail.com` |

### CORS / Frontend

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
