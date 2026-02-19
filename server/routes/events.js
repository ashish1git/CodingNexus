import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import upload, { uploadToCloudinary } from '../middleware/upload.js';
import { sendRegistrationConfirmation, sendCertificateEmail, sendEventReminder } from '../services/emailService.js';
import { generateCertificatePDF } from '../utils/certificateGenerator.js';

const router = express.Router();

// ==================== PUBLIC ROUTES (No Auth Required) ====================

// 1. GET all active/upcoming events (public)
router.get('/public/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        isActive: true,
        status: {
          in: ['upcoming', 'ongoing']
        }
        // Remove deadline filter - show all active events regardless of deadline
      },
      select: {
        id: true,
        title: true,
        description: true,
        eventType: true,
        eventDate: true,
        eventEndDate: true,
        venue: true,
        posterUrl: true,
        maxParticipants: true,
        registrationDeadline: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            registrations: {
              where: {
                registrationStatus: 'confirmed'
              }
            }
          }
        }
      },
      orderBy: {
        eventDate: 'asc'
      }
    });

    // Format response with registered count
    const formattedEvents = events.map(event => ({
      ...event,
      registeredCount: event._count.registrations,
      spotsLeft: event.maxParticipants - event._count.registrations,
      _count: undefined
    }));

    res.json({
      success: true,
      events: formattedEvents
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch events' 
    });
  }
});

// 2. GET single event details (public)
router.get('/public/events/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            registrations: {
              where: {
                registrationStatus: 'confirmed'
              }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'Event not found' 
      });
    }

    res.json({
      success: true,
      event: {
        ...event,
        registeredCount: event._count.registrations,
        spotsLeft: event.maxParticipants - event._count.registrations,
        _count: undefined
      }
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch event details' 
    });
  }
});

// 3. Register for event (guest participant)
router.post('/public/events/:id/register', async (req, res) => {
  const { id: eventId } = req.params;
  const { fullName, email, phone, year, branch, division } = req.body;

  try {
    // Validate required fields
    if (!fullName || !email || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Full name, email, and phone are required' 
      });
    }

    // Validate phone format
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone must be 10 digits' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            registrations: {
              where: { registrationStatus: 'confirmed' }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'Event not found' 
      });
    }

    if (!event.isActive) {
      return res.status(400).json({ 
        success: false, 
        error: 'Event is not active' 
      });
    }

    // Check if event is full
    if (event._count.registrations >= event.maxParticipants) {
      return res.status(400).json({ 
        success: false, 
        error: 'Event is full. No more spots available.' 
      });
    }

    // Check if email already registered for this event
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        participant: {
          email
        }
      }
    });

    if (existingRegistration) {
      return res.status(400).json({ 
        success: false, 
        error: 'You have already registered for this event' 
      });
    }

    // Check if participant exists
    let participant = await prisma.eventParticipant.findUnique({
      where: { email }
    });

    const isNewParticipant = !participant;

    if (!participant) {
      try {
        // Create new participant - generate random password and hash it
        const randomPassword = uuidv4().substring(0, 16);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        participant = await prisma.eventParticipant.create({
          data: {
            name: fullName,
            email,
            phone,
            year: year && year !== '' ? year : null,
            branch: branch && branch !== '' ? branch : null,
            division: division && division !== '' ? division : null,
            password: hashedPassword,
            userType: 'event_guest'
          }
        });
      } catch (createError) {
        if (createError.code === 'P2002') {
          // Unique constraint violation - participant already exists
          participant = await prisma.eventParticipant.findUnique({
            where: { email }
          });
        } else {
          throw createError;
        }
      }
    }
    
    if (!participant) {
      return res.status(400).json({
        success: false,
        error: 'Could not create or find participant'
      });
    }
    
    // Update participant if it already existed
    if (!isNewParticipant) {
      await prisma.eventParticipant.update({
        where: { id: participant.id },
        data: {
          name: fullName,
          phone,
          year: year && year !== '' ? year : participant.year,
          branch: branch && branch !== '' ? branch : participant.branch,
          division: division && division !== '' ? division : participant.division
        }
      });
      // Refetch updated participant
      participant = await prisma.eventParticipant.findUnique({
        where: { id: participant.id }
      });
    }

    // Create registration
    await prisma.eventRegistration.create({
      data: {
        eventId,
        participantId: participant.id,
        registrationStatus: 'confirmed'
      }
    });

    // Send confirmation email asynchronously (don't wait for it)
    // For event guests, we don't need email verification token
    sendRegistrationConfirmation(event, participant, null)
      .then(result => {
        console.log('✅ Registration email sent:', result);
      })
      .catch(error => {
        console.error('❌ Email failed:', error.message);
        // Don't fail registration if email fails
      });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Check your email for confirmation.',
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message, error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Registration failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 4. Event participant login
router.post('/event-login', async (req, res) => {
  const { email, phone, division, branch } = req.body;

  try {
    if (!email || !phone || !division || !branch) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, phone, division, and branch are required' 
      });
    }

    // Find participant by email and verify phone + division + branch match
    const participant = await prisma.eventParticipant.findUnique({
      where: { email }
    });

    if (!participant || !participant.isActive) {
      return res.status(401).json({ 
        success: false, 
        error: 'Participant not found or inactive' 
      });
    }

    // Verify credentials match
    if (participant.phone !== phone || participant.division !== division || participant.branch !== branch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email, phone, division, or branch does not match' 
      });
    }

    // Get active event registrations (allow upcoming and ongoing events)
    const activeRegistrations = await prisma.eventRegistration.findMany({
      where: {
        participantId: participant.id,
        registrationStatus: 'confirmed',
        event: {
          status: {
            in: ['upcoming', 'ongoing']
          },
          isActive: true
        }
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventEndDate: true,
            venue: true,
            posterUrl: true,
            description: true,
            eventType: true,
            status: true
          }
        }
      }
    });

    // Check if participant has access to any registered event
    if (activeRegistrations.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'No registered events',
        message: 'You don\'t have any active event registrations.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: participant.id,
        email: participant.email,
        role: 'event_guest',
        userType: 'event_guest',
        events: activeRegistrations.map(r => r.event.id)
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Shorter expiry for event guests
    );

    res.json({
      success: true,
      token,
      user: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        role: 'event_guest',
        userType: 'event_guest',
        activeEvents: activeRegistrations.map(r => r.event)
      }
    });
  } catch (error) {
    console.error('Event login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed. Please try again.' 
    });
  }
});

