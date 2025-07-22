import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach Bearer token except for login/signup
api.interceptors.request.use(
  (config) => {
    // Don't attach token for login or signup
    if (
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/signup')
    ) {
      return config;
    }
    // Try to get token from localStorage/session (adjust as needed)
    let token = null;
    if (typeof window !== 'undefined') {
      try {
        const session = JSON.parse(
          localStorage.getItem('nextauth.session') || '{}'
        );
        token = session?.user?.access_token;
      } catch (e) {
        // ignore JSON parse errors
      }
    }
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
