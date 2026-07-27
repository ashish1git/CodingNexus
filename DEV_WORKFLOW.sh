# ══════════════════════════════════════════════
# Coding Nexus — LOCAL DEVELOPMENT WORKFLOW
# ══════════════════════════════════════════════
#
# Read this ONCE. Follow exactly. Zero confusion forever.
# ========================================================

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ONE-TIME SETUP (first time only)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 1️⃣  Clone
git clone https://github.com/ashish1git/CodingNexus.git
cd CodingNexus

# 2️⃣  Create your local env file
cp .env.local.example .env.local

# 3️⃣  Fill in real values in .env.local
#     Open .env.local and replace <CHANGE_ME> with:
#       CLOUDINARY_API_KEY=857761858925618
#       CLOUDINARY_API_SECRET=LUUTr5swZFAzsu1F3jUOq0TBU94
#       BREVO_API_KEY=xkeysib-4a9ebd2...
#       BREVO_API_KEY_SECONDARY=xkeysib-5fa3348...
#       EMAIL_FROM=codingnexus@apsit.edu.in
#       EMAIL_FROM_SECONDARY=ashishapsit@gmail.com
#     (Copy these from the server's .env.docker)

# 4️⃣  Install dependencies
npm install

# 5️⃣  Start local database + Judge0 (keep Docker Desktop running!)
docker compose -f docker-compose.dev.yml up -d

# 6️⃣  Run database migrations (first time only)
npx prisma migrate deploy

# 7️⃣  Start the app with hot-reload
npm run dev:all
#     → Frontend: http://localhost:5173
#     → Backend:  http://localhost:3000



# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DAILY WORKFLOW (every time you code)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Start Docker Desktop (if not running)
# Then:
docker compose -f docker-compose.dev.yml up -d    # start DB + Judge0
npm run dev:all                                     # start app with hot-reload

# Make changes in VSCode → see them instantly at http://localhost:5173
# Test everything: login, competition, code execution, email

# When done for the day:
Ctrl+C                                                # stop npm
docker compose -f docker-compose.dev.yml down         # stop all services



# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DEPLOY TO PRODUCTION (when feature is tested and ready)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

git add .
git commit -m "feature: description of your change"

git push origin main

# THAT'S IT.
#
# GitHub automatically:
#   1. CI: builds + lints your code
#   2. Builds Docker image → pushes to ghcr.io
#   3. SSHs into 202.179.85.68
#   4. Pulls image → restarts container
#   5. Health check
#
# Watch progress at: https://github.com/ashish1git/CodingNexus/actions
# Your site at:      https://codingnexus.apsit.edu.in



# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TROUBLESHOOTING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# "Port 5432 already in use"
# → You have another PostgreSQL running. Stop it first.

# "prisma migrate deploy fails"
# → DB container not ready. Wait 10 seconds, retry.

# "Code execution not working"
# → curl http://localhost:2358/about
# → If no response: Judge0 containers didn't start. Check Docker Desktop.

# "Module not found: @prisma/client"
# → npx prisma generate

# "Deploy failed on GitHub Actions"
# → Check: https://github.com/ashish1git/CodingNexus/actions
# → Common cause: GitHub Secrets not set up.
# → Follow: .github/SETUP_CI_CD.md (Step 2)



# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FILES YOU NEVER TOUCH
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# .env.local     — Your local secrets (NEVER commit, gitignored)
# .env.docker    — Production secrets (NEVER commit, gitignored)
# .env           — Build-time vars (committed, no secrets)
# .env.example   — Template (committed, placeholders only)
# .env.local.example — Local template (committed, placeholders only)
