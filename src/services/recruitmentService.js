import { apiClient } from './apiClient';

/**
 * Service for the role-based recruitment system.
 * Handles public form submission and admin management.
 */
export const recruitmentService = {
  // ── Public ──

  /** GET /recruitment/config — List all open roles with their questions */
  async getOpenRoles() {
    return apiClient.get('/recruitment/config');
  },

  /** GET /recruitment/config/:role — Config + questions for a single role */
  async getRoleConfig(role) {
    return apiClient.get(`/recruitment/config/${encodeURIComponent(role)}`);
  },

  /** POST /recruitment/submit — Submit an application */
  async submitApplication(formData) {
    return apiClient.post('/recruitment/submit', formData);
  },

  // ── Admin ──

  /** GET /recruitment/admin/config — All role configs */
  async getAllConfigs() {
    return apiClient.get('/recruitment/admin/config');
  },

  /** PUT /recruitment/admin/config/:role — Toggle open/closed + set expiry */
  async updateConfig(role, data) {
    return apiClient.put(`/recruitment/admin/config/${encodeURIComponent(role)}`, data);
  },

  /** GET /recruitment/admin/submissions — List submissions (with filters) */
  async getSubmissions(params = {}) {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    const qs = query.toString();
    return apiClient.get(`/recruitment/admin/submissions${qs ? '?' + qs : ''}`);
  },

  /** GET /recruitment/admin/submissions/export — Download Excel file */
  async exportSubmissions(role) {
    const query = role ? `?role=${encodeURIComponent(role)}` : '';
    const response = await fetch(
      `${apiClient.baseURL}/recruitment/admin/submissions/export${query}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }
    );
    if (!response.ok) {
      throw new Error('Failed to export submissions');
    }
    return response.blob();
  },

  /** GET /recruitment/admin/stats — Dashboard stats */
  async getAdminStats() {
    return apiClient.get('/recruitment/admin/stats');
  },

  /** PUT /recruitment/admin/config — Batch toggle all roles */
  async batchUpdateConfigs(isOpen) {
    return apiClient.put('/recruitment/admin/config', { isOpen });
  },

  /** DELETE /recruitment/admin/submissions/:id — Delete a submission */
  async deleteSubmission(id) {
    return apiClient.delete(`/recruitment/admin/submissions/${id}`);
  },

  /** PUT /recruitment/admin/submissions/:id/status — Update status */
  async updateStatus(id, status) {
    return apiClient.put(`/recruitment/admin/submissions/${id}/status`, { status });
  },

  /** POST /recruitment/admin/submissions/batch-status — Batch update status */
  async batchUpdateStatus(ids, status) {
    return apiClient.post('/recruitment/admin/submissions/batch-status', { ids, status });
  },
};
