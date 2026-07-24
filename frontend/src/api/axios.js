import axios from 'axios';
import { tokenManager, clearAuthStorage } from './tokenManager';
import { shouldForceLogoutOnRefreshFailure } from './authSession';

const api = axios.create({
  baseURL:         import.meta.env.REACT_API_BASE_URL || 'http://localhost:8080/api/v1',
  withCredentials: true, // ← Tự động gửi HttpOnly Cookie
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor ───────────────────────────────────────
api.interceptors.request.use(config => {

  // 1. Kiểm tra client rate limit
  const unlockTime = localStorage.getItem('unlockTime');
  if (unlockTime && Date.now() < parseInt(unlockTime)) {
    return Promise.reject(new Error('CLIENT_RATE_LIMIT_EXCEEDED'));
  }

  // 2. Gắn access token từ memory (không dùng localStorage nữa)
  const token = tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, error => Promise.reject(error));

// ── Response interceptor ──────────────────────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,

  async error => {
    const originalRequest = error.config;

    // ── Rate limit 429 ────────────────────────────────────────
    if (error.response?.status === 429) {
      const errData = error.response?.data;
      const errMessage = typeof errData === 'string'
        ? errData
        : (errData?.message || errData?.error || 'Too many requests');
      const retryAfter = Number.isFinite(errData?.retryAfter)
        ? errData.retryAfter
        : 60;

      localStorage.setItem('unlockTime',
        String(Date.now() + retryAfter * 1000));
      window.dispatchEvent(new CustomEvent('rateLimitExceeded', {
        detail: { message: errMessage }
      }));
      return Promise.reject(error);
    }

    // ── Access token hết hạn 401 → tự động refresh ───────────
    if (error.response?.status === 401
        && !originalRequest._retry
        && !originalRequest.url?.includes('/auth/')) {

      // Đang refresh → đưa vào queue chờ
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Cookie refreshToken tự gửi kèm nhờ withCredentials
        const res = await axios.post(
          `${import.meta.env.REACT_API_BASE_URL
            || 'http://localhost:8080/api/v1'}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data.accessToken;
        tokenManager.setToken(newToken);

        // Cập nhật info user nếu có
        if (res.data.name)  localStorage.setItem('userName',  res.data.name);
        if (res.data.email) localStorage.setItem('userEmail', res.data.email);
        if (res.data.role)  localStorage.setItem('userRole',  res.data.role);

        // Dispatch event để Navbar biết đã refresh
        window.dispatchEvent(new CustomEvent('tokenRefreshed', {
          detail: res.data
        }));

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);

        if (shouldForceLogoutOnRefreshFailure(refreshError)) {
          clearAuthStorage();
          window.dispatchEvent(new Event('sessionExpired'));
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;