/**
 * Nexi AI guard — server-side safeguards for the chatbot.
 *
 * In-memory, per-process. Single-instance deployment (see nginx.conf upstream),
 * so no Redis needed. All limits are keyed by authenticated student userId —
 * IP-based limits would break behind the nginx proxy and punish shared NATs.
 *
 * Limits (configurable via env, defaults match the production requirement):
 *  - NEXI_MAX_PER_MINUTE   (default 5)   requests / student / rolling minute
 *  - NEXI_MAX_PER_DAY      (default 100) requests / student / rolling day
 *  - NEXI_MAX_ACTIVE       (default 1)   concurrent in-flight requests / student
 *  - NEXI_MAX_CONCURRENT   (default 2)   concurrent generations across all students
 *  - NEXI_QUEUE_SIZE       (default 5)   how many requests wait (per student, after that → 429)
 *  - NEXI_QUEUE_TIMEOUT_MS (default 30000) how long a queued request may wait
 *
 * Errors carry { status, code, retryAfterMs } so the route can map them to
 * proper HTTP responses without duplicating logic.
 */

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const MAX_PER_MINUTE = parseInt(process.env.NEXI_MAX_PER_MINUTE || '5', 10);
const MAX_PER_DAY = parseInt(process.env.NEXI_MAX_PER_DAY || '100', 10);
const MAX_ACTIVE_PER_STUDENT = parseInt(process.env.NEXI_MAX_ACTIVE || '1', 10);
const MAX_GLOBAL_CONCURRENT = parseInt(process.env.NEXI_MAX_CONCURRENT || '2', 10);
const QUEUE_SIZE = parseInt(process.env.NEXI_QUEUE_SIZE || '5', 10);
const QUEUE_TIMEOUT_MS = parseInt(process.env.NEXI_QUEUE_TIMEOUT_MS || '30000', 10);

// ─── In-memory state ─────────────────────────────────────────────────────────

const perUser = new Map();   // userId → { minuteHits: number[], dayHits: number[], active: number, queue: [{resolve,reject,timer}], retryAfterUntil }
let globalActive = 0;       // total in-flight generations across all students

function getBucket(userId) {
  let b = perUser.get(userId);
  if (!b) {
    b = { minuteHits: [], dayHits: [], active: 0, queue: [], retryAfterUntil: 0 };
    perUser.set(userId, b);
  }
  return b;
}

function pruneBuckets(now) {
  for (const [userId, b] of perUser) {
    b.minuteHits = b.minuteHits.filter(t => now - t < MS_PER_MINUTE);
    b.dayHits = b.dayHits.filter(t => now - t < MS_PER_DAY);
    if (!b.minuteHits.length && !b.dayHits.length && b.active === 0) {
      perUser.delete(userId);
    }
  }
}

// Prune old buckets once a minute so the map never grows unbounded.
setInterval(() => pruneBuckets(Date.now()), MS_PER_MINUTE).unref();

function makeLimitError(code, message, retryAfterMs) {
  const e = new Error(message);
  e.status = 429;
  e.code = code;
  e.retryAfterMs = retryAfterMs;
  return e;
}

// ─── Concurrency slot (lease) ────────────────────────────────────────────────

// Global wait queue for concurrency slots (across all students). Per-student
// active caps are enforced separately in acquireSlot.
const globalQueue = [];

/**
 * Try to acquire a global concurrency slot for a user, or queue the request.
 * Resolves with a release() function once a slot is free.
 * Rejects with AI_BUSY (429) if the queue is full or the wait times out.
 */
export async function acquireSlot(userId) {
  const bucket = getBucket(userId);

  // Per-student active-request cap (fail fast — no queueing).
  if (bucket.active >= MAX_ACTIVE_PER_STUDENT) {
    throw makeLimitError(
      'AI_ACTIVE_LIMIT',
      'You already have a chat in progress — please wait for it to finish! 💜',
      MS_PER_MINUTE
    );
  }

  if (globalActive < MAX_GLOBAL_CONCURRENT) {
    globalActive++;
    bucket.active++;
    return () => releaseSlot(userId);
  }

  // Global concurrency full → queue if there's room (per student).
  const myQueued = globalQueue.filter(q => q.userId === userId).length;
  if (myQueued >= QUEUE_SIZE) {
    throw makeLimitError(
      'AI_BUSY',
      'Nexi is super busy right now — too many students chatting at once! Please try again in a minute. 💜',
      MS_PER_MINUTE
    );
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = globalQueue.findIndex(q => q.timer === timer);
      if (idx !== -1) globalQueue.splice(idx, 1);
      reject(makeLimitError(
        'AI_BUSY',
        'Nexi took too long to find a free slot — please try again in a moment. 💜',
        MS_PER_MINUTE
      ));
    }, QUEUE_TIMEOUT_MS);

    globalQueue.push({
      userId,
      resolve: () => {
        clearTimeout(timer);
        const b = perUser.get(userId);
        if (b) b.active = Math.max(0, b.active + 1);
        globalActive++;
        resolve(() => releaseSlot(userId));
      },
      reject,
      timer
    });
  });
}

function releaseSlot(userId) {
  const bucket = perUser.get(userId);
  if (bucket) bucket.active = Math.max(0, bucket.active - 1);
  globalActive = Math.max(0, globalActive - 1);

  // Grant the next queued slot globally (FIFO across all students).
  if (globalQueue.length > 0) {
    const next = globalQueue.shift();
    next.resolve();
  }
}

// ─── Rate limiting ───────────────────────────────────────────────────────────

/**
 * Check per-student rate limits (minute + day). Throws 429 on exceed.
 */
export function checkRateLimit(userId) {
  const bucket = getBucket(userId);
  const now = Date.now();

  // Respect an active rate-limit penalty window.
  if (bucket.retryAfterUntil > now) {
    throw makeLimitError(
      'AI_RATE_LIMIT',
      'Nexi is taking a short breather right now — too many chats at once! Please try again in a minute or two. 💜',
      bucket.retryAfterUntil - now
    );
  }

  bucket.minuteHits = bucket.minuteHits.filter(t => now - t < MS_PER_MINUTE);
  bucket.dayHits = bucket.dayHits.filter(t => now - t < MS_PER_DAY);

  if (bucket.minuteHits.length >= MAX_PER_MINUTE) {
    bucket.retryAfterUntil = now + MS_PER_MINUTE;
    throw makeLimitError(
      'AI_RATE_LIMIT',
      'Nexi is taking a short breather right now — too many chats at once! Please try again in a minute or two. 💜',
      MS_PER_MINUTE
    );
  }

  if (bucket.dayHits.length >= MAX_PER_DAY) {
    bucket.retryAfterUntil = now + MS_PER_DAY;
    throw makeLimitError(
      'AI_RATE_LIMIT',
      "You've reached your daily chat limit — Nexi will be back tomorrow! 💜",
      MS_PER_DAY
    );
  }

  bucket.minuteHits.push(now);
  bucket.dayHits.push(now);
}

/**
 * Run an AI generation under the rate + concurrency guards.
 * @returns {Promise<{ result: *, release: () => void }>}
 */
export async function runGuarded({ userId, fn }) {
  checkRateLimit(userId);
  const release = await acquireSlot(userId);
  try {
    return { result: await fn(), release };
  } catch (err) {
    release();
    throw err;
  }
}
