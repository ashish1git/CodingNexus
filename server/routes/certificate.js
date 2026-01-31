import express from 'express';
import prisma from '../config/db.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// ============ ADMIN ROUTES ============

// Get all certificates (admin)
router.get('/admin/all', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const certificates = await prisma.certificate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { requests: true }
        }
      }
    });

    res.json({ success: true, data: certificates });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create certificate (admin)
router.post('/admin/create', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const { eventName, eventDate, description, batch, templateType } = req.body;

    if (!eventName || !eventDate) {
      return res.status(400).json({ success: false, error: 'Event name and date are required' });
    }

    const certificate = await prisma.certificate.create({
      data: {
        eventName,
        eventDate: new Date(eventDate),
        description: description || null,
        batch: batch || 'All',
        templateType: templateType || 'participation',
        createdBy: req.user.id,
        isActive: true
      }
    });

    res.json({ success: true, data: certificate, message: 'Certificate created successfully' });
  } catch (error) {
    console.error('Create certificate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update certificate (admin)
router.put('/admin/:id', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { eventName, eventDate, description, batch, templateType, isActive } = req.body;

    const certificate = await prisma.certificate.update({
      where: { id },
      data: {
        eventName,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        description,
        batch,
        templateType,
        isActive
      }
    });

    res.json({ success: true, data: certificate, message: 'Certificate updated successfully' });
  } catch (error) {
    console.error('Update certificate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete certificate (admin)
router.delete('/admin/:id', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.certificate.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get certificate requests (admin)
router.get('/admin/:id/requests', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;

    const requests = await prisma.certificateRequest.findMany({
      where: { certificateId: id },
      include: {
        user: {
          select: {
            email: true,
            moodleId: true,
            studentProfile: {
              select: { name: true, batch: true }
            }
          }
        }
      },
      orderBy: { requestedAt: 'desc' }
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get certificate requests error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ STUDENT ROUTES ============

// Get available certificates for student
router.get('/available', authenticate, authorizeRole('student'), async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    // Get certificates for student's batch or "All"
    const certificates = await prisma.certificate.findMany({
      where: {
        isActive: true,
        OR: [
          { batch: student.batch },
          { batch: 'All' }
        ]
      },
      orderBy: { eventDate: 'desc' }
    });

    // Get student's requests
    const requests = await prisma.certificateRequest.findMany({
      where: { userId: req.user.id }
    });

    const requestMap = new Map(requests.map(r => [r.certificateId, r]));

    // Combine data
    const certificatesWithStatus = certificates.map(cert => ({
      ...cert,
      requested: requestMap.has(cert.id),
      request: requestMap.get(cert.id) || null
    }));

    res.json({ success: true, data: certificatesWithStatus });
  } catch (error) {
    console.error('Get available certificates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Request/claim a certificate
router.post('/:id/request', authenticate, authorizeRole('student'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nameOnCertificate } = req.body;

    if (!nameOnCertificate || nameOnCertificate.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Please provide a valid name for the certificate' });
    }

    // Check if certificate exists and is active
    const certificate = await prisma.certificate.findUnique({
      where: { id }
    });

    if (!certificate || !certificate.isActive) {
      return res.status(404).json({ success: false, error: 'Certificate not found or not available' });
    }

    // Check if already requested
    const existing = await prisma.certificateRequest.findUnique({
      where: {
        certificateId_userId: {
          certificateId: id,
          userId: req.user.id
        }
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'You have already claimed this certificate' });
    }

    // Create request (auto-approved)
    const request = await prisma.certificateRequest.create({
      data: {
        certificateId: id,
        userId: req.user.id,
        nameOnCertificate: nameOnCertificate.trim(),
        status: 'approved'
      },
      include: {
        certificate: true
      }
    });

    res.json({ success: true, data: request, message: 'Certificate claimed successfully!' });
  } catch (error) {
    console.error('Request certificate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get my certificates (student)
router.get('/my-certificates', authenticate, authorizeRole('student'), async (req, res) => {
  try {
    const requests = await prisma.certificateRequest.findMany({
      where: { userId: req.user.id },
      include: {
        certificate: true
      },
      orderBy: { requestedAt: 'desc' }
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get my certificates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Track download
router.post('/:id/download', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.certificateRequest.update({
      where: { id },
      data: {
        downloadCount: { increment: 1 }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
