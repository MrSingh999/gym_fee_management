import apiClient from "@/services/apiClient";

export const authService = {
  checkMe: () => apiClient.get("/api/auth/me"),

  login: (email, password) =>
    apiClient.post("/api/auth/login", { email, password }),

  logout: () => apiClient.post("/api/auth/logout"),

  forgotPassword: (email) =>
    apiClient.post("/api/auth/forgot-password", { email }),

  resetPassword: (email, otp, password) =>
    apiClient.put("/api/auth/reset-password", { email, otp, password }),

  updatePassword: (currentPassword, newPassword) =>
    apiClient.put("/api/auth/update-password", { currentPassword, newPassword }),

  uploadProfilePicture: (formData) =>
    apiClient.put("/api/auth/profile-picture", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};
