import { Router } from 'express';
import os from 'os';
import { exec } from 'child_process';
import http from 'http';
import jwt from 'jsonwebtoken';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import prisma from '../config/db.js';

const router = Router();

// ─── Netdata proxy (before auth — auth via query token for iframe) ───
router.use((req, res, next) => {
  if (!req.path.startsWith('/netdata')) return next();
  handleNetdataProxy(req, res);
});

function handleNetdataProxy(req, res) {
  const token = req.query.token;
  if (!token) return res.status(401).json({ error: 'Token required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  let targetPath = req.path.replace(/^\/netdata/, '') || '/';
  if (req.url.includes('?')) {
    const qs = req.url.substring(req.url.indexOf('?'));
    targetPath += qs;
  }

  const proxyReq = http.request({
    hostname: '127.0.0.1',
    port: 19999,
    path: targetPath,
    method: req.method,
    headers: { host: '127.0.0.1:19999', 'x-forwarded-for': '127.0.0.1', accept: req.headers.accept || '*/*' }
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', () => { if (!res.headersSent) res.status(502).json({ error: 'Netdata unreachable' }); });
  proxyReq.setTimeout(10000, () => { proxyReq.destroy(); if (!res.headersSent) res.status(504).json({ error: 'Netdata timeout' }); });
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
}

// ─── Auth for all other monitoring routes ───
router.use(authenticate);
router.use(authorizeRole('superadmin'));

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://202.179.85.68:2358';
const DOCKER_SOCKET = '/var/run/docker.sock';

let cachedMetrics = null;
let lastFetchTime = 0;
const CACHE_TTL = 10000;

function dockerRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      socketPath: DOCKER_SOCKET,
      method,
      path,
      headers: body ? { 'Content-Type': 'application/json' } : {}
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(res.statusCode >= 400 ? null : JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Docker timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function executeCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 5000 }, (error, stdout) => {
      if (error) resolve(null);
      else resolve(stdout.trim());
    });
  });
}

async function getSystemMetrics() {
  const now = Date.now();
  if (cachedMetrics && now - lastFetchTime < CACHE_TTL) {
    return cachedMetrics;
  }

  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const loadAvg = os.loadavg();
  const ramUsage = ((totalMem - freeMem) / totalMem) * 100;

  let cpuUsage = 0;
  if (cpus.length) {
    const totalIdle = cpus.reduce((sum, cpu) => sum + cpu.times.idle, 0);
    const totalTick = cpus.reduce((sum, cpu) =>
      sum + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq, 0);
    cpuUsage = ((totalTick - totalIdle) / totalTick) * 100;
  }

  const diskOutput = await executeCommand("df -h / | awk 'NR==2 {print $3, $4, $5}'");
  let diskUsed = '0G', diskAvail = '0G', diskPct = '0%';
  if (diskOutput) {
    const parts = diskOutput.split(/\s+/);
    if (parts.length >= 3) {
      diskUsed = parts[0];
      diskAvail = parts[1];
      diskPct = parts[2];
    }
  }

  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'down';
  }

  let judge0Status = 'unknown';
  let judge0Version = '';
  try {
    const resp = await fetch(`${JUDGE0_URL}/about`);
    if (resp.ok) {
      const data = await resp.json();
      judge0Version = data.version || '';
      judge0Status = 'healthy';
    }
  } catch {
    judge0Status = 'down';
  }

  const diskWarn = parseInt(diskPct) > 85;

  cachedMetrics = {
    cpu: cpuUsage.toFixed(1) + '%',
    ram: ramUsage.toFixed(1) + '%',
    ramUsed: ((totalMem - freeMem) / 1024 ** 3).toFixed(1) + 'G',
    ramTotal: (totalMem / 1024 ** 3).toFixed(1) + 'G',
    diskUsed,
    diskAvail,
    diskPct,
    diskWarn,
    loadAvg: loadAvg.map(v => v.toFixed(2)),
    nodeStatus: 'healthy',
    dbStatus,
    judge0Status,
    judge0Version,
    hostname: os.hostname(),
    uptime: Math.floor(os.uptime()),
    cores: cpus.length,
    timestamp: new Date().toISOString()
  };
  lastFetchTime = now;
  return cachedMetrics;
}