// 5. Verify email
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Verification token is required' 
      });
    }

    const participant = await prisma.eventParticipant.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!participant) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired verification token' 
      });
    }

    // Update participant
    await prisma.eventParticipant.update({
      where: { id: participant.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null
      }
    });

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Verification failed' 
    });
  }
});

// ==================== ADMIN ROUTES (Auth Required) ====================

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'subadmin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required' 
    });
  }
  next();
};

// 6. Create event (admin only)
router.post('/admin/events', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      eventType,
      eventDate,
      eventEndDate,
      venue,
      posterUrl,
      maxParticipants,
      registrationDeadline,
      batch
    } = req.body;

    // Validate required fields
    if (!title || !eventDate || !registrationDeadline) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title, event date, and registration deadline are required' 
      });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        eventType: eventType || 'workshop',
        eventDate: new Date(eventDate),
        eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
        venue,
        posterUrl,
        maxParticipants: maxParticipants || 100,
        registrationDeadline: new Date(registrationDeadline),
        batch,
        status: 'upcoming',
        isActive: true,
        createdBy: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create event' 
    });
  }
});

// 7. Get all events (admin)
router.get('/admin/events', authenticate, requireAdmin, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: {
            registrations: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Keep _count for admin to access event._count.registrations
    res.json({
      success: true,
      events: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch events' 
    });
  }
});

// 8. Update event status (admin)
router.patch('/admin/events/:id/status', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!['upcoming', 'ongoing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status' 
      });
    }

    const event = await prisma.event.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      message: 'Event status updated',
      event
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update event status' 
    });
  }
});

// 9. Get event registrations (admin)
router.get('/admin/events/:id/registrations', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: id },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            year: true,
            branch: true,
            division: true,
            collegeName: true,
            isEmailVerified: true
          }
        }
      },
      orderBy: {
        registrationDate: 'desc'
      }
    });

    // Get all quiz attempts for this event to check who actually attended quizzes
    const quizzes = await prisma.eventQuiz.findMany({
      where: { eventId: id },
      select: { id: true }
    });
    const quizIds = quizzes.map(q => q.id);

    let quizAttendedParticipants = new Set();
    if (quizIds.length > 0) {
      const quizAttempts = await prisma.eventQuizAttempt.findMany({
        where: { quizId: { in: quizIds } },
        select: { participantId: true }
      });
      quizAttendedParticipants = new Set(quizAttempts.map(a => a.participantId));
    }

    // Enrich registrations with computed quizAttended field
    const enrichedRegistrations = registrations.map(reg => ({
      ...reg,
      quizAttended: reg.quizAttended || quizAttendedParticipants.has(reg.participantId)
    }));

    res.json({
      success: true,
      registrations: enrichedRegistrations
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch registrations' 
    });
  }
});

// 10. Mark attendance (admin)
router.post('/admin/events/:eventId/attendance/:participantId', authenticate, requireAdmin, async (req, res) => {
  const { eventId, participantId } = req.params;

  try {
    const registration = await prisma.eventRegistration.updateMany({
      where: {
        eventId,
        participantId,
        registrationStatus: 'confirmed'
      },
      data: {
        attendanceMarked: true,
        attendanceTime: new Date()
      }
    });

    if (registration.count === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Registration not found' 
      });
    }

    res.json({
      success: true,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark attendance' 
    });
  }
});

