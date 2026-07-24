import * as adminService from '../services/admin.service.js';

export async function getCompetitionSubmissions(req, res, next) {
  try {
    const { id } = req.params;
    const submissions = await adminService.getCompetitionSubmissions({ competitionId: id });
    res.json(submissions);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}

export async function markSubmissionIncomplete(req, res, next) {
  try {
    const { submissionId } = req.params;
    const result = await adminService.markSubmissionIncomplete({ submissionId });
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error incompleting submission:', error);
    res.status(500).json({ error: 'Failed to incomplete submission' });
  }
}

export async function createCompetition(req, res, next) {
  try {
    const result = await adminService.createCompetition({
      competitionData: req.body,
      userId: req.user.id
    });
    res.status(201).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error creating competition:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create competition', details: error.message });
  }
}

export async function updateCompetition(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminService.updateCompetition({
      competitionId: id,
      competitionData: req.body
    });
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error updating competition:', error);
    res.status(500).json({ error: 'Failed to update competition' });
  }
}

export async function deleteCompetition(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminService.deleteCompetition({ competitionId: id });
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error deleting competition:', error);
    res.status(500).json({ error: 'Failed to delete competition' });
  }
}

export async function getCompetitionProblems(req, res, next) {
  try {
    const { id } = req.params;
    const problems = await adminService.getCompetitionProblems({ competitionId: id });
    res.json(problems);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
}

export async function getProblemSubmissions(req, res, next) {
  try {
    const { competitionId, problemId } = req.params;
    const submissions = await adminService.getProblemSubmissions({ competitionId, problemId });
    res.json(submissions);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}

export async function evaluateSubmission(req, res, next) {
  try {
    const { submissionId, competitionId, problemId } = req.params;
    const { marks, comments } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const result = await adminService.evaluateSubmission({
      competitionId,
      problemId,
      submissionId,
      marks,
      comments,
      evaluatorId: req.user.id,
      ipAddress
    });
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error saving evaluation:', error);
    res.status(500).json({ error: 'Failed to save evaluation' });
  }
}

export async function getEvaluationHistory(req, res, next) {
  try {
    const { submissionId } = req.params;
    const history = await adminService.getEvaluationHistory({ submissionId });
    res.json(history);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error fetching evaluation history:', error);
    res.status(500).json({ error: 'Failed to fetch evaluation history' });
  }
}

export async function getEvaluations(req, res, next) {
  try {
    const { competitionId } = req.params;
    const evaluations = await adminService.getEvaluations({ competitionId });
    res.json(evaluations);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
}

export async function getEvaluatorActivity(req, res, next) {
  try {
    const { competitionId } = req.params;
    const activitySummary = await adminService.getEvaluatorActivity({ competitionId });
    res.json(activitySummary);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error fetching evaluator activity:', error);
    res.status(500).json({ error: 'Failed to fetch evaluator activity' });
  }
}
