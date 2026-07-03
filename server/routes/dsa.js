import express from 'express';
import prisma from '../config/db.js';
import { authenticate, authorizeRole, checkPermission } from '../middleware/auth.js';
import upload, { uploadToCloudinary } from '../middleware/upload.js';
import { sendEmail } from '../services/email/brevo.service.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRole('admin', 'subadmin', 'superadmin'));

// ────────────────────────────────────────────────────────
// DSA TRAINER MANAGEMENT
// ────────────────────────────────────────────────────────

// Get all DSA trainers with admin details
router.get('/trainers', async (req, res) => {
  try {
    const trainers = await prisma.dsaTrainer.findMany({
      include: {
        admin: {
          include: {
            user: { select: { email: true, role: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = trainers.map(t => ({
      id: t.id,
      adminId: t.adminId,
      role: t.role,
      isActive: t.isActive,
      assignedBy: t.assignedBy,
      createdAt: t.createdAt,
      name: t.admin.name,
      email: t.admin.user.email,
      permissions: t.admin.permissions
    }));

    res.json({ success: true, trainers: mapped });
  } catch (error) {
    console.error('Get trainers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current user's DSA role (TRAINER, OPERATIONS, or null)
router.get('/my-role', async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({ where: { userId: req.user.id } });
    if (!admin) return res.json({ success: true, role: null });

    const dsaUser = await prisma.dsaTrainer.findUnique({ where: { adminId: admin.id } });
    if (!dsaUser || !dsaUser.isActive) return res.json({ success: true, role: null });

    res.json({ success: true, role: dsaUser.role, isActive: dsaUser.isActive });
  } catch (error) {
    console.error('Get my role error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available admins who are NOT yet DSA trainers
router.get('/trainers/available', async (req, res) => {
  try {
    // Get all Admin IDs that are already DSA trainers
    const existingTrainerAdminIds = await prisma.dsaTrainer.findMany({
      select: { adminId: true }
    });
    const existingIds = existingTrainerAdminIds.map(t => t.adminId);

    // Find all User records with admin/subadmin/superadmin roles 
    // that either have no Admin profile OR whose Admin.id is not in existingIds
    const availableUsers = await prisma.user.findMany({
      where: {
        role: { in: ['subadmin', 'admin', 'superadmin'] },
        isActive: true
      },
      include: {
        adminProfile: true
      }
    });

    const mapped = availableUsers
      .filter(u => {
        // Skip current user (the super admin themselves)
        if (u.id === req.user.id) return false;
        // Include only those NOT already assigned any DSA role (unique per admin - mutually exclusive by DB constraint)
        if (!u.adminProfile) return true;
        return !existingIds.includes(u.adminProfile.id);
      })
      .map(u => ({
        adminId: u.adminProfile?.id || u.id,
        userId: u.id,
        name: u.adminProfile?.name || u.email.split('@')[0],
        email: u.email,
        role: u.role,
        needsProfile: !u.adminProfile
      }));

    res.json({ success: true, available: mapped });
  } catch (error) {
    console.error('Get available trainers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get operations users (users with role="OPERATIONS" in DsaTrainer)
router.get('/trainers/operations', async (req, res) => {
  try {
    const ops = await prisma.dsaTrainer.findMany({
      where: { role: 'OPERATIONS' },
      include: {
        admin: {
          include: { user: { select: { email: true } } }
        }
      }
    });

    const mapped = ops.map(t => ({
      adminId: t.adminId,
      userId: t.admin.user.id,
      name: t.admin.name,
      email: t.admin.user.email,
      isActive: t.isActive,
      assignedBy: t.assignedBy,
      createdAt: t.createdAt,
      permissions: t.admin.permissions
    }));

    res.json({ success: true, operations: mapped });
  } catch (error) {
    console.error('Get operations users error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Assign a DSA role (TRAINER or OPERATIONS)
router.post('/trainers', async (req, res) => {
  try {
    if (!canManageTrainers(req)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not have permission to assign roles.' });
    }
    const { adminId, role } = req.body;
    if (!adminId) {
      return res.status(400).json({ success: false, error: 'Admin ID is required' });
    }

    const dsaRole = role === 'OPERATIONS' ? 'OPERATIONS' : 'TRAINER';

    const existing = await prisma.dsaTrainer.findUnique({ where: { adminId } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'This admin already has a DSA role assigned.' });
    }

    // Try to find the admin profile first
    let admin = await prisma.admin.findUnique({
      where: { id: adminId },
      include: { user: { select: { email: true } } }
    });

    // If admin not found by adminId, try looking up by userId
    if (!admin) {
      // Maybe adminId is actually a userId - check
      const user = await prisma.user.findUnique({
        where: { id: adminId },
        include: { adminProfile: true }
      });
      if (user && user.adminProfile) {
        admin = await prisma.admin.findUnique({
          where: { id: user.adminProfile.id },
          include: { user: { select: { email: true } } }
        });
      }
    }

    if (!admin) {
      // If admin profile doesn't exist, create one for this user
      const user = await prisma.user.findUnique({ where: { id: adminId } });
      if (user && (user.role === 'subadmin' || user.role === 'admin' || user.role === 'superadmin')) {
        // Get the current admin's name for the new profile
        const currentAdmin = await prisma.admin.findUnique({ where: { userId: req.user.id } });
        admin = await prisma.admin.create({
          data: {
            userId: user.id,
            name: user.email.split('@')[0],
            permissions: '{}',
            createdBy: req.user.id
          },
          include: { user: { select: { email: true } } }
        });
      } else {
        return res.status(404).json({ success: false, error: 'User not found or not an admin/subadmin.' });
      }
    }

    const trainer = await prisma.dsaTrainer.create({
      data: { adminId: admin.id, role: dsaRole, assignedBy: req.user.id },
      include: {
        admin: {
          include: { user: { select: { email: true, role: true } } }
        }
      }
    });

    // Auto-provision required permissions for Operations role
    if (dsaRole === 'OPERATIONS') {
      const currentPerms = admin.permissions
        ? (typeof admin.permissions === 'string' ? JSON.parse(admin.permissions) : admin.permissions)
        : {};
      const updatedPerms = {
        ...currentPerms,
        manageDsaSchedule: true,
        manageDsaNotes: currentPerms.manageDsaNotes !== undefined ? currentPerms.manageDsaNotes : true
      };
      await prisma.admin.update({
        where: { id: admin.id },
        data: { permissions: typeof updatedPerms === 'object' ? JSON.stringify(updatedPerms) : updatedPerms }
      });
    }

    // Send welcome email notification
    try {
      const trainerEmail = trainer.admin.user.email;
      const trainerName = trainer.admin.name;
      const roleLabel = dsaRole === 'OPERATIONS' ? 'DSA Operations' : 'DSA Trainer';
      const roleDescription = dsaRole === 'OPERATIONS'
        ? 'scheduling lectures, reviewing notes, and managing daily DSA workflow'
        : 'conducting lectures and uploading notes';

      await sendEmail({
        to: trainerEmail,
        subject: `🎉 Congratulations! You are now assigned as ${roleLabel}`,
        html: `
          <div style="font-family: system-ui; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Welcome to the DSA Team!</h2>
            <p>Hi <strong>${trainerName}</strong>,</p>
            <p>Congratulations! You have been assigned the role of <strong>${roleLabel}</strong> at Coding Nexus.</p>
            <div style="background: #eef2ff; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0;"><strong>Your Role:</strong> ${roleLabel}</p>
              <p style="margin: 8px 0 0 0;">As a ${roleLabel}, you will be responsible for <strong>${roleDescription}</strong>.</p>
            </div>
            <p>Please log in to the Coding Nexus portal and check the <strong>DSA Management</strong> tab for more details about your schedule, lecture assignments, and notes workflow.</p>
            <a href="https://codingnexus.apsit.edu.in/admin/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 12px;">Go to DSA Management</a>
            <p style="margin-top: 24px; color: #666; font-size: 14px;">
              Best regards,<br/>Coding Nexus Admin
            </p>
          </div>
        `,
        text: `Welcome to the DSA Team!\n\nHi ${trainerName},\n\nCongratulations! You have been assigned the role of ${roleLabel} at Coding Nexus.\n\nAs a ${roleLabel}, you will be responsible for ${roleDescription}.\n\nPlease log in to the Coding Nexus portal and check the DSA Management tab for more details.\n\nBest regards,\nCoding Nexus Admin`
      });
    } catch (emailErr) {
      console.error('Failed to send assignment email:', emailErr.message);
    }

    res.json({
      success: true,
      trainer: {
        id: trainer.id,
        adminId: trainer.adminId,
        role: trainer.role,
        isActive: trainer.isActive,
        assignedBy: trainer.assignedBy,
        createdAt: trainer.createdAt,
        name: trainer.admin.name,
        email: trainer.admin.user.email
      }
    });
  } catch (error) {
    console.error('Assign trainer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove DSA trainer
router.delete('/trainers/:id', async (req, res) => {
  try {
    if (!canManageTrainers(req)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not have permission to remove trainers.' });
    }
    await prisma.dsaTrainer.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Remove trainer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle trainer active status
router.put('/trainers/:id/toggle', async (req, res) => {
  try {
    if (!canManageTrainers(req)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not have permission to manage trainers.' });
    }
    const trainer = await prisma.dsaTrainer.findUnique({
      where: { id: req.params.id },
      include: {
        admin: {
          include: { user: { select: { email: true } } }
        }
      }
    });
    if (!trainer) {
      return res.status(404).json({ success: false, error: 'Trainer not found' });
    }
    const updated = await prisma.dsaTrainer.update({
      where: { id: req.params.id },
      data: { isActive: !trainer.isActive }
    });

    // Send email notification on activation
    if (!trainer.isActive && updated.isActive) {
      try {
        const trainerEmail = trainer.admin.user.email;
        const trainerName = trainer.admin.name;
        const roleLabel = trainer.role === 'OPERATIONS' ? 'DSA Operations' : 'DSA Trainer';

        await sendEmail({
          to: trainerEmail,
          subject: `✅ Your ${roleLabel} account has been activated`,
          html: `
            <div style="font-family: system-ui; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Account Activated!</h2>
              <p>Hi <strong>${trainerName}</strong>,</p>
              <p>Your <strong>${roleLabel}</strong> account at Coding Nexus has been <strong style="color: #16a34a;">activated</strong>.</p>
              <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0;">You now have full access to the DSA Management portal. Please log in and check the <strong>DSA Management</strong> tab to view your schedule and get started.</p>
              </div>
              <a href="https://codingnexus.apsit.edu.in/admin/dashboard" style="display: inline-block; background: #16a34a; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 12px;">Go to DSA Management</a>
              <p style="margin-top: 24px; color: #666; font-size: 14px;">
                Best regards,<br/>Coding Nexus Admin
              </p>
            </div>
          `,
          text: `Account Activated!\n\nHi ${trainerName},\n\nYour ${roleLabel} account at Coding Nexus has been activated. You now have full access to the DSA Management portal.\n\nPlease log in and check the DSA Management tab to view your schedule and get started.\n\nBest regards,\nCoding Nexus Admin`
        });
      } catch (emailErr) {
        console.error('Failed to send activation email:', emailErr.message);
      }
    }

    res.json({ success: true, trainer: updated });
  } catch (error) {
    console.error('Toggle trainer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ────────────────────────────────────────────────────────
// DSA LECTURE MANAGEMENT
// ────────────────────────────────────────────────────────

// Helper: check if user can manage schedules (superadmin or has manageDsaSchedule permission)
const canManageSchedule = (req) => {
  if (req.user.role === 'superadmin' || req.user.role === 'admin') return true;
  if (req.user.role === 'subadmin') {
    try {
      const perms = typeof req.user?.adminProfile?.permissions === 'string'
        ? JSON.parse(req.user.adminProfile.permissions)
        : req.user?.adminProfile?.permissions || {};
      return perms.manageDsaSchedule === true;
    } catch { return false; }
  }
  return false;
};

// Helper: check if user can manage trainers (superadmin only)
const canManageTrainers = (req) => {
  return req.user.role === 'superadmin' || req.user.role === 'admin';
};

// Get all lectures
router.get('/lectures', async (req, res) => {
  try {
    const { trainerId, status, batch, startDate, endDate } = req.query;
    const where = {};
    if (trainerId) where.trainerId = trainerId;
    if (status) where.status = status;
    if (batch) where.batch = batch;
    if (startDate || endDate) {
      where.lectureDate = {};
      if (startDate) where.lectureDate.gte = new Date(startDate);
      if (endDate) where.lectureDate.lte = new Date(endDate);
    }

    const lectures = await prisma.dsaLecture.findMany({
      where,
      include: {
        trainer: {
          include: { admin: { select: { name: true } } }
        },
        notes: {
          select: { id: true, title: true, status: true, fileUrl: true, fileName: true, createdAt: true }
        }
      },
      orderBy: { lectureDate: 'desc' }
    });

    const mapped = lectures.map(l => ({
      id: l.id,
      trainerId: l.trainerId,
      topic: l.topic,
      description: l.description,
      batch: l.batch,
      lectureDate: l.lectureDate,
      startTime: l.startTime,
      endTime: l.endTime,
      status: l.status,
      notifySent: l.notifySent,
      notesRequired: l.notesRequired,
      trainerName: l.trainer.admin.name,
      noteCount: l.notes.length,
      approvedNote: l.notes.find(n => n.status === 'approved'),
      pendingNote: l.notes.find(n => n.status === 'pending'),
      rejectedNote: l.notes.find(n => n.status === 'rejected'),
      hasNotes: l.notes.length > 0,
      notesStatus: l.notes.length === 0 ? 'missing' : l.notes.some(n => n.status === 'approved') ? 'approved' : l.notes.some(n => n.status === 'pending') ? 'pending' : l.notes.some(n => n.status === 'rejected') ? 'rejected' : 'missing'
    }));

    res.json({ success: true, lectures: mapped, count: mapped.length });
  } catch (error) {
    console.error('Get lectures error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create lecture(s) — supports assigning to multiple trainers at once
router.post('/lectures', async (req, res) => {
  try {
    if (!canManageSchedule(req)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not have permission to schedule lectures.' });
    }
    const { trainerIds, trainerId, topic, description, batch, lectureDate, startTime, endTime, notesRequired } = req.body;

    if (!topic || !lectureDate) {
      return res.status(400).json({ success: false, error: 'Topic and date are required' });
    }

    // Accept either single trainerId or array of trainerIds
    const ids = trainerIds || (trainerId ? [trainerId] : []);
    if (ids.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one trainer must be selected' });
    }

    // Validate all trainers exist and are active
    const validTrainers = await prisma.dsaTrainer.findMany({
      where: { id: { in: ids }, isActive: true }
    });
    if (validTrainers.length !== ids.length) {
      return res.status(400).json({ success: false, error: 'One or more trainers are invalid or inactive' });
    }

    // Create a lecture for each selected trainer
    const created = [];
    for (const tid of ids) {
      const lecture = await prisma.dsaLecture.create({
        data: {
          trainerId: tid,
          topic,
          description: description || null,
          batch: batch || null,
          lectureDate: new Date(lectureDate),
          startTime: startTime || null,
          endTime: endTime || null,
          notesRequired: notesRequired !== undefined ? notesRequired : true,
          createdBy: req.user.id
        },
        include: {
          trainer: {
            include: { admin: { select: { name: true } } }
          }
        }
      });
      created.push({
        id: lecture.id,
        trainerId: lecture.trainerId,
        topic: lecture.topic,
        lectureDate: lecture.lectureDate,
        startTime: lecture.startTime,
        endTime: lecture.endTime,
        status: lecture.status,
        trainerName: lecture.trainer.admin.name
      });
    }

    res.json({ success: true, lectures: created, count: created.length, message: `${created.length} lecture${created.length > 1 ? 's' : ''} scheduled for ${validTrainers.length} trainer${validTrainers.length > 1 ? 's' : ''}` });
  } catch (error) {
    console.error('Create lecture error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update lecture
router.put('/lectures/:id', async (req, res) => {
  try {
    if (!canManageSchedule(req)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not have permission to edit lectures.' });
    }
    const { topic, description, batch, lectureDate, startTime, endTime, status, notesRequired } = req.body;
    const data = {};
    if (topic !== undefined) data.topic = topic;
    if (description !== undefined) data.description = description;
    if (batch !== undefined) data.batch = batch;
    if (lectureDate !== undefined) data.lectureDate = new Date(lectureDate);
    if (startTime !== undefined) data.startTime = startTime;
    if (endTime !== undefined) data.endTime = endTime;
    if (status !== undefined) data.status = status;
    if (notesRequired !== undefined) data.notesRequired = notesRequired;

    const lecture = await prisma.dsaLecture.update({
      where: { id: req.params.id },
      data
    });

    res.json({ success: true, lecture });
  } catch (error) {
    console.error('Update lecture error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete lecture
router.delete('/lectures/:id', async (req, res) => {
  try {
    if (!canManageSchedule(req)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not have permission to delete lectures.' });
    }
    await prisma.dsaLecture.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete lecture error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel lecture (soft cancel - sets status to cancelled)
router.put('/lectures/:id/cancel', async (req, res) => {
  try {
    if (!canManageSchedule(req)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not have permission to cancel lectures.' });
    }
    const lecture = await prisma.dsaLecture.findUnique({ where: { id: req.params.id } });
    if (!lecture) return res.status(404).json({ success: false, error: 'Lecture not found' });
    if (lecture.status === 'cancelled') return res.status(400).json({ success: false, error: 'Lecture already cancelled' });

    const updated = await prisma.dsaLecture.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' }
    });
    res.json({ success: true, lecture: updated });
  } catch (error) {
    console.error('Cancel lecture error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reschedule lecture (change date and/or time)
router.put('/lectures/:id/reschedule', async (req, res) => {
  try {
    if (!canManageSchedule(req)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not have permission to reschedule lectures.' });
    }
    const { lectureDate, startTime, endTime } = req.body;
    if (!lectureDate) return res.status(400).json({ success: false, error: 'New lecture date is required' });

    const lecture = await prisma.dsaLecture.findUnique({ where: { id: req.params.id } });
    if (!lecture) return res.status(404).json({ success: false, error: 'Lecture not found' });

    const data = { lectureDate: new Date(lectureDate), status: 'scheduled' };
    if (startTime !== undefined) data.startTime = startTime;
    if (endTime !== undefined) data.endTime = endTime;

    const updated = await prisma.dsaLecture.update({
      where: { id: req.params.id },
      data
    });
    res.json({ success: true, lecture: updated });
  } catch (error) {
    console.error('Reschedule lecture error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create recurring weekly schedule
// Body: { trainerId, topic, description, batch, startTime, endTime, daysOfWeek: ["monday","wednesday"], startDate, endDate, count }
router.post('/lectures/recurring', async (req, res) => {
  try {
    if (!canManageSchedule(req)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not have permission to create recurring schedules.' });
    }
    const { trainerIds, trainerId, topic, description, batch, startTime, endTime, daysOfWeek, startDate, endDate, count, notesRequired } = req.body;

    if (!topic || !startDate || !daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return res.status(400).json({ success: false, error: 'Topic, start date, and at least one day of week are required' });
    }

    const ids = trainerIds || (trainerId ? [trainerId] : []);
    if (ids.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one trainer must be selected' });
    }

    const validTrainers = await prisma.dsaTrainer.findMany({
      where: { id: { in: ids }, isActive: true }
    });
    if (validTrainers.length !== ids.length) {
      return res.status(400).json({ success: false, error: 'One or more trainers are invalid or inactive' });
    }

    const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const targetDays = daysOfWeek.map(d => dayMap[d.toLowerCase()]);
    if (targetDays.some(d => d === undefined)) {
      return res.status(400).json({ success: false, error: 'Invalid day name. Use: sunday, monday, tuesday, wednesday, thursday, friday, saturday' });
    }

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    const maxCount = count || 52;
    const maxLectures = 100;
    const lectures = [];

    for (const tid of ids) {
      let current = new Date(start);
      let generated = 0;

      while (generated < maxCount && lectures.length < maxLectures * ids.length) {
        if (end && current > end) break;

        if (targetDays.includes(current.getDay())) {
          const lecture = await prisma.dsaLecture.create({
            data: {
              trainerId: tid,
              topic,
              description: description || null,
              batch: batch || null,
              lectureDate: new Date(current),
              startTime: startTime || null,
              endTime: endTime || null,
              notesRequired: notesRequired !== undefined ? notesRequired : true,
              createdBy: req.user.id
            },
            include: {
              trainer: {
                include: { admin: { select: { name: true } } }
              }
            }
          });
          lectures.push({
            id: lecture.id,
            trainerId: lecture.trainerId,
            topic: lecture.topic,
            lectureDate: lecture.lectureDate,
            startTime: lecture.startTime,
            endTime: lecture.endTime,
            status: lecture.status,
            trainerName: lecture.trainer.admin.name
          });
          generated++;
        }
        current.setDate(current.getDate() + 1);
      }
    }

    res.json({ success: true, lectures, count: lectures.length });
  } catch (error) {
    console.error('Recurring schedule error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ────────────────────────────────────────────────────────
// DSA NOTES MANAGEMENT
// ────────────────────────────────────────────────────────

// Upload a note (file + metadata)
router.post('/notes/upload', upload.single('file'), async (req, res) => {
  try {
    const { lectureId, title, description } = req.body;

    if (!lectureId || !title) {
      return res.status(400).json({ success: false, error: 'Lecture ID and title are required' });
    }

    // Verify the user is a trainer
    const admin = await prisma.admin.findUnique({ where: { userId: req.user.id } });
    if (!admin) {
      return res.status(403).json({ success: false, error: 'Admin profile not found' });
    }

    const trainer = await prisma.dsaTrainer.findUnique({ where: { adminId: admin.id } });
    if (!trainer) {
      return res.status(403).json({ success: false, error: 'You are not assigned as a DSA trainer' });
    }

    // Verify lecture belongs to this trainer (or user is superadmin)
    const lecture = await prisma.dsaLecture.findUnique({ where: { id: lectureId } });
    if (!lecture) {
      return res.status(404).json({ success: false, error: 'Lecture not found' });
    }
    if (lecture.trainerId !== trainer.id && req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'This lecture is not assigned to you' });
    }

    let fileUrl = null;
    let fileName = title;
    let fileSize = null;
    let fileType = 'pdf';

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'codingnexus/dsa-notes');
      fileUrl = result.secure_url;
      fileName = req.file.originalname || title;
      fileSize = req.file.size;
      if (req.file.mimetype.includes('pdf')) fileType = 'pdf';
      else if (req.file.mimetype.includes('image')) fileType = 'image';
      else if (req.file.mimetype.includes('video')) fileType = 'video';
      else fileType = 'document';
    } else if (req.body.fileUrl) {
      fileUrl = req.body.fileUrl;
    } else {
      return res.status(400).json({ success: false, error: 'No file uploaded or file URL provided' });
    }

    const note = await prisma.dsaNote.create({
      data: {
        trainerId: trainer.id,
        lectureId,
        title,
        description: description || null,
        fileUrl,
        fileName,
        fileSize: fileSize ? parseInt(fileSize) : null,
        fileType,
        uploadedBy: req.user.id
      },
      include: {
        lecture: { select: { topic: true, lectureDate: true } }
      }
    });

    res.json({ success: true, note });
  } catch (error) {
    console.error('Upload note error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all notes (with filters)
router.get('/notes', async (req, res) => {
  try {
    const { trainerId, lectureId, status, batch } = req.query;
    const where = {};
    if (trainerId) where.trainerId = trainerId;
    if (lectureId) where.lectureId = lectureId;
    if (status) where.status = status;

    // If user is a trainer (not superadmin/operations), only show their notes
    const isSuperAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
    const hasOps = !isSuperAdmin && req.user.role === 'subadmin' && (() => {
      try {
        const perms = typeof req.user.adminProfile?.permissions === 'string'
          ? JSON.parse(req.user.adminProfile.permissions)
          : req.user.adminProfile?.permissions || {};
        return perms.manageDsaSchedule === true;
      } catch { return false; }
    })();

    if (!isSuperAdmin && !hasOps && !status) {
      const admin = await prisma.admin.findUnique({ where: { userId: req.user.id } });
      if (admin) {
        const trainer = await prisma.dsaTrainer.findUnique({ where: { adminId: admin.id } });
        if (trainer) {
          where.trainerId = trainer.id;
        }
      }
    } else if (!isSuperAdmin && !hasOps) {
      // subadmin checking own notes
      const admin = await prisma.admin.findUnique({ where: { userId: req.user.id } });
      if (admin) {
        const trainer = await prisma.dsaTrainer.findUnique({ where: { adminId: admin.id } });
        if (trainer) {
          where.trainerId = trainer.id;
        }
      }
    }

    const notes = await prisma.dsaNote.findMany({
      where,
      include: {
        trainer: {
          include: { admin: { select: { name: true } } }
        },
        lecture: { select: { topic: true, lectureDate: true, batch: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = notes.map(n => ({
      ...n,
      trainerName: n.trainer.admin.name,
      lectureTopic: n.lecture.topic,
      lectureDate: n.lecture.lectureDate,
      lectureBatch: n.lecture.batch
    }));

    res.json({ success: true, notes: mapped, count: mapped.length });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Review a note (approve/reject)
router.put('/notes/:id/review', async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be "approved" or "rejected"' });
    }

    // Only superadmin/admins or users with manageDsaNotes or manageDsaSchedule permission can review
    const canReview = req.user.role === 'superadmin' || req.user.role === 'admin';
    if (!canReview && req.user.role === 'subadmin') {
      const perms = typeof req.user.adminProfile?.permissions === 'string'
        ? JSON.parse(req.user.adminProfile.permissions)
        : req.user.adminProfile?.permissions;
      if (!perms?.manageDsaNotes && !perms?.manageDsaSchedule) {
        return res.status(403).json({ success: false, error: 'Access denied. Insufficient permissions.' });
      }
    } else if (!canReview) {
      return res.status(403).json({ success: false, error: 'Access denied. Insufficient permissions.' });
    }

    const note = await prisma.dsaNote.update({
      where: { id: req.params.id },
      data: {
        status,
        remarks: remarks || null,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      }
    });

    // Send email notification to the trainer
    try {
      const noteWithTrainer = await prisma.dsaNote.findUnique({
        where: { id: note.id },
        include: {
          trainer: {
            include: {
              admin: {
                include: { user: { select: { email: true } } }
              }
            }
          },
          lecture: { select: { topic: true } }
        }
      });

      if (noteWithTrainer?.trainer?.admin?.user?.email) {
        const trainerEmail = noteWithTrainer.trainer.admin.user.email;
        const trainerName = noteWithTrainer.trainer.admin.name;
        const lectureTopic = noteWithTrainer.lecture?.topic || 'Unknown';
        const reviewerName = req.user.adminProfile?.name || 'Admin';

        const statusLabel = status === 'approved' ? 'Approved ✅' : 'Rejected ❌';
        const statusColor = status === 'approved' ? '#10b981' : '#dc2626';

        await sendEmail({
          to: trainerEmail,
          subject: `Notes ${status}: "${note.title}" for lecture "${lectureTopic}"`,
          html: `
            <div style="font-family: system-ui; max-width: 600px; margin: 0 auto;">
              <h2 style="color: ${statusColor};">Notes ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
              <p>Hi <strong>${trainerName}</strong>,</p>
              <p>Your notes for lecture <strong>"${lectureTopic}"</strong> have been <strong style="color: ${statusColor};">${status}</strong> by <strong>${reviewerName}</strong>.</p>
              <div style="background: ${status === 'approved' ? '#ecfdf5' : '#fee2e2'}; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0;"><strong>Note:</strong> ${note.title}</p>
                ${remarks ? `<p style="margin: 8px 0 0 0;"><strong>Remarks:</strong> ${remarks}</p>` : ''}
              </div>
              <p style="margin-top: 24px; color: #666; font-size: 14px;">
                Best regards,<br/>Coding Nexus Admin
              </p>
            </div>
          `,
          text: `Hi ${trainerName},\n\nYour notes for lecture "${lectureTopic}" have been ${status} by ${reviewerName}.\n\nNote: ${note.title}${remarks ? `\nRemarks: ${remarks}` : ''}\n\nBest regards,\nCoding Nexus Admin`
        });
      }
    } catch (emailErr) {
      console.error('Failed to send review notification email:', emailErr.message);
    }

    res.json({ success: true, note });
  } catch (error) {
    console.error('Review note error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a note (owner trainer or superadmin only)
router.delete('/notes/:id', async (req, res) => {
  try {
    const note = await prisma.dsaNote.findUnique({
      where: { id: req.params.id },
      include: {
        trainer: { select: { adminId: true } }
      }
    });

    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    // Allow if user is superadmin/admin, or if they own the note
    const isSuperAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
    const admin = await prisma.admin.findUnique({ where: { userId: req.user.id } });
    const isOwner = admin && note.trainer.adminId === admin.id;

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: 'You can only delete your own notes' });
    }

    await prisma.dsaNote.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ────────────────────────────────────────────────────────
// TRAINER DASHBOARD
// ────────────────────────────────────────────────────────

router.get('/trainer-dashboard', async (req, res) => {
  try {
    // If requesting for a specific trainer, or get current user's data
    const { trainerId } = req.query;
    let targetAdminId;

    if (trainerId) {
      targetAdminId = trainerId;
    } else {
      const admin = await prisma.admin.findUnique({ where: { userId: req.user.id } });
      if (!admin) {
        return res.status(404).json({ success: false, error: 'Admin profile not found' });
      }
      targetAdminId = admin.id;
    }

    const trainer = await prisma.dsaTrainer.findUnique({
      where: { adminId: targetAdminId },
      include: {
        admin: { select: { name: true } },
        lectures: {
          include: { notes: { select: { id: true, status: true, title: true } } },
          orderBy: { lectureDate: 'desc' }
        }
      }
    });

    if (!trainer) {
      return res.status(404).json({ success: false, error: 'Trainer not found' });
    }

    const totalLectures = trainer.lectures.length;
    const upcomingLectures = trainer.lectures.filter(l =>
      l.status === 'scheduled' && new Date(l.lectureDate) >= new Date()
    );
    const pastLectures = trainer.lectures.filter(l =>
      l.status === 'completed' || new Date(l.lectureDate) < new Date()
    );

    let pending = 0, approved = 0, rejected = 0, missing = 0;

    trainer.lectures.forEach(lecture => {
      if (!lecture.notesRequired) {
        // Lectures where notes are optional don't count as "missing"
        if (lecture.notes.length > 0) {
          const approvedNote = lecture.notes.find(n => n.status === 'approved');
          const pendingNote = lecture.notes.find(n => n.status === 'pending');
          const rejectedNote = lecture.notes.find(n => n.status === 'rejected');
          if (approvedNote) approved++;
          else if (pendingNote) pending++;
          else if (rejectedNote) rejected++;
        }
        return;
      }
      if (lecture.notes.length === 0) {
        missing++;
      } else {
        const approvedNote = lecture.notes.find(n => n.status === 'approved');
        const pendingNote = lecture.notes.find(n => n.status === 'pending');
        const rejectedNote = lecture.notes.find(n => n.status === 'rejected');

        if (approvedNote) approved++;
        else if (pendingNote) pending++;
        else if (rejectedNote) rejected++;
        else missing++;
      }
    });

    res.json({
      success: true,
      dashboard: {
        trainerName: trainer.admin.name,
        isActive: trainer.isActive,
        stats: { totalLectures, pending, approved, rejected, missing },
        upcomingLectures: upcomingLectures.map(l => ({
          id: l.id,
          topic: l.topic,
          lectureDate: l.lectureDate,
          startTime: l.startTime,
          endTime: l.endTime,
          batch: l.batch,
          notesRequired: l.notesRequired,
          noteCount: l.notes.length,
          hasNotes: l.notes.length > 0,
          noteStatus: l.notes.length === 0 ? 'missing' :
            l.notes.some(n => n.status === 'approved') ? 'approved' :
            l.notes.some(n => n.status === 'pending') ? 'pending' : 'rejected'
        })),
        recentLectures: trainer.lectures.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Trainer dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ────────────────────────────────────────────────────────
// NOTIFICATION
// ────────────────────────────────────────────────────────

// Send reminder to trainers with missing notes for upcoming lectures
router.post('/notify-missing', async (req, res) => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 2);

    // Find upcoming lectures with missing notes in the next 2 days (only where notesRequired)
    const lectures = await prisma.dsaLecture.findMany({
      where: {
        lectureDate: { gte: now, lte: tomorrow },
        status: 'scheduled',
        notifySent: false,
        notesRequired: true,
        notes: { none: {} }
      },
      include: {
        trainer: {
          include: {
            admin: {
              include: { user: { select: { email: true } } }
            }
          }
        }
      }
    });

    let notified = 0;
    const errors = [];

    for (const lecture of lectures) {
      const trainerEmail = lecture.trainer.admin.user.email;
      const trainerName = lecture.trainer.admin.name;

      if (!trainerEmail) {
        errors.push({ lectureId: lecture.id, error: 'No email for trainer' });
        continue;
      }

      try {
        const emailSent = await sendEmail({
          to: trainerEmail,
          subject: `Reminder: Notes not uploaded for "${lecture.topic}"`,
          html: `
            <div style="font-family: system-ui; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Notes Upload Reminder</h2>
              <p>Hi <strong>${trainerName}</strong>,</p>
              <p>This is a reminder that you have an upcoming DSA lecture on <strong>${lecture.lectureDate.toLocaleDateString()}</strong>
              on topic <strong>"${lecture.topic}"</strong>, but no notes have been uploaded yet.</p>
              <p>Please upload your lecture notes at your earliest convenience to ensure they are reviewed and approved before the lecture.</p>
              <p style="margin-top: 24px; color: #666; font-size: 14px;">
                Best regards,<br/>Coding Nexus Admin
              </p>
            </div>
          `,
          text: `Hi ${trainerName},\n\nThis is a reminder that you have an upcoming DSA lecture on ${lecture.lectureDate.toLocaleDateString()} on topic "${lecture.topic}", but no notes have been uploaded yet.\n\nPlease upload your lecture notes.\n\nBest regards,\nCoding Nexus Admin`
        });

        if (emailSent.success) {
          await prisma.dsaLecture.update({
            where: { id: lecture.id },
            data: { notifySent: true }
          });
          notified++;
        } else {
          errors.push({ lectureId: lecture.id, error: emailSent.error || 'Failed to send email' });
        }
      } catch (emailErr) {
        errors.push({ lectureId: lecture.id, error: emailErr.message });
      }
    }

    res.json({
      success: true,
      notified,
      total: lectures.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Notify missing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
