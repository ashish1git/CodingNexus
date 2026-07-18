import { apiClient } from './apiClient';
import toast from 'react-hot-toast';

export const dsaSheetService = {
  async unlock(code) {
    try {
      const response = await apiClient.post('/student/dsa-sheet/unlock', { code });
      return response;
    } catch (error) {
      console.error('DSA unlock error:', error);
      return { success: false, error: error.message };
    }
  },
  async getProgress() {
    try {
      const response = await apiClient.get('/student/dsa-sheet/progress');
      return response;
    } catch (error) {
      console.error('DSA progress fetch error:', error);
      return { success: false, error: error.message };
    }
  },

  async toggleComplete(problemId) {
    try {
      const response = await apiClient.post('/student/dsa-sheet/toggle-complete', { problemId });
      return response;
    } catch (error) {
      console.error('DSA toggle-complete error:', error);
      toast.error('Failed to update progress');
      return { success: false, error: error.message };
    }
  },

  async toggleBookmark(problemId) {
    try {
      const response = await apiClient.post('/student/dsa-sheet/toggle-bookmark', { problemId });
      return response;
    } catch (error) {
      console.error('DSA toggle-bookmark error:', error);
      toast.error('Failed to update bookmark');
      return { success: false, error: error.message };
    }
  },

  async getStats() {
    try {
      const response = await apiClient.get('/student/dsa-sheet/stats');
      return response;
    } catch (error) {
      console.error('DSA stats error:', error);
      return { success: false, error: error.message };
    }
  },
};

export default dsaSheetService;
