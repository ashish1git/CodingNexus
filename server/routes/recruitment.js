import express from 'express';
import prisma from '../config/db.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import { ROLES, getRoleKeys } from '../config/recruitment-questions.js';
import { sendEmail } from '../services/email/brevo.service.js';
import * as emailTemplates from '../services/email/emailTemplates.js';
import * as XLSX from 'xlsx';

const router = express.Router();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Auto-seed config rows for all roles on first use ──
async function ensureConfigRows() {
  try {
    const keys = getRoleKeys();
    for (const role of keys) {
      await prisma.recruitmentConfig.upsert({
        where: { role },
        create: { role, isOpen: false },
        update: {},
      });
    }
    console.log(`✅ Seeded ${keys.length} recruitment config rows`);
  } catch (err) {
    console.error('Failed to seed recruitment configs:', err);
  }
}
ensureConfigRows();

// ────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ────────────────────────────────────────────────────────────

/**
 * GET /api/recruitment/config
 * List all roles that are currently open (and not expired), with their questions.
 */
router.get('/config', async (req, res) => {
  try {
    const configs = await prisma.recruitmentConfig.findMany({
      where: { isOpen: true },
      orderBy: { role: 'asc' },
    });

    const now = new Date();
    const openRoles = configs.filter((c) => !c.expiresAt || new Date(c.expiresAt) > now);

    const payload = openRoles.map((c) => ({
      role: c.role,
      label: ROLES[c.role]?.label || c.role,
      description: ROLES[c.role]?.description || '',
      icon: ROLES[c.role]?.icon || 'User',
      color: ROLES[c.role]?.color || 'gray',
      expiresAt: c.expiresAt,
      questions: ROLES[c.role]?.questions || [],
    }));

    return res.json({ success: true, roles: payload });
  } catch (error) {
    console.error('Recruitment config error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch recruitment config' });
  }
});

/**
 * GET /api/recruitment/config/:role
 * Config + questions for a single role (checks open + expiry).
 */
router.get('/config/:role', async (req, res) => {
  try {
    const { role } = req.params;

    if (!ROLES[role]) {
      return res.status(404).json({ success: false, error: `Unknown role: ${role}` });
    }

    const config = await prisma.recruitmentConfig.findUnique({ where: { role } });

    if (!config || !config.isOpen) {
      return res.status(403).json({ success: false, error: 'This role is not currently open for applications' });
    }

    if (config.expiresAt && new Date(config.expiresAt) < new Date()) {
      return res.status(403).json({ success: false, error: 'Applications for this role have closed' });
    }

    return res.json({
      success: true,
      role: {
        role: config.role,
        label: ROLES[role].label,
        description: ROLES[role].description,
        icon: ROLES[role].icon,
        color: ROLES[role].color,
        expiresAt: config.expiresAt,
        questions: ROLES[role].questions,
      },
    });
  } catch (error) {
    console.error('Recruitment role config error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch role config' });
  }
});

/**
 * POST /api/recruitment/submit
 * Submit an application for a specific role.
 */
