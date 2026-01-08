import apiClient from './apiClient';

const competitionService = {
  // Get all competitions
  getAllCompetitions: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    
    const queryString = params.toString();
    const url = `/competitions${queryString ? `?${queryString}` : ''}`;
    
    return await apiClient.get(url);
  },

  // Get single competition with problems
  getCompetition: async (competitionId) => {
    return await apiClient.get(`/competitions/${competitionId}`);
  },

  // Register for competition
  registerForCompetition: async (competitionId) => {
    return await apiClient.post(`/competitions/${competitionId}/register`);
  },

  // Submit solutions
  submitSolutions: async (competitionId, solutions) => {
    return await apiClient.post(`/competitions/${competitionId}/submit`, {
      solutions
    });
  },

  // Get leaderboard
  getLeaderboard: async (competitionId) => {
    return await apiClient.get(`/competitions/${competitionId}/leaderboard`);
  },

  // Get my submission details
  getMySubmission: async (competitionId) => {
    return await apiClient.get(`/competitions/${competitionId}/my-submission`);
  },

  // Admin: Create competition
  createCompetition: async (competitionData) => {
    return await apiClient.post('/competitions', competitionData);
  },

  // Admin: Update competition
  updateCompetition: async (competitionId, competitionData) => {
    return await apiClient.put(`/competitions/${competitionId}`, competitionData);
  },

  // Admin: Delete competition
  deleteCompetition: async (competitionId) => {
    return await apiClient.delete(`/competitions/${competitionId}`);
  },

  // Admin: Get all submissions for a competition
  getCompetitionSubmissions: async (competitionId) => {
    return await apiClient.get(`/competitions/${competitionId}/submissions`);
  }
};

export default competitionService;
