// Event service for guest participants - completely separate from batch student services
import apiClient from './apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:21000/api';

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

  // Get all registrations with eligibility status
  async getMyRegistrations() {
    return apiClient.get('/events/event-guest/my-registrations');
  }

  // Download certificate as PDF blob with optional custom name (backend-generated)
  async downloadCertificate(eventId, customName = null) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/events/event-guest/certificate/${eventId}/download`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ customName })
    });

    if (!response.ok) {
      const error = new Error('Download failed');
      error.response = { status: response.status };
      try {
        const data = await response.json();
        error.message = data.message || data.error || 'Download failed';
      } catch (e) {
        // response wasn't JSON
      }
      throw error;
    }

    return response.blob();
  }

  // ==================== STATS ====================

  async getStats() {
    return apiClient.get('/events/event-guest/stats');
  }

  // ==================== MEDIA FILES (Guest) ====================

  async getEventMedia(eventId) {
    return apiClient.get(`/events/event-guest/events/${eventId}/media`);
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

  // ==================== ADMIN CERTIFICATE APPROVAL ====================

  async adminGetRegistrationsWithEligibility(eventId) {
    return apiClient.get(`/events/admin/events/${eventId}/registrations-with-eligibility`);
  }

  async adminApproveCertificate(eventId, registrationId, approved = true) {
    return apiClient.put(`/events/admin/events/${eventId}/registrations/${registrationId}/approve-certificate`, { approved });
  }

  async adminBulkApproveCertificates(eventId, registrationIds, approved = true) {
    return apiClient.put(`/events/admin/events/${eventId}/certificates/bulk-approve`, { registrationIds, approved });
  }

  async adminRevokeCertificate(eventId, participantId) {
    return apiClient.delete(`/events/admin/events/${eventId}/certificate/${participantId}`);
  }

  // ==================== HACKATHON REGISTRATION ENDPOINTS ====================

  // Participant: Submit/Update hackathon registration
  async submitHackathonRegistration(eventId, data) {
    return apiClient.post(`/events/participant/events/${eventId}/hackathon-registration`, data);
  }

  // Participant: Get own hackathon registrations
  async getHackathonRegistrations() {
    return apiClient.get('/events/participant/hackathon-registrations');
  }

  // Participant: Get hackathon registration for specific event
  async getHackathonRegistration(eventId) {
    return apiClient.get(`/events/participant/events/${eventId}/hackathon-registration`);
  }

  // Participant: Delete hackathon registration
  async deleteHackathonRegistration(eventId) {
    return apiClient.delete(`/events/participant/events/${eventId}/hackathon-registration`);
  }

  // Admin: Get all hackathon registrations for an event
  async adminGetHackathonRegistrations(eventId) {
    return apiClient.get(`/events/admin/events/${eventId}/hackathon-registrations`);
  }

  // Admin: Update hackathon registration
  async adminUpdateHackathonRegistration(eventId, registrationId, data) {
    return apiClient.put(`/events/admin/events/${eventId}/hackathon-registrations/${registrationId}`, data);
  }

  // Admin: Download hackathon registrations as CSV
  async adminDownloadHackathonCSV(eventId, selectedColumns = null) {
    const token = localStorage.getItem('token');
    let url = `${API_URL}/events/admin/events/${eventId}/hackathon-registrations/download-csv`;
    
    if (selectedColumns && selectedColumns.length > 0) {
      const params = new URLSearchParams();
      params.append('columns', selectedColumns.join(','));
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download CSV');
    }

    return response.blob();
  }
}

export const eventService = new EventService();
export default eventService;