// 11. Admin: Preview certificate template with test data (MUST BE BEFORE :participantId route)
router.post('/admin/events/:eventId/certificate/preview', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { participantName = 'Test Participant', division = 'FY AIML' } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const eventDate = new Date(event.eventDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Generate preview PDF
    const safeName = participantName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${safeName}-preview.pdf`);

    const pdfDoc = await generateCertificatePDF({
      participantName,
      division,
      eventName: event.title,
      eventDate,
      certificateNumber: `PREVIEW-${Date.now()}`,
      templateType: 'participation'
    });

    pdfDoc.pipe(res);
  } catch (error) {
    console.error('Certificate preview error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate preview' });
  }
});

// 12. Generate certificate (admin)
router.post('/admin/events/:eventId/certificate/:participantId', authenticate, requireAdmin, async (req, res) => {
  const { eventId, participantId } = req.params;
  const { templateType } = req.body;

  try {
    // Check if certificate already exists
    const existingCert = await prisma.eventCertificate.findFirst({
      where: {
        eventId,
        participantId
      }
    });

    if (existingCert) {
      return res.status(400).json({ 
        success: false, 
        error: 'Certificate already generated for this participant' 
      });
    }

    // Get event and participant details
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    const participant = await prisma.eventParticipant.findUnique({
      where: { id: participantId }
    });

    const registration = await prisma.eventRegistration.findFirst({
      where: { eventId, participantId }
    });

    if (!event || !participant || !registration) {
      return res.status(404).json({ 
        success: false, 
        error: 'Event, participant, or registration not found' 
      });
    }

    // Generate certificate number
    const certNumber = `CN-${event.title.substring(0, 3).toUpperCase().replace(/\s/g, '')}-${Date.now()}`;

    // Create certificate (PDF generation would be done here or via separate service)
    const certificate = await prisma.eventCertificate.create({
      data: {
        eventId,
        participantId,
        registrationId: registration.id,
        certificateNumber: certNumber,
        templateType: templateType || 'participation',
        verified: true
        // certificateUrl would be set after PDF generation
      }
    });

    // Update registration - set both flags
    await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        certificateGenerated: true,
        certificateId: certificate.id,
        certificateApprovedByAdmin: true  // Auto-approve when admin generates cert
      }
    });

    // Email sending disabled (SMTP auth issues)
    // sendCertificateEmail(event, participant, certificate)
    //   .then(result => {
    //     console.log('✅ Certificate email sent:', result);
    //   })
    //   .catch(error => {
    //     console.error('❌ Certificate email failed:', error);
    //   });

    res.json({
      success: true,
      message: 'Certificate generated successfully',
      certificate
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate certificate' 
    });
  }
});

// 12. Bulk generate certificates (admin)
router.post('/admin/events/:eventId/certificates/bulk', authenticate, requireAdmin, async (req, res) => {
  const { eventId } = req.params;
  const { templateType, attendanceRequired } = req.body;

  try {
    // First get all quiz attendees for this event (from actual quiz attempts)
    const quizzes = await prisma.eventQuiz.findMany({
      where: { eventId },
      select: { id: true }
    });
    const quizIds = quizzes.map(q => q.id);
    
    let quizAttendedParticipants = new Set();
    if (quizIds.length > 0) {
      const quizAttempts = await prisma.eventQuizAttempt.findMany({
        where: { quizId: { in: quizIds } },
        select: { participantId: true }
      });
      quizAttendedParticipants = new Set(quizAttempts.map(a => a.participantId));
    }

    // Get all confirmed registrations without certificates
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        registrationStatus: 'confirmed',
        certificateGenerated: false
      },
      include: {
        participant: true
      }
    });

    // Filter registrations: must have attended (marked OR quizAttended OR in quiz attempts)
    const filteredRegistrations = attendanceRequired 
      ? registrations.filter(reg => 
          reg.attendanceMarked || 
          reg.quizAttended || 
          quizAttendedParticipants.has(reg.participantId)
        )
      : registrations;

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    const results = [];

    for (const registration of filteredRegistrations) {
      try {
        const certNumber = `CN-${event.title.substring(0, 3).toUpperCase().replace(/\s/g, '')}-${Date.now()}-${registration.participant.id.substring(0, 4)}`;

        const certificate = await prisma.eventCertificate.create({
          data: {
            eventId,
            participantId: registration.participantId,
            registrationId: registration.id,
            certificateNumber: certNumber,
            templateType: templateType || 'participation',
            verified: true
          }
        });

        await prisma.eventRegistration.update({
          where: { id: registration.id },
          data: {
            certificateGenerated: true,
            certificateId: certificate.id,
            certificateApprovedByAdmin: true  // Auto-approve when admin generates cert
          }
        });

        // Email sending disabled (SMTP auth issues)
        // sendCertificateEmail(event, registration.participant, certificate).catch(console.error);

        results.push({
          participantId: registration.participantId,
          participantName: registration.participant.name,
          success: true
        });
      } catch (error) {
        results.push({
          participantId: registration.participantId,
          participantName: registration.participant.name,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Generated ${results.filter(r => r.success).length} certificates`,
      results
    });
  } catch (error) {
    console.error('Bulk certificate generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate certificates' 
    });
  }
});

// 13. Admin: Revoke/Delete certificate (MUST BE BEFORE /admin/events/:id to avoid route conflict)
router.delete('/admin/events/:eventId/certificate/:participantId', authenticate, requireAdmin, async (req, res) => {
  console.log('🗑️ Certificate revoke route HIT');
  console.log('   Event ID:', req.params.eventId);
  console.log('   Participant ID:', req.params.participantId);
  
  try {
    const { eventId, participantId } = req.params;

    // Find certificate (may not exist if generated via old system)
    const certificate = await prisma.eventCertificate.findFirst({
      where: { eventId, participantId }
    });

    console.log('   Certificate found:', !!certificate);

    // Delete certificate if it exists
    if (certificate) {
      await prisma.eventCertificate.delete({
        where: { id: certificate.id }
      });
      console.log('   ✅ EventCertificate record deleted');
    } else {
      console.log('   ⚠️ No EventCertificate record found, updating registration only');
    }

    // Always update registration to revoke certificate status
    const updated = await prisma.eventRegistration.updateMany({
      where: { eventId, participantId },
      data: {
        certificateGenerated: false,
        certificateId: null,
        certificateApprovedByAdmin: false  // Also revoke approval
      }
    });

    console.log('   ✅ Registration updated:', updated.count, 'records');

    res.json({
      success: true,
      message: 'Certificate revoked successfully'
    });
  } catch (error) {
    console.error('Certificate revoke error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke certificate' });
  }
});

// 14. Delete event (admin)
router.delete('/admin/events/:id', authenticate, requireAdmin, async (req, res) => {
  console.log('🗑️ Event delete route HIT (should NOT be hit for certificate revoke)');
  console.log('   ID:', req.params.id);
  
  const { id } = req.params;

  try {
    await prisma.event.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete event' 
    });
  }
});

