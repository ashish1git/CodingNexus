import express from 'express';
import prisma from '../config/db.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import { sendEmail } from '../services/email/brevo.service.js';
import * as emailTemplates from '../services/email/emailTemplates.js';

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Public endpoint: submit team application
router.post('/', async (req, res) => {
  try {
    const {
      fullName, branch, year, department, email, phoneNumber,
      githubProfile, linkedinProfile, portfolioWebsite,
      resumeLink, technicalSkills, technicalProficiency,
      preferredLanguage, practiceDSA, dsaPlatforms, problemSolvingLevel,
      hasProjects, projectLinks, proudestProject,
      whyJoinCodingNexus, technicalLearning,
      hoursPerWeek, teamworkCommitted, technicalTaskWilling,
      offlineAvailable, interestedDomain, additionalInfo, declarationAgreed
    } = req.body;

    // REQUIRED VALIDATIONS - Basic Information
    if (!fullName?.trim()) return res.status(400).json({ success: false, error: 'Full Name is required' });
    if (!branch?.trim()) return res.status(400).json({ success: false, error: 'Branch & Year is required' });
    if (!email?.trim()) return res.status(400).json({ success: false, error: 'Email is required' });
    if (!phoneNumber?.trim()) return res.status(400).json({ success: false, error: 'Phone Number is required' });
    
    // REQUIRED VALIDATIONS - Your Profiles (GitHub required)
    if (!githubProfile?.trim()) return res.status(400).json({ success: false, error: 'GitHub Profile is required' });
    
    // REQUIRED VALIDATIONS - Programming & DSA
    if (!preferredLanguage?.trim()) return res.status(400).json({ success: false, error: 'Preferred Programming Language is required' });
    if (!practiceDSA?.trim()) return res.status(400).json({ success: false, error: 'DSA Practice info is required' });
    if (!problemSolvingLevel) return res.status(400).json({ success: false, error: 'Problem Solving Level is required' });
    
    // REQUIRED VALIDATIONS - Technical Skills (at least 1)
    if (!technicalSkills || technicalSkills.length === 0) {
      return res.status(400).json({ success: false, error: 'Select at least one Technical Skill' });
    }
    
    // REQUIRED VALIDATIONS - Motivation & Learning
    if (!whyJoinCodingNexus?.trim()) return res.status(400).json({ success: false, error: 'Why you want to join is required' });
    if (!technicalLearning?.trim()) return res.status(400).json({ success: false, error: 'Technical Learning description is required' });
    
    // REQUIRED VALIDATIONS - Commitment & Availability
    if (!hoursPerWeek || hoursPerWeek < 1) return res.status(400).json({ success: false, error: 'Hours Per Week is required (minimum 1)' });
    if (!teamworkCommitted) return res.status(400).json({ success: false, error: 'Must confirm team commitment' });
    if (!technicalTaskWilling) return res.status(400).json({ success: false, error: 'Must confirm willingness for technical tasks' });
    if (!offlineAvailable) return res.status(400).json({ success: false, error: 'Must confirm offline availability' });
    if (!interestedDomain?.trim()) return res.status(400).json({ success: false, error: 'Interested Domain is required' });
    
    // REQUIRED VALIDATION - Final Declaration
    if (!declarationAgreed) return res.status(400).json({ success: false, error: 'You must agree to the declaration' });
    
    // FORMAT VALIDATIONS
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Invalid email address format' });
    }
    
    if (phoneNumber.trim().length < 8 || phoneNumber.trim().length > 20) {
      return res.status(400).json({ success: false, error: 'Phone number must be 8-20 characters' });
    }
    
    if (fullName.trim().length < 2 || fullName.trim().length > 120) {
      return res.status(400).json({ success: false, error: 'Name must be 2-120 characters' });
    }

    // Create application
    const application = await prisma.teamApplication.create({
      data: {
        fullName: fullName.trim(),
        branch: branch.trim(),
        year: year?.trim() || null,
        department: department?.trim() || null,
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        githubProfile: githubProfile.trim(),
        linkedinProfile: linkedinProfile?.trim() || null,
        portfolioWebsite: portfolioWebsite?.trim() || null,
        resumeLink: resumeLink?.trim() || null,
        technicalSkills: technicalSkills,
        technicalProficiency: parseInt(technicalProficiency) || 3,
        preferredLanguage: preferredLanguage.trim(),
        practiceDSA: practiceDSA.trim(),
        dsaPlatforms: dsaPlatforms?.trim() || null,
        problemSolvingLevel: parseInt(problemSolvingLevel),
        hasProjects: hasProjects === 'yes' || hasProjects === true,
        projectLinks: projectLinks?.trim() || null,
        proudestProject: proudestProject?.trim() || null,
        whyJoinCodingNexus: whyJoinCodingNexus.trim(),
        technicalLearning: technicalLearning.trim(),
        hoursPerWeek: parseInt(hoursPerWeek),
        teamworkCommitted: true,
        technicalTaskWilling: true,
        offlineAvailable: true,
        interestedDomain: interestedDomain.trim(),
        additionalInfo: additionalInfo?.trim() || null,
        declarationAgreed: true
      }
    });

    // Send confirmation email
    try {
      await sendEmail({
        to: email.trim().toLowerCase(),
        subject: 'Team Application Submitted - Coding Nexus',
        html: emailTemplates.teamApplicationSubmission(fullName.trim(), 'Team Application', `APP-${application.id}`),
        text: emailTemplates.plainTextFallback('teamApplicationSubmission', {
          userName: fullName.trim(),
          teamName: 'Team Application',
          applicationId: `APP-${application.id}`
        })
      });
    } catch (emailError) {
      console.error('Failed to send team application email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: application.id
    });
  } catch (error) {
    console.error('Team application submit error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit application'
    });
  }
});

