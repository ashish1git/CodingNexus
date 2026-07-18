import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import process from 'node:process';
import prisma from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { sendEmail } from '../services/email/brevo.service.js';
import { passwordResetOTP } from '../services/email/emailTemplates.js';

const router = express.Router();
const OTP_EXPIRY_MINUTES = 10;
const STUDENT_EMAIL_DOMAIN = '@apsit.edu.in';

// Format Indian-style name ("LastName FirstName MiddleName") to display format ("FirstName LastName")
const formatDisplayName = (name) => {
  if (!name || !name.trim()) return '';
  return name.trim();
};

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
    const { email, password, name, moodleId, batch, phone: rawPhone, mobile } = req.body;
    const phone = rawPhone || mobile;  // accept both field names

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
        isActive: true, // Requires admin activation
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
      message: 'Account created.',
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

    console.log('🔐 Login attempt with:', email);

    // Build search conditions - handle multiple formats
    const searchConditions = [
      { email: email }, // Exact email match (e.g., 23106031@student.mu.ac.in)
      { moodleId: email } // Moodle ID match (e.g., 23106031)
    ];

    // If input doesn't contain @, also try with common email domains
    if (!email.includes('@')) {
      searchConditions.push(
        { email: `${email}${STUDENT_EMAIL_DOMAIN}` },
        { email: `${email}@student.mu.ac.in` },
        { email: `${email}@codingnexus.com` }
      );
    } else {
      // If it has @, also extract the moodleId part and search by that
      const moodleIdPart = email.split('@')[0];
      searchConditions.push({ moodleId: moodleIdPart });
    }

    console.log('🔍 Search conditions:', JSON.stringify(searchConditions));

    // Find user by email or moodleId
    const user = await prisma.user.findFirst({
      where: {
        OR: searchConditions,
        role: 'student'
      },
      include: {
        studentProfile: true
      }
    });

    console.log('👤 User found:', user ? { id: user.id, email: user.email, moodleId: user.moodleId, isActive: user.isActive, hasProfile: !!user.studentProfile, profileData: user.studentProfile } : 'NOT FOUND');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
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
        moodleId: user.moodleId,
        isActive: user.isActive,
        profile: { ...user.studentProfile, name: formatDisplayName(user.studentProfile?.name) },
        studentProfile: { ...user.studentProfile, name: formatDisplayName(user.studentProfile?.name) },
        // Add commonly accessed fields at root level
        batch: user.studentProfile?.batch,
        name: formatDisplayName(user.studentProfile?.name),
        phone: user.studentProfile?.phone,
        rollNo: user.studentProfile?.rollNo,
        profilePhotoUrl: user.studentProfile?.profilePhotoUrl
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

    // Parse permissions if it's a JSON string
    let permissions = user.adminProfile?.permissions || 'all';
    if (typeof permissions === 'string' && permissions !== 'all') {
      try {
        permissions = JSON.parse(permissions);
      } catch (e) {
        console.error('Failed to parse permissions:', e);
        permissions = 'all';
      }
    }

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
        permissions: permissions
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

    // Structure response similar to login - flattened for easy access
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      moodleId: user.moodleId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      // Keep nested profiles for backward compatibility
      profile: user.studentProfile ? { ...user.studentProfile, name: formatDisplayName(user.studentProfile.name) } : user.adminProfile,
      studentProfile: user.studentProfile ? { ...user.studentProfile, name: formatDisplayName(user.studentProfile.name) } : null,
      adminProfile: user.adminProfile,
      // Add profile data directly at root level for easy access
      ...(user.studentProfile && {
        batch: user.studentProfile.batch,
        division: user.studentProfile.division,
        name: formatDisplayName(user.studentProfile.name),
        phone: user.studentProfile.phone,
        rollNo: user.studentProfile.rollNo,
        profilePhotoUrl: user.studentProfile.profilePhotoUrl,
        dsaAccess: user.studentProfile.dsaAccess
      }),
      ...(user.adminProfile && {
        name: user.adminProfile.name,
        permissions: (() => {
          const perms = user.adminProfile.permissions;
          if (!perms || perms === 'all') return 'all';
          if (typeof perms === 'string') {
            try {
              return JSON.parse(perms);
            } catch (e) {
              console.error('Failed to parse permissions:', e);
              return 'all';
            }
          }
          return perms;
        })()
      })
    };

    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate a 6-digit OTP
const generateOTP = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

