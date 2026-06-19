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

# design
- Preserve existing visual design and styling when making content updates — avoid full UI rewrites unless explicitly requested. Prefer targeted content changes (text, badges, copy) over complete redesigns. Confidence: 0.70
- Do not expose internal tech stack details (Judge0, Monaco Editor, specific engines/libraries) on public-facing pages like About or Landing — the user considers these implementation secrets. Confidence: 0.85

# workflow
- For production or infrastructure changes, first inspect the current state, then present a clear plan of what will happen, and wait for explicit confirmation ("yes") before executing. Confidence: 0.80
- When backend changes involve DB schema modifications or new API routes, proactively run the migration and rebuild/restart the server (Docker/PM2) — don't declare the task done until the deployed server picks up the changes. Confidence: 0.75
