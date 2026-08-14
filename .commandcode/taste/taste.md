# code-style
- When displaying limits, thresholds, or maximum values in UI components (e.g., "Score: X / Y"), derive the limit from the actual data model (e.g., `problem.points`) rather than hardcoding numeric constants like `/10` or `/100`. Hardcoded limits drift out of sync across components and produce inconsistent displays when the underlying data changes. Confidence: 0.80
- Scope name formatting changes to the minimal required surface area (e.g., just the profile page) — avoid broad refactors across all server routes unless explicitly requested. Confidence: 0.75
- When replacing a broken/dead config with the actual working fix (e.g., replacing a dead `define` in vite.config with a `loader.config()` call), remove the dead config rather than leaving it in place alongside the fix — orphaned config creates confusion about which mechanism is actually in effect and invites the same mistake later. Confidence: 0.75

# architecture
- Prefer deterministic, non-AI solutions for data import/parsing when a strict format exists (e.g., JSON import instead of AI-powered PDF parsing). AI introduces reliability risk. Confidence: 0.75

# docker
See [docker/taste.md](docker/taste.md)
# communication
See [communication/taste.md](communication/taste.md)
# datetime
- Display times in Indian time (IST / en-IN locale) for competition views and admin competition creation. Confidence: 0.80
- When displaying dates from API/database data in the frontend: (1) verify the actual field name the server returns (don't assume `createdAt` when the server sends `uploadedAt`), (2) validate the parsed Date with `!isNaN(date.getTime())` before calling any date methods, and (3) show a graceful fallback like "Unknown" if the date is invalid — never let "Invalid Date" reach the UI. Confidence: 0.80

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
- In Prisma v7, relation field filters (e.g., `batch`, `division` on a `studentProfile` relation) must be placed inside `is: {}`, not spread at the same level as `isNot: null`. Putting them as siblings of `isNot` (via spread operator) causes PrismaClientValidationError because Prisma rejects unknown arguments. The correct pattern is: `studentProfile: { isNot: null, is: { batch: ..., division: ... } }`. Confidence: 0.85
- Prisma `equals` matching on string fields is case-sensitive. When database has "Basic" but code normalizes to "basic", the query returns zero results. Use `in: [normalizedValue, TitleCaseVariant]` or Prisma's `mode: 'insensitive'` to avoid case-mismatch zero-result bugs — this is especially critical for batch/division filtering where user-facing labels may not exactly match stored values. Confidence: 0.75

# architecture
- When adding similar functionality for a different user role (e.g., subadmin tickets), extend the existing model (e.g., SupportTicket) with a type/discriminator field rather than creating a parallel model — reuse over duplication. Confidence: 0.70

# email
- Use `codingnexus.apsit.edu.in` as the admin portal URL in email links (not `codingnexus.live`). Confidence: 0.65
- All email sending must use dual-API-key fallback (Brevo primary + fallback key) for reliability. When the primary API can silently accept but not deliver (Brevo returns 200 + messageId even for unverified senders), error-based fallback is insufficient — the system needs a force-dual mode that fires through a verified/trusted fallback channel regardless of the primary response. Never send email through a single API key path if a fallback is available. Confidence: 0.90
- Email content containing user/admin-generated text (e.g., support ticket replies) must preserve the original whitespace and line breaks — render it like a `<pre>` tag (e.g., `white-space: pre-wrap` with readable line-height) rather than a plain `<p>` tag, because HTML collapses newlines and multiple spaces. The user wants any type of support reply to appear in the email exactly as typed, as a proper readable response. Confidence: 0.80

# admin-operations
- Admin-side operations (password resets, email sends, data modifications) should NOT be subject to the same rate limits as student-facing endpoints. Rate limits protect against abuse from untrusted users; admins are trusted actors and their workflows (like resetting a student's password) must never be blocked by rate limiting. Confidence: 0.75

# scoring
- For code submission grading: award partial marks for correct but unoptimized solutions rather than failing them outright; students should know their solution passed but was not optimally efficient. Confidence: 0.80

# database
- When adding new columns to an existing table (via Prisma schema or raw SQL), proactively backfill/migrate existing rows with inferred values — don't leave them NULL and assume only future records will be populated. Existing records with NULL in filterable columns silently drop out of all queries that filter on those columns, breaking the feature for all pre-existing data. The user expects the feature to work for old data too, not just new uploads. Confidence: 0.80

# api
See [api/taste.md](api/taste.md)
# admin-ui
- When displaying student information in admin views (tickets, management, etc.), show all available student profile fields (name, division, batch, rollNo, phone) — don't truncate to just name+rollNo. Users expect the full student context visible at a glance. Confidence: 0.70
- When implementing hide/visibility toggles for student-facing content, admin views must bypass the visibility filter — admins need to see and manage all items regardless of visibility state. Applying a student-facing filter globally without role-awareness causes hidden items to silently disappear from admin views, breaking admin workflows. Confidence: 0.70

# debugging
- When a user reports a feature still not working after a frontend fix was deployed, verify the actual API response data shape (e.g., log it or check the endpoint) before modifying the frontend — don't assume the nested path (e.g., `user.studentProfile`) matches the real response structure. The fix will silently fail if the data path is wrong. Confidence: 0.75
- When there are two similar-sounding systems (e.g., subadmin support tickets vs. student support tickets), confirm which system the user is referring to before making changes — editing the wrong component wastes time and the user sees no fix. Confidence: 0.65

# scoring
- When displaying a "Score: X / Y" total in competition results, the denominator (Y) must come from the full competition's problem set (all problems × their points), NOT from only the problems the student attempted. A student solving 2 of 8 problems correctly should see "200/800", not "200/200" — using the attempted subset as denominator is misleading because it implies a perfect score. Confidence: 0.75
- For competition leaderboards: rank by score desc, then submission time asc (who finished first), then execution time asc — submission speed is the primary tiebreaker, not code execution speed. Students who submitted earlier with the same score should rank higher. Confidence: 0.70

# architecture
- When making changes to the standalone practice code editor (CodeEditor.jsx, server/routes/code.js), do NOT modify competition-related code (competition hooks, async-submissions, codeWrapper.js) — the practice and competition code paths are deliberately separate and should stay that way. Confidence: 0.65
