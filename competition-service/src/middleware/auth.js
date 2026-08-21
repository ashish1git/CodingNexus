/**
 * competition-service/src/middleware/auth.js
 *
 * JWT-ONLY authentication middleware — no database round-trip.
 *
 * Rationale: The competition module only uses req.user.id and req.user.role.
 * It never reads req.user.studentProfile or req.user.adminProfile, so the
 * full DB lookup done by the monolith's auth.js is unnecessary overhead here.
 *
 * authorizeRole and checkPermission are kept as-is.
 * Note: checkPermission's sub-admin granular check (adminProfile.permissions)
 * is not available in JWT-only mode. admin/superadmin always pass (as before),
 * and sub-admins are treated as having competition permissions granted.
 */

import jwt from 'jsonwebtoken';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach minimal user context from token claims only
    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.',
      });
    }
    next();
  };
};

/**
 * checkPermission — granular permission guard.
 *
 * In JWT-only mode, we cannot read adminProfile.permissions from the DB.
 * Admin and superadmin always pass (same as monolith behaviour).
 * Sub-admins are granted access to all competition endpoints — if you need
 * finer control, embed a `permissions` claim in the JWT at login time and
 * read it from decoded here.
 */
export const checkPermission = (permissionKey) => {
  return (req, res, next) => {
    const { role } = req.user;

    // Full access: admin or superadmin always pass
    if (role === 'admin' || role === 'superadmin') {
      return next();
    }

    // Sub-admin: grant access (no adminProfile available in token-only mode)
    if (role === 'subadmin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Access denied. Insufficient permissions.',
    });
  };
};
