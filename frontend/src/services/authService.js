import { handleResponse } from "@/services/apiClient";

export const authService = {
  checkMe: async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    return handleResponse(res);
  },

  login: async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    return handleResponse(res);
  },

  logout: async () => {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    return handleResponse(res);
  },

  forgotPassword: async (email) => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      credentials: "include",
    });
    return handleResponse(res);
  },

  resetPassword: async (token, password) => {
    const res = await fetch(`/api/auth/reset-password/${token}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      credentials: "include",
    });
    return handleResponse(res);
  },

  updatePassword: async (currentPassword, newPassword) => {
    const res = await fetch("/api/auth/update-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
      credentials: "include",
    });
    return handleResponse(res);
  },
};

