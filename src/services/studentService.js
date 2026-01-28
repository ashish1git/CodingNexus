// src/services/studentService.js - PostgreSQL/REST API version
import { apiClient } from './apiClient';
import toast from 'react-hot-toast';

export const studentService = {
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
  }
};

export default studentService;
