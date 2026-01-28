// src/services/adminService.js - PostgreSQL/REST API version
import { apiClient } from './apiClient';
import toast from 'react-hot-toast';

export const adminService = {
  // ============ STUDENT MANAGEMENT ============
  
  async getAllStudents() {
    try {
      const response = await apiClient.get('/admin/students');
      return response;
    } catch (error) {
      console.error('Get students error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateStudent(studentId, data) {
    try {
      const response = await apiClient.put(`/admin/students/${studentId}`, data);
      if (response.success) {
        toast.success('Student updated successfully');
      }
      return response;
    } catch (error) {
      console.error('Update student error:', error);
      toast.error(error.message || 'Failed to update student');
      return { success: false, error: error.message };
    }
  },

  async deleteStudent(studentId) {
    try {
      const response = await apiClient.delete(`/admin/students/${studentId}`);
      if (response.success) {
        toast.success('Student deleted successfully');
      }
      return response;
    } catch (error) {
      console.error('Delete student error:', error);
      toast.error(error.message || 'Failed to delete student');
      return { success: false, error: error.message };
    }
  },

  // ============ NOTES MANAGEMENT ============
  
  async uploadNote(noteData) {
    try {
      const response = await apiClient.post('/admin/notes', noteData);
      if (response.success) {
        toast.success('Note uploaded successfully');
      }
      return response;
    } catch (error) {
      console.error('Upload note error:', error);
      toast.error(error.message || 'Failed to upload note');
      return { success: false, error: error.message };
    }
  },

  async getAllNotes() {
    try {
      const response = await apiClient.get('/admin/notes');
      return response;
    } catch (error) {
      console.error('Get notes error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteNote(noteId) {
    try {
      const response = await apiClient.delete(`/admin/notes/${noteId}`);
      if (response.success) {
        toast.success('Note deleted successfully');
      }
      return response;
    } catch (error) {
      console.error('Delete note error:', error);
      toast.error(error.message || 'Failed to delete note');
      return { success: false, error: error.message };
    }
  },

  // ============ ANNOUNCEMENT MANAGEMENT ============
  
  async createAnnouncement(announcementData) {
    try {
      const response = await apiClient.post('/admin/announcements', announcementData);
      if (response.success) {
        toast.success('Announcement created successfully');
      }
      return response;
    } catch (error) {
      console.error('Create announcement error:', error);
      toast.error(error.message || 'Failed to create announcement');
      return { success: false, error: error.message };
    }
  },

  async getAllAnnouncements() {
    try {
      const response = await apiClient.get('/admin/announcements');
      return response;
    } catch (error) {
      console.error('Get announcements error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateAnnouncement(announcementId, data) {
    try {
      const response = await apiClient.put(`/admin/announcements/${announcementId}`, data);
      if (response.success) {
        toast.success('Announcement updated successfully');
      }
      return response;
    } catch (error) {
      console.error('Update announcement error:', error);
      toast.error(error.message || 'Failed to update announcement');
      return { success: false, error: error.message };
    }
  },

  async deleteAnnouncement(announcementId) {
    try {
      const response = await apiClient.delete(`/admin/announcements/${announcementId}`);
      if (response.success) {
        toast.success('Announcement deleted successfully');
      }
      return response;
    } catch (error) {
      console.error('Delete announcement error:', error);
      toast.error(error.message || 'Failed to delete announcement');
      return { success: false, error: error.message };
    }
  },

  // ============ ATTENDANCE MANAGEMENT (NEW PROFESSIONAL VERSION) ============
  
  // Create attendance session
  async createAttendanceSession(sessionData) {
    try {
      const response = await apiClient.post('/admin/attendance/session', sessionData);
      if (response.success) {
        toast.success('Session created successfully');
      }
      return response;
    } catch (error) {
      console.error('Create session error:', error);
      toast.error(error.message || 'Failed to create session');
      return { success: false, error: error.message };
    }
  },

  // Get all sessions
  async getAttendanceSessions(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/admin/attendance/sessions?${queryString}`);
      return response;
    } catch (error) {
      console.error('Get sessions error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get session by ID
  async getAttendanceSessionById(sessionId) {
    try {
      const response = await apiClient.get(`/admin/attendance/session/${sessionId}`);
      return response;
    } catch (error) {
      console.error('Get session error:', error);
      return { success: false, error: error.message };
    }
  },

  // Mark bulk attendance
  async markBulkAttendance(data) {
    try {
      const response = await apiClient.post('/admin/attendance/mark', data);
      if (response.success) {
        toast.success('Attendance saved successfully');
      }
      return response;
    } catch (error) {
      console.error('Mark attendance error:', error);
      toast.error(error.message || 'Failed to mark attendance');
      return { success: false, error: error.message };
    }
  },

  // Mark manual attendance (without session)
  async markManualAttendance(data) {
    try {
      const response = await apiClient.post('/admin/attendance/manual', data);
      return response;
    } catch (error) {
      console.error('Mark manual attendance error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get manual attendance for date/batch
  async getManualAttendance(params) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/admin/attendance/manual?${queryString}`);
      return response;
    } catch (error) {
      console.error('Get manual attendance error:', error);
      return { success: false, error: error.message };
    }
  },

  // Mark attendance by QR
  async markAttendanceByQR(data) {
    try {
      const response = await apiClient.post('/admin/attendance/mark-qr', data);
      return response;
    } catch (error) {
      console.error('Mark QR attendance error:', error);
      return { success: false, error: error.message };
    }
  },

  // Refresh QR code for session
  async refreshSessionQR(sessionId) {
    try {
      const response = await apiClient.post(`/admin/attendance/session/${sessionId}/refresh-qr`);
      if (response.success) {
        toast.success('QR code refreshed');
      }
      return response;
    } catch (error) {
      console.error('Refresh QR error:', error);
      toast.error(error.message || 'Failed to refresh QR');
      return { success: false, error: error.message };
    }
  },

  // Get student attendance details
  async getStudentAttendanceDetails(userId) {
    try {
      const response = await apiClient.get(`/admin/attendance/student/${userId}`);
      return response;
    } catch (error) {
      console.error('Get student details error:', error);
      return { success: false, error: error.message };
    }
  },

  // Close session
  async closeAttendanceSession(sessionId) {
    try {
      const response = await apiClient.put(`/admin/attendance/session/${sessionId}/close`);
      if (response.success) {
        toast.success('Session closed');
      }
      return response;
    } catch (error) {
      console.error('Close session error:', error);
      toast.error(error.message || 'Failed to close session');
      return { success: false, error: error.message };
    }
  },

  // Delete session
  async deleteAttendanceSession(sessionId) {
    try {
      const response = await apiClient.delete(`/admin/attendance/session/${sessionId}`);
      return response;
    } catch (error) {
      console.error('Delete session error:', error);
      toast.error(error.message || 'Failed to delete session');
      return { success: false, error: error.message };
    }
  },

  // Get analytics
  async getAttendanceAnalytics(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/admin/attendance/analytics?${queryString}`);
      return response;
    } catch (error) {
      console.error('Get analytics error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete attendance record
  async deleteAttendanceRecord(sessionId, userId, date = null, isManual = false) {
    try {
      let response;
      if (isManual && date) {
        // Delete manual attendance
        response = await apiClient.delete(`/admin/attendance/manual/${userId}/${date}`);
      } else if (sessionId) {
        // Delete from session
        response = await apiClient.delete(`/admin/attendance/record/${sessionId}/${userId}`);
      } else {
        throw new Error('Invalid parameters for delete');
      }
      
      if (response.success) {
        toast.success('Attendance record deleted');
      }
      return response;
    } catch (error) {
      console.error('Delete attendance record error:', error);
      toast.error(error.message || 'Failed to delete attendance');
      return { success: false, error: error.message };
    }
  },

  // Export report
  async exportAttendanceReport(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/admin/attendance/export?${queryString}`);
      return response;
    } catch (error) {
      console.error('Export report error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============ LEGACY ATTENDANCE (BACKWARD COMPATIBILITY) ============
  
  async markAttendance(attendanceData) {
    try {
      const response = await apiClient.post('/admin/attendance', attendanceData);
      if (response.success) {
        toast.success('Attendance marked successfully');
      }
      return response;
    } catch (error) {
      console.error('Mark attendance error:', error);
      toast.error(error.message || 'Failed to mark attendance');
      return { success: false, error: error.message };
    }
  },

  async getAttendanceByDate(date) {
    try {
      const response = await apiClient.get(`/admin/attendance/${date}`);
      return response;
    } catch (error) {
      console.error('Get attendance error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============ QUIZ MANAGEMENT ============
  
  async createQuiz(quizData) {
    try {
      const response = await apiClient.post('/admin/quizzes', quizData);
      if (response.success) {
        toast.success('Quiz created successfully');
      }
      return response;
    } catch (error) {
      console.error('Create quiz error:', error);
      toast.error(error.message || 'Failed to create quiz');
      return { success: false, error: error.message };
    }
  },

  async getAllQuizzes() {
    try {
      const response = await apiClient.get('/admin/quizzes');
      return response;
    } catch (error) {
      console.error('Get quizzes error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateQuiz(quizId, data) {
    try {
      const response = await apiClient.put(`/admin/quizzes/${quizId}`, data);
      if (response.success) {
        toast.success('Quiz updated successfully');
      }
      return response;
    } catch (error) {
      console.error('Update quiz error:', error);
      toast.error(error.message || 'Failed to update quiz');
      return { success: false, error: error.message };
    }
  },

  async deleteQuiz(quizId) {
    try {
      const response = await apiClient.delete(`/admin/quizzes/${quizId}`);
      if (response.success) {
        toast.success('Quiz deleted successfully');
      }
      return response;
    } catch (error) {
      console.error('Delete quiz error:', error);
      toast.error(error.message || 'Failed to delete quiz');
      return { success: false, error: error.message };
    }
  },

  async getQuizById(quizId) {
    try {
      const response = await apiClient.get(`/admin/quizzes/${quizId}`);
      return response;
    } catch (error) {
      console.error('Get quiz by ID error:', error);
      toast.error(error.message || 'Failed to fetch quiz details');
      return { success: false, error: error.message };
    }
  },

  async getQuizSubmissions(quizId) {
    try {
      const response = await apiClient.get(`/admin/quizzes/${quizId}/submissions`);
      return response;
    } catch (error) {
      console.error('Get quiz submissions error:', error);
      toast.error(error.message || 'Failed to fetch quiz submissions');
      return { success: false, error: error.message };
    }
  },

  // ============ SUPPORT TICKET MANAGEMENT ============
  
  async getAllTickets() {
    try {
      const response = await apiClient.get('/admin/tickets');
      return response;
    } catch (error) {
      console.error('Get tickets error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateTicket(ticketId, data) {
    try {
      const response = await apiClient.put(`/admin/tickets/${ticketId}`, data);
      if (response.success) {
        toast.success('Ticket updated successfully');
      }
      return response;
    } catch (error) {
      console.error('Update ticket error:', error);
      toast.error(error.message || 'Failed to update ticket');
      return { success: false, error: error.message };
    }
  },

  // ============ SUB-ADMIN MANAGEMENT ============
  
  async getAllSubAdmins() {
    try {
      const response = await apiClient.get('/admin/subadmins');
      return response;
    } catch (error) {
      console.error('Get sub-admins error:', error);
      return { success: false, error: error.message };
    }
  },

  async createSubAdmin(adminData, password) {
    try {
      const response = await apiClient.post('/admin/subadmins', {
        ...adminData,
        password
      });
      if (response.success) {
        toast.success('Sub-admin created successfully');
      }
      return response;
    } catch (error) {
      console.error('Create sub-admin error:', error);
      toast.error(error.message || 'Failed to create sub-admin');
      return { success: false, error: error.message };
    }
  },

  async updateSubAdmin(adminId, data) {
    try {
      const response = await apiClient.put(`/admin/subadmins/${adminId}`, data);
      if (response.success) {
        toast.success('Sub-admin updated successfully');
      }
      return response;
    } catch (error) {
      console.error('Update sub-admin error:', error);
      toast.error(error.message || 'Failed to update sub-admin');
      return { success: false, error: error.message };
    }
  },

  async deleteSubAdmin(adminId) {
    try {
      const response = await apiClient.delete(`/admin/subadmins/${adminId}`);
      if (response.success) {
        toast.success('Sub-admin deleted successfully');
      }
      return response;
    } catch (error) {
      console.error('Delete sub-admin error:', error);
      toast.error(error.message || 'Failed to delete sub-admin');
      return { success: false, error: error.message };
    }
  },

  // ============ CURRENT ADMIN PROFILE ============
  
  async getCurrentAdminProfile() {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.success) {
        return response.user.adminProfile || response.user;
      }
      return null;
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      return null;
    }
  }
};

export default adminService;
