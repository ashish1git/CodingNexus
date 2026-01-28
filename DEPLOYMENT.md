# Deployment Guide — Frontend (Vercel) & Backend (Render)

This is a short, practical guide to deploy the frontend to Vercel and the backend to Render. Follow the steps below and use the checklist at the end.

---

## 1. Prepare the repo
- Ensure your project builds locally:
  - Frontend (Vite/React): `npm run build` should create a `dist` folder.
  - Backend (Node/Express): `npm run server` should start the server and listen on `process.env.PORT || 5000`.
- Recommended `package.json` scripts:
  - `"build": "vite build"`
  - `"preview": "vite preview --port 5173"`
  - `"server": "node server/index.js"`
  - `"start": "node server/index.js"` (used by Render)

---

## 2. Backend: Deploy to Render
1. Create a new Web Service on Render and connect your GitHub repo.
2. Service settings:
   - Branch: `main` (or your chosen branch)
   - Environment: `Node` (auto-detect from `package.json`)
   - Build Command: leave empty if only running server, or `npm ci` if you need dependencies installed.
   - Start Command: `npm run server` or `node server/index.js`.
3. Add Environment Variables (Render Dashboard -> Environment):
   - `DATABASE_URL` (Postgres)
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `CLOUDINARY_*` (if used)
   - `USE_GEMINI_DIRECT`, `GEMINI_API_KEY` or `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` depending on your evaluator choice
   - `FRONTEND_URL` (set this after you have Vercel URL)
   - Any other keys present in your local `.env`
4. Health check (optional): add a path like `/health` that returns 200.
5. Deploy. Copy the public service URL (e.g., `https://my-app.onrender.com`).

Notes:
- Choose instance type based on expected load. The free tier works for light usage.
- If you use database or other managed services, ensure the network and credentials are configured properly.

---

## 3. Frontend: Deploy to Vercel
1. In Vercel, import the Git repo and create a new Project.
2. Configure:
   - Root Directory: left empty if frontend is at repo root; otherwise set path to frontend folder.
   - Install Command: `npm ci` (or `npm install`)
   - Build Command: `npm run build` (or `vite build`)
   - Output Directory: `dist`
3. Environment Variables (Vercel Project Settings -> Environment):
   - `VITE_API_BASE_URL` (set to your Render backend URL, e.g., `https://my-app.onrender.com`)
   - Any Cloudinary public keys used by the client
4. Deploy. Vercel will give you a URL like `https://your-project.vercel.app`.
5. After Vercel deploys, update the `FRONTEND_URL` environment variable in Render with the Vercel URL (so backend CORS and notifications work).

Notes:
- Vite exposes env vars prefixed with `VITE_` to client code.
- If your frontend fetches `process.env.VITE_API_BASE_URL`, ensure your code uses `import.meta.env.VITE_API_BASE_URL`.

---

## 4. CORS & Networking
- Update backend CORS to allow the Vercel origin. Example CORS setup in Express:
```js
// in server middleware
const allowed = (process.env.FRONTEND_URL || '').split(',');
app.use(require('cors')({ origin: allowed }));
```
- Alternatively, allow specific Vercel domain returned after deployment.

---

## 5. Quick Health Endpoint (suggested)
Add a simple endpoint to `server/index.js` or `server/routes`:
```js
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));
```
Render can use this for health checks and it's useful for quick verification.

---

## 6. Local testing commands
- Start backend:
```bash
npm run server
```
- Build frontend and preview locally:
```bash
npm run build
npm run preview
```
- Use `curl` to check backend health:
```bash
curl https://my-app.onrender.com/health
```

---

## 7. Post-deploy checklist
- [ ] Backend responds at its Render URL
- [ ] Frontend deployed and loads from Vercel URL
- [ ] Frontend can call backend endpoints successfully (CORS OK)
- [ ] Environment variables on Render and Vercel are correct
- [ ] One end-to-end evaluation test works (trigger evaluation from frontend)
- [ ] Monitor logs on Render for any runtime errors

---

## 8. Troubleshooting tips
- 403/401 from LLM providers: check keys and quotas
- 404 on static assets: confirm Vite `dist` path and Vercel output dir
- CORS errors: check `FRONTEND_URL` and CORS middleware
- Slow evaluator/quotas hit: consider local deterministic grader or using provider credits

---

If you want, I can:
- Add `/health` endpoint and a small patch to `package.json` now.
- Generate `render.yaml` and `vercel.json` for repo-driven deployment.
- Walk you through the Render and Vercel console steps interactively.

What do you want me to do next?