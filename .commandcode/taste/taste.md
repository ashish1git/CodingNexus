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