router.post('/submit', async (req, res) => {
  try {
    const { role, fullName, moodleId, whatsappNo, email, branch, year, roleAnswers } = req.body;

    // ── Validate common fields ──
    if (!role || !ROLES[role]) return res.status(400).json({ success: false, error: 'Invalid or missing role' });
    if (!fullName?.trim()) return res.status(400).json({ success: false, error: 'Full Name is required' });
    if (!moodleId?.trim()) return res.status(400).json({ success: false, error: 'Moodle ID is required' });
    if (!whatsappNo?.trim()) return res.status(400).json({ success: false, error: 'WhatsApp Number is required' });
    if (!email?.trim()) return res.status(400).json({ success: false, error: 'Email is required' });
    if (!branch?.trim()) return res.status(400).json({ success: false, error: 'Branch is required' });
    if (!year?.trim()) return res.status(400).json({ success: false, error: 'Year is required' });
    if (!roleAnswers) return res.status(400).json({ success: false, error: 'Role-specific answers are required' });

    // ── Format validations ──
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Invalid email address format' });
    }
    if (fullName.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Name must be at least 2 characters' });
    }
    if (whatsappNo.trim().length < 8) {
      return res.status(400).json({ success: false, error: 'WhatsApp number must be at least 8 characters' });
    }

    // ── Check if role is open and not expired ──
    const config = await prisma.recruitmentConfig.findUnique({ where: { role } });
    if (!config || !config.isOpen) {
      return res.status(403).json({ success: false, error: 'Applications for this role are currently closed' });
    }
    if (config.expiresAt && new Date(config.expiresAt) < new Date()) {
      return res.status(403).json({ success: false, error: 'The application deadline for this role has passed' });
    }

    // ── Validate required role-specific answers ──
    const questions = ROLES[role]?.questions || [];
    for (const q of questions) {
      if (q.required) {
        const answer = roleAnswers[q.id];
        if (
          answer === undefined ||
          answer === null ||
          (typeof answer === 'string' && !answer.trim()) ||
          (Array.isArray(answer) && answer.length === 0)
        ) {
          return res.status(400).json({ success: false, error: `"${q.label}" is required` });
        }
      }
    }

    // ── Create submission ──
    const submission = await prisma.recruitmentSubmission.create({
      data: {
        role,
        fullName: fullName.trim(),
        moodleId: moodleId.trim(),
        whatsappNo: whatsappNo.trim(),
        email: email.trim().toLowerCase(),
        branch: branch.trim(),
        year: year.trim(),
        roleAnswers,
      },
    });

    // ── Send confirmation email ──
    try {
      await sendEmail({
        to: email.trim().toLowerCase(),
        subject: `Application Received — ${ROLES[role]?.label || role} — Coding Nexus`,
        html: emailTemplates.generalNotification(
          fullName.trim(),
          `🎯 Application Received for ${ROLES[role]?.label || role}!`,
          `<p>Thank you for applying to join the <strong>${ROLES[role]?.label || role}</strong> team!</p>
           <div class="success-box">
             <strong>✓ Your application has been submitted successfully.</strong>
           </div>
           <p>Our team will review your application and get back to you via email or WhatsApp.</p>
           <p>Application ID: <strong>REC-${submission.id.substring(0, 8)}</strong></p>
           <p>Keep an eye on your inbox and WhatsApp for updates from the Coding Nexus team.</p>`,
          'success'
        ),
        text: `Hello ${fullName.trim()},\n\nThank you for applying to the ${ROLES[role]?.label || role} team at Coding Nexus!\n\nYour application has been received successfully.\n\nApplication ID: REC-${submission.id.substring(0, 8)}\n\nWe'll review and get back to you soon.\n\nBest regards,\nCoding Nexus Team`,
      });
    } catch (emailError) {
      console.error('Failed to send recruitment confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      submissionId: submission.id,
    });
  } catch (error) {
    console.error('Recruitment submission error:', error);
    return res.status(500).json({ success: false, error: 'Failed to submit application' });
  }
});

// ────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS (protected)
// ────────────────────────────────────────────────────────────

/**
 * GET /api/recruitment/admin/config
 * List all role configurations (admin only).
 */
router.get(
  '/admin/config',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  async (req, res) => {
    try {
      const configs = await prisma.recruitmentConfig.findMany({ orderBy: { role: 'asc' } });
      return res.json({ success: true, configs });
    } catch (error) {
      console.error('Admin config fetch error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch configurations' });
    }
  }
);

/**
 * PUT /api/recruitment/admin/config/:role
 * Toggle a role open/closed and optionally set an expiry date.
 */
router.put(
  '/admin/config/:role',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  async (req, res) => {
    try {
      const { role } = req.params;
      const { isOpen, expiresAt } = req.body;

      if (!ROLES[role]) {
        return res.status(400).json({ success: false, error: `Unknown role: ${role}` });
      }

      const config = await prisma.recruitmentConfig.upsert({
        where: { role },
        create: { role, isOpen: !!isOpen, expiresAt: expiresAt ? new Date(expiresAt) : null },
        update: {
          ...(typeof isOpen === 'boolean' ? { isOpen } : {}),
          ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
        },
      });

      return res.json({ success: true, message: 'Configuration updated', config });
    } catch (error) {
      console.error('Admin config update error:', error);
      return res.status(500).json({ success: false, error: 'Failed to update configuration' });
    }
  }
);

/**
 * GET /api/recruitment/admin/stats
 * Return aggregate stats for the dashboard header.
 */
