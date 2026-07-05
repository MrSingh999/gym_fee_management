import axios from 'axios';

const apiClient = axios.create({
  baseURL: '',
  withCredentials: true,
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error status is 401 and it's not a retry and not login/refresh URLs
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/api/auth/login') &&
      !originalRequest.url.includes('/api/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        // Request token refresh
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token expired or invalid, clear user session
        window.dispatchEvent(new Event("auth-session-expired"));
        return Promise.reject(refreshError);
      }
    }
    
    const errMsg = error.response?.data?.message || error.message || 'API Error';
    return Promise.reject(new Error(errMsg));
  }
);

export default apiClient;