// 14. Update event (admin)
router.put('/admin/events/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    eventType,
    eventDate,
    eventEndDate,
    venue,
    posterUrl,
    maxParticipants,
    registrationDeadline,
    batch,
    isActive
  } = req.body;

  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(eventType && { eventType }),
        ...(eventDate && { eventDate: new Date(eventDate) }),
        ...(eventEndDate && { eventEndDate: new Date(eventEndDate) }),
        ...(venue !== undefined && { venue }),
        ...(posterUrl !== undefined && { posterUrl }),
        ...(maxParticipants && { maxParticipants }),
        ...(registrationDeadline && { registrationDeadline: new Date(registrationDeadline) }),
        ...(batch !== undefined && { batch }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update event' 
    });
  }
});

// ==================== EVENT QUIZ ROUTES (Admin) ====================

// Dedicated auth middleware for event guests (EventParticipant table, NOT User table)
const authenticateEventGuest = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Event guests have role 'event_guest' in the token
    if (decoded.role !== 'event_guest' && decoded.userType !== 'event_guest') {
      return res.status(403).json({ success: false, error: 'Event guest access required' });
    }

    // Look up participant in EventParticipant table (NOT User table)
    const participant = await prisma.eventParticipant.findUnique({
      where: { id: decoded.userId }
    });

    if (!participant || !participant.isActive) {
      return res.status(401).json({ success: false, error: 'Participant not found or inactive' });
    }

    // Attach participant info + JWT claims to req.user
    req.user = {
      id: participant.id,
      userId: participant.id,
      name: participant.name,
      email: participant.email,
      role: 'event_guest',
      events: decoded.events || []
    };

    next();
  } catch (error) {
    console.error('Event guest auth error:', error.message);
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

// 15. Create event quiz (admin)
router.post('/admin/events/:eventId/quizzes', authenticate, requireAdmin, async (req, res) => {
  const { eventId } = req.params;
  const { title, description, startTime, endTime, duration, questions } = req.body;

  try {
    console.log('📝 Received quiz creation request:');
    console.log('  - eventId:', eventId);
    console.log('  - title:', title);
    console.log('  - duration:', duration, 'type:', typeof duration);
    console.log('  - startTime:', startTime);
    console.log('  - endTime:', endTime);
    console.log('  - questions type:', Array.isArray(questions) ? `Array[${questions.length}]` : typeof questions);
    console.log('  - createdBy:', req.user.id);

    // Validation
    const parsedDuration = parseInt(duration, 10);
    if (!title || !startTime || !endTime || isNaN(parsedDuration) || !Array.isArray(questions) || questions.length === 0) {
      console.warn('❌ Validation failed:', { title: !!title, startTime: !!startTime, endTime: !!endTime, duration: parsedDuration, questions: Array.isArray(questions) });
      return res.status(400).json({ 
        success: false, 
        error: 'Title, start time, end time, duration, and questions are required',
        received: { title: !!title, startTime: !!startTime, endTime: !!endTime, duration: `${duration}(parsed:${parsedDuration})`, questionsArray: Array.isArray(questions), questionsLength: questions?.length }
      });
    }

    // Check event exists
    console.log('🔍 Checking if event exists:', eventId);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      console.warn('❌ Event not found:', eventId);
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    console.log('✅ Event found:', event.title);

    // Validate questions structure
    console.log('🔍 Validating questions structure...');
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || !q.type) {
        console.warn(`❌ Question ${i} invalid:`, q);
        return res.status(400).json({ success: false, error: `Question ${i}: missing question text or type` });
      }
    }
    console.log('✅ Questions structure valid');

    // Create quiz
    console.log('💾 Creating quiz in database with parsed duration:', parsedDuration);
    const quiz = await prisma.eventQuiz.create({
      data: {
        eventId,
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: parsedDuration,
        questions: questions, // Assign as-is; Prisma handles JSON serialization
        isActive: true,
        createdBy: req.user.id
      }
    });

    console.log('✅ Quiz created successfully:', quiz.id);
    res.status(201).json({ success: true, message: 'Event quiz created', quiz });
  } catch (error) {
    console.error('❌ Create event quiz error');
    console.error('  - Message:', error.message);
    console.error('  - Code:', error.code);
    console.error('  - Meta:', error.meta);
    console.error('  - Stack:', error.stack);
    
    // Provide more specific error messages
    let errorMsg = 'Failed to create event quiz';
    if (error.code === 'P2002') {
      errorMsg = 'A quiz with this configuration already exists';
    } else if (error.code === 'P2003') {
      errorMsg = 'Invalid event reference';
    } else if (error.code === 'P2014') {
      errorMsg = 'Required relation violation';
    }
    
    res.status(500).json({ success: false, error: errorMsg, details: error.message });
  }
});

