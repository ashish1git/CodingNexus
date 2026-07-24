import express from 'express';
import { authenticate, authorizeRole, checkPermission } from '../../middleware/auth.js';
import * as studentController from './controllers/student.controller.js';
import * as adminController from './controllers/admin.controller.js';

const router = express.Router();

// ─── Student Routes ──────────────────────────────────────────────────────────

// Get all competitions (with filters)
router.get('/', authenticate, studentController.getCompetitions);

// Get my submission details for a competition
router.get('/:id/my-submission', authenticate, studentController.getMySubmission);

// Get leaderboard for competition
router.get('/:id/leaderboard', authenticate, studentController.getLeaderboard);

// Get all submissions for a competition (Admin only)
router.get(
  '/:id/submissions',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  checkPermission('viewCompetitionSubmissions'),
  adminController.getCompetitionSubmissions
);

// Mark submission incomplete — so student can resubmit
router.put(
  '/:id/submissions/:submissionId/incomplete',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  checkPermission('manageCompetitionSubmissions'),
  adminController.markSubmissionIncomplete
);

// Get single competition with problems
router.get('/:id', authenticate, studentController.getCompetitionById);

// Timer sync - returns server time for client clock calibration
router.get('/:id/timer', authenticate, studentController.getTimerSync);

// Register for competition
router.post('/:id/register', authenticate, studentController.registerUser);

// Submit solutions for competition
router.post('/:id/submit', authenticate, studentController.submitSolutions);

// Save draft code (Auto-Save)
router.put('/:id/save-code', authenticate, studentController.saveDraftCode);

// Clear draft codes
router.delete('/:id/drafts', authenticate, studentController.clearDrafts);

// ─── Admin Routes ────────────────────────────────────────────────────────────

// Create competition (Admin only)
router.post(
  '/',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  checkPermission('manageCompetitions'),
  adminController.createCompetition
);

// Update competition (Admin only)
router.put(
  '/:id',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  checkPermission('manageCompetitions'),
  adminController.updateCompetition
);

// Delete competition (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  checkPermission('deleteCompetitions'),
  adminController.deleteCompetition
);

// Get all problems for a competition (Admin only - for evaluation)
router.get(
  '/:id/problems',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  checkPermission('evaluateCompetitionSubmissions'),
  adminController.getCompetitionProblems
);

// Get all submissions for a specific problem (Admin only - for evaluation)
router.get(
  '/:competitionId/problems/:problemId/submissions',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  checkPermission('evaluateCompetitionSubmissions'),
  adminController.getProblemSubmissions
);

// Save manual evaluation for a submission (Admin only)
router.post(
  '/:competitionId/problems/:problemId/submissions/:submissionId/evaluate',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  checkPermission('evaluateCompetitionSubmissions'),
  adminController.evaluateSubmission
);

// Get evaluation history for a submission (Admin only)
router.get(
  '/:competitionId/problems/:problemId/submissions/:submissionId/history',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  checkPermission('evaluateCompetitionSubmissions'),
  adminController.getEvaluationHistory
);

// Get all evaluations for a competition (Admin only)
router.get(
  '/:competitionId/evaluations',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  checkPermission('evaluateCompetitionSubmissions'),
  adminController.getEvaluations
);

// Get evaluator activity summary (Admin only)
router.get(
  '/:competitionId/evaluator-activity',
  authenticate,
  authorizeRole('admin', 'subadmin', 'superadmin'),
  checkPermission('evaluateCompetitionSubmissions'),
  adminController.getEvaluatorActivity
);

export default router;