// ─── Endpoints ───

router.get('/status', async (req, res) => {
  try {
    const metrics = await getSystemMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/judge0', async (req, res) => {
  try {
    let workers = [];
    let workerContainers = [];

    try {
      const resp = await fetch(`${JUDGE0_URL}/workers`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) workers = data;
        else if (data && typeof data === 'object') workers = [data];
      }
    } catch {}

    try {
      const containers = await dockerRequest('GET', '/containers/json?all=true');
      if (containers) {
        workerContainers = containers
          .filter(c => c.Names && c.Names.some(n => n.includes('judge0') && n.includes('worker')))
          .map(c => ({
            id: c.Id ? c.Id.substring(0, 12) : '',
            name: (c.Names || []).join(', ').replace(/^\//, ''),
            status: c.State || 'unknown',
            running: c.State === 'running',
            state: c.Status || ''
          }));

        const running = containers.filter(c =>
          c.Names && c.Names.some(n => n.includes('judge0') && n.includes('workers')) && c.State === 'running');

        for (const container of running) {
          try {
            const stats = await dockerRequest('GET', `/containers/${container.Id}/stats?stream=false`);
            if (stats) {
              const idx = workerContainers.findIndex(w => w.id === container.Id.substring(0, 12));
              if (idx >= 0) {
                const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
                const sysDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
                const cpuPercent = sysDelta > 0 ? (cpuDelta / sysDelta * stats.cpu_stats.online_cpus * 100).toFixed(1) : '0.0';
                const memUsed = stats.memory_stats.usage ? (stats.memory_stats.usage / 1024 ** 3).toFixed(2) + 'G' : 'N/A';
                workerContainers[idx].cpu = cpuPercent + '%';
                workerContainers[idx].memory = memUsed;
                workerContainers[idx].health = cpuPercent > 90 ? 'busy' : 'healthy';
              }
            }
          } catch {}
        }
      }
    } catch {}

    res.json({
      success: true,
      data: {
        workerCount: workerContainers.length,
        workersFromApi: workers.length,
        hasIdleWorkers: workers.length > 0 && workers.some(w => w.idle > 0),
        workerContainers,
        workers,
        judge0Url: JUDGE0_URL
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/judge0/restart-workers', async (req, res) => {
  try {
    const containers = await dockerRequest('GET', '/containers/json?all=true');
    if (!containers) return res.status(500).json({ success: false, error: 'Cannot access Docker API' });

    const workerContainers = containers.filter(c =>
      c.Names && c.Names.some(n => n.includes('judge0') && n.includes('worker')));

    const results = [];
    for (const container of workerContainers) {
      try {
        await dockerRequest('POST', `/containers/${container.Id}/restart`);
        results.push({ name: (container.Names || [])[0], status: 'restarted' });
      } catch {
        results.push({ name: (container.Names || [])[0], status: 'failed' });
      }
    }

    cachedMetrics = null;
    res.json({ success: true, data: { results, message: `Restarted ${results.length} worker(s)` } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/judge0/restart-server', async (req, res) => {
  try {
    const containers = await dockerRequest('GET', '/containers/json?all=true');
    if (!containers) return res.status(500).json({ success: false, error: 'Cannot access Docker API' });

    const serverContainer = containers.find(c =>
      c.Names && c.Names.some(n => n.includes('judge0') && n.includes('server')));

    if (!serverContainer) return res.status(404).json({ success: false, error: 'Judge0 server container not found' });

    await dockerRequest('POST', `/containers/${serverContainer.Id}/restart`);
    cachedMetrics = null;
    res.json({ success: true, data: { name: (serverContainer.Names || [])[0], status: 'restarted' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/docker/containers', async (req, res) => {
  try {
    const containers = await dockerRequest('GET', '/containers/json?all=true');
    if (!containers) return res.json({ success: true, data: [] });

    const result = containers.map(c => ({
      id: c.Id ? c.Id.substring(0, 12) : '',
      name: (c.Names || []).join(', ').replace(/^\//, ''),
      image: c.Image || '',
      status: c.State || 'unknown',
      running: c.State === 'running',
      state: c.Status || '',
      ports: (c.Ports || []).map(p => `${p.PublicPort || ''}->${p.PrivatePort}`).filter(Boolean)
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
