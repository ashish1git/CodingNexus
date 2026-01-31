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
      // Send the input directly - backend handles all formats
      const response = await apiClient.post('/auth/login', {
        email: input,
        password
      });

      if (response.success && response.token) {
        apiClient.setToken(response.token);
        
        console.log('🔐 Login response user:', response.user);
        
        // The backend already provides flattened data with batch/name at root level
        // Just use it directly, but also ensure we have fallbacks
        const userData = {
          ...response.user,
          // Ensure these are at root level (backend already provides them, but fallback just in case)
          batch: response.user.batch || response.user.studentProfile?.batch || response.user.profile?.batch,
          name: response.user.name || response.user.studentProfile?.name || response.user.profile?.name,
          phone: response.user.phone || response.user.studentProfile?.phone || response.user.profile?.phone,
          rollNo: response.user.rollNo || response.user.studentProfile?.rollNo || response.user.profile?.rollNo,
          moodleId: response.user.moodleId
        };
        
        console.log('💾 Storing user data:', userData);
        console.log('✅ Batch:', userData.batch, '| Name:', userData.name);
        
        // Store user data in localStorage for AuthContext
        localStorage.setItem('user', JSON.stringify(userData));
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
        
        // Structure user data properly - merge profile into user object
        const userData = {
          ...response.user,
          adminProfile: response.user.profile,
          // Also add admin profile fields directly for easy access
          ...(response.user.profile && {
            name: response.user.profile.name,
            permissions: response.user.profile.permissions
          })
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success('Admin login successful!');
      }
      // Return the API response (it should include `user` and `role` when successful)
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
      if (response.success && response.user) {
        // Normalize the response - handle both old nested and new flattened structure
        const userData = {
          ...response.user,
          // Ensure batch/name are at root level (backward compatibility)
          batch: response.user.batch || response.user.studentProfile?.batch || response.user.profile?.batch,
          name: response.user.name || response.user.studentProfile?.name || response.user.adminProfile?.name || response.user.profile?.name,
          phone: response.user.phone || response.user.studentProfile?.phone || response.user.profile?.phone,
          rollNo: response.user.rollNo || response.user.studentProfile?.rollNo || response.user.profile?.rollNo
        };
        
        console.log('📥 Current user fetched:', {
          email: userData.email,
          role: userData.role,
          batch: userData.batch,
          name: userData.name
        });
        
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
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

  // Request password reset - verify moodleId exists
  requestPasswordReset: async (moodleId) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', {
        moodleId
      });
      return response;
    } catch (error) {
      console.error('Request password reset error:', error);
      toast.error(error.message || 'Failed to find account');
      return { success: false, error: error.message };
    }
  },

  // Reset password with phone verification
  resetPassword: async (moodleId, phoneLast4, newPassword) => {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        moodleId,
        phoneLast4,
        newPassword
      });

      if (response.success) {
        toast.success('Password reset successfully!');
      }
      return response;
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to reset password');
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
