import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/db.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import upload, { uploadToCloudinary } from '../middleware/upload.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorizeRole('admin', 'subadmin', 'superadmin'));

// ============ USER/ADMIN LOOKUP ============

// Get user details by ID (for fetching evaluator names)
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminProfile: {
          select: {
            name: true,
            permissions: true
          }
        },
        studentProfile: {
          select: {
            name: true,
            rollNo: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user details' });
  }
});

// ============ STUDENT MANAGEMENT ============

// Create student (admin only) - auto-activated
router.post('/students', async (req, res) => {
  try {
    const { email, password, name, moodleId, batch, phone, rollNo } = req.body;

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

    // Create user and student profile - AUTO-ACTIVATED since created by admin
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'student',
        moodleId,
        isActive: true, // Auto-activate when admin creates student
        studentProfile: {
          create: {
            name,
            rollNo,
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
      message: 'Student created and activated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        name: user.studentProfile.name
      }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      include: {
        studentProfile: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ 
      success: true, 
      students: students.map(u => {
        const student = u.studentProfile || {};
        return {
          id: u.id,
          userId: u.id,
          studentId: student.id,
          email: u.email,
          moodleId: u.moodleId,
          isActive: u.isActive,
          name: student.name,
          rollNo: student.rollNo,
          batch: student.batch,
          phone: student.phone,
          profilePhotoUrl: student.profilePhotoUrl,
          createdAt: u.createdAt
        };
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update student
router.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, batch, phone, profilePhotoUrl, isActive } = req.body;

    console.log('🔧 UPDATE REQUEST for student:', id);
    console.log('📦 Request body:', { name, batch, phone, profilePhotoUrl, isActive });

    // Update user
    if (isActive !== undefined) {
      await prisma.user.update({
        where: { id },
        data: { isActive }
      });
    }

    // Build update object with only defined fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (batch !== undefined) updateData.batch = batch;
    if (phone !== undefined) updateData.phone = phone;
    if (profilePhotoUrl !== undefined) updateData.profilePhotoUrl = profilePhotoUrl;
    
    console.log('🎯 Update data for Prisma:', updateData);

    // Only perform update if there's data to update
    if (Object.keys(updateData).length === 0) {
      console.log('⚠️ No fields to update, skipping Prisma upsert');
      // Still fetch and return current state
      const currentUser = await prisma.user.findUnique({
        where: { id },
        include: {
          studentProfile: true
        }
      });
      
      return res.json({ 
        success: true,
        student: {
          id: currentUser.id,
          userId: currentUser.id,
          email: currentUser.email,
          moodleId: currentUser.moodleId,
          isActive: currentUser.isActive,
          name: currentUser.studentProfile?.name,
          rollNo: currentUser.studentProfile?.rollNo,
          batch: currentUser.studentProfile?.batch,
          phone: currentUser.studentProfile?.phone,
          profilePhotoUrl: currentUser.studentProfile?.profilePhotoUrl
        }
      });
    }

    // Update or create student profile
    const studentProfile = await prisma.student.upsert({
      where: { userId: id },
      update: updateData,
      create: {
        userId: id,
        name: name || 'Student',
        batch: batch || 'Basic',
        phone,
        profilePhotoUrl
      }
    });
    
    console.log('💾 Prisma upsert result:', studentProfile);

    // Fetch the complete updated user with student profile
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true
      }
    });
    
    console.log('✅ Final updated user:', updatedUser);
    console.log('🎯 Final batch value:', updatedUser.studentProfile?.batch);

    const responseData = { 
      success: true,
      student: {
        id: updatedUser.id,
        userId: updatedUser.id,
        email: updatedUser.email,
        moodleId: updatedUser.moodleId,
        isActive: updatedUser.isActive,
        name: updatedUser.studentProfile?.name,
        rollNo: updatedUser.studentProfile?.rollNo,
        batch: updatedUser.studentProfile?.batch,
        phone: updatedUser.studentProfile?.phone,
        profilePhotoUrl: updatedUser.studentProfile?.profilePhotoUrl
      }
    };
    
    console.log('📤 Sending response:', responseData);
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete student
router.delete('/students/:id', async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ FILE UPLOAD ============

// Upload file to Cloudinary
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'codingnexus');

    res.json({
      success: true,
      fileUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ NOTES MANAGEMENT ============

// Upload note
router.post('/notes', async (req, res) => {
  try {
    const { title, description, fileUrl, batch, subject } = req.body;

    // Extract file format from URL or default to pdf
    let fileFormat = 'pdf';
    if (fileUrl && fileUrl.includes('.')) {
      const match = fileUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      if (match) {
        fileFormat = match[1].toLowerCase();
      }
    }

    const note = await prisma.note.create({
      data: {
        title,
        description,
        fileUrl,
        batch,
        subject,
        uploadedBy: req.user.id
      }
    });

    // Return note with additional computed fields for frontend
    res.json({ 
      success: true,
      note: {
        ...note,
        fileFormat,
        fileName: title + '.' + fileFormat
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all notes
router.get('/notes', async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { uploadedAt: 'desc' }
    });
    
    // Get admin names for each note
    const enrichedNotes = await Promise.all(notes.map(async (note) => {
      let fileFormat = 'pdf';
      if (note.fileUrl && note.fileUrl.includes('.')) {
        const match = note.fileUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        if (match) {
          fileFormat = match[1].toLowerCase();
        }
      }
      
      // Get admin details
      let uploadedByName = 'Unknown';
      try {
        const user = await prisma.user.findUnique({
          where: { id: note.uploadedBy },
          select: {
            email: true,
            adminProfile: {
              select: { name: true }
            }
          }
        });
        
        if (user?.adminProfile?.name) {
          uploadedByName = user.adminProfile.name;
        } else if (user?.email) {
          uploadedByName = user.email.split('@')[0];
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
      
      return {
        ...note,
        fileFormat,
        fileName: note.title + '.' + fileFormat,
        uploadedByName
      };
    }));
    
    res.json({ success: true, notes: enrichedNotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete note
router.delete('/notes/:id', async (req, res) => {
  try {
    await prisma.note.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ANNOUNCEMENTS ============

// Create announcement
router.post('/announcements', async (req, res) => {
  try {
    const { title, message, batch, priority } = req.body;

    await prisma.announcement.create({
      data: {
        title,
        message,
        batch,
        priority: priority || 'normal',
        createdBy: req.user.id
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all announcements
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update announcement
router.put('/announcements/:id', async (req, res) => {
  try {
    await prisma.announcement.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete announcement
router.delete('/announcements/:id', async (req, res) => {
  try {
    await prisma.announcement.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ATTENDANCE SYSTEM (CHEATING-PROOF VERSION) ============

// Helper: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Helper: Generate secure QR code
function generateSecureQR() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return `NEXUS_${timestamp}_${random}`;
}

// Create attendance session with geolocation
router.post('/attendance/session', async (req, res) => {
  try {
    const { batch, date, sessionType, startTime, location, latitude, longitude, maxDistance = 100, codeValidity = 30 } = req.body;

    // Generate secure QR code
    const qrCode = generateSecureQR();
    const qrExpiresAt = new Date(Date.now() + codeValidity * 60 * 1000); // codeValidity in minutes

    const session = await prisma.attendanceSession.create({
      data: {
        batch,
        date: new Date(date),
        sessionType: sessionType || 'regular',
        startTime: new Date(startTime || Date.now()),
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        maxDistance: parseInt(maxDistance),
        qrCode,
        qrExpiresAt,
        createdBy: req.user.id
      }
    });

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Refresh QR code for a session
router.post('/attendance/session/:id/refresh-qr', async (req, res) => {
  try {
    const qrCode = generateSecureQR();
    const qrExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const session = await prisma.attendanceSession.update({
      where: { id: req.params.id },
      data: { qrCode, qrExpiresAt }
    });

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all sessions
router.get('/attendance/sessions', async (req, res) => {
  try {
    const { batch, startDate, endDate, isActive } = req.query;
    
    const where = {};
    if (batch) where.batch = batch;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        records: {
          include: {
            user: {
              include: {
                studentProfile: true
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get session by ID
router.get('/attendance/session/:id', async (req, res) => {
  try {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: req.params.id },
      include: {
        records: {
          include: {
            user: {
              include: {
                studentProfile: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark attendance (bulk or individual)
router.post('/attendance/mark', async (req, res) => {
  try {
    const { sessionId, records, method = 'manual' } = req.body;

    // Validate session exists and is active
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (!session.isActive) {
      return res.status(400).json({ success: false, error: 'Session is closed' });
    }

    // Mark attendance for each student
    const markedRecords = await Promise.all(
      records.map(async (record) => {
        return await prisma.attendanceRecord.upsert({
          where: {
            sessionId_userId: {
              sessionId,
              userId: record.userId
            }
          },
          create: {
            sessionId,
            userId: record.userId,
            status: record.status || 'present',
            markedBy: req.user.id,
            markedMethod: method,
            latitude: record.latitude,
            longitude: record.longitude,
            ipAddress: req.ip,
            deviceInfo: req.headers['user-agent'],
            notes: record.notes
          },
          update: {
            status: record.status || 'present',
            markedBy: req.user.id,
            markedAt: new Date(),
            notes: record.notes
          }
        });
      })
    );

    // Update session statistics
    const allRecords = await prisma.attendanceRecord.findMany({
      where: { sessionId }
    });

    const stats = {
      presentCount: allRecords.filter(r => r.status === 'present').length,
      absentCount: allRecords.filter(r => r.status === 'absent').length,
      lateCount: allRecords.filter(r => r.status === 'late').length,
      totalStudents: allRecords.length
    };

    stats.attendanceRate = stats.totalStudents > 0 
      ? (stats.presentCount + stats.lateCount) / stats.totalStudents * 100 
      : 0;

    await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: stats
    });

    res.json({ success: true, records: markedRecords, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark attendance by QR code with GEOLOCATION VERIFICATION
router.post('/attendance/mark-qr', async (req, res) => {
  try {
    const { qrCode, userId, latitude, longitude, deviceFingerprint } = req.body;

    // Find active session with valid QR code
    const session = await prisma.attendanceSession.findFirst({
      where: {
        qrCode,
        isActive: true,
        qrExpiresAt: {
          gte: new Date()
        }
      }
    });

    if (!session) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired QR code. Please ask your instructor for a new code.' 
      });
    }

    // Check if already marked
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId
        }
      }
    });

    if (existingRecord) {
      return res.status(400).json({ 
        success: false, 
        error: 'Attendance already marked for this session' 
      });
    }

    // GEOLOCATION VERIFICATION - Check if student is within allowed distance
    let distanceFromSession = null;
    let locationVerified = false;
    
    if (session.latitude && session.longitude && latitude && longitude) {
      distanceFromSession = calculateDistance(
        session.latitude, 
        session.longitude, 
        parseFloat(latitude), 
        parseFloat(longitude)
      );
      
      // Check if within max allowed distance (default 100 meters)
      const maxDistance = session.maxDistance || 100;
      if (distanceFromSession > maxDistance) {
        return res.status(400).json({ 
          success: false, 
          error: `You must be within ${maxDistance}m of the session location. You are ${Math.round(distanceFromSession)}m away.`,
          distance: Math.round(distanceFromSession),
          maxAllowed: maxDistance
        });
      }
      locationVerified = true;
    }

    // Mark attendance
    const record = await prisma.attendanceRecord.create({
      data: {
        sessionId: session.id,
        userId,
        status: 'present',
        markedBy: userId,
        markedMethod: 'qr',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        distanceFromSession: distanceFromSession ? Math.round(distanceFromSession) : null,
        locationVerified,
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent'],
        deviceFingerprint
      }
    });

    // Update session stats
    const allRecords = await prisma.attendanceRecord.findMany({
      where: { sessionId: session.id }
    });

    const stats = {
      presentCount: allRecords.filter(r => r.status === 'present').length,
      lateCount: allRecords.filter(r => r.status === 'late').length,
      totalStudents: allRecords.length
    };

    await prisma.attendanceSession.update({
      where: { id: session.id },
      data: {
        presentCount: stats.presentCount,
        lateCount: stats.lateCount
      }
    });

    res.json({ 
      success: true, 
      record, 
      session,
      message: locationVerified 
        ? `Attendance marked! Location verified (${Math.round(distanceFromSession)}m from session)`
        : 'Attendance marked successfully!'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ MANUAL ATTENDANCE (Without Session) ============

// Mark manual attendance
router.post('/attendance/manual', async (req, res) => {
  try {
    const { userId, status, date, batch, startTime, endTime, duration } = req.body;
    const markedBy = req.user.id;

    console.log('📝 Manual attendance request:', { userId, status, date, batch, startTime, endTime, duration });

    // Normalize date to UTC midnight to avoid timezone issues
    const normalizedDate = new Date(date + 'T00:00:00.000Z');

    // Upsert attendance record in the legacy Attendance table
    const record = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId,
          date: normalizedDate
        }
      },
      create: {
        userId,
        date: normalizedDate,
        status,
        batch,
        markedBy,
        startTime,
        endTime,
        duration
      },
      update: {
        status,
        markedBy,
        markedAt: new Date(),
        startTime,
        endTime,
        duration
      }
    });

    console.log('✅ Manual attendance saved:', record);
    res.json({ success: true, record });
  } catch (error) {
    console.error('❌ Manual attendance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get manual attendance for a date/batch
router.get('/attendance/manual', async (req, res) => {
  try {
    const { date, batch } = req.query;

    const records = await prisma.attendance.findMany({
      where: {
        date: new Date(date),
        batch
      },
      include: {
        user: {
          include: {
            studentProfile: true
          }
        }
      }
    });

    res.json({ success: true, records });
  } catch (error) {
    console.error('Get manual attendance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Close attendance session
router.put('/attendance/session/:id/close', async (req, res) => {
  try {
    const session = await prisma.attendanceSession.update({
      where: { id: req.params.id },
      data: {
        isActive: false,
        endTime: new Date()
      }
    });

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete attendance session
router.delete('/attendance/session/:id', async (req, res) => {
  try {
    // First delete all attendance records for this session (using correct model)
    await prisma.attendanceRecord.deleteMany({
      where: { sessionId: req.params.id }
    });

    // Then delete the session itself
    await prisma.attendanceSession.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete attendance record (for manual attendance)
router.delete('/attendance/manual/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const normalizedDate = new Date(date + 'T00:00:00.000Z');

    await prisma.attendance.delete({
      where: {
        userId_date: {
          userId,
          date: normalizedDate
        }
      }
    });

    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete attendance record from session
router.delete('/attendance/record/:sessionId/:userId', async (req, res) => {
  try {
    const { sessionId, userId } = req.params;

    await prisma.attendanceRecord.delete({
      where: {
        sessionId_userId: {
          sessionId,
          userId
        }
      }
    });

    // Update session stats
    const allRecords = await prisma.attendanceRecord.findMany({
      where: { sessionId }
    });

    const stats = {
      presentCount: allRecords.filter(r => r.status === 'present').length,
      lateCount: allRecords.filter(r => r.status === 'late').length,
      absentCount: allRecords.filter(r => r.status === 'absent').length,
      totalStudents: allRecords.length
    };

    stats.attendanceRate = stats.totalStudents > 0 
      ? (stats.presentCount + stats.lateCount) / stats.totalStudents * 100 
      : 0;

    await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: stats
    });

    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance record error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get attendance analytics with batch comparison
router.get('/attendance/analytics', async (req, res) => {
  try {
    const { batch, startDate, endDate } = req.query;

    const where = {};
    if (batch && batch !== 'all') where.batch = batch;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        records: {
          include: {
            user: {
              include: {
                studentProfile: true
              }
            }
          }
        }
      }
    });

    // Get all students for each batch
    const allStudents = await prisma.student.findMany({
      include: { user: true }
    });

    // Calculate analytics
    const totalSessions = sessions.length;
    const avgAttendanceRate = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / sessions.length
      : 0;

    // Batch-wise statistics for comparison
    const batchStats = {
      Basic: { sessions: 0, avgRate: 0, totalStudents: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0 },
      Advanced: { sessions: 0, avgRate: 0, totalStudents: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0 }
    };

    sessions.forEach(session => {
      if (batchStats[session.batch]) {
        batchStats[session.batch].sessions++;
        batchStats[session.batch].totalPresent += session.presentCount || 0;
        batchStats[session.batch].totalLate += session.lateCount || 0;
        batchStats[session.batch].totalAbsent += session.absentCount || 0;
        batchStats[session.batch].totalStudents += session.totalStudents || 0;
      }
    });

    // Calculate avg rates for batches
    Object.keys(batchStats).forEach(batch => {
      const stats = batchStats[batch];
      stats.avgRate = stats.totalStudents > 0 
        ? ((stats.totalPresent + stats.totalLate) / stats.totalStudents * 100).toFixed(1)
        : 0;
    });

    // Student-wise statistics
    const studentStats = {};
    
    // Initialize all students
    allStudents.forEach(student => {
      studentStats[student.userId] = {
        userId: student.userId,
        name: student.name,
        batch: student.batch,
        rollNumber: student.rollNumber,
        moodleId: student.moodleId,
        email: student.user?.email,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        percentage: 0,
        streak: 0,
        lastAttendance: null,
        qrAttendances: 0,
        manualAttendances: 0
      };
    });

    sessions.forEach(session => {
      session.records.forEach(record => {
        if (studentStats[record.userId]) {
          studentStats[record.userId].total++;
          if (record.status === 'present') studentStats[record.userId].present++;
          if (record.status === 'absent') studentStats[record.userId].absent++;
          if (record.status === 'late') studentStats[record.userId].late++;
          if (record.markedMethod === 'qr') studentStats[record.userId].qrAttendances++;
          if (record.markedMethod === 'manual') studentStats[record.userId].manualAttendances++;
          if (!studentStats[record.userId].lastAttendance || 
              new Date(record.markedAt) > new Date(studentStats[record.userId].lastAttendance)) {
            studentStats[record.userId].lastAttendance = record.markedAt;
          }
        }
      });
    });

    // Calculate percentages and rank students
    const studentList = Object.values(studentStats).map(stat => ({
      ...stat,
      percentage: stat.total > 0
        ? parseFloat(((stat.present + stat.late) / stat.total * 100).toFixed(1))
        : 0
    })).sort((a, b) => b.percentage - a.percentage);

    // Top performers and at-risk students
    const topPerformers = studentList.filter(s => s.percentage >= 90).slice(0, 5);
    const atRisk = studentList.filter(s => s.percentage < 75 && s.total > 0);

    // Monthly trends for chart
    const monthlyTrends = sessions.reduce((acc, session) => {
      const monthKey = session.date.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, Basic: 0, Advanced: 0, BasicSessions: 0, AdvancedSessions: 0 };
      }
      if (session.batch === 'Basic') {
        acc[monthKey].Basic += session.attendanceRate || 0;
        acc[monthKey].BasicSessions++;
      } else if (session.batch === 'Advanced') {
        acc[monthKey].Advanced += session.attendanceRate || 0;
        acc[monthKey].AdvancedSessions++;
      }
      return acc;
    }, {});

    // Average the monthly trends
    const monthlyData = Object.values(monthlyTrends).map(m => ({
      month: m.month,
      Basic: m.BasicSessions > 0 ? parseFloat((m.Basic / m.BasicSessions).toFixed(1)) : 0,
      Advanced: m.AdvancedSessions > 0 ? parseFloat((m.Advanced / m.AdvancedSessions).toFixed(1)) : 0
    })).sort((a, b) => a.month.localeCompare(b.month));

    // Daily trends
    const dailyTrends = sessions.reduce((acc, session) => {
      const dateKey = session.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, sessions: 0, avgRate: 0, totalRate: 0 };
      }
      acc[dateKey].sessions++;
      acc[dateKey].totalRate += session.attendanceRate || 0;
      acc[dateKey].avgRate = acc[dateKey].totalRate / acc[dateKey].sessions;
      return acc;
    }, {});

    res.json({
      success: true,
      analytics: {
        totalSessions,
        avgAttendanceRate: parseFloat(avgAttendanceRate.toFixed(1)),
        batchStats,
        studentStats: studentList,
        topPerformers,
        atRisk,
        monthlyTrends: monthlyData,
        dailyTrends: Object.values(dailyTrends).sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        ),
        totalStudents: allStudents.length
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get detailed student attendance history
router.get('/attendance/student/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Get all attendance records for this student
    const records = await prisma.attendanceRecord.findMany({
      where: { userId },
      include: {
        session: true
      },
      orderBy: { markedAt: 'desc' }
    });

    // Calculate statistics
    const stats = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      late: records.filter(r => r.status === 'late').length,
      absent: records.filter(r => r.status === 'absent').length,
      qrMarked: records.filter(r => r.markedMethod === 'qr').length,
      manualMarked: records.filter(r => r.markedMethod === 'manual').length,
      locationVerified: records.filter(r => r.locationVerified).length
    };
    
    stats.percentage = stats.total > 0 
      ? parseFloat(((stats.present + stats.late) / stats.total * 100).toFixed(1))
      : 0;

    // Monthly breakdown
    const monthlyBreakdown = records.reduce((acc, record) => {
      const month = new Date(record.markedAt).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { month, present: 0, late: 0, absent: 0, total: 0 };
      }
      acc[month].total++;
      if (record.status === 'present') acc[month].present++;
      if (record.status === 'late') acc[month].late++;
      if (record.status === 'absent') acc[month].absent++;
      return acc;
    }, {});

    // Calculate streaks
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    
    const sortedRecords = [...records].sort((a, b) => new Date(a.markedAt) - new Date(b.markedAt));
    sortedRecords.forEach(record => {
      if (record.status === 'present' || record.status === 'late') {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    });
    
    // Current streak from most recent
    for (let i = records.length - 1; i >= 0; i--) {
      if (records[i].status === 'present' || records[i].status === 'late') {
        currentStreak++;
      } else {
        break;
      }
    }

    res.json({
      success: true,
      student: {
        ...student,
        email: student.user?.email
      },
      stats: {
        ...stats,
        currentStreak,
        maxStreak
      },
      records: records.map(r => ({
        id: r.id,
        date: r.session.date,
        sessionType: r.session.sessionType,
        location: r.session.location,
        status: r.status,
        markedMethod: r.markedMethod,
        markedAt: r.markedAt,
        locationVerified: r.locationVerified,
        distanceFromSession: r.distanceFromSession
      })),
      monthlyBreakdown: Object.values(monthlyBreakdown).sort((a, b) => a.month.localeCompare(b.month))
    });
  } catch (error) {
    console.error('Student attendance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export attendance report
router.get('/attendance/export', async (req, res) => {
  try {
    const { batch, startDate, endDate, format = 'json' } = req.query;

    const where = {};
    if (batch) where.batch = batch;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        records: {
          include: {
            user: {
              include: {
                studentProfile: true
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Format data
    const reportData = sessions.map(session => ({
      date: session.date,
      batch: session.batch,
      sessionType: session.sessionType,
      location: session.location,
      totalStudents: session.totalStudents,
      presentCount: session.presentCount,
      absentCount: session.absentCount,
      lateCount: session.lateCount,
      attendanceRate: session.attendanceRate,
      records: session.records.map(r => ({
        studentName: r.user.studentProfile?.name,
        rollNo: r.user.studentProfile?.rollNo,
        moodleId: r.user.moodleId,
        status: r.status,
        markedAt: r.markedAt,
        markedMethod: r.markedMethod
      }))
    }));

    res.json({ success: true, report: reportData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ LEGACY ATTENDANCE (BACKWARD COMPATIBILITY) ============

// Mark attendance
router.post('/attendance', async (req, res) => {
  try {
    const { userId, date, status, batch } = req.body;

    await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId,
          date: new Date(date)
        }
      },
      create: {
        userId,
        date: new Date(date),
        status,
        batch,
        markedBy: req.user.id
      },
      update: {
        status,
        markedBy: req.user.id
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get attendance by date
router.get('/attendance/:date', async (req, res) => {
  try {
    const attendance = await prisma.attendance.findMany({
      where: {
        date: new Date(req.params.date)
      },
      include: {
        user: {
          include: {
            studentProfile: true
          }
        }
      }
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ QUIZZES ============

// Create quiz
router.post('/quizzes', async (req, res) => {
  try {
    const { title, description, batch, startTime, endTime, duration, questions } = req.body;
    
    console.log('📝 Creating quiz:', {
      title,
      batch,
      duration,
      questionsCount: Array.isArray(questions) ? questions.length : 0,
      createdBy: req.user.id
    });

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        batch,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        duration,
        questions,
        createdBy: req.user.id
      }
    });

    console.log('✅ Quiz created successfully:', quiz.id);

    res.json({ success: true, quiz });
  } catch (error) {
    console.error('❌ Quiz creation error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all quizzes
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, quizzes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get quiz submissions (all student attempts for a quiz) - MUST BE BEFORE :id route
router.get('/quizzes/:id/submissions', async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: {
        attempts: {
          include: {
            user: {
              include: {
                studentProfile: true
              }
            }
          },
          orderBy: { submittedAt: 'desc' }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    const submissions = quiz.attempts.map(attempt => ({
      id: attempt.id,
      studentName: attempt.user?.studentProfile?.name || 'Unknown',
      studentRollNo: attempt.user?.studentProfile?.rollNo || 'N/A',
      studentEmail: attempt.user?.email,
      studentBatch: attempt.user?.studentProfile?.batch || 'Unknown',
      answers: attempt.answers,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: ((attempt.score / attempt.maxScore) * 100).toFixed(2),
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt
    }));

    res.json({ 
      success: true, 
      quiz: {
        id: quiz.id,
        title: quiz.title,
        questions: quiz.questions,
        duration: quiz.duration,
        batch: quiz.batch
      },
      submissions 
    });
  } catch (error) {
    console.error('❌ Get quiz submissions error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single quiz by ID - MUST BE AFTER submissions route
router.get('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id }
    });
    
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    
    res.json({ success: true, quiz });
  } catch (error) {
    console.error('❌ Get quiz error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update quiz
router.put('/quizzes/:id', async (req, res) => {
  try {
    const { startTime, endTime, ...rest } = req.body;
    
    const updateData = { ...rest };
    if (startTime) {
      updateData.startTime = new Date(startTime);
    }
    if (endTime) {
      updateData.endTime = new Date(endTime);
    }

    await prisma.quiz.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete quiz
router.delete('/quizzes/:id', async (req, res) => {
  try {
    await prisma.quiz.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ TICKETS ============

// Get all tickets
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        user: {
          include: {
            studentProfile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mappedTickets = tickets.map(ticket => ({
      ...ticket,
      studentName: ticket.user?.studentProfile?.name || 'Unknown',
      studentRollNo: ticket.user?.studentProfile?.rollNo || 'N/A',
      responses: ticket.response ? (() => {
        try {
          return JSON.parse(ticket.response);
        } catch (e) {
          return [];
        }
      })() : []
    }));

    res.json({ success: true, tickets: mappedTickets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update ticket
router.put('/tickets/:id', async (req, res) => {
  try {
    const { status, reply } = req.body;
    
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const updateData = {};
    
    if (status) {
      updateData.status = status;
    }
    
    if (reply && reply.trim()) {
      let responses = [];
      if (ticket.response) {
        try {
          responses = JSON.parse(ticket.response);
        } catch (e) {
          responses = [];
        }
      }
      
      responses.push({
        from: 'admin',
        name: req.user.adminProfile?.name || 'Admin',
        timestamp: new Date().toISOString(),
        message: reply.trim()
      });
      
      updateData.response = JSON.stringify(responses);
    }
    
    updateData.respondedBy = req.user.id;
    updateData.respondedAt = new Date();

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: updateData
    });

    // Parse responses for response
    const responseData = updatedTicket.response ? (() => {
      try {
        return JSON.parse(updatedTicket.response);
      } catch (e) {
        return [];
      }
    })() : [];

    res.json({ 
      success: true, 
      data: {
        ...updatedTicket,
        responses: responseData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ SUB-ADMIN MANAGEMENT ============

// Get all sub-admins
router.get('/subadmins', async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'subadmin' },
      include: {
        adminProfile: true
      }
    });

    // Filter out users without admin profiles
    const validAdmins = admins.filter(u => u.adminProfile);

    res.json({ 
      success: true, 
      subAdmins: validAdmins.map(u => ({
        id: u.id,
        userId: u.id,
        adminId: u.adminProfile.id,
        email: u.email,
        name: u.adminProfile.name,
        permissions: u.adminProfile.permissions ? 
          (u.adminProfile.permissions === 'all' ? 'all' : JSON.parse(u.adminProfile.permissions)) 
          : 'all'
      }))
    });
  } catch (error) {
    console.error('Get subadmins error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create sub-admin
router.post('/subadmins', async (req, res) => {
  try {
    const { email, password, name, permissions } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'subadmin',
        isActive: true,
        adminProfile: {
          create: {
            name,
            permissions: typeof permissions === 'object' ? JSON.stringify(permissions) : (permissions || 'all'),
            createdBy: req.user.id
          }
        }
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update sub-admin
router.put('/subadmins/:id', async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const userId = req.params.id;

    console.log('Update request for user:', userId, 'with permissions:', permissions);

    // First, verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { adminProfile: true }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    if (user.role !== 'subadmin') {
      return res.status(400).json({ 
        success: false, 
        error: 'User is not a sub-admin' 
      });
    }

    if (!user.adminProfile) {
      return res.status(400).json({ 
        success: false, 
        error: 'Admin profile not found. Please contact support.' 
      });
    }

    // Update the admin profile
    const updated = await prisma.admin.update({
      where: { userId },
      data: { 
        name, 
        permissions: typeof permissions === 'object' ? JSON.stringify(permissions) : permissions 
      }
    });

    console.log('Successfully updated admin:', updated.id);
    
    // Return the updated sub-admin with properly formatted data
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { adminProfile: true }
    });
    
    res.json({ 
      success: true,
      subAdmin: {
        id: updatedUser.id,
        userId: updatedUser.id,
        adminId: updatedUser.adminProfile.id,
        email: updatedUser.email,
        name: updatedUser.adminProfile.name,
        permissions: updatedUser.adminProfile.permissions ? 
          (updatedUser.adminProfile.permissions === 'all' ? 'all' : JSON.parse(updatedUser.adminProfile.permissions)) 
          : 'all'
      }
    });
  } catch (error) {
    console.error('Update sub-admin error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete sub-admin
router.delete('/subadmins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists and is a subadmin
    const user = await prisma.user.findUnique({
      where: { id },
      include: { adminProfile: true }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Sub-admin not found' 
      });
    }

    if (user.role !== 'subadmin') {
      return res.status(400).json({ 
        success: false, 
        error: 'User is not a sub-admin' 
      });
    }

    // Delete user (cascade will delete adminProfile)
    await prisma.user.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete sub-admin error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ COMPETITION MANAGEMENT ============

// Get competition by ID (for evaluation dashboard)
router.get('/competitions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        problems: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            difficulty: true,
            points: true,
            orderIndex: true
          }
        },
        _count: {
          select: {
            registrations: true,
            submissions: true
          }
        }
      }
    });

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // Add computed status
    const now = new Date();
    let status = 'upcoming';
    if (now >= new Date(competition.startTime) && now <= new Date(competition.endTime)) {
      status = 'ongoing';
    } else if (now > new Date(competition.endTime)) {
      status = 'past';
    }

    res.json({
      ...competition,
      status,
      participantCount: competition._count.registrations
    });
  } catch (error) {
    console.error('Error fetching competition:', error);
    res.status(500).json({ error: 'Failed to fetch competition' });
  }
});

export default router;
