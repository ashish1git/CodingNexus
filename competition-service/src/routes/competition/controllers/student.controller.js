import * as studentService from '../services/student.service.js';

export async function getCompetitions(req, res, next) {
  try {
    const { status, difficulty } = req.query;
    const competitions = await studentService.getCompetitions({
      userId: req.user.id,
      status,
      difficulty
    });
    res.json(competitions);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error fetching competitions:', error);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
}

export async function getMySubmission(req, res, next) {
  try {
    const { id } = req.params;
    const submission = await studentService.getMySubmission({
      competitionId: id,
      userId: req.user.id
    });
    res.json(submission);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error fetching submission details:', error);
    res.status(500).json({ error: 'Failed to fetch submission details' });
  }
}

export async function getLeaderboard(req, res, next) {
  try {
    const { id } = req.params;
    const leaderboard = await studentService.getLeaderboard({
      competitionId: id
    });
    res.json(leaderboard);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}

export async function getCompetitionById(req, res, next) {
  try {
    const { id } = req.params;
    const competition = await studentService.getCompetitionById({
      competitionId: id,
      userId: req.user.id
    });
    res.json(competition);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error fetching competition:', error);
    res.status(500).json({ error: 'Failed to fetch competition' });
  }
}

export async function getServerTime(req, res) {
  res.json({ serverTime: new Date().toISOString() });
}

export async function getTimerSync(req, res, next) {
  try {
    const { id } = req.params;
    const timerSync = await studentService.getTimerSync({
      competitionId: id
    });
    res.json(timerSync);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error fetching timer sync:', error);
    res.status(500).json({ error: 'Failed to sync timer' });
  }
}

export async function registerUser(req, res, next) {
  try {
    const { id } = req.params;
    const result = await studentService.registerUser({
      competitionId: id,
      userId: req.user.id
    });
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error registering for competition:', error);
    res.status(500).json({ error: 'Failed to register for competition' });
  }
}

export async function submitSolutions(req, res, next) {
  try {
    const { id } = req.params;
    const { solutions, violationLog } = req.body;
    const result = await studentService.submitSolutions({
      competitionId: id,
      userId: req.user.id,
      solutions,
      violationLog
    });
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error submitting competition:', error);
    res.status(500).json({ error: 'Failed to submit competition' });
  }
}

export async function saveDraftCode(req, res, next) {
  try {
    const { id: competitionId } = req.params;
    const { problemId, code, language } = req.body;
    const result = await studentService.saveDraftCode({
      competitionId,
      userId: req.user.id,
      problemId,
      code,
      language
    });
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error saving draft code:', error);
    res.status(500).json({ error: 'Failed to save code' });
  }
}

export async function acknowledgeReview(req, res, next) {
  try {
    const { id: competitionId, problemId } = req.params;
    const result = await studentService.acknowledgeReview({
      competitionId,
      userId: req.user.id,
      problemId
    });
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error acknowledging review:', error);
    res.status(500).json({ error: 'Failed to acknowledge review' });
  }
}

export async function clearDrafts(req, res, next) {
  try {
    const { id: competitionId } = req.params;
    const result = await studentService.clearDrafts({
      competitionId,
      userId: req.user.id
    });
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error clearing draft codes:', error);
    res.status(500).json({ error: 'Failed to clear drafts' });
  }
}
