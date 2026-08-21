import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import competitionRoutes from './src/routes/competition/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: '*',
  credentials: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request logging ──────────────────────────────────────────────────────────

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'competition-service', timestamp: new Date().toISOString() });
});

// ─── Competition Routes ───────────────────────────────────────────────────────
// Auth (authenticate, authorizeRole, checkPermission) is applied per-route
// inside the router, so we don't need a global authenticate here.

app.use('/api/competitions', competitionRoutes);

// ─── Global Error Handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[competition-service] Unhandled error:', err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[competition-service] Running on port ${PORT}`);
  console.log(`[competition-service] Health: http://localhost:${PORT}/health`);
  console.log(`[competition-service] API:    http://localhost:${PORT}/api/competitions`);
});
