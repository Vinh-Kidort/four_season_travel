import React, {
  createContext, useContext,
  useState, useEffect, useCallback
} from 'react';
import axios     from './api/axios';
import axiosRaw  from 'axios';
import { tokenManager } from './api/tokenManager';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Phục hồi session khi load trang ──────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Cookie refreshToken tự gửi kèm
        const res = await axiosRaw.post(
          `${import.meta.env.REACT_API_BASE_URL
            || 'http://localhost:8080/api/v1'}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        tokenManager.setToken(res.data.accessToken);

        const userData = {
          name:  res.data.name,
          email: res.data.email,
          role:  res.data.role,
        };
        setUser(userData);

        localStorage.setItem('userName',  res.data.name  || '');
        localStorage.setItem('userEmail', res.data.email || '');
        localStorage.setItem('userRole',  res.data.role  || '');

      } catch {
        // Chưa đăng nhập hoặc refresh token hết hạn
        tokenManager.clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── Lắng nghe event session hết hạn từ axios interceptor ─────
  useEffect(() => {
    const handleSessionExpired = () => {
      tokenManager.clearToken();
      setUser(null);
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    };

    const handleTokenRefreshed = (e) => {
      const data = e.detail;
      if (data) {
        setUser({
          name:  data.name,
          email: data.email,
          role:  data.role,
        });
      }
    };

    window.addEventListener('sessionExpired',   handleSessionExpired);
    window.addEventListener('tokenRefreshed',   handleTokenRefreshed);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
    };
  }, []);

  // ── Login ─────────────────────────────────────────────────────
  const login = useCallback((data) => {
    // data.accessToken từ backend (refreshToken đã được set vào Cookie)
    const accessToken = data.accessToken || data.token;
    tokenManager.setToken(accessToken);

    const userData = {
      name:  data.name  || '',
      email: data.email || '',
      role:  data.role  || 'USER',
    };
    setUser(userData);

    localStorage.setItem('userName',  userData.name);
    localStorage.setItem('userEmail', userData.email);
    localStorage.setItem('userRole',  userData.role);
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      // Gọi backend revoke refreshToken + xóa cookie
      await axios.post('/auth/logout', {}, { withCredentials: true });
    } catch {
      // ignore
    } finally {
      tokenManager.clearToken();
      setUser(null);
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
    }
  }, []);

  // ── Check có đang đăng nhập không ────────────────────────────
  const isAuthenticated = !!user && tokenManager.hasToken();

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated,
      // Giữ token getter để Navbar dùng
      token: tokenManager.getToken(),
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}