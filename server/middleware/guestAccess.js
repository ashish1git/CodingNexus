// server/middleware/guestAccess.js
// NEW: Middleware to enforce admin-configured guest route access.
// Import and use this in any route file you wish to gate by the admin config.
//
// Usage:
//   import { requireGuestAllowed } from '../middleware/guestAccess.js';
//   router.get('/some-route', requireGuestAllowed('/frontend/path'), handler);
//
// For guest users the middleware checks the GuestRouteConfig table.
// For regular authenticated users it always passes through (no change to existing behaviour).

import prisma from '../config/db.js';

// Cache allowed routes for 60 s to avoid hitting DB on every request
let _routeCache = null;
let _cacheExpiry = 0;

async function getEnabledRoutes() {
  const now = Date.now();
  if (_routeCache && now < _cacheExpiry) return _routeCache;

  const configs = await prisma.guestRouteConfig.findMany({
    where: { isEnabled: true },
    select: { route: true }
  });

  _routeCache = configs.map((c) => c.route);
  _cacheExpiry = now + 60_000; // 60 s cache
  return _routeCache;
}

// Call this to invalidate cache after admin saves (optional, handled automatically by TTL)
export function invalidateGuestRouteCache() {
  _routeCache = null;
  _cacheExpiry = 0;
}

/**
 * Middleware factory: checks whether a guest is permitted on a given frontend path.
 * Regular (non-guest) users are always allowed through.
 *
 * @param {string} frontendPath  - The frontend route path e.g. '/student/competitions'
 */
export function requireGuestAllowed(frontendPath) {
  return async (req, res, next) => {
    // Non-guest users: pass through without any change
    if (!req.user || req.user.role !== 'guest') {
      return next();
    }

    // Guest user: check if admin has enabled this route
    try {
      const enabledRoutes = await getEnabledRoutes();
      const isAllowed = enabledRoutes.some((r) => {
        // Exact match OR prefix match for wildcard-style paths
        return frontendPath === r || frontendPath.startsWith(r);
      });

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          error: 'Guest access to this route is not permitted by the administrator.'
        });
      }

      return next();
    } catch (error) {
      console.error('Guest access check error:', error);
      return res.status(500).json({ success: false, error: 'Could not verify guest access.' });
    }
  };
}

/**
 * Standalone middleware: blocks guests from routes that require a full account.
 * Use on routes like /profile, /settings etc.
 */
export function blockGuests(req, res, next) {
  if (req.user && req.user.role === 'guest') {
    return res.status(403).json({
      success: false,
      error: 'This feature is not available to guest users.'
    });
  }
  return next();
}