// 16. Get all quizzes for an event (admin)
router.get('/admin/events/:eventId/quizzes', authenticate, requireAdmin, async (req, res) => {
  const { eventId } = req.params;

  try {
    console.log('📋 Fetching quizzes for event:', eventId);
    const quizzes = await prisma.eventQuiz.findMany({
      where: { eventId },
      include: {
        _count: { select: { attempts: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${quizzes.length} quizzes for event ${eventId}`);

    const formatted = quizzes.map(q => ({
      ...q,
      attemptCount: q._count.attempts,
      questionCount: Array.isArray(q.questions) ? q.questions.length : 0,
      _count: undefined
    }));

    res.json({ success: true, quizzes: formatted });
  } catch (error) {
    console.error('❌ Error fetching event quizzes:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({ success: false, error: 'Failed to fetch event quizzes', details: error.message });
  }
});

// 17. Update event quiz (admin)
router.put('/admin/events/quizzes/:quizId', authenticate, requireAdmin, async (req, res) => {
  const { quizId } = req.params;
  const { title, description, startTime, endTime, duration, questions, isActive } = req.body;

  try {
    const quiz = await prisma.eventQuiz.update({
      where: { id: quizId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(duration && { duration: parseInt(duration) }),
        ...(questions && { questions }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({ success: true, message: 'Event quiz updated', quiz });
  } catch (error) {
    console.error('Update event quiz error:', error);
    res.status(500).json({ success: false, error: 'Failed to update event quiz' });
  }
});

// 18. Delete event quiz (admin)
router.delete('/admin/events/quizzes/:quizId', authenticate, requireAdmin, async (req, res) => {
  const { quizId } = req.params;

  try {
    await prisma.eventQuiz.delete({ where: { id: quizId } });
    res.json({ success: true, message: 'Event quiz deleted' });
  } catch (error) {
    console.error('Delete event quiz error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete event quiz' });
  }
});

// 19. Get quiz submissions (admin)
router.get('/admin/events/quizzes/:quizId/submissions', authenticate, requireAdmin, async (req, res) => {
  const { quizId } = req.params;

  try {
    const attempts = await prisma.eventQuizAttempt.findMany({
      where: { quizId },
      include: {
        participant: {
          select: { id: true, name: true, email: true, phone: true, branch: true, division: true }
        }
      },
      orderBy: { score: 'desc' }
    });

    res.json({ success: true, submissions: attempts });
  } catch (error) {
    console.error('Error fetching quiz submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

// ==================== EVENT QUIZ ROUTES (Guest) ====================

// 20. Get quizzes for guest's events
router.get('/event-guest/quizzes', authenticateEventGuest, async (req, res) => {
  try {
    const eventIds = req.user.events || [];
    
    const quizzes = await prisma.eventQuiz.findMany({
      where: {
        eventId: { in: eventIds },
        isActive: true
      },
      select: {
        id: true,
        eventId: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        duration: true,
        isActive: true,
        event: { select: { title: true } },
        _count: { select: { attempts: true } }
      },
      orderBy: { startTime: 'asc' }
    });

    // Check which quizzes the participant already attempted
    const attempts = await prisma.eventQuizAttempt.findMany({
      where: {
        participantId: req.user.userId,
        quizId: { in: quizzes.map(q => q.id) }
      },
      select: { quizId: true, score: true, maxScore: true }
    });

    const attemptMap = {};
    attempts.forEach(a => { attemptMap[a.quizId] = a; });

    const formatted = quizzes.map(q => ({
      ...q,
      eventTitle: q.event.title,
      questionCount: 0, // Don't reveal question count
      attempted: !!attemptMap[q.id],
      attemptScore: attemptMap[q.id]?.score || null,
      attemptMaxScore: attemptMap[q.id]?.maxScore || null,
      event: undefined,
      _count: undefined
    }));

    res.json({ success: true, quizzes: formatted });
  } catch (error) {
    console.error('Error fetching guest quizzes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch quizzes' });
  }
});

// 21. Get single quiz for attempt (guest)
router.get('/event-guest/quizzes/:quizId', authenticateEventGuest, async (req, res) => {
  const { quizId } = req.params;

  try {
    const quiz = await prisma.eventQuiz.findUnique({
      where: { id: quizId },
      include: { event: { select: { title: true } } }
    });

    if (!quiz || !quiz.isActive) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    // Verify the guest has access to this event
    const eventIds = req.user.events || [];
    if (!eventIds.includes(quiz.eventId)) {
      return res.status(403).json({ success: false, error: 'You do not have access to this quiz' });
    }

    // Strip correct answers before sending to client
    const sanitizedQuestions = quiz.questions.map(q => ({
      question: q.question,
      type: q.type,
      options: q.options,
      codeSnippet: q.codeSnippet || null
      // correctAnswer intentionally omitted
    }));

    res.json({
      success: true,
      data: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        startTime: quiz.startTime,
        endTime: quiz.endTime,
        duration: quiz.duration,
        eventTitle: quiz.event.title,
        questions: sanitizedQuestions
      }
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch quiz' });
  }
});

// 22. Check if already attempted (guest)
router.get('/event-guest/quizzes/:quizId/attempt', authenticateEventGuest, async (req, res) => {
  const { quizId } = req.params;

  try {
    const attempt = await prisma.eventQuizAttempt.findUnique({
      where: {
        quizId_participantId: {
          quizId,
          participantId: req.user.userId
        }
      }
    });

    if (attempt) {
      res.json({ success: true, data: attempt });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (error) {
    console.error('Error checking attempt:', error);
    res.status(500).json({ success: false, error: 'Failed to check attempt' });
  }
});

// 23. Submit quiz attempt (guest)
router.post('/event-guest/quizzes/:quizId/attempt', authenticateEventGuest, async (req, res) => {
  const { quizId } = req.params;
  const { answers, score, maxScore } = req.body;

  try {
    // Check if already attempted
    const existing = await prisma.eventQuizAttempt.findUnique({
      where: {
        quizId_participantId: {
          quizId,
          participantId: req.user.userId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'You have already attempted this quiz' });
    }

    // Verify quiz exists and is active
    const quiz = await prisma.eventQuiz.findUnique({ where: { id: quizId } });
    if (!quiz || !quiz.isActive) {
      return res.status(404).json({ success: false, error: 'Quiz not found or inactive' });
    }

    // Verify timing
    const now = new Date();
    if (now < new Date(quiz.startTime) || now > new Date(quiz.endTime)) {
      return res.status(400).json({ success: false, error: 'Quiz is not currently active' });
    }

    // Server-side score verification
    let verifiedScore = 0;
    const quizQuestions = quiz.questions;
    if (Array.isArray(quizQuestions)) {
      quizQuestions.forEach((q, i) => {
        if (answers[i] === q.correctAnswer) verifiedScore++;
      });
    }

    const attempt = await prisma.eventQuizAttempt.create({
      data: {
        quizId,
        participantId: req.user.userId,
        answers,
        score: verifiedScore,
        maxScore: quizQuestions.length,
        submittedAt: new Date()
      }
    });

    // Auto-update registration: set quizAttended = true
    await prisma.eventRegistration.updateMany({
      where: {
        eventId: quiz.eventId,
        participantId: req.user.userId
      },
      data: {
        quizAttended: true
      }
    });

    res.status(201).json({
      success: true,
      message: `Quiz submitted! Score: ${verifiedScore}/${quizQuestions.length}`,
      data: attempt
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'You have already attempted this quiz' });
    }
    res.status(500).json({ success: false, error: 'Failed to submit quiz' });
  }
});

// 24. Get quiz results with answers (guest)
router.get('/event-guest/quizzes/:quizId/results', authenticateEventGuest, async (req, res) => {
  const { quizId } = req.params;

  try {
    const attempt = await prisma.eventQuizAttempt.findUnique({
      where: {
        quizId_participantId: {
          quizId,
          participantId: req.user.userId
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({ success: false, error: 'No attempt found' });
    }

    const quiz = await prisma.eventQuiz.findUnique({
      where: { id: quizId },
      include: { event: { select: { title: true } } }
    });

    // Include correct answers for review
    res.json({
      success: true,
      data: {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          eventTitle: quiz.event.title,
          questions: quiz.questions
        },
        attempt: {
          score: attempt.score,
          maxScore: attempt.maxScore,
          answers: attempt.answers,
          submittedAt: attempt.submittedAt
        }
      }
    });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch results' });
  }
});

// ==================== EVENT CERTIFICATE ROUTES (Guest) ====================

// 25. Get certificates for guest
router.get('/event-guest/certificates', authenticateEventGuest, async (req, res) => {
  try {
    const participantId = req.user.userId;

    const certificates = await prisma.eventCertificate.findMany({
      where: {
        participantId: participantId
      },
      include: {
        event: { 
          select: { 
            id: true, 
            title: true, 
            eventDate: true, 
            eventType: true, 
            venue: true, 
            description: true 
          } 
        },
        participant: { 
          select: { 
            id: true, 
            name: true, 
            email: true 
          } 
        }
      },
      orderBy: { issueDate: 'desc' }
    });

    // Filter: Only show certificates for events where participant was marked present
    const eventRegistrations = await prisma.eventRegistration.findMany({
      where: {
        participantId: participantId,
        attendanceMarked: true
      },
      select: { eventId: true }
    });

    const presentEventIds = new Set(eventRegistrations.map(reg => reg.eventId));
    const filteredCertificates = certificates.filter(cert => presentEventIds.has(cert.eventId));

    res.json({ success: true, certificates: filteredCertificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch certificates' });
  }
});

// 26. Get single certificate (guest)
router.get('/event-guest/certificates/:certId', authenticateEventGuest, async (req, res) => {
  const { certId } = req.params;

  try {
    const certificate = await prisma.eventCertificate.findUnique({
      where: { id: certId },
      include: {
        event: true,
        participant: { select: { name: true, email: true } }
      }
    });

    if (!certificate || certificate.participantId !== req.user.userId) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    res.json({ success: true, certificate });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch certificate' });
  }
});

// 27. Get event stats for guest (quizzes attempted, certs earned)
router.get('/event-guest/stats', authenticateEventGuest, async (req, res) => {
  try {
    console.log('📊 Fetching stats for participant:', req.user.userId);
    const eventIds = req.user.events || [];

    const [quizAttempts, certificates] = await Promise.all([
      prisma.eventQuizAttempt.count({
        where: { participantId: req.user.userId }
      }),
      prisma.eventCertificate.count({
        where: { participantId: req.user.userId }
      })
    ]);

    console.log(`✅ Stats: ${quizAttempts} quizzes, ${certificates} certs`);

    res.json({
      success: true,
      stats: {
        totalEvents: eventIds.length,
        quizzesAttempted: quizAttempts,
        certificatesEarned: certificates
      }
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({ success: false, error: 'Failed to fetch stats', details: error.message });
  }
});

// ==================== MEDIA FILES ROUTES ====================

// 27b. Admin: Upload media file to Cloudinary (server-side)
router.post('/admin/events/:eventId/upload-media', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    // Verify event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    // Upload to Cloudinary using server-side credentials
    const result = await uploadToCloudinary(req.file.buffer, `events/media/${eventId}`);

    res.json({ 
      success: true, 
      fileUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format
    });
  } catch (error) {
    console.error('Error uploading media to Cloudinary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload file',
      details: error.message 
    });
  }
});

// 28. Admin: Add media file to event
router.post('/admin/events/:eventId/media', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, fileUrl, fileType, fileName, fileSize } = req.body;

    console.log('Received media save request:', {
      eventId,
      title,
      fileUrl: fileUrl?.substring(0, 50) + '...',
      fileType,
      fileName,
      fileSize,
      userId: req.user?.id
    });

    if (!title || !fileUrl || !fileName) {
      return res.status(400).json({ success: false, error: 'Title, fileUrl, and fileName are required' });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const media = await prisma.eventMedia.create({
      data: {
        eventId,
        title,
        description: description || null,
        fileUrl,
        fileType: fileType || 'document',
        fileName,
        fileSize: fileSize ? parseInt(fileSize) : null,
        uploadedBy: req.user.id
      }
    });

    console.log('Media saved successfully:', media.id);
    res.status(201).json({ success: true, media });
  } catch (error) {
    console.error('Error adding media:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add media file',
      details: error.message 
    });
  }
});

// 29. Admin: List media files for an event
router.get('/admin/events/:eventId/media', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const media = await prisma.eventMedia.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, media });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch media files' });
  }
});

// 30. Admin: Delete media file
router.delete('/admin/events/:eventId/media/:mediaId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { mediaId } = req.params;
    await prisma.eventMedia.delete({ where: { id: mediaId } });
    res.json({ success: true, message: 'Media file deleted' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ success: false, error: 'Failed to delete media file' });
  }
});

// 31. Event Guest: List media files for their registered events
router.get('/event-guest/events/:eventId/media', authenticateEventGuest, async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventIds = req.user.events || [];

    // Verify participant is registered for this event
    if (!eventIds.includes(eventId)) {
      return res.status(403).json({ success: false, error: 'You are not registered for this event' });
    }

    const media = await prisma.eventMedia.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, media });
  } catch (error) {
    console.error('Error fetching media for guest:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch media files' });
  }
});

// ==================== DYNAMIC CERTIFICATE PDF SYSTEM ====================

// 32. Event Guest: Get all registrations with eligibility status
router.get('/event-guest/my-registrations', authenticateEventGuest, async (req, res) => {
  try {
    const participantId = req.user.userId;

    const registrations = await prisma.eventRegistration.findMany({
      where: {
        participantId,
        registrationStatus: 'confirmed'
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventEndDate: true,
            eventType: true,
            venue: true,
            description: true,
            status: true
          }
        }
      },
      orderBy: { registrationDate: 'desc' }
    });

    // Also check quiz attempts for each event to auto-determine quiz attendance
    const quizAttempts = await prisma.eventQuizAttempt.findMany({
      where: { participantId },
      include: {
        quiz: {
          select: { eventId: true }
        }
      }
    });

    // Build set of event IDs where participant has attempted a quiz
    const quizAttendedEventIds = new Set(
      quizAttempts.map(attempt => attempt.quiz.eventId)
    );

    // Check for issued certificates (EventCertificate records)
    const issuedCertificates = await prisma.eventCertificate.findMany({
      where: {
        participantId,
        eventId: { in: registrations.map(r => r.eventId) }
      },
      select: { eventId: true, id: true }
    });

    const issuedCertEventIds = new Set(issuedCertificates.map(c => c.eventId));

    // Map registrations with eligibility
    const registrationsWithEligibility = registrations.map(reg => {
      const quizAttended = reg.quizAttended || quizAttendedEventIds.has(reg.eventId);
      const certificateIssued = issuedCertEventIds.has(reg.eventId);
      
      // Eligible if: quiz attended OR admin approved OR certificate already issued
      const eligible = reg.registrationStatus === 'confirmed' && 
        (quizAttended || reg.certificateApprovedByAdmin || certificateIssued);

      return {
        id: reg.id,
        eventId: reg.eventId,
        registrationDate: reg.registrationDate,
        attendanceMarked: reg.attendanceMarked,
        quizAttended,
        certificateApprovedByAdmin: reg.certificateApprovedByAdmin,
        certificateIssued,
        eligible,
        event: reg.event
      };
    });

    res.json({ success: true, registrations: registrationsWithEligibility });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch registrations' });
  }
});

// 33. Event Guest: Download certificate PDF (backend-generated)
// Supports both GET (uses DB name) and POST (accepts custom name)
router.post('/event-guest/certificate/:eventId/download', authenticateEventGuest, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { customName } = req.body; // Optional custom name for certificate
    const participantId = req.user.userId;

    // Fetch registration
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        participantId,
        registrationStatus: 'confirmed'
      }
    });

    if (!registration) {
      return res.status(403).json({ success: false, message: 'Not registered for this event' });
    }

    // Check quiz attendance from EventQuizAttempt
    let quizAttended = registration.quizAttended;
    if (!quizAttended) {
      const quizAttempt = await prisma.eventQuizAttempt.findFirst({
        where: {
          participantId,
          quiz: { eventId }
        }
      });
      quizAttended = !!quizAttempt;
    }

    // Check if certificate already issued (EventCertificate exists)
    const existingCert = await prisma.eventCertificate.findFirst({
      where: { eventId, participantId }
    });

    // Eligibility: quiz attended OR admin approved OR certificate already issued
    if (!quizAttended && !registration.certificateApprovedByAdmin && !existingCert) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not eligible for certificate. You must attend the quiz or be approved by admin.' 
      });
    }

    // Fetch event & participant details
    const [event, participant] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.eventParticipant.findUnique({ where: { id: participantId } })
    ]);

    if (!event || !participant) {
      return res.status(404).json({ success: false, message: 'Event or participant not found' });
    }

    // Use custom name if provided, otherwise use DB name
    const certificateName = customName?.trim() || participant.name;

    // Format event date
    const eventDate = new Date(event.eventDate).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Generate certificate number
    const certNumber = `CN-${event.title.substring(0, 3).toUpperCase().replace(/\s/g, '')}-${Date.now()}`;

    // Determine template type
    let templateType = 'participation';
    if (existingCert) {
      templateType = existingCert.templateType;
    }

    // Generate PDF
    const safeName = certificateName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${safeName}-certificate.pdf`);

    const pdfDoc = await generateCertificatePDF({
      participantName: certificateName,
      division: participant.division || '',
      eventName: event.title,
      eventDate,
      certificateNumber: existingCert?.certificateNumber || certNumber,
      templateType
    });

    pdfDoc.pipe(res);
  } catch (error) {
    console.error('Certificate download error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate certificate' });
  }
});

// GET version for backward compatibility
router.get('/event-guest/certificate/:eventId/download', authenticateEventGuest, async (req, res) => {
  try {
    const { eventId } = req.params;
    const participantId = req.user.userId;

    // Fetch registration
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        participantId,
        registrationStatus: 'confirmed'
      }
    });

    if (!registration) {
      return res.status(403).json({ success: false, message: 'Not registered for this event' });
    }

    // Check quiz attendance from EventQuizAttempt as well
    let quizAttended = registration.quizAttended;
    if (!quizAttended) {
      const quizAttempt = await prisma.eventQuizAttempt.findFirst({
        where: {
          participantId,
          quiz: { eventId }
        }
      });
      quizAttended = !!quizAttempt;
    }

    // Check if certificate already issued (EventCertificate exists)
    const existingCert = await prisma.eventCertificate.findFirst({
      where: { eventId, participantId }
    });

    // Eligibility check: quiz attended OR admin approved OR cert already issued
    if (!quizAttended && !registration.certificateApprovedByAdmin && !existingCert) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not eligible for certificate. You must attend the quiz or be approved by admin.' 
      });
    }

    // Fetch event & participant details
    const [event, participant] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.eventParticipant.findUnique({ where: { id: participantId } })
    ]);

    if (!event || !participant) {
      return res.status(404).json({ success: false, message: 'Event or participant not found' });
    }

    // Format event date
    const eventDate = new Date(event.eventDate).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Generate certificate number if not already in EventCertificate
    const certNumber = `CN-${event.title.substring(0, 3).toUpperCase().replace(/\s/g, '')}-${Date.now()}`;

    // Determine template type from existingCert (already fetched above)
    let templateType = 'participation';
    if (existingCert) {
      templateType = existingCert.templateType;
    }

    // Generate PDF
    const safeName = participant.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${safeName}-certificate.pdf`);

    const pdfDoc = await generateCertificatePDF({
      participantName: participant.name,
      division: participant.division || '',
      eventName: event.title,
      eventDate,
      certificateNumber: existingCert?.certificateNumber || certNumber,
      templateType
    });

    pdfDoc.pipe(res);
  } catch (error) {
    console.error('Certificate download error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate certificate' });
  }
});


// 34. Admin: Toggle certificate approval for a participant
router.put('/admin/events/:eventId/registrations/:registrationId/approve-certificate', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId, registrationId } = req.params;
    const { approved } = req.body; // true or false

    const registration = await prisma.eventRegistration.findFirst({
      where: {
        id: registrationId,
        eventId
      }
    });

    if (!registration) {
      return res.status(404).json({ success: false, error: 'Registration not found' });
    }

    const updated = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        certificateApprovedByAdmin: approved !== undefined ? approved : true
      },
      include: {
        participant: {
          select: { name: true, email: true }
        }
      }
    });

    res.json({
      success: true,
      message: `Certificate ${updated.certificateApprovedByAdmin ? 'approved' : 'revoked'} for ${updated.participant.name}`,
      registration: updated
    });
  } catch (error) {
    console.error('Certificate approval error:', error);
    res.status(500).json({ success: false, error: 'Failed to update certificate approval' });
  }
});

// 36. Admin: Bulk approve certificates for event participants
router.put('/admin/events/:eventId/certificates/bulk-approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { registrationIds, approved } = req.body; // array of registration IDs

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return res.status(400).json({ success: false, error: 'registrationIds array is required' });
    }

    const result = await prisma.eventRegistration.updateMany({
      where: {
        id: { in: registrationIds },
        eventId
      },
      data: {
        certificateApprovedByAdmin: approved !== undefined ? approved : true
      }
    });

    res.json({
      success: true,
      message: `Certificate ${approved !== false ? 'approved' : 'revoked'} for ${result.count} participants`,
      updatedCount: result.count
    });
  } catch (error) {
    console.error('Bulk certificate approval error:', error);
    res.status(500).json({ success: false, error: 'Failed to bulk update certificate approvals' });
  }
});

// 36. Admin: Get registrations with eligibility info
router.get('/admin/events/:eventId/registrations-with-eligibility', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            year: true,
            branch: true,
            division: true
          }
        }
      },
      orderBy: { registrationDate: 'asc' }
    });

    // Check quiz attempts
    const quizAttempts = await prisma.eventQuizAttempt.findMany({
      where: {
        quiz: { eventId },
        participantId: { in: registrations.map(r => r.participantId) }
      },
      select: { participantId: true }
    });

    const quizAttendedParticipants = new Set(quizAttempts.map(a => a.participantId));

    // Check issued certificates
    const issuedCertificates = await prisma.eventCertificate.findMany({
      where: {
        eventId,
        participantId: { in: registrations.map(r => r.participantId) }
      },
      select: { participantId: true, id: true }
    });

    const certIssuedParticipants = new Set(issuedCertificates.map(c => c.participantId));

    const registrationsWithEligibility = registrations.map(reg => {
      const quizAttended = reg.quizAttended || quizAttendedParticipants.has(reg.participantId);
      const certificateIssued = certIssuedParticipants.has(reg.participantId);
      const eligible = reg.registrationStatus === 'confirmed' && 
        (quizAttended || reg.certificateApprovedByAdmin || certificateIssued);

      return {
        ...reg,
        quizAttended,
        certificateIssued,
        eligible
      };
    });

    res.json({ success: true, registrations: registrationsWithEligibility });
  } catch (error) {
    console.error('Error fetching registrations with eligibility:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch registrations' });
  }
});

export default router;
