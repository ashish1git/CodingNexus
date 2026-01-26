import express from 'express';
import bcrypt from 'bcryptjs';
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

    // Update user
    if (isActive !== undefined) {
      await prisma.user.update({
        where: { id },
        data: { isActive }
      });
    }

    // Update or create student profile
    await prisma.student.upsert({
      where: { userId: id },
      update: {
        name,
        batch,
        phone,
        profilePhotoUrl
      },
      create: {
        userId: id,
        name: name || 'Student',
        batch: batch || 'Basic',
        phone,
        profilePhotoUrl
      }
    });

    res.json({ success: true });
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

// ============ ATTENDANCE ============

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
    res.json({ success: true });
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
