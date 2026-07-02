import { handleResponse } from '@/services/apiClient';

export const authService = {
  checkMe: async () => {
    const res = await fetch('/api/auth/me');
    return handleResponse(res);
  },
  
  login: async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },
  
  logout: async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    return handleResponse(res);
  },
  
  forgotPassword: async (email) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },
  
  resetPassword: async (token, password) => {
    const res = await fetch(`/api/auth/reset-password/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return handleResponse(res);
  }
};
