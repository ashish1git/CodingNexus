// Event service for guest participants - completely separate from batch student services
import apiClient from './apiClient';

class EventService {
  // ==================== QUIZ ENDPOINTS (Guest) ====================
  
  async getQuizzes() {
    return apiClient.get('/events/event-guest/quizzes');
  }

  async getQuizById(quizId) {
    return apiClient.get(`/events/event-guest/quizzes/${quizId}`);
  }

  async checkQuizAttempt(quizId) {
    return apiClient.get(`/events/event-guest/quizzes/${quizId}/attempt`);
  }

  async submitQuizAttempt(quizId, data) {
    return apiClient.post(`/events/event-guest/quizzes/${quizId}/attempt`, data);
  }

  async getQuizResults(quizId) {
    return apiClient.get(`/events/event-guest/quizzes/${quizId}/results`);
  }

  // ==================== CERTIFICATE ENDPOINTS (Guest) ====================

  async getCertificates() {
    return apiClient.get('/events/event-guest/certificates');
  }

  async getCertificateById(certId) {
    return apiClient.get(`/events/event-guest/certificates/${certId}`);
  }

  // ==================== STATS ====================

  async getStats() {
    return apiClient.get('/events/event-guest/stats');
  }

  // ==================== ADMIN QUIZ ENDPOINTS ====================

  async adminGetEventQuizzes(eventId) {
    return apiClient.get(`/events/admin/events/${eventId}/quizzes`);
  }

  async adminCreateEventQuiz(eventId, data) {
    return apiClient.post(`/events/admin/events/${eventId}/quizzes`, data);
  }

  async adminUpdateEventQuiz(quizId, data) {
    return apiClient.put(`/events/admin/events/quizzes/${quizId}`, data);
  }

  async adminDeleteEventQuiz(quizId) {
    return apiClient.delete(`/events/admin/events/quizzes/${quizId}`);
  }

  async adminGetQuizSubmissions(quizId) {
    return apiClient.get(`/events/admin/events/quizzes/${quizId}/submissions`);
  }
}

export const eventService = new EventService();
export default eventService;
