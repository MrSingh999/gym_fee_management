import apiClient from "@/services/apiClient";

const API_BASE = "/api/members";

export const dashboardService = {
  getStats: () => apiClient.get(`${API_BASE}/dashboard/stats`),
  getDueMembers: () => apiClient.get(`${API_BASE}/due`),
};
