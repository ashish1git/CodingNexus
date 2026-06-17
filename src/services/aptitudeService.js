import apiClient from './apiClient';

const aptitudeService = {
  // ── Student ──────────────────────────────────────────────

  getAllTests: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.difficulty && filters.difficulty !== 'all') params.append('difficulty', filters.difficulty);
    const qs = params.toString();
    return await apiClient.get(`/aptitude${qs ? `?${qs}` : ''}`);
  },

  getTest: async (testId) => {
    return await apiClient.get(`/aptitude/${testId}`);
  },

  submitAttempt: async (testId, answers, timeTaken) => {
    return await apiClient.post(`/aptitude/${testId}/submit`, { answers, timeTaken });
  },

  getMyAttempts: async (testId) => {
    return await apiClient.get(`/aptitude/${testId}/my-attempts`);
  },

  getLeaderboard: async (testId) => {
    return await apiClient.get(`/aptitude/${testId}/leaderboard`);
  },

  // ── Admin ─────────────────────────────────────────────────

  adminGetAllTests: async () => {
    return await apiClient.get('/aptitude/admin/all');
  },

  adminGetTest: async (testId) => {
    return await apiClient.get(`/aptitude/admin/${testId}`);
  },

  adminCreateTest: async (testData) => {
    return await apiClient.post('/aptitude/admin', testData);
  },

  adminUpdateTest: async (testId, testData) => {
    return await apiClient.put(`/aptitude/admin/${testId}`, testData);
  },

  adminDeleteTest: async (testId) => {
    return await apiClient.delete(`/aptitude/admin/${testId}`);
  },

  adminGetSubmissions: async (testId) => {
    return await apiClient.get(`/aptitude/admin/${testId}/submissions`);
  },

  // ── Practice Engine ───────────────────────────────────────

  // Start a practice session — returns sessionId + first batch of questions
  startPractice: async ({ category, topicId, difficulty, count = 10, mode = 'static' }) => {
    return await apiClient.post('/aptitude/practice/start', { category, topicId, difficulty, count, mode });
  },

  // Submit a single answer during a live practice session
  submitPracticeAnswer: async (sessionId, { answerSlotId, selected, timeTaken }) => {
    return await apiClient.post(`/aptitude/practice/${sessionId}/answer`, { answerSlotId, selected, timeTaken });
  },

  // End a session early or after all questions answered
  finishPractice: async (sessionId) => {
    return await apiClient.post(`/aptitude/practice/${sessionId}/finish`);
  },

  // Get full session result (for results page)
  getPracticeSession: async (sessionId) => {
    return await apiClient.get(`/aptitude/practice/${sessionId}`);
  },

  // Check daily AI practice generation limit
  getAILimit: async () => {
    return await apiClient.get('/aptitude/practice/ai-limit');
  },

  // Fetch random questions without a session (lightweight)
  getRandomQuestions: async ({ category, topicId, difficulty, count = 10, exclude = [] }) => {
    const params = new URLSearchParams({ count });
    if (category)    params.append('categoryId', category);
    if (topicId)     params.append('topicId', topicId);
    if (difficulty && difficulty !== 'all') params.append('difficulty', difficulty);
    if (exclude.length) params.append('exclude', exclude.join(','));
    return await apiClient.get(`/aptitude/questions/random?${params.toString()}`);
  },

  // AI-generate questions for practice (admin-generated, student uses them)
  generateAIPracticeQuestions: async ({ topic, category, difficulty, count = 5 }) => {
    return await apiClient.post('/aptitude/ai-questions/generate-from-topic', {
      topic, category, difficulty, count, saveToBank: false
    });
  },

  // ── Aptitude Competition (Student) ────────────────────────────────────────

  // List all competitions with current user's registration/attempt state
  listCompetitions: async (status) => {
    const params = status ? `?status=${status}` : '';
    return await apiClient.get(`/aptitude/competition${params}`);
  },

  // Register/join a competition
  registerCompetition: async (competitionId) => {
    return await apiClient.post(`/aptitude/competition/${competitionId}/register`);
  },

  // Get competition data + questions (starts the attempt clock server-side)
  getCompetitionAttempt: async (competitionId) => {
    return await apiClient.get(`/aptitude/competition/${competitionId}`);
  },

  // Server-authoritative timer sync (poll every 10s)
  syncCompetitionTimer: async (competitionId) => {
    return await apiClient.get(`/aptitude/competition/${competitionId}/timer`);
  },

  // Submit competition answers
  submitCompetition: async (competitionId, answers, timeTaken) => {
    return await apiClient.post(`/aptitude/competition/${competitionId}/submit`, { answers, timeTaken });
  },

  // Get leaderboard
  getCompetitionLeaderboard: async (competitionId) => {
    return await apiClient.get(`/aptitude/competition/${competitionId}/leaderboard`);
  },

  // ── Aptitude Competition (Admin) ──────────────────────────────────────────

  adminListCompetitions: async () => {
    return await apiClient.get('/aptitude/competition/admin/all');
  },

  adminGetCompetition: async (id) => {
    return await apiClient.get(`/aptitude/competition/admin/${id}`);
  },

  adminCreateCompetition: async (data) => {
    return await apiClient.post('/aptitude/competition/admin', data);
  },

  adminUpdateCompetition: async (id, data) => {
    return await apiClient.put(`/aptitude/competition/admin/${id}`, data);
  },

  adminDeleteCompetition: async (id) => {
    return await apiClient.delete(`/aptitude/competition/admin/${id}`);
  },

  adminGetCompetitionSubmissions: async (id) => {
    return await apiClient.get(`/aptitude/competition/admin/${id}/submissions`);
  },
};

export default aptitudeService;
