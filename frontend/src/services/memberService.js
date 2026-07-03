import { handleResponse } from "@/services/apiClient";

const API_BASE = "/api/members";

export const memberService = {
  getMembers: async ({
    search = "",
    status = "",
    membershipType = "",
  } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (membershipType) params.append("membershipType", membershipType);

    const res = await fetch(`${API_BASE}?${params.toString()}`, {
      credentials: "include",
    });
    return handleResponse(res);
  },

  createMember: async (memberData) => {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memberData),
      credentials: "include",
    });
    return handleResponse(res);
  },

  renewMember: async (id, payload) => {
    const res = await fetch(`${API_BASE}/${id}/renew`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return handleResponse(res);
  },

  updateMember: async (id, memberData) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memberData),
      credentials: "include",
    });
    return handleResponse(res);
  },

  deleteMember: async (id) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return handleResponse(res);
  },

  getMemberPayments: async (id) => {
    const res = await fetch(`${API_BASE}/${id}/payments`, {
      credentials: "include",
    });
    return handleResponse(res);
  },
};
