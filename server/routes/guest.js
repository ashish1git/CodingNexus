// server/routes/guest.js
// NEW: Guest User System - does NOT touch any existing login/signup code
import express from 'express';
import jwt from 'jsonwebtoken';
import process from 'node:process';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/db.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// -----------------------------------------------------------------
// Helper: generate a short-lived guest JWT
// The JWT payload uses the same shape expected by `authenticate`
// middleware so that existing competition/leaderboard routes just work.
// -----------------------------------------------------------------
const generateGuestToken = (guestId) => {
  return jwt.sign(
    { userId: guestId, role: 'guest' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// -----------------------------------------------------------------
// POST /api/guest/join
// - If username exists and session is ACTIVE  → resume (reissue JWT)
// - If username exists but EXPIRED           → create new session (reuse username)
// - If username is free                      → create fresh session
// -----------------------------------------------------------------
router.post('/join', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || String(username).trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Username must be at least 2 characters.' });
    }

    const cleanUsername = String(username).trim();

    // Check for existing session with this username
    const existing = await prisma.guestSession.findFirst({
      where: { username: cleanUsername }
    });

    // ── CASE 1: Active session exists → RESUME ──────────────────────
    if (existing && existing.isActive && existing.expiresAt > new Date()) {
      // Extend expiry by another 24h and reissue JWT
      await prisma.guestSession.update({
        where: { id: existing.id },
        data: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
      });

      const token = generateGuestToken(existing.id);
      return res.json({
        success: true,
        resumed: true,
        token,
        guest: { id: existing.id, username: existing.username, role: 'guest' }
      });
    }

    // ── CASE 2: Session exists but expired → RECYCLE ID/username ────
    if (existing && (!existing.isActive || existing.expiresAt <= new Date())) {
      // Reactivate the same row so the user's historical data is preserved
      const updated = await prisma.guestSession.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
      // Reactivate the shadow user too
      await prisma.user.update({
        where: { id: existing.id },
        data: { isActive: true }
      });

      const token = generateGuestToken(updated.id);
      return res.json({
        success: true,
        resumed: true,
        token,
        guest: { id: updated.id, username: updated.username, role: 'guest' }
      });
    }

    // ── CASE 3: Brand-new username ── create fresh session ──────────
    const dummyEmail = `guest_${cleanUsername.toLowerCase()}_${Date.now()}@guest.codingnexus.com`;
    const dummyPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

    const guest = await prisma.$transaction(async (tx) => {
      const fakeUser = await tx.user.create({
        data: {
          email: dummyEmail,
          password: dummyPassword,
          role: 'guest',
          isActive: true
        }
      });
      return await tx.guestSession.create({
        data: {
          id: fakeUser.id,
          username: cleanUsername,
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
    });

    const token = generateGuestToken(guest.id);
    return res.json({
      success: true,
      resumed: false,
      token,
      guest: { id: guest.id, username: guest.username, role: 'guest' }
    });

  } catch (error) {
    console.error('Guest join error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------
// GET /api/guest/check-username?username=xxx
// Returns { available, resumable } so the frontend can show the
// correct CTA ("Join" vs "Resume Session")
// -----------------------------------------------------------------
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json({ available: false, resumable: false });

    const existing = await prisma.guestSession.findFirst({
      where: { username: String(username).trim(), isActive: true }
    });

    if (!existing) return res.json({ available: true, resumable: false });

    const isExpired = existing.expiresAt <= new Date();
    // Active & not expired → resumable (not "taken")
    // Active but expired   → available for new session
    return res.json({
      available: isExpired,
      resumable: !isExpired
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------
// POST /api/guest/logout  (authenticated — guest token required)
// Marks the session inactive so the username is freed immediately.
// -----------------------------------------------------------------
router.post('/logout', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'guest') {
      return res.status(403).json({ success: false, error: 'Not a guest session' });
    }

    await prisma.guestSession.update({
      where: { id: req.user.id },
      data: { isActive: false }
    });

    return res.json({ success: true, message: 'Guest session ended.' });
  } catch (error) {
    console.error('Guest logout error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// ADMIN — Guest Access Control routes
// All routes below require admin authentication
// =================================================================

// -----------------------------------------------------------------
// GET /api/guest/admin/routes
// Returns list of all guest-accessible route configs
// -----------------------------------------------------------------
router.get('/admin/routes', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const configs = await prisma.guestRouteConfig.findMany({
      orderBy: { route: 'asc' }
    });
    return res.json({ success: true, configs });
  } catch (error) {
    console.error('Fetch guest routes error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------
// PUT /api/guest/admin/routes
// Bulk-save the admin's toggle selections.
// Body: { routes: [{ route, label, isEnabled }] }
// -----------------------------------------------------------------
router.put('/admin/routes', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const { routes } = req.body;

    if (!Array.isArray(routes)) {
      return res.status(400).json({ success: false, error: 'routes must be an array' });
    }

    // Upsert each route config
    await Promise.all(
      routes.map((r) =>
        prisma.guestRouteConfig.upsert({
          where: { route: r.route },
          create: {
            route: r.route,
            label: r.label || r.route,
            isEnabled: !!r.isEnabled,
            updatedBy: req.user.id
          },
          update: {
            isEnabled: !!r.isEnabled,
            label: r.label || r.route,
            updatedBy: req.user.id
          }
        })
      )
    );

    return res.json({ success: true, message: 'Guest route configuration saved.' });
  } catch (error) {
    console.error('Save guest routes error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------
// GET /api/guest/admin/allowed-routes (PUBLIC — called by frontend
// to decide which routes to unlock for guest)
// -----------------------------------------------------------------
router.get('/allowed-routes', async (req, res) => {
  try {
    const configs = await prisma.guestRouteConfig.findMany({
      where: { isEnabled: true },
      select: { route: true, label: true }
    });
    return res.json({ success: true, routes: configs });
  } catch (error) {
    console.error('Fetch allowed routes error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------
// GET /api/guest/admin/sessions
// Returns list of all active guest sessions for the admin to view
// -----------------------------------------------------------------
router.get('/admin/sessions', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const sessions = await prisma.guestSession.findMany({
      where: { isActive: true },          // only return live sessions
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, sessions });
  } catch (error) {
    console.error('Fetch guest sessions error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------
// POST /api/guest/admin/delete-session
// Admin force-removes a guest session (marks inactive + deactivates shadow user)
// -----------------------------------------------------------------
router.post('/admin/delete-session', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId required' });

    await prisma.$transaction(async (tx) => {
      // Hard-delete the GuestSession row first (FK constraint order)
      await tx.guestSession.delete({ where: { id: sessionId } });
      // Hard-delete the shadow User record permanently
      await tx.user.delete({ where: { id: sessionId } });
    });

    return res.json({ success: true, message: 'Guest session permanently deleted.' });
  } catch (error) {
    console.error('Delete guest session error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

