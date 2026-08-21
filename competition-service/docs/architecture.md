# Competition Service — Architecture

## Service Overview

```
Internet
    │
    ▼
  Nginx (port 80/443)
    │
    ├── /api/competitions/*  ──────►  competition-service (port 3001)
    │                                       │
    │                                    PostgreSQL (shared DB)
    │                                       │
    │                                    Judge0 (code execution)
    │
    └── /api/*              ──────►  main app (port 3000)
    └── /*                  ──────►  main app (SPA fallback)
```

## Folder Map

```
competition-service/
├── server.js                       Entry point — Express app, health check, error handler
├── package.json                    Minimal deps: express, prisma, jwt, axios, cors, dotenv
├── Dockerfile                      node:20-alpine multi-stage build, non-root user
├── .dockerignore
├── .env.example
├── prisma/
│   └── schema.prisma               Read-only copy — migrations run from main app only
└── src/
    ├── config/
    │   └── db.js                   PrismaClient instance (connects via DATABASE_URL)
    ├── middleware/
    │   └── auth.js                 JWT-only: no DB lookup, sets req.user = { id, role }
    ├── utils/
    │   ├── helpers.js              generateStarterCode, formatDisplayName
    │   └── codeWrapper.js          wrapCodeForExecution, adjustErrorLineNumbers
    └── routes/
        └── competition/
            ├── index.js            18 Express routes (student + admin)
            ├── controllers/
            │   ├── admin.controller.js
            │   └── student.controller.js
            └── services/
                ├── admin.service.js    Prisma queries for admin ops
                ├── student.service.js  Prisma + Judge0 submit
                └── shared.service.js  Judge0 HTTP integration (axios)
```

## Auth Flow

```
Request: GET /api/competitions
                │
                ▼
           Nginx (port 80)
                │  forwards Authorization: Bearer <token>
                ▼
    competition-service:3001
                │
                ▼
        authenticate() middleware
                │  jwt.verify(token, JWT_SECRET)
                │  req.user = { id: decoded.userId, role: decoded.role }
                ▼
        authorizeRole() / checkPermission()
                │  role check only (no DB)
                ▼
        Controller → Service → Prisma → PostgreSQL
```

## Key Design Choices

| Decision | Choice | Reason |
|----------|--------|--------|
| Auth | JWT-only (no DB lookup) | Competition module only reads `req.user.id` and `req.user.role` |
| Database | Shared PostgreSQL | No migration risk; competition service is read-write on existing tables |
| Migrations | Main app only | Single source of truth for schema changes |
| Networking | `network_mode: host` | Matches existing setup; avoids refactoring main app networking |
| Node version | 20-alpine | Matches main app Dockerfile |

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Same PostgreSQL as main app |
| `JWT_SECRET` | Yes | Must be identical to main app |
| `JUDGE0_URL` | Yes | Code execution endpoint |
| `PORT` | No | Defaults to 3001 |

## What Stays in the Main App

- Migrations (`prisma migrate`)
- User auth, registration, profiles
- DSA, events, aptitude, recruitment
- All other routes not under `/api/competitions`
