import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:5600") + "/api",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // FIX: Prevent redirect loop if already on login page or if it's the auth check
    // We use relative paths here to match the thunk calls
    const url = error.config?.url || '';
    const isAuthCheck = url.endsWith('auth/me') || url.endsWith('auth/account-data');
    const isLoginPage = window.location.pathname === '/login';

    if (error.response) {
      const status = error.response.status;

      // 1. Handle Unauthorized (401)
      if (status === 401) {
        console.warn("[API] Unauthorized access - 401. Redux will handle state cleanup.");
        // We no longer force a hard reload here to prevent redirect loops
      }
      // 2. Handle Too Many Requests (429)
      else if (status === 429) {
        console.error("[API] Rate limit exceeded. Please wait a moment before trying again.");
        // Optional: You could trigger a global toast notification here
      }
      // 2. Handle 500 Series (Server Errors)
      else if (status >= 500) {
        window.location.href = '/error-500';
      }
      // 3. 400 Series errors are now handled locally by the calling code/thunks to preserve UI state
    }
    return Promise.reject(error);
  }
);

export default api;