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
  }
};

export default aptitudeService;