router.get(
  '/admin/stats',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  async (req, res) => {
    try {
      const [totalRoles, openRoles, totalSubmissions] = await Promise.all([
        prisma.recruitmentConfig.count(),
        prisma.recruitmentConfig.count({ where: { isOpen: true } }),
        prisma.recruitmentSubmission.count(),
      ]);

      return res.json({ success: true, stats: { totalRoles, openRoles, totalSubmissions } });
    } catch (error) {
      console.error('Admin stats error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
  }
);

/**
 * PUT /api/recruitment/admin/config
 * Batch toggle all roles open or closed.
 */
router.put(
  '/admin/config',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  async (req, res) => {
    try {
      const { isOpen } = req.body;
      if (typeof isOpen !== 'boolean') {
        return res.status(400).json({ success: false, error: 'isOpen boolean is required' });
      }

      await prisma.recruitmentConfig.updateMany({ data: { isOpen } });

      return res.json({ success: true, message: `All roles ${isOpen ? 'opened' : 'closed'}` });
    } catch (error) {
      console.error('Admin batch update error:', error);
      return res.status(500).json({ success: false, error: 'Failed to update configurations' });
    }
  }
);

/**
 * GET /api/recruitment/admin/submissions
 * List submissions with optional role and date filters.
 */
router.get(
  '/admin/submissions',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  async (req, res) => {
    try {
      const { role, startDate, endDate } = req.query;

      const where = {};
      if (role) where.role = role;
      if (startDate || endDate) {
        where.submittedAt = {};
        if (startDate) where.submittedAt.gte = new Date(startDate);
        if (endDate) where.submittedAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }

      const submissions = await prisma.recruitmentSubmission.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
      });

      return res.json({ success: true, submissions, total: submissions.length });
    } catch (error) {
      console.error('Admin submissions fetch error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
    }
  }
);

/**
 * GET /api/recruitment/admin/submissions/export
 * Export submissions as an Excel (.xlsx) file.
 */
router.get(
  '/admin/submissions/export',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  async (req, res) => {
    try {
      const { role } = req.query;
      const where = role ? { role } : {};
      const submissions = await prisma.recruitmentSubmission.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
      });

      if (submissions.length === 0) {
        return res.status(404).json({ success: false, error: 'No submissions to export' });
      }

      // Build rows: common fields + role-specific answers flattened
      const rows = submissions.map((sub) => {
        const answers = sub.roleAnswers || {};
        const roleQuestions = ROLES[sub.role]?.questions || [];

        const row = {
          'Submission ID': sub.id.substring(0, 8),
          Role: sub.role,
          'Full Name': sub.fullName,
          'Moodle ID': sub.moodleId,
          'WhatsApp No.': sub.whatsappNo,
          Email: sub.email,
          Branch: sub.branch,
          Year: sub.year,
          'Submitted At': sub.submittedAt.toISOString(),
        };

        for (const q of roleQuestions) {
          const answer = answers[q.id];
          row[q.label] = Array.isArray(answer) ? answer.join(', ') : answer ?? '';
        }

        return row;
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

      // Auto-fit column widths
      const colWidths = Object.keys(rows[0] || {}).map((k) => ({
        wch: Math.max(k.length, 20),
      }));
      worksheet['!cols'] = colWidths;

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const filename = `recruitment-submissions${role ? '-' + role.replace(/\s+/g, '-') : ''}-${Date.now()}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    } catch (error) {
      console.error('Export error:', error);
      return res.status(500).json({ success: false, error: 'Failed to export submissions' });
    }
  }
);

/**
 * PUT /api/recruitment/admin/submissions/:id/status
 * Update a submission's status (pending / shortlisted / rejected).
 * Sends a shortlist email automatically when status is 'shortlisted'.
 */
router.put(
  '/admin/submissions/:id/status',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, sendEmail } = req.body;

      if (!['pending', 'shortlisted', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status. Must be pending, shortlisted, or rejected' });
      }

      const sub = await prisma.recruitmentSubmission.findUnique({ where: { id } });
      if (!sub) {
        return res.status(404).json({ success: false, error: 'Submission not found' });
      }

      const updated = await prisma.recruitmentSubmission.update({
        where: { id },
        data: { status, reviewedBy: req.user.id, reviewedAt: new Date() },
      });

      // Auto-send shortlist email
      let emailSent = false;
      if (status === 'shortlisted' && sendEmail !== false) {
        try {
          const roleLabel = ROLES[sub.role]?.label || sub.role;
          await sendEmail({
            to: sub.email,
            subject: `🎉 Congratulations! Shortlisted for ${roleLabel} — Coding Nexus`,
            html: generalNotification(
              sub.fullName,
              `🎉 You've Been Shortlisted for ${roleLabel}!`,
              `<p>Congratulations! We are pleased to inform you that you have been <strong>shortlisted</strong> for the position of <strong>${roleLabel}</strong> at Coding Nexus.</p>
               <div class="success-box">
                 <strong>✅ What's Next?</strong>
                 <p style="margin-top: 8px;">You will receive further details about the interview schedule shortly via email and WhatsApp. Keep an eye on your inbox!</p>
               </div>
               <p>If you have any questions in the meantime, feel free to reach out to us.</p>`,
              'success'
            ),
            text: `Hello ${sub.fullName},\n\nCongratulations! You have been shortlisted for the ${roleLabel} position at Coding Nexus.\n\nYou will receive further details about the interview schedule shortly via email and WhatsApp.\n\nBest regards,\nCoding Nexus Team`
          });
          emailSent = true;
        } catch (emailError) {
          console.error('Failed to send shortlist email:', emailError);
        }
      }

      return res.json({ success: true, submission: updated, emailSent });
    } catch (error) {
      console.error('Status update error:', error);
      return res.status(500).json({ success: false, error: 'Failed to update status' });
    }
  }
);

