import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [savedAccounts, setSavedAccounts] = useState([]);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Cờ kiểm soát ẩn/hiện mật khẩu
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [showForgot,    setShowForgot]    = useState(false);
  const [forgotEmail,   setForgotEmail]   = useState('');
  const [forgotMsg,     setForgotMsg]     = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const accounts = JSON.parse(localStorage.getItem('savedAccounts')) || [];
    const validAccounts = accounts.filter(acc => Date.now() < acc.expiryTime);
    setSavedAccounts(validAccounts);
    localStorage.setItem('savedAccounts', JSON.stringify(validAccounts));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const captchaToken = await executeRecaptcha('login');
      const response = await axios.post('/auth/login', { ...form, captchaToken });
      const { token, role, email, name } = response.data; 
      loginAndSave(email, name, token, role, false); 
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại!');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post('/auth/google', { token: credentialResponse.credential });
      const { token, role, email, name } = response.data;
      loginAndSave(email, name, token, role, true);
    } catch (err) {
      setError('Đăng nhập Google thất bại!');
    }
  };

  const handleQuickLogin = (account) => {
    loginAndSave(account.email, account.name, account.token, account.role, false);
  };

  const loginAndSave = (email, name, token, role, isGoogle = false) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', name);
    localStorage.setItem('userRole', role);

    if (!isGoogle) {
      let accounts = JSON.parse(localStorage.getItem('savedAccounts')) || [];
      accounts = accounts.filter(acc => acc.email !== email);
      accounts.unshift({
        email, name, token, role,
        expiryTime: Date.now() + (3 * 24 * 60 * 60 * 1000) 
      });
      if (accounts.length > 7) accounts.pop();
      localStorage.setItem('savedAccounts', JSON.stringify(accounts));
    }
    navigate('/');
    
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg('');
    try {
      await axios.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMsg('success');
    } catch (err) {
      setForgotMsg(err.response?.data?.error || 'Lỗi gửi email!');
    }
    setForgotLoading(false);
  };

  // ĐIỀU KIỆN THÔNG MINH: Chỉ hiện Dropdown khi click vào VÀ ô email/password ĐANG TRỐNG
  const shouldShowDropdown = showDropdown && savedAccounts.length > 0 && form.email === '' && form.password === '';

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Đăng nhập</h2>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Ô NHẬP EMAIL */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              required 
              value={form.email}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              onChange={(e) => setForm({...form, email: e.target.value})}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />

            {/* DANH SÁCH THẢ XUỐNG */}
            {shouldShowDropdown && (
              <div className="absolute z-50 top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  Tài khoản đã lưu trên thiết bị
                </div>
                {savedAccounts.map((acc, index) => (
                  <div 
                    key={index} 
                    onClick={() => handleQuickLogin(acc)}
                    className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-50 last:border-0 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-200 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {acc.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-800 text-sm">{acc.email}</span>
                    </div>
                    <span className="text-gray-400 text-xl tracking-widest leading-none mt-1">
                      ••••••••
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ô NHẬP MẬT KHẨU CÓ CON MẮT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} // Bật tắt kiểu text/password
                required 
                value={form.password}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10" 
                onChange={(e) => setForm({...form, password: e.target.value})} 
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              />
              
              {/* Nút bấm Con Mắt (Nằm đè lên bên phải của ô input) */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? (
                  // Icon Mắt Mở
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                ) : (
                  // Icon Mắt Đóng (Có gạch chéo)
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <button type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm text-blue-500 hover:underline font-medium">
                Quên mật khẩu?
              </button>
            </div>
          </div>
          
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-sm">
            Đăng nhập
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-3 text-sm text-gray-500 font-medium">HOẶC</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Đăng nhập Google bị lỗi!')}
            useOneTap 
          />
        </div>

        <p className="text-center text-gray-600 mt-6">
          Chưa có tài khoản? <Link to="/register" className="text-blue-600 font-bold hover:underline">Đăng ký ngay</Link>
        </p>
      </div>

      {/* --- MODAL QUÊN MẬT KHẨU ĐƯỢC ĐẶT Ở NGOÀI CÙNG --- */}
      {showForgot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">
                🔑 Quên mật khẩu
              </h3>
              <button onClick={() => {
                setShowForgot(false);
                setForgotMsg('');
                setForgotEmail('');
              }} className="text-gray-400 hover:text-red-500 text-2xl leading-none">&times;</button>
            </div>

            {forgotMsg === 'success' ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">📧</div>
                <p className="font-bold text-green-600 mb-2">Đã gửi thành công!</p>
                <p className="text-gray-500 text-sm">
                  Kiểm tra hộp thư <strong>{forgotEmail}</strong> để lấy
                  mật khẩu tạm thời.
                </p>
                <p className="text-amber-600 text-xs mt-3 bg-amber-50 rounded-lg p-2 font-medium">
                  ⚠️ Bạn sẽ cần đặt mật khẩu mới sau khi đăng nhập.
                </p>
                <button
                  onClick={() => { setShowForgot(false); setForgotMsg(''); setForgotEmail(''); }}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-gray-500 text-sm">
                  Nhập email tài khoản, chúng tôi sẽ gửi mật khẩu tạm thời
                  về email của bạn.
                </p>
                {forgotMsg && (
                  <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg font-medium text-center">
                    {forgotMsg}
                  </p>
                )}
                <input type="email" required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
                <button type="submit" disabled={forgotLoading}
                  className="w-full bg-amber-500 text-white font-bold py-2.5 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition shadow-sm">
                  {forgotLoading ? '⏳ Đang gửi...' : 'Gửi mật khẩu tạm thời'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;