import { apiClient } from './apiClient';

function getApiUrl() {
  if (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.API_URL) {
    return window.CONFIG.API_URL;
  }

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }

  return '/api';
}

const API_URL = getApiUrl();

export const teamApplicationService = {
  async submitApplication(formData) {
    const response = await fetch(`${API_URL}/team-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit application');
    }

    return data;
  },

  async getAllApplications() {
    return apiClient.get('/team-applications/admin');
  },

  async deleteApplication(id) {
    return apiClient.delete(`/team-applications/${id}`);
  }
};

export default teamApplicationService;
