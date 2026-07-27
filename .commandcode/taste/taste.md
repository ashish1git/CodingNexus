# code-style
- Scope name formatting changes to the minimal required surface area (e.g., just the profile page) — avoid broad refactors across all server routes unless explicitly requested. Confidence: 0.75

# architecture
- Prefer deterministic, non-AI solutions for data import/parsing when a strict format exists (e.g., JSON import instead of AI-powered PDF parsing). AI introduces reliability risk. Confidence: 0.75

# docker
See [docker/taste.md](docker/taste.md)
# communication
See [communication/taste.md](communication/taste.md)
# datetime
- Display times in Indian time (IST / en-IN locale) for competition views and admin competition creation. Confidence: 0.80

# architecture
- Avoid adding complex real-time infrastructure (WebSocket, Socket.IO) for activity monitoring; prefer simple approaches like piggybacking activity logs on the existing submission flow. Confidence: 0.85

# code-style
- When adding new features, prefer minimal, non-breaking changes that don't require restructuring existing code or adding new infrastructure dependencies. Confidence: 0.80

# architecture
- For role-based authorization systems: explicitly define roles (e.g., DSA_TRAINER, DSA_OPERATIONS) as first-class entities rather than inferring roles from permission flags — permissions define capabilities, roles define identity; keep roles mutually exclusive by design. Confidence: 0.65

# design
See [design/taste.md](design/taste.md)
# workflow
See [workflow/taste.md](workflow/taste.md)
# debugging
See [debugging/taste.md](debugging/taste.md)
# logging
- Only log unusual/exceptional events (violations, errors, warnings); avoid logging every normal state transition (e.g. fullscreen enter/exit on every toggle) to prevent log noise. Confidence: 0.70

# prisma
- After adding DB fields via raw SQL (not Prisma migrations), run `npx prisma generate` and rebuild the Docker image — otherwise the Prisma client won't know about the new fields and queries will throw 500 errors. Confidence: 0.75
- When adding new fields to the Prisma schema (schema-first approach), also run the corresponding ALTER TABLE or `prisma db push` on the actual database — `prisma generate` only regenerates the client, it does NOT update the database, and missing columns cause all queries to silently fail. Confidence: 0.75

# architecture
- When adding similar functionality for a different user role (e.g., subadmin tickets), extend the existing model (e.g., SupportTicket) with a type/discriminator field rather than creating a parallel model — reuse over duplication. Confidence: 0.70

# email
- Use `codingnexus.apsit.edu.in` as the admin portal URL in email links (not `codingnexus.live`). Confidence: 0.65

# scoring
- For code submission grading: award partial marks for correct but unoptimized solutions rather than failing them outright; students should know their solution passed but was not optimally efficient. Confidence: 0.80

# api
- When enriching data from one API response with fields from another source, verify that the field names match between the two data shapes (e.g., `id` vs `submissionId`) — mismatches cause `undefined` values that propagate silently in production. Confidence: 0.70
- For feature gating: prefer self-service access code systems (admin generates codes via script, students enter codes to unlock) over manual DB-flag toggling — the user finds direct DB access too tedious for granting student access. Confidence: 0.70
- When building access code systems: implement BOTH grant and revoke paths — revoking/deleting a code should also revoke access for students who already used it, not just prevent new unlocks. The user expects full lifecycle control over access. Confidence: 0.65

# admin-ui
- When displaying student information in admin views (tickets, management, etc.), show all available student profile fields (name, division, batch, rollNo, phone) — don't truncate to just name+rollNo. Users expect the full student context visible at a glance. Confidence: 0.70

# debugging
- When a user reports a feature still not working after a frontend fix was deployed, verify the actual API response data shape (e.g., log it or check the endpoint) before modifying the frontend — don't assume the nested path (e.g., `user.studentProfile`) matches the real response structure. The fix will silently fail if the data path is wrong. Confidence: 0.75
- When there are two similar-sounding systems (e.g., subadmin support tickets vs. student support tickets), confirm which system the user is referring to before making changes — editing the wrong component wastes time and the user sees no fix. Confidence: 0.65

# scoring
- For competition leaderboards: rank by score desc, then submission time asc (who finished first), then execution time asc — submission speed is the primary tiebreaker, not code execution speed. Students who submitted earlier with the same score should rank higher. Confidence: 0.70

# architecture
- When making changes to the standalone practice code editor (CodeEditor.jsx, server/routes/code.js), do NOT modify competition-related code (competition hooks, async-submissions, codeWrapper.js) — the practice and competition code paths are deliberately separate and should stay that way. Confidence: 0.65