// Admin endpoint: list applications
router.get('/admin', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const applications = await prisma.teamApplication.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Team application list error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
});

// Admin endpoint: delete application
router.delete('/:id', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;

    const application = await prisma.teamApplication.findUnique({
      where: { id }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    await prisma.teamApplication.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Team application delete error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete application'
    });
  }
});

// Admin endpoint: shortlist team applications
router.post('/:id/shortlist', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { interviewDate, interviewTime, additionalNotes } = req.body;

    const application = await prisma.teamApplication.findUnique({
      where: { id }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Update application status
    const updatedApp = await prisma.teamApplication.update({
      where: { id },
      data: {
        status: 'shortlisted',
        interviewDate: interviewDate || null,
        interviewTime: interviewTime || null,
        notes: additionalNotes || null
      }
    });

    // Send shortlist notification email
    try {
      const shortlistMessage = interviewDate 
        ? `Congratulations! You have been shortlisted for the Coding Nexus team.\n\n🗓️ Interview Details:\nDate: ${interviewDate}\nTime: ${interviewTime || 'To be confirmed'}\n\nPlease keep checking your inbox for further updates.`
        : 'Congratulations! You have been shortlisted for the Coding Nexus team.\n\nYou will get an email regarding your interview details soon. Keep checking your inbox!';

      await sendEmail({
        to: application.email,
        subject: `You're Shortlisted! 🎉 - Coding Nexus Team Interview`,
        html: emailTemplates.generalNotification(
          application.fullName,
          '🎊 Congratulations! You\'re Shortlisted!',
          `<p>We are pleased to inform you that you have been shortlisted for the Coding Nexus team interview.</p>
          ${interviewDate ? `<div class="success-box">
            <strong>📅 Interview Details:</strong><br/>
            <strong>Date:</strong> ${interviewDate}<br/>
            <strong>Time:</strong> ${interviewTime || 'To be confirmed'}<br/>
            ${additionalNotes ? `<strong>Additional Information:</strong> ${additionalNotes}` : ''}
          </div>` : '<div class="info-box"><strong>You will receive interview details soon!</strong><br/>Keep checking your inbox for the interview schedule and any other instructions.</div>'}
          <p style="margin-top: 20px;">Thank you for your interest in Coding Nexus. We look forward to meeting you!</p>`,
          'success'
        ),
        text: `${application.fullName},\n\nCongratulations! You have been shortlisted for Coding Nexus team interview.\n\n${shortlistMessage}\n\nBest regards,\nCoding Nexus Team`
      });
    } catch (emailError) {
      console.error('Failed to send shortlist email:', emailError);
    }

    return res.json({
      success: true,
      message: 'Application shortlisted and email sent',
      application: updatedApp
    });
  } catch (error) {
    console.error('Team application shortlist error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to shortlist application'
    });
  }
});

// Admin endpoint: send interview schedule announcement to all applicants
router.post('/admin/send-interview-announcement', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const { interviewDate, interviewTime, additionalInfo, targetStatus } = req.body;

    if (!interviewDate) {
      return res.status(400).json({
        success: false,
        error: 'Interview date is required'
      });
    }

    // Fetch all applications (or filter by status if specified)
    const whereClause = targetStatus ? { status: targetStatus } : {};
    const applications = await prisma.teamApplication.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true
      }
    });

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No applications found to send announcement to'
      });
    }

    // Send announcement emails to all applicants
    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    for (const application of applications) {
      try {
        await sendEmail({
          to: application.email,
          subject: `📢 Important: Interview Schedule Announcement - Coding Nexus`,
          html: emailTemplates.interviewScheduleAnnouncement(
            application.fullName,
            interviewDate,
            interviewTime || '',
            additionalInfo || ''
          ),
          text: `Hello ${application.fullName},\n\nThank you for applying to Coding Nexus team!\n\nWe are currently evaluating all applications. If you are shortlisted, your interview will be on ${interviewDate}${interviewTime ? ' at ' + interviewTime : ''}.\n\nYou will receive a separate email with your interview details if you are shortlisted. Keep checking your inbox!\n\nBest regards,\nCoding Nexus Team`
        });
        
        successCount++;
        console.log(`✅ Interview announcement sent to ${application.email}`);
      } catch (emailError) {
        failureCount++;
        errors.push({
          email: application.email,
          name: application.fullName,
          error: emailError.message
        });
        console.error(`❌ Failed to send announcement to ${application.email}:`, emailError.message);
      }
    }

    return res.json({
      success: true,
      message: `Interview announcement sent to ${successCount} applicants`,
      summary: {
        total: applications.length,
        emailsSent: successCount,
        emailsFailed: failureCount
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Send interview announcement error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send announcement: ' + error.message
    });
  }
});

export default router;