/**
 * POST /api/recruitment/admin/submissions/batch-status
 * Batch update status for multiple submissions.
 * Sends shortlist emails automatically when status is 'shortlisted'.
 */
router.post(
  '/admin/submissions/batch-status',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  async (req, res) => {
    try {
      const { ids, status, sendEmail } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'ids array is required' });
      }
      if (!['pending', 'shortlisted', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status. Must be pending, shortlisted, or rejected' });
      }

      const result = await prisma.recruitmentSubmission.updateMany({
        where: { id: { in: ids } },
        data: { status, reviewedBy: req.user.id, reviewedAt: new Date() },
      });

      // Send shortlist emails to each candidate
      let emailsSent = 0;
      let emailErrors = 0;
      if (status === 'shortlisted' && sendEmail !== false) {
        const submissions = await prisma.recruitmentSubmission.findMany({
          where: { id: { in: ids } }
        });

        for (const sub of submissions) {
          try {
            const roleLabel = ROLES[sub.role]?.label || sub.role;
            await sendEmail({
              to: sub.email,
              subject: `🎉 Congratulations! Shortlisted for ${roleLabel} — Coding Nexus`,
              html: generalNotification(
                sub.fullName,
                `🎉 You've Been Shortlisted for ${roleLabel}!`,
                `<p>Congratulations! We are pleased to inform you that you have been <strong>shortlisted</strong> for the position of <strong>${roleLabel}</strong> at Coding Nexus.</p>
                 <div class="success-box">
                   <strong>✅ What's Next?</strong>
                   <p style="margin-top: 8px;">You will receive further details about the interview schedule shortly via email and WhatsApp. Keep an eye on your inbox!</p>
                 </div>
                 <p>If you have any questions in the meantime, feel free to reach out to us.</p>`,
                'success'
              ),
              text: `Hello ${sub.fullName},\n\nCongratulations! You have been shortlisted for the ${roleLabel} position at Coding Nexus.\n\nYou will receive further details about the interview schedule shortly via email and WhatsApp.\n\nBest regards,\nCoding Nexus Team`
            });
            emailsSent++;
          } catch (emailError) {
            console.error(`Failed to send shortlist email to ${sub.email}:`, emailError);
            emailErrors++;
          }
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return res.json({
        success: true,
        count: result.count,
        emailsSent: status === 'shortlisted' ? emailsSent : 0,
        emailErrors: status === 'shortlisted' ? emailErrors : 0
      });
    } catch (error) {
      console.error('Batch status update error:', error);
      return res.status(500).json({ success: false, error: 'Failed to batch update status' });
    }
  }
);

/**
 * DELETE /api/recruitment/admin/submissions/:id
 * Delete a single submission.
 */
router.delete(
  '/admin/submissions/:id',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const sub = await prisma.recruitmentSubmission.findUnique({ where: { id } });
      if (!sub) {
        return res.status(404).json({ success: false, error: 'Submission not found' });
      }

      await prisma.recruitmentSubmission.delete({ where: { id } });

      return res.json({ success: true, message: 'Submission deleted' });
    } catch (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete submission' });
    }
  }
);

export default router;
