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

  // ============ ATTENDANCE MANAGEMENT ============
  
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
