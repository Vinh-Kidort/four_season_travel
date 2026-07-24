// Lưu access token trong memory — không lưu localStorage
let accessToken = null;

export const tokenManager = {
  getToken:   ()    => accessToken,
  setToken:   (token)   => { accessToken = token; },
  clearToken: ()    => { accessToken = null; },
  hasToken:   ()    => !!accessToken,
};

export const clearAuthStorage = () => {
  tokenManager.clearToken();
  if (typeof window === 'undefined') return;
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
};

export const persistAuthData = (token, userData = {}) => {
  tokenManager.setToken(token);
  if (typeof window === 'undefined') return;

  const name = userData.name ?? '';
  const email = userData.email ?? '';
  const role = userData.role ?? 'USER';

  localStorage.setItem('userName', name);
  localStorage.setItem('userEmail', email);
  localStorage.setItem('userRole', role);
};