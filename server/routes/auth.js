import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import process from 'node:process';
import prisma from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Student Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, moodleId, batch, phone } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { moodleId: moodleId || undefined }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email or Moodle ID already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and student profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'student',
        moodleId,
        isActive: false, // Requires admin activation
        studentProfile: {
          create: {
            name,
            batch,
            phone
          }
        }
      },
      include: {
        studentProfile: true
      }
    });

    res.json({ 
      success: true, 
      message: 'Account created. Awaiting admin activation.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Student Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Normalize email (handle moodleId@codingnexus.com)
    let normalizedEmail = email;
    if (!email.includes('@')) {
      normalizedEmail = `${email}@codingnexus.com`;
    }

    // Find user by email or moodleId
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { moodleId: email }
        ],
        role: 'student'
      },
      include: {
        studentProfile: true
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        error: 'Account not activated. Please contact admin.' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profile: user.studentProfile,
        studentProfile: user.studentProfile,
        // Add commonly accessed fields
        batch: user.studentProfile?.batch,
        name: user.studentProfile?.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin Login
router.post('/login/admin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email,
        role: { in: ['admin', 'subadmin', 'superadmin'] }
      },
      include: {
        adminProfile: true
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profile: user.adminProfile,
        adminProfile: user.adminProfile,
        // Add commonly accessed fields
        name: user.adminProfile?.name,
        permissions: user.adminProfile?.permissions
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Activate student account (admin only in separate route)
router.post('/activate/:userId', authenticate, async (req, res) => {
  try {
    if (!['admin', 'subadmin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { userId } = req.params;
    const { password } = req.body;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        ...(hashedPassword && { password: hashedPassword })
      }
    });

    res.json({ success: true, message: 'Account activated' });
  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        moodleId: true,
        isActive: true,
        createdAt: true,
        studentProfile: true,
        adminProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    console.log('🔍 /auth/me - User found:', {
      id: user.id,
      email: user.email,
      hasStudentProfile: !!user.studentProfile,
      batch: user.studentProfile?.batch
    });

    // Structure response similar to login - flattened for easy access
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      moodleId: user.moodleId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      // Keep nested profiles for backward compatibility
      profile: user.studentProfile || user.adminProfile,
      studentProfile: user.studentProfile,
      adminProfile: user.adminProfile,
      // Add profile data directly at root level for easy access
      ...(user.studentProfile && {
        batch: user.studentProfile.batch,
        name: user.studentProfile.name,
        phone: user.studentProfile.phone,
        rollNo: user.studentProfile.rollNo,
        profilePhotoUrl: user.studentProfile.profilePhotoUrl
      }),
      ...(user.adminProfile && {
        name: user.adminProfile.name,
        permissions: user.adminProfile.permissions
      })
    };

    console.log('📤 /auth/me - Sending userData:', JSON.stringify(userData, null, 2));

    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
