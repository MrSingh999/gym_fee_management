import { handleResponse } from '@/services/apiClient';

const API_BASE = '/api/members';

export const dashboardService = {
  getStats: async () => {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    return handleResponse(res);
  },
  
  getDueMembers: async () => {
    const res = await fetch(`${API_BASE}/due`);
    return handleResponse(res);
  }
};