// Request password reset - send OTP to email
router.post('/forgot-password', async (req, res) => {
  try {
    const { moodleId } = req.body;

    if (!moodleId) {
      return res.status(400).json({ success: false, error: 'Moodle ID is required' });
    }

    const input = moodleId.trim();

    // Build search conditions - handle multiple formats
    const searchConditions = [
      { moodleId: input },
      { email: input }
    ];

    if (!input.includes('@')) {
      searchConditions.push(
        { email: `${input}${STUDENT_EMAIL_DOMAIN}` },
        { email: `${input}@student.mu.ac.in` },
        { email: `${input}@codingnexus.com` }
      );
    } else {
      const moodleIdPart = input.split('@')[0];
      searchConditions.push({ moodleId: moodleIdPart });
    }

    // Find user by moodleId or email
    const user = await prisma.user.findFirst({
      where: {
        OR: searchConditions,
        role: 'student'
      },
      include: {
        studentProfile: true,
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'No account found with this Moodle ID' });
    }

    // Check cooldown — only one password reset per user per 24 hours
    const recentReset = await prisma.passwordResetOTP.findFirst({
      where: {
        userId: user.id,
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentReset) {
      const cooldownEnd = new Date(recentReset.createdAt.getTime() + 24 * 60 * 60 * 1000);
      const msLeft = cooldownEnd - new Date();
      const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
      const minsLeft = Math.ceil((msLeft % (1000 * 60 * 60)) / (1000 * 60));
      const timeStr = hoursLeft > 0
        ? `${hoursLeft}h ${minsLeft}m`
        : `${minsLeft} minute${minsLeft !== 1 ? 's' : ''}`;
      return res.status(429).json({
        success: false,
        error: `Password reset already requested recently. Please try again in ${timeStr}. If urgent, contact the Coding Nexus Team at codingnexus@apsit.edu.in.`
      });
    }

    // Determine the email to send OTP to
    // Handle cases where stored email is just the moodleId without domain
    const userMoodleId = user.moodleId || moodleId;
    let targetEmail = user.email;
    if (!targetEmail || !targetEmail.includes('@')) {
      targetEmail = `${userMoodleId}${STUDENT_EMAIL_DOMAIN}`;
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any existing unused OTPs for this user
    await prisma.passwordResetOTP.updateMany({
      where: {
        userId: user.id,
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      data: { isUsed: true }
    });

    // Store new OTP
    await prisma.passwordResetOTP.create({
      data: {
        userId: user.id,
        otp,
        expiresAt
      }
    });

    // Get student name for email
    const fullName = user.studentProfile?.name || 'Student';
    const nameParts = fullName.trim().split(/\s+/);
    const displayName = nameParts.length >= 2 ? nameParts[1] : nameParts[0];

    // Send OTP via Brevo
    const emailResult = await sendEmail({
      to: targetEmail,
      subject: 'Password Reset OTP - Coding Nexus',
      html: passwordResetOTP(displayName, otp, moodleId),
      text: `Hello ${displayName},\n\nYour OTP for password reset is: ${otp}\n\nThis OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nCoding Nexus Team`
    });

    if (!emailResult.success) {
      console.error('❌ Failed to send OTP email:', emailResult.error);
      return res.status(500).json({ success: false, error: 'Failed to send OTP email. Please try again later.' });
    }

    // Mask email for display
    const emailParts = targetEmail.split('@');
    const maskedLocal = emailParts[0].length > 3
      ? emailParts[0][0] + '***' + emailParts[0][emailParts[0].length - 1]
      : emailParts[0][0] + '***';
    const maskedEmail = `${maskedLocal}@${emailParts[1]}`;

    // Mask name
    const maskedName = displayName.length > 2
      ? displayName[0] + '*'.repeat(displayName.length - 2) + displayName[displayName.length - 1]
      : displayName;

    res.json({
      success: true,
      data: {
        maskedName,
        maskedEmail,
        message: `OTP sent to ${maskedEmail}`
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify OTP only (separate from password reset)
router.post('/verify-otp', async (req, res) => {
  try {
    const { moodleId, otp } = req.body;

    if (!moodleId || !otp) {
      return res.status(400).json({ success: false, error: 'Moodle ID and OTP are required' });
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, error: 'OTP must be a 6-digit number' });
    }

    const input = moodleId.trim();
    const searchConditions = [
      { moodleId: input },
      { email: input }
    ];

    if (!input.includes('@')) {
      searchConditions.push(
        { email: `${input}${STUDENT_EMAIL_DOMAIN}` },
        { email: `${input}@student.mu.ac.in` },
        { email: `${input}@codingnexus.com` }
      );
    } else {
      const moodleIdPart = input.split('@')[0];
      searchConditions.push({ moodleId: moodleIdPart });
    }

    const user = await prisma.user.findFirst({
      where: { OR: searchConditions, role: 'student' }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    const otpRecord = await prisma.passwordResetOTP.findFirst({
      where: {
        userId: user.id,
        otp,
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP. Please request a new one.' });
    }

    // OTP is valid — pass otpId so the reset step can use the same OTP record
    res.json({
      success: true,
      data: { otpId: otpRecord.id }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify OTP and reset password
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { moodleId, otp, newPassword } = req.body;

    if (!moodleId || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Moodle ID, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, error: 'OTP must be a 6-digit number' });
    }

    const input = moodleId.trim();

    // Build search conditions
    const searchConditions = [
      { moodleId: input },
      { email: input }
    ];

    if (!input.includes('@')) {
      searchConditions.push(
        { email: `${input}${STUDENT_EMAIL_DOMAIN}` },
        { email: `${input}@student.mu.ac.in` },
        { email: `${input}@codingnexus.com` }
      );
    } else {
      const moodleIdPart = input.split('@')[0];
      searchConditions.push({ moodleId: moodleIdPart });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: searchConditions,
        role: 'student'
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    // Find valid OTP
    const otpRecord = await prisma.passwordResetOTP.findFirst({
      where: {
        userId: user.id,
        otp,
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP. Please request a new one.' });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Mark OTP as used
    await prisma.passwordResetOTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true }
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
