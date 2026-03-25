import express from 'express';
import prisma from '../config/db.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

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

    // Validate email format only if provided
    if (email?.trim() && !emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }

    // Validate phone format only if provided
    if (phoneNumber?.trim() && (phoneNumber.trim().length < 8 || phoneNumber.trim().length > 20)) {
      return res.status(400).json({ success: false, error: 'Phone number must be 8-20 characters' });
    }

    // Validate name length only if provided
    if (fullName?.trim() && (fullName.trim().length < 2 || fullName.trim().length > 120)) {
      return res.status(400).json({ success: false, error: 'Name must be 2-120 characters' });
    }

    // Create application
    const application = await prisma.teamApplication.create({
      data: {
        fullName: fullName?.trim() || null,
        branch: branch?.trim() || null,
        year: year?.trim() || null,
        department: department?.trim() || null,
        email: email?.trim()?.toLowerCase() || null,
        phoneNumber: phoneNumber?.trim() || null,
        githubProfile: githubProfile?.trim() || null,
        linkedinProfile: linkedinProfile?.trim() || null,
        portfolioWebsite: portfolioWebsite?.trim() || null,
        resumeLink: resumeLink?.trim() || null,
        technicalSkills: technicalSkills || [],
        technicalProficiency: parseInt(technicalProficiency) || 3,
        preferredLanguage: preferredLanguage?.trim() || null,
        practiceDSA: practiceDSA?.trim() || null,
        dsaPlatforms: dsaPlatforms?.trim() || null,
        problemSolvingLevel: parseInt(problemSolvingLevel) || 3,
        hasProjects: hasProjects === 'yes' || hasProjects === true,
        projectLinks: projectLinks?.trim() || null,
        proudestProject: proudestProject?.trim() || null,
        whyJoinCodingNexus: whyJoinCodingNexus?.trim() || null,
        technicalLearning: technicalLearning?.trim() || null,
        hoursPerWeek: hoursPerWeek ? parseInt(hoursPerWeek) : null,
        teamworkCommitted: teamworkCommitted === true,
        technicalTaskWilling: technicalTaskWilling === true,
        offlineAvailable: offlineAvailable === true,
        interestedDomain: interestedDomain?.trim() || null,
        additionalInfo: additionalInfo?.trim() || null,
        declarationAgreed: declarationAgreed === true
      }
    });

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

export default router;
