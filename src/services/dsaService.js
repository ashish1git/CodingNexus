import { apiClient } from './apiClient';
import toast from 'react-hot-toast';

export const dsaService = {
  // ============ DSA TRAINERS ============

  async getTrainers() {
    try {
      const response = await apiClient.get('/admin/dsa/trainers');
      return response;
    } catch (error) {
      console.error('Get trainers error:', error);
      return { success: false, error: error.message };
    }
  },

  async getMyDsaRole() {
    try {
      const response = await apiClient.get('/admin/dsa/my-role');
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getAvailableAdmins() {
    try {
      const response = await apiClient.get('/admin/dsa/trainers/available');
      return response;
    } catch (error) {
      console.error('Get available admins error:', error);
      return { success: false, error: error.message };
    }
  },

  async getOperationsUsers() {
    try {
      const response = await apiClient.get('/admin/dsa/trainers/operations');
      return response;
    } catch (error) {
      console.error('Get operations users error:', error);
      return { success: false, error: error.message };
    }
  },

  async assignTrainer(adminId, role = 'TRAINER') {
    try {
      const response = await apiClient.post('/admin/dsa/trainers', { adminId, role });
      if (response.success) {
        const label = role === 'OPERATIONS' ? 'Operations' : 'Trainer';
        const msg = role === 'OPERATIONS' ? 'DSA Operations assigned with schedule & review permissions' : `DSA ${label} assigned`;
        toast.success(msg);
      }
      return response;
    } catch (error) {
      console.error('Assign trainer error:', error);
      toast.error(error.message || 'Failed to assign role');
      return { success: false, error: error.message };
    }
  },

  async removeTrainer(id) {
    try {
      const response = await apiClient.delete(`/admin/dsa/trainers/${id}`);
      if (response.success) toast.success('DSA trainer removed');
      return response;
    } catch (error) {
      console.error('Remove trainer error:', error);
      toast.error(error.message || 'Failed to remove trainer');
      return { success: false, error: error.message };
    }
  },

  async toggleTrainer(id) {
    try {
      const response = await apiClient.put(`/admin/dsa/trainers/${id}/toggle`);
      if (response.success) toast.success('Trainer status updated');
      return response;
    } catch (error) {
      console.error('Toggle trainer error:', error);
      toast.error(error.message || 'Failed to update trainer');
      return { success: false, error: error.message };
    }
  },

  // ============ LECTURES ============

  async getLectures(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/admin/dsa/lectures?${query}`);
      return response;
    } catch (error) {
      console.error('Get lectures error:', error);
      return { success: false, error: error.message };
    }
  },

  async createLecture(data) {
    try {
      const response = await apiClient.post('/admin/dsa/lectures', data);
      if (response.success) toast.success(response.message || 'Lecture scheduled');
      return response;
    } catch (error) {
      console.error('Create lecture error:', error);
      toast.error(error.message || 'Failed to create lecture');
      return { success: false, error: error.message };
    }
  },

  async updateLecture(id, data) {
    try {
      const response = await apiClient.put(`/admin/dsa/lectures/${id}`, data);
      if (response.success) toast.success('Lecture updated');
      return response;
    } catch (error) {
      console.error('Update lecture error:', error);
      toast.error(error.message || 'Failed to update lecture');
      return { success: false, error: error.message };
    }
  },

  async deleteLecture(id) {
    try {
      const response = await apiClient.delete(`/admin/dsa/lectures/${id}`);
      if (response.success) toast.success('Lecture deleted');
      return response;
    } catch (error) {
      console.error('Delete lecture error:', error);
      toast.error(error.message || 'Failed to delete lecture');
      return { success: false, error: error.message };
    }
  },

  async cancelLecture(id) {
    try {
      const response = await apiClient.put(`/admin/dsa/lectures/${id}/cancel`);
      if (response.success) toast.success('Lecture cancelled');
      return response;
    } catch (error) {
      console.error('Cancel lecture error:', error);
      toast.error(error.message || 'Failed to cancel lecture');
      return { success: false, error: error.message };
    }
  },

  async rescheduleLecture(id, data) {
    try {
      const response = await apiClient.put(`/admin/dsa/lectures/${id}/reschedule`, data);
      if (response.success) toast.success('Lecture rescheduled');
      return response;
    } catch (error) {
      console.error('Reschedule lecture error:', error);
      toast.error(error.message || 'Failed to reschedule lecture');
      return { success: false, error: error.message };
    }
  },

  async createRecurringSchedule(data) {
    try {
      const response = await apiClient.post('/admin/dsa/lectures/recurring', data);
      if (response.success) toast.success(`Created ${response.count} recurring lectures`);
      return response;
    } catch (error) {
      console.error('Recurring schedule error:', error);
      toast.error(error.message || 'Failed to create recurring schedule');
      return { success: false, error: error.message };
    }
  },

  // ============ NOTES ============

  async uploadNote(formData) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dsa/notes/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      const data = await response.json();
      if (data.success) toast.success('Note uploaded for review');
      else toast.error(data.error || 'Upload failed');
      return data;
    } catch (error) {
      console.error('Upload note error:', error);
      toast.error(error.message || 'Failed to upload');
      return { success: false, error: error.message };
    }
  },

  async getNotes(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/admin/dsa/notes?${query}`);
      return response;
    } catch (error) {
      console.error('Get notes error:', error);
      return { success: false, error: error.message };
    }
  },

  async reviewNote(id, status, remarks) {
    try {
      const response = await apiClient.put(`/admin/dsa/notes/${id}/review`, { status, remarks });
      if (response.success) toast.success(`Note ${status}`);
      return response;
    } catch (error) {
      console.error('Review note error:', error);
      toast.error(error.message || 'Failed to review');
      return { success: false, error: error.message };
    }
  },

  async deleteNote(id) {
    try {
      const response = await apiClient.delete(`/admin/dsa/notes/${id}`);
      if (response.success) toast.success('Note deleted successfully');
      return response;
    } catch (error) {
      console.error('Delete note error:', error);
      toast.error(error.message || 'Failed to delete note');
      return { success: false, error: error.message };
    }
  },

  // ============ TRAINER DASHBOARD ============

  async getTrainerDashboard(trainerId) {
    try {
      const query = trainerId ? `?trainerId=${trainerId}` : '';
      const response = await apiClient.get(`/admin/dsa/trainer-dashboard${query}`);
      return response;
    } catch (error) {
      console.error('Get trainer dashboard error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============ NOTIFICATIONS ============

  async notifyMissingNotes() {
    try {
      const response = await apiClient.post('/admin/dsa/notify-missing');
      if (response.success && response.notified > 0) {
        toast.success(`Sent ${response.notified} reminder${response.notified > 1 ? 's' : ''}`);
      } else if (response.success) {
        toast('No reminders needed', { icon: '📬' });
      }
      return response;
    } catch (error) {
      console.error('Notify missing error:', error);
      toast.error(error.message || 'Failed to send notifications');
      return { success: false, error: error.message };
    }
  }
};

export default dsaService;
