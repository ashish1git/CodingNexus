# code-style
- Scope name formatting changes to the minimal required surface area (e.g., just the profile page) — avoid broad refactors across all server routes unless explicitly requested. Confidence: 0.75

# architecture
- Prefer deterministic, non-AI solutions for data import/parsing when a strict format exists (e.g., JSON import instead of AI-powered PDF parsing). AI introduces reliability risk. Confidence: 0.75

# docker
- When a Docker container has correct HostConfig.PortBindings but empty NetworkSettings.Ports (corrupted port binding, often from "address already in use" during startup), "docker restart" is insufficient — stop, rm, and recreate the container via "docker compose up -d" to fix. Confidence: 0.85

# communication
- Explicitly report or enumerate every change made when performing edits — the user wants to be told what was changed, not just have it done silently. Confidence: 0.70

# datetime
- Display times in Indian time (IST / en-IN locale) for competition views and admin competition creation. Confidence: 0.80

# architecture
- Avoid adding complex real-time infrastructure (WebSocket, Socket.IO) for activity monitoring; prefer simple approaches like piggybacking activity logs on the existing submission flow. Confidence: 0.85

# code-style
- When adding new features, prefer minimal, non-breaking changes that don't require restructuring existing code or adding new infrastructure dependencies. Confidence: 0.80

# architecture
- For role-based authorization systems: explicitly define roles (e.g., DSA_TRAINER, DSA_OPERATIONS) as first-class entities rather than inferring roles from permission flags — permissions define capabilities, roles define identity; keep roles mutually exclusive by design. Confidence: 0.65

# design
- Preserve existing visual design and styling when making content updates — avoid full UI rewrites unless explicitly requested. Prefer targeted content changes (text, badges, copy) over complete redesigns. Confidence: 0.70
- Do not expose internal tech stack details (Judge0, Monaco Editor, specific engines/libraries) on public-facing pages like About or Landing — the user considers these implementation secrets. Confidence: 0.85

# workflow
- For production or infrastructure changes, first inspect the current state, then present a clear plan of what will happen, and wait for explicit confirmation ("yes") before executing. Confidence: 0.80
- For feature implementation requests, skip planning/discussion and implement directly and quickly; explain what was done after implementation, not before. Confidence: 0.65
- When backend changes involve DB schema modifications or new API routes, proactively run the migration and rebuild/restart the server (Docker/PM2) — don't declare the task done until the deployed server picks up the changes. Confidence: 0.80
- Frontend-only changes require `npm run build` to deploy; backend changes require Docker container rebuild and `docker compose up -d` to restart. Don't mix up the deployment paths. Confidence: 0.70
- When changes span both frontend AND backend (new routes, new pages, new API endpoints), run BOTH the frontend build (`npm run build`) AND the Docker rebuild (`docker compose up -d --build`) — the system won't work in production unless both deployment paths are completed. Confidence: 0.75

# debugging
- When debugging "Cannot access 'X' before initialization" TDZ errors in a Vite/Rollup production build, build with `--minify false` to reveal actual variable names instead of minified single-letter names (S,N,etc.) - this immediately identifies whether the error is in your code or a dependency. Confidence: 0.85

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

# design
- When hiding a feature like leaderboard, show a placeholder message (e.g., "Leaderboard will be displayed soon") instead of removing the tab/UI element entirely — students panic if the tab disappears. Confidence: 0.70

# api
- When enriching data from one API response with fields from another source, verify that the field names match between the two data shapes (e.g., `id` vs `submissionId`) — mismatches cause `undefined` values that propagate silently in production. Confidence: 0.70

# admin-ui
- When displaying student information in admin views (tickets, management, etc.), show all available student profile fields (name, division, batch, rollNo, phone) — don't truncate to just name+rollNo. Users expect the full student context visible at a glance. Confidence: 0.70

# debugging
- When a user reports a feature still not working after a frontend fix was deployed, verify the actual API response data shape (e.g., log it or check the endpoint) before modifying the frontend — don't assume the nested path (e.g., `user.studentProfile`) matches the real response structure. The fix will silently fail if the data path is wrong. Confidence: 0.75
- When there are two similar-sounding systems (e.g., subadmin support tickets vs. student support tickets), confirm which system the user is referring to before making changes — editing the wrong component wastes time and the user sees no fix. Confidence: 0.65

# scoring
- For competition leaderboards: rank by score desc, then submission time asc (who finished first), then execution time asc — submission speed is the primary tiebreaker, not code execution speed. Students who submitted earlier with the same score should rank higher. Confidence: 0.70
