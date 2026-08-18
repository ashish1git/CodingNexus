// src/services/studentService.js - PostgreSQL/REST API version
import { apiClient } from './apiClient';
import toast from 'react-hot-toast';

export const studentService = {
  // ============ SERVER TIME ============

  async getServerTime() {
    return apiClient.get('/timer');
  },

  // ============ NOTES ============
  
  async getNotes() {
    try {
      const response = await apiClient.get('/student/notes');
      return response;
    } catch (error) {
      console.error('Get notes error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============ QUIZZES ============
  
  async getQuizzes() {
    try {
      const response = await apiClient.get('/student/quizzes');
      return response;
    } catch (error) {
      console.error('Get quizzes error:', error);
      return { success: false, error: error.message };
    }
  },

  async getQuizById(quizId) {
    try {
      const response = await apiClient.get(`/student/quizzes/${quizId}`);
      return response;
    } catch (error) {
      console.error('Get quiz error:', error);
      return { success: false, error: error.message };
    }
  },

  async submitQuizAttempt(quizId, attemptData) {
    try {
      const response = await apiClient.post(`/student/quizzes/${quizId}/attempt`, attemptData);
      if (response.success) {
        toast.success('Quiz submitted successfully');
      }
      return response;
    } catch (error) {
      console.error('Submit quiz error:', error);
      toast.error(error.message || 'Failed to submit quiz');
      return { success: false, error: error.message };
    }
  },

  async getQuizAttempt(quizId) {
    try {
      const response = await apiClient.get(`/student/quizzes/${quizId}/attempt`);
      return response;
    } catch (error) {
      console.error('Get quiz attempt error:', error);
      return { success: false, error: error.message };
    }
  },

  async getQuizAttempts() {
    try {
      const response = await apiClient.get('/student/quiz-attempts');
      return response;
    } catch (error) {
      console.error('Get quiz attempts error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============ ATTENDANCE (NEW PROFESSIONAL VERSION) ============
  
  // Get attendance records with stats
  async getAttendanceRecords(params = {}) {
    try {
      // Add timestamp to prevent caching
      const paramsWithTimestamp = { ...params, _t: Date.now() };
      const queryString = new URLSearchParams(paramsWithTimestamp).toString();
      const response = await apiClient.get(`/student/attendance/records?${queryString}`);
      return response;
    } catch (error) {
      console.error('Get attendance records error:', error);
      return { success: false, error: error.message };
    }
  },

  // Mark attendance via QR code with geolocation
  async markAttendanceByQR(data) {
    try {
      const response = await apiClient.post('/student/attendance/mark-qr', data);
      return response;
    } catch (error) {
      console.error('Mark QR attendance error:', error);
      const errorMsg = error.message || 'Failed to mark attendance';
      return { success: false, error: errorMsg };
    }
  },

  // Get attendance analytics
  async getAttendanceAnalytics() {
    try {
      const response = await apiClient.get('/student/attendance/analytics');
      return response;
    } catch (error) {
      console.error('Get attendance analytics error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============ LEGACY ATTENDANCE (BACKWARD COMPATIBILITY) ============
  
  async getAttendance() {
    try {
      const response = await apiClient.get('/student/attendance');
      return response;
    } catch (error) {
      console.error('Get attendance error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============ ANNOUNCEMENTS ============
  
  async getAnnouncements() {
    try {
      const response = await apiClient.get('/student/announcements');
      return response;
    } catch (error) {
      console.error('Get announcements error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============ SUPPORT TICKETS ============
  
  async createTicket(ticketData) {
    try {
      const response = await apiClient.post('/student/tickets', ticketData);
      if (response.success) {
        toast.success('Ticket created successfully');
      }
      return response;
    } catch (error) {
      console.error('Create ticket error:', error);
      toast.error(error.message || 'Failed to create ticket');
      return { success: false, error: error.message };
    }
  },

  async getTickets() {
    try {
      const response = await apiClient.get('/student/tickets');
      return response;
    } catch (error) {
      console.error('Get tickets error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteTicket(ticketId) {
    try {
      const response = await apiClient.delete(`/student/tickets/${ticketId}`);
      return response;
    } catch (error) {
      console.error('Delete ticket error:', error);
      return { success: false, error: error.message };
    }
  },

  async replyToTicket(ticketId, message) {
    try {
      const response = await apiClient.post(`/student/tickets/${ticketId}/reply`, { message });
      return response;
    } catch (error) {
      console.error('Reply to ticket error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============ NEXI AI SUPPORT ASSISTANT ============

  async nexiChat(message, code = null, history = []) {
    try {
      const response = await apiClient.post('/student/nexi/chat', { message, code, history });
      return response;
    } catch (error) {
      console.error('Nexi chat error:', error);
      return { success: false, error: error.message, code: error.code };
    }
  },

  // Streaming chat: reads the NDJSON stream from /nexi/chat. Each line is a
  // JSON object — { success:true, streaming:true, delta } during generation,
  // then a final { success:true, streaming:false, data } with the full parsed
  // result. onDelta is called per line; returns the final data object.
  // Errors mid-stream (incl. rate limits) arrive as a JSON error line.
  async nexiChatStream(message, code = null, history = [], onDelta) {
    const token = apiClient.getToken();
    const res = await fetch(`${apiClient.baseURL}/student/nexi/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ message, code, history })
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Nexi stream unavailable');
    }

    if (!res.body) {
      // Streaming not supported by this client — fall back to the JSON call.
      return this.nexiChat(message, code, history);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);
        if (!line) continue;
        try {
          const chunk = JSON.parse(line);
          if (chunk.success === false) {
            const e = new Error(chunk.error || 'Nexi stream error');
            e.code = chunk.code;
            e.retryAfterMs = chunk.retryAfterMs;
            throw e;
          }
          if (chunk.streaming) {
            onDelta?.(chunk.delta || '');
          } else if (chunk.data) {
            result = chunk.data;
          }
        } catch (err) {
          if (err.code || err.message === 'Nexi stream error') throw err;
          // Ignore malformed partial lines.
        }
      }
    }

    if (!result) throw new Error('Nexi returned an empty response');
    return result;
  },

  async nexiEscalate(query, code = null) {
    try {
      const response = await apiClient.post('/student/nexi/escalate', { query, code });
      return response;
    } catch (error) {
      console.error('Nexi escalate error:', error);
      return { success: false, error: error.message };
    }
  },

  async nexiCreateTicket(subject, message, priority = 'normal') {
    try {
      const response = await apiClient.post('/student/nexi/create-ticket', { subject, message, priority });
      return response;
    } catch (error) {
      console.error('Nexi create-ticket error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============ PROFILE ============
  
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/student/profile', profileData);
      if (response.success) {
        toast.success('Profile updated successfully');
      }
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Failed to update profile');
      return { success: false, error: error.message };
    }
  },

  // ============ FORMS / SURVEYS ============

  async getForms() { try { return await apiClient.get('/student/forms'); } catch (e) { return { success: false, error: e.message }; } },
  async getFormById(id) { try { return await apiClient.get(`/student/forms/${id}`); } catch (e) { return { success: false, error: e.message }; } },
  async submitForm(id, answers) { try { return await apiClient.post(`/student/forms/${id}/submit`, { answers }); } catch (e) { return { success: false, error: e.message }; } },
  async getMyFormSubmissions() { try { return await apiClient.get('/student/form-submissions'); } catch (e) { return { success: false, error: e.message }; } },
};

export default studentService;
