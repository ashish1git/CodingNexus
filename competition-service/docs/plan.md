# Competition Microservice — Extraction Plan

> **Status:** Planning
> **Goal:** Extract `server/routes/competition/` into a standalone Express microservice behind Nginx as API gateway.

---

## Context — Why We're Doing This

The CodingNexus backend is a **single Express monolith** (`server/index.js`) handling everything: auth, students, events, DSA, recruitment, competitions. The competition module is already well-isolated under `server/routes/competition/` with its own controllers and services — making it the ideal first candidate for microservice extraction.

**Benefits:**
- Independent deployment & scaling for competition load spikes
- Failure isolation — competition bugs won't crash the main app
- Cleaner codebase — one service, one responsibility

**Approach:** Nginx API Gateway (Option B)
Nginx already proxies all `/api/*` to port 3000. We extend it to route `/api/competitions/*` to the new service on port 3001.

---

## Current Codebase Analysis

```
server/
├── index.js                        <- Mounts all routes including competitions (line 181)
├── middleware/
│   └── auth.js                     <- JWT + DB lookup: authenticate, authorizeRole, checkPermission
├── config/
│   └── db.js                       <- Prisma client instance
├── utils/
│   ├── helpers.js                  <- generateStarterCode, formatDisplayName
│   ├── codeWrapper.js              <- wrapCodeForExecution, adjustErrorLineNumbers
│   └── logger.js                   <- NOT needed by competition service
└── routes/
    └── competition/
        ├── index.js                <- 18 Express endpoints (student + admin)
        ├── controllers/
        │   ├── admin.controller.js  <- 9 admin handlers (CRUD, eval, submissions)
        │   └── student.controller.js <- 9 student handlers (list, register, submit, draft)
        └── services/
            ├── admin.service.js    <- Prisma queries + business logic
            ├── student.service.js  <- Prisma queries + Judge0 integration
            └── shared.service.js  <- Judge0 HTTP calls via axios
```

### Direct Dependencies of Competition Module

| File | Used by |
|------|---------|
| `server/config/db.js` (Prisma) | All 3 services |
| `server/utils/helpers.js` | admin.service, student.service |
| `server/utils/codeWrapper.js` | shared.service |
| `server/middleware/auth.js` | routes/index.js |

### External Packages Needed (minimal set)

- `express` — routing
- `@prisma/client` — DB queries
- `prisma` — generate client
- `jsonwebtoken` — JWT verification
- `axios` — Judge0 HTTP calls
- `dotenv` — env vars
- `cors` — CORS headers

**NOT needed:** `nodemailer`, `brevo`, `cloudinary`, `multer`, `bcryptjs`, `xlsx`, `pdfkit`

---

## Target Directory Structure

```
competition-service/
├── Dockerfile
├── .dockerignore
├── .env.example
├── package.json
├── server.js                       <- Express entry point
├── docs/
│   ├── plan.md                     <- THIS FILE
│   ├── architecture.md             <- Architecture diagram & service boundaries
│   └── api-reference.md            <- All 18 endpoints documented
├── prisma/
│   └── schema.prisma               <- Copied from main, read-only (no migrations)
└── src/
    ├── config/
    │   └── db.js                   <- New Prisma client instance
    ├── middleware/
    │   └── auth.js                 <- JWT-only auth (no DB calls)
    ├── utils/
    │   ├── helpers.js              <- Copied from server/utils/helpers.js
    │   └── codeWrapper.js          <- Copied from server/utils/codeWrapper.js
    └── routes/
        └── competition/
            ├── index.js            <- Fixed import path for middleware
            ├── controllers/
            │   ├── admin.controller.js
            │   └── student.controller.js
            └── services/
                ├── admin.service.js
                ├── student.service.js
                └── shared.service.js
```

---

## Key Design Decisions

### 1. Auth Middleware — JWT-Only (No DB Round-trip)

The current `auth.js` does a full DB lookup per request. The competition module only uses `req.user.id` and `req.user.role` — never `req.user.studentProfile` or `req.user.adminProfile`. So we skip the DB call:

```js
// BEFORE (monolith auth.js)
const user = await prisma.user.findUnique({ where: { id: decoded.userId }, include: {...} });
req.user = user;

// AFTER (competition-service auth.js)
req.user = { id: decoded.userId, role: decoded.role };  // from token only
```

`authorizeRole` and `checkPermission` are kept as-is. Since admin/superadmin always bypass `checkPermission`, and sub-admin granular checks need `adminProfile.permissions`, sub-admin checks will pass for all sub-admins in the microservice (they have no `adminProfile` on the token).

### 2. Prisma Client — Shared Schema, Separate Instance

- Copy `prisma/schema.prisma` verbatim into `competition-service/prisma/`
- Create `competition-service/src/config/db.js` with a fresh `PrismaClient` instance
- Do NOT run `prisma migrate` from competition service — migrations stay in main app only
- `npx prisma generate` runs inside the Dockerfile during build

