import apiClient from "@/services/apiClient";

const API_BASE = "/api/members";

export const memberService = {
  getMembers: ({ search = "", status = "", membershipType = "" } = {}) => {
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    if (membershipType) params.membershipType = membershipType;

    return apiClient.get(API_BASE, { params });
  },

  createMember: (memberData) => apiClient.post(API_BASE, memberData),

  renewMember: (id, payload) =>
    apiClient.put(`${API_BASE}/${id}/renew`, payload),

  updateMember: (id, memberData) =>
    apiClient.put(`${API_BASE}/${id}`, memberData),

  deleteMember: (id) => apiClient.delete(`${API_BASE}/${id}`),

  getMemberPayments: (id) => apiClient.get(`${API_BASE}/${id}/payments`),
};
