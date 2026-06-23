/**
 * Modular server logger utility.
 *
 * Provides consistent logging levels and reduces noise.
 * - info: General operational messages
 * - warn: Warning conditions
 * - error: Error conditions
 * - debug: Verbose debug details (only shown if DEBUG=true)
 */

const IS_DEBUG = process.env.DEBUG === 'true';

const log = (level, emoji, ...args) => {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] ${emoji} [${level.toUpperCase()}]`, ...args);
};

const logger = {
  info: (...args) => log('info', 'ℹ️', ...args),
  ok: (...args) => log('ok', '✅', ...args),
  warn: (...args) => log('warn', '⚠️', ...args),
  error: (...args) => log('error', '❌', ...args),

  /** Debug only shows when DEBUG=true env var is set. */
  debug: (...args) => {
    if (IS_DEBUG) log('debug', '🔍', ...args);
  },

  /** Log an API request in a single line. */
  apiRequest: (req) => {
    log('info', '📨', `${req.method} ${req.path}`);
  },
};

export default logger;