### 3. Import Path Fixes in competition/index.js

The router imports `../../middleware/auth.js`. After relocation to `src/routes/competition/index.js`, this path changes:

| Original | New |
|----------|-----|
| `../../middleware/auth.js` | `../../../middleware/auth.js` |

Service files import `../../../config/db.js` and `../../../utils/*` — these paths remain correct since the folder depth from `services/` to `src/` is preserved.

### 4. Nginx Routing Update

Add a specific location block for `/api/competitions/` **before** the generic `/api/` block:

```nginx
# NEW — Competition Microservice (add BEFORE the generic /api/ block)
location /api/competitions/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_redirect off;
}
```

Note: `Authorization` header must be explicitly forwarded.

### 5. Docker Networking

The main app uses `network_mode: "host"` in docker-compose. For simplicity and minimal disruption:
- Competition service will also use `network_mode: "host"` on port 3001
- Nginx (also host mode) will proxy to `127.0.0.1:3001`
- This avoids changing the existing networking model

---

## Step-by-Step Build Order

### Phase 1 — Scaffold & Copy
1. Create all directories under `competition-service/`
2. Copy competition module files into new locations
3. Copy `helpers.js` and `codeWrapper.js` to `src/utils/`
4. Copy `prisma/schema.prisma` to `competition-service/prisma/`

### Phase 2 — Fix & Adapt Source Files
5. Create `src/config/db.js` — fresh Prisma instance
6. Create `src/middleware/auth.js` — JWT-only authenticate
7. Fix import in `src/routes/competition/index.js` (middleware path)

### Phase 3 — Entry Point & Package
8. Create `package.json` with minimal deps
9. Create `server.js` — Express entry point
10. Create `.env.example`

### Phase 4 — Docker
11. Create `Dockerfile` (node:20-alpine to match main app)
12. Create `.dockerignore`

### Phase 5 — Infrastructure Updates
13. Update `nginx.conf` — add `/api/competitions/` location block
14. Update `docker-compose.yml` — add competition-service container
15. Update `server/index.js` — remove competition routes

### Phase 6 — Docs
16. Create `docs/architecture.md`
17. Create `docs/api-reference.md`

---

## Open Questions (Require Decision Before Execution)

| # | Question | Impact |
|---|----------|--------|
| 1 | **Sub-admin permissions:** JWT-only auth means `adminProfile.permissions` is unavailable. Should sub-admins have full competition access, or do we do a targeted DB lookup for sub-admin role only? | `src/middleware/auth.js` |
| 2 | **Node version:** Main Dockerfile uses `node:20-alpine`. Prompt says `node:18-alpine`. Match main app or follow prompt? | `Dockerfile` |
| 3 | **Remove from main app now or later?** Should `server/index.js` stop serving `/api/competitions` immediately, or keep as fallback during testing? | `server/index.js` rollout risk |

---

## Verification Checklist

- [ ] `cd competition-service && npm install && node server.js` — starts on port 3001
- [ ] `GET http://localhost:3001/health` returns `{ "status": "ok" }`
- [ ] `GET http://localhost:3001/api/competitions` with valid Bearer token returns competition list
- [ ] `POST http://localhost:3001/api/competitions/:id/register` succeeds
- [ ] `POST http://localhost:3001/api/competitions/:id/submit` triggers Judge0
- [ ] Admin `POST http://localhost:3001/api/competitions` with admin token creates competition
- [ ] `docker-compose up --build` — all containers start without errors
- [ ] `GET http://localhost/api/competitions` via Nginx routes to port 3001
- [ ] `GET http://localhost/api/student/profile` via Nginx routes to port 3000 (unchanged)
- [ ] Frontend works without any code changes

---

## Files to Create / Modify

| Action | Path |
|--------|------|
| CREATE | `competition-service/server.js` |
| CREATE | `competition-service/package.json` |
| CREATE | `competition-service/Dockerfile` |
| CREATE | `competition-service/.dockerignore` |
| CREATE | `competition-service/.env.example` |
| CREATE | `competition-service/src/config/db.js` |
| CREATE | `competition-service/src/middleware/auth.js` |
| COPY+FIX | `competition-service/src/routes/competition/index.js` |
| COPY | `competition-service/src/routes/competition/controllers/admin.controller.js` |
| COPY | `competition-service/src/routes/competition/controllers/student.controller.js` |
| COPY | `competition-service/src/routes/competition/services/admin.service.js` |
| COPY | `competition-service/src/routes/competition/services/student.service.js` |
| COPY | `competition-service/src/routes/competition/services/shared.service.js` |
| COPY | `competition-service/src/utils/helpers.js` |
| COPY | `competition-service/src/utils/codeWrapper.js` |
| COPY | `competition-service/prisma/schema.prisma` |
| MODIFY | `nginx.conf` |
| MODIFY | `docker-compose.yml` |
| MODIFY | `server/index.js` |
| CREATE | `competition-service/docs/architecture.md` |
| CREATE | `competition-service/docs/api-reference.md` |
