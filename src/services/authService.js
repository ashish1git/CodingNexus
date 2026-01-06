// src/services/authService.js - PostgreSQL/REST API version
import { apiClient } from './apiClient';
import toast from 'react-hot-toast';

export const authService = {
  // Student signup
  signupStudent: async (email, password, userData) => {
    try {
      // Normalize email - add domain if not present
      let studentEmail = email;
      if (!studentEmail.includes('@')) {
        studentEmail = `${studentEmail}@codingnexus.com`;
      }

      const response = await apiClient.post('/auth/signup', {
        email: studentEmail,
        password,
        ...userData
      });

      if (response.success) {
        toast.success('Account created! Awaiting admin activation.');
      }
      return response;
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed. Please try again.');
      return { success: false, error: error.message };
    }
  },

  // Student login
  loginStudent: async (input, password) => {
    try {
      // Normalize email - handle both moodle ID and email
      let studentEmail = input;
      if (!studentEmail.includes('@')) {
        studentEmail = `${studentEmail}@codingnexus.com`;
      }

      const response = await apiClient.post('/auth/login', {
        email: studentEmail,
        password
      });

      if (response.success && response.token) {
        apiClient.setToken(response.token);
        // Store user data in localStorage for AuthContext
        localStorage.setItem('user', JSON.stringify(response.user));
        toast.success('Login successful!');
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please check your credentials.');
      return { success: false, error: error.message };
    }
  },

  // Admin login
  loginAdmin: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login/admin', {
        email,
        password
      });

      if (response.success && response.token) {
        apiClient.setToken(response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        toast.success('Admin login successful!');
      }

      return response;
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error(error.message || 'Admin login failed.');
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout: async () => {
    try {
      apiClient.removeToken();
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.user));
        return response.user;
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      // If token is invalid, clear it
      apiClient.removeToken();
      localStorage.removeItem('user');
      return null;
    }
  },

  // Change password
  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await apiClient.post('/auth/change-password', {
        oldPassword,
        newPassword
      });

      if (response.success) {
        toast.success('Password changed successfully');
      }
      return response;
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(error.message || 'Failed to change password');
      return { success: false, error: error.message };
    }
  },

  // Activate student account (admin only)
  activateStudentAccount: async (userId, password) => {
    try {
      const response = await apiClient.post(`/auth/activate/${userId}`, {
        password
      });

      if (response.success) {
        toast.success('Student account activated successfully');
      }
      return response;
    } catch (error) {
      console.error('Activate account error:', error);
      toast.error(error.message || 'Failed to activate account');
      return { success: false, error: error.message };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!apiClient.getToken();
  },

  // Get stored user data (synchronous)
  getStoredUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  }
};

export default authService;
