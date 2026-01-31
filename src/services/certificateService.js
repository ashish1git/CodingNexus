// Certificate Service - handles certificate API calls
import { apiClient } from './apiClient';
import toast from 'react-hot-toast';

export const certificateService = {
  // ============ ADMIN METHODS ============
  
  // Get all certificates (admin)
  getAllCertificates: async () => {
    try {
      const response = await apiClient.get('/certificates/admin/all');
      return response;
    } catch (error) {
      console.error('Get certificates error:', error);
      toast.error(error.message || 'Failed to fetch certificates');
      return { success: false, error: error.message };
    }
  },

  // Create certificate (admin)
  createCertificate: async (data) => {
    try {
      const response = await apiClient.post('/certificates/admin/create', data);
      if (response.success) {
        toast.success('Certificate created successfully!');
      }
      return response;
    } catch (error) {
      console.error('Create certificate error:', error);
      toast.error(error.message || 'Failed to create certificate');
      return { success: false, error: error.message };
    }
  },

  // Update certificate (admin)
  updateCertificate: async (id, data) => {
    try {
      const response = await apiClient.put(`/certificates/admin/${id}`, data);
      if (response.success) {
        toast.success('Certificate updated successfully!');
      }
      return response;
    } catch (error) {
      console.error('Update certificate error:', error);
      toast.error(error.message || 'Failed to update certificate');
      return { success: false, error: error.message };
    }
  },

  // Delete certificate (admin)
  deleteCertificate: async (id) => {
    try {
      const response = await apiClient.delete(`/certificates/admin/${id}`);
      if (response.success) {
        toast.success('Certificate deleted successfully!');
      }
      return response;
    } catch (error) {
      console.error('Delete certificate error:', error);
      toast.error(error.message || 'Failed to delete certificate');
      return { success: false, error: error.message };
    }
  },

  // Get certificate requests (admin)
  getCertificateRequests: async (certificateId) => {
    try {
      const response = await apiClient.get(`/certificates/admin/${certificateId}/requests`);
      return response;
    } catch (error) {
      console.error('Get certificate requests error:', error);
      toast.error(error.message || 'Failed to fetch requests');
      return { success: false, error: error.message };
    }
  },

  // ============ STUDENT METHODS ============

  // Get available certificates
  getAvailableCertificates: async () => {
    try {
      const response = await apiClient.get('/certificates/available');
      return response;
    } catch (error) {
      console.error('Get available certificates error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get my certificates
  getMyCertificates: async () => {
    try {
      const response = await apiClient.get('/certificates/my-certificates');
      return response;
    } catch (error) {
      console.error('Get my certificates error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Request/claim certificate
  requestCertificate: async (certificateId, nameOnCertificate) => {
    try {
      const response = await apiClient.post(`/certificates/${certificateId}/request`, {
        nameOnCertificate
      });
      if (response.success) {
        toast.success('Certificate claimed successfully!');
      }
      return response;
    } catch (error) {
      console.error('Request certificate error:', error);
      toast.error(error.message || 'Failed to claim certificate');
      return { success: false, error: error.message };
    }
  },

  // Track download
  trackDownload: async (requestId) => {
    try {
      await apiClient.post(`/certificates/${requestId}/download`);
    } catch (error) {
      console.error('Track download error:', error);
    }
  }
};

export default certificateService;
