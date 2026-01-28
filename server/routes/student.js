import express from 'express';
import prisma from '../config/db.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import upload, { uploadToCloudinary } from '../middleware/upload.js';

const router = express.Router();

// All routes require student authentication
router.use(authenticate);
router.use(authorizeRole('student'));

// ============ NOTES ============

// Get notes for student's batch
router.get('/notes', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    const notes = await prisma.note.findMany({
      where: {
        OR: [
          { batch: student.batch },
          { batch: 'All' }
        ]
      },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ QUIZZES ============

// Get quizzes for student's batch
router.get('/quizzes', async (req, res) => {
  try {
    console.log('📚 Fetching quizzes for user:', req.user.id);
    
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      console.log('❌ Student profile not found for user:', req.user.id);
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    console.log('👤 Student batch:', student.batch);

    const quizzes = await prisma.quiz.findMany({
      where: {
        OR: [
          { batch: student.batch },
          { batch: 'All' }
        ],
        isActive: true
      },
      orderBy: { startTime: 'desc' }
    });

    console.log(`✅ Found ${quizzes.length} quizzes for batch "${student.batch}"`);
    quizzes.forEach(q => console.log(`  - ${q.title} (${q.batch})`));

    res.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('❌ Error fetching quizzes:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get quiz by ID
router.get('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id }
    });

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    res.json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit quiz attempt
router.post('/quizzes/:id/attempt', async (req, res) => {
  try {
    const { answers, score, maxScore } = req.body;
    const quizId = req.params.id;

    console.log('📝 Submitting quiz attempt:', { quizId, userId: req.user.id, score, maxScore });

    // Check if already attempted
    const existing = await prisma.quizAttempt.findUnique({
      where: {
        quizId_userId: {
          quizId,
          userId: req.user.id
        }
      }
    });

    if (existing) {
      console.log('⚠️ Quiz already attempted by user');
      return res.status(400).json({ 
        success: false, 
        error: 'Quiz already attempted' 
      });
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: req.user.id,
        answers,
        score,
        maxScore,
        submittedAt: new Date()
      }
    });

    console.log('✅ Quiz attempt submitted successfully:', attempt.id);

    res.json({ success: true, data: attempt });
  } catch (error) {
    console.error('❌ Quiz submission error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get quiz attempt
router.get('/quizzes/:id/attempt', async (req, res) => {
  try {
    console.log('📋 Fetching quiz attempt:', { quizId: req.params.id, userId: req.user.id });
    
    const attempt = await prisma.quizAttempt.findUnique({
      where: {
        quizId_userId: {
          quizId: req.params.id,
          userId: req.user.id
        }
      }
    });

    if (!attempt) {
      console.log('❌ No attempt found');
      return res.json({ success: false, data: null });
    }

    console.log('✅ Attempt found:', { score: attempt.score, maxScore: attempt.maxScore });
    res.json({ success: true, data: attempt });
  } catch (error) {
    console.error('❌ Error fetching attempt:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all quiz attempts for current student
router.get('/quiz-attempts', async (req, res) => {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: req.user.id },
      include: {
        quiz: {
          select: {
            title: true,
            description: true,
            duration: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({ success: true, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ATTENDANCE (NEW PROFESSIONAL VERSION) ============

// Get student's attendance records with analytics
router.get('/attendance/records', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    console.log('🔍 Student fetching attendance records for user:', req.user.id);

    // Fetch session-based attendance records
    const sessionWhere = { userId: req.user.id };
    if (startDate || endDate) {
      sessionWhere.session = {
        date: {}
      };
      if (startDate) sessionWhere.session.date.gte = new Date(startDate);
      if (endDate) sessionWhere.session.date.lte = new Date(endDate);
    }

    const sessionRecords = await prisma.attendanceRecord.findMany({
      where: sessionWhere,
      include: {
        session: true
      },
      orderBy: {
        markedAt: 'desc'
      }
    });

    // Fetch manual attendance records (marked by admin/subadmin)
    const manualWhere = { userId: req.user.id };
    if (startDate || endDate) {
      manualWhere.date = {};
      if (startDate) manualWhere.date.gte = new Date(startDate);
      if (endDate) manualWhere.date.lte = new Date(endDate);
    }

    const manualRecords = await prisma.attendance.findMany({
      where: manualWhere,
      orderBy: {
        date: 'desc'
      }
    });

    console.log(`📊 Found ${sessionRecords.length} session records and ${manualRecords.length} manual records`);
    
    // Log manual records details
    if (manualRecords.length > 0) {
      console.log('Manual records found:');
      manualRecords.forEach(r => {
        const dateStr = new Date(r.date).toISOString().split('T')[0];
        console.log(`  - ${dateStr}: ${r.status} (batch: ${r.batch})`);
      });
    }

    // Convert manual records to match session record format
    const normalizedManualRecords = manualRecords.map(record => ({
      id: `manual-${record.id}`,
      userId: record.userId,
      status: record.status,
      markedAt: record.markedAt,
      markedMethod: 'manual',
      duration: record.duration,
      startTime: record.startTime,
      endTime: record.endTime,
      date: record.date, // Add date field for proper merging
      session: {
        id: null,
        date: record.date,
        batch: record.batch,
        location: 'Manual Entry',
        sessionType: 'manual'
      }
    }));

    // Combine and deduplicate (session records take priority over manual for same date)
    const dateMap = new Map();
    
    // Add session records first (they have priority)
    sessionRecords.forEach(record => {
      const dateKey = new Date(record.session.date).toISOString().split('T')[0];
      dateMap.set(dateKey, record);
    });
    
    // Add manual records - they will replace session records if present
    // This ensures manual updates (like changing late to present) are reflected
    normalizedManualRecords.forEach(record => {
      const dateKey = new Date(record.session.date).toISOString().split('T')[0];
      // Manual attendance always takes priority as it's the most recent admin update
      dateMap.set(dateKey, record);
    });

    // Convert map back to array and sort by date
    const records = Array.from(dateMap.values()).sort((a, b) => 
      new Date(b.session.date) - new Date(a.session.date)
    );
    
    // Log final merged records
    console.log(`📤 Sending ${records.length} merged records to student:`);
    records.forEach(r => {
      const dateStr = new Date(r.session.date).toISOString().split('T')[0];
      console.log(`  - ${dateStr}: ${r.status} (method: ${r.markedMethod || 'session'})`);
    });

    // Calculate statistics
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(2) : 0;

    // Monthly breakdown
    const monthlyStats = records.reduce((acc, record) => {
      const month = new Date(record.session.date).toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = { total: 0, present: 0, late: 0, absent: 0 };
      }
      acc[month].total++;
      acc[month][record.status]++;
      return acc;
    }, {});

    res.json({
      success: true,
      records,
      stats: {
        total,
        present,
        late,
        absent,
        percentage
      },
      monthlyStats
    });
  } catch (error) {
    console.error('Get attendance records error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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

// Mark attendance via QR code (student self-marking) with GEOLOCATION VERIFICATION
router.post('/attendance/mark-qr', async (req, res) => {
  try {
    const { qrCode, latitude, longitude, deviceFingerprint } = req.body;

    // Find active session - match full code OR last 8 characters (short code)
    const shortCode = qrCode.trim().toUpperCase();
    
    const session = await prisma.attendanceSession.findFirst({
      where: {
        isActive: true,
        qrExpiresAt: {
          gte: new Date()
        }
      }
    });

    // Check if the code matches (full or short)
    if (!session) {
      return res.status(400).json({
        success: false,
        error: 'No active session found. Please ask your instructor to start a session.'
      });
    }

    const fullCode = session.qrCode;
    const sessionShortCode = fullCode.slice(-8).toUpperCase();
    
    // Match either full code or short code
    if (fullCode !== qrCode && sessionShortCode !== shortCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid code. Please check and enter the correct attendance code.'
      });
    }

    // Check if code is expired
    if (new Date(session.qrExpiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'This code has expired. Please ask your instructor for a new code.'
      });
    }

    // Check if student belongs to this batch
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    if (student.batch !== session.batch) {
      return res.status(403).json({
        success: false,
        error: `This session is for ${session.batch} batch, but you are in ${student.batch} batch.`
      });
    }

    // Check if already marked
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId: req.user.id
        }
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'You have already marked attendance for this session.'
      });
    }

    // GEOLOCATION VERIFICATION
    let distanceFromSession = null;
    let locationVerified = false;
    
    if (session.latitude && session.longitude && latitude && longitude) {
      distanceFromSession = calculateDistance(
        session.latitude, 
        session.longitude, 
        parseFloat(latitude), 
        parseFloat(longitude)
      );
      
      // Check if within max allowed distance
      const maxDistance = session.maxDistance || 100;
      if (distanceFromSession > maxDistance) {
        return res.status(400).json({ 
          success: false, 
          error: `You must be within ${maxDistance}m of the class location to mark attendance. You appear to be ${Math.round(distanceFromSession)}m away.`,
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
        userId: req.user.id,
        status: 'present',
        markedBy: req.user.id,
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
    await prisma.attendanceSession.update({
      where: { id: session.id },
      data: {
        presentCount: {
          increment: 1
        }
      }
    });

    const message = locationVerified 
      ? `Attendance marked successfully! Location verified (${Math.round(distanceFromSession)}m from class).`
      : 'Attendance marked successfully!';

    res.json({
      success: true,
      message,
      record,
      locationVerified,
      distance: distanceFromSession ? Math.round(distanceFromSession) : null
    });
  } catch (error) {
    console.error('QR Attendance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get attendance analytics for student
router.get('/attendance/analytics', async (req, res) => {
  try {
    const records = await prisma.attendanceRecord.findMany({
      where: { userId: req.user.id },
      include: {
        session: true
      }
    });

    // Overall stats
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(2) : 0;

    // Trend analysis (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRecords = records.filter(r => 
      new Date(r.session.date) >= thirtyDaysAgo
    );

    const dailyTrend = recentRecords.reduce((acc, record) => {
      const date = new Date(record.session.date).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, present: 0, absent: 0, late: 0 };
      }
      acc[date][record.status]++;
      return acc;
    }, {});

    // Predictions and insights
    const insights = [];
    if (parseFloat(percentage) < 75) {
      const required = Math.ceil((75 * total - (present + late) * 100) / 25);
      insights.push({
        type: 'warning',
        message: `You need to attend ${required} more classes to reach 75% attendance`
      });
    } else if (parseFloat(percentage) >= 90) {
      insights.push({
        type: 'success',
        message: 'Excellent attendance! Keep it up!'
      });
    }

    res.json({
      success: true,
      analytics: {
        overall: { total, present, late, absent, percentage },
        trend: Object.values(dailyTrend).sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        ),
        insights
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ LEGACY ATTENDANCE (BACKWARD COMPATIBILITY) ============

// Get student's attendance
router.get('/attendance', async (req, res) => {
  try {
    // Get manual attendance records
    const manualAttendance = await prisma.attendance.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' }
    });

    // Get session-based attendance records
    const sessionAttendance = await prisma.attendanceRecord.findMany({
      where: { userId: req.user.id },
      include: {
        session: {
          select: {
            date: true,
            batch: true,
            location: true
          }
        }
      },
      orderBy: { markedAt: 'desc' }
    });

    // Combine both - manual attendance takes priority (most recent admin updates)
    const dateMap = new Map();
    
    // Add session records first
    sessionAttendance.forEach(record => {
      const dateKey = new Date(record.session.date).toISOString().split('T')[0];
      dateMap.set(dateKey, {
        id: record.id,
        userId: record.userId,
        date: record.session.date,
        status: record.status,
        batch: record.session.batch,
        markedAt: record.markedAt,
        type: 'session'
      });
    });
    
    // Add manual records - they override session records
    // This ensures admin manual updates (like late → present) are shown
    manualAttendance.forEach(record => {
      const dateKey = new Date(record.date).toISOString().split('T')[0];
      dateMap.set(dateKey, {
        id: record.id,
        userId: record.userId,
        date: record.date,
        status: record.status,
        batch: record.batch,
        markedAt: record.markedAt,
        duration: record.duration,
        startTime: record.startTime,
        endTime: record.endTime,
        type: 'manual'
      });
    });

    // Convert to array and sort by date
    const combinedAttendance = Array.from(dateMap.values()).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    res.json({ success: true, data: combinedAttendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ANNOUNCEMENTS ============

// Get announcements for student's batch
router.get('/announcements', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { batch: student.batch },
          { batch: 'All' }
        ],
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ SUPPORT TICKETS ============

// Create ticket
router.post('/tickets', async (req, res) => {
  try {
    const { subject, message, priority } = req.body;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user.id,
        subject,
        message,
        priority: priority || 'normal'
      }
    });

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get student's tickets
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    const ticketsWithResponses = tickets.map(ticket => ({
      ...ticket,
      responses: ticket.response ? (() => {
        try {
          return JSON.parse(ticket.response);
        } catch (e) {
          return [];
        }
      })() : []
    }));

    res.json({ success: true, data: ticketsWithResponses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ PROFILE ============

// Upload profile photo
router.post('/profile/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'codingnexus/profiles');

    // Update student profile with new photo URL
    await prisma.student.update({
      where: { userId: req.user.id },
      data: {
        profilePhotoUrl: result.secure_url
      }
    });

    res.json({
      success: true,
      profilePhotoUrl: result.secure_url
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update profile
router.put('/profile', async (req, res) => {
  try {
    const { name, phone, profilePhotoUrl } = req.body;

    await prisma.student.update({
      where: { userId: req.user.id },
      data: {
        name,
        phone,
        profilePhotoUrl
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
