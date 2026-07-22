import React, { useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useTranslation } from 'react-i18next'; 
import { tokenManager } from '../api/tokenManager';

function LoginPage() {
  const { t } = useTranslation(); // KHỞI TẠO HOOK DỊCH

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  
  const [showPassword, setShowPassword] = useState(false); 
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [showForgot,    setShowForgot]    = useState(false);
  const [forgotEmail,   setForgotEmail]   = useState('');
  const [forgotMsg,     setForgotMsg]     = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  
  const navigate = useNavigate();

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const captchaToken = await executeRecaptcha('login');
      const response = await axios.post('/auth/login', { ...form, captchaToken });
      
      // Lấy token (Chấp nhận cả accessToken hoặc token)
      const { accessToken, token, role, email, name } = response.data; 
      const jwtToken = accessToken || token;

      loginAndSave(email, name, jwtToken, role); 
    } catch (err) {
      setError(err.response?.data?.error || t('loginPage.errorMessage'));
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post('/auth/google', { token: credentialResponse.credential });
      const { token, role, email, name } = response.data;
      loginAndSave(email, name, token, role, true);
    } catch (err) {
      setError(t('loginPage.googleError'));
    }
  };

  const loginAndSave = (email, name, token, role) => {
    if (token) {
      tokenManager.setToken(token);
    }
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', name);
    localStorage.setItem('userRole', role);
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
      setForgotMsg(err.response?.data?.error || t('loginPage.emailSendError'));
    }
    setForgotLoading(false);
  };


  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4 py-8 md:py-10">
      
      {/* RESPONSIVE: Thêm p-6 cho mobile và p-8 cho desktop */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            {t('loginPage.login')}
          </h2>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center font-medium text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Ô NHẬP EMAIL */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('loginPage.email')}
            </label>
            <input 
              type="email" 
              required 
              value={form.email}
              placeholder={t('loginPage.placeholderEmail')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-transparent" 
              onChange={(e) => setForm({...form, email: e.target.value})}
            />
 
          </div>

          {/* Ô NHẬP MẬT KHẨU CÓ CON MẮT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('loginPage.password')}
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={form.password}
                placeholder={t('loginPage.placeholderPassword')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10 text-sm bg-transparent" 
                onChange={(e) => setForm({...form, password: e.target.value})} 
              />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                ) : (
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
                {t('loginPage.forgotPasswordLink')}
              </button>
            </div>
          </div>
          
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-sm text-sm sm:text-base">
            {t('loginPage.login')}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-3 text-sm text-gray-400 font-bold uppercase tracking-wider">
            {t('loginPage.or')}
          </span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError(t('loginPage.googleError'))}
            useOneTap 
          />
        </div>

        <p className="text-center text-sm text-gray-500 mt-6 font-medium">
          {t('loginPage.noAccount')}{' '}
          <Link to="/register" className="text-blue-600 font-bold hover:underline">
            {t('loginPage.signUpNow')}
          </Link>
        </p>
      </div>

      {/* --- MODAL QUÊN MẬT KHẨU --- */}
      {showForgot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-fade-in-down">

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">
                {t('loginPage.forgotPasswordTitle')}
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
                <p className="font-bold text-green-600 mb-2">
                  {t('loginPage.sentSuccess')}
                </p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {t('loginPage.checkInboxPart1')} <strong>{forgotEmail}</strong> {t('loginPage.checkInboxPart2')}
                </p>
                <p className="text-amber-600 text-xs mt-4 bg-amber-50 rounded-lg p-2.5 font-medium leading-relaxed">
                  {t('loginPage.mustResetWarning')}
                </p>
                <button
                  onClick={() => { setShowForgot(false); setForgotMsg(''); setForgotEmail(''); }}
                  className="mt-5 w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition">
                  {t('loginPage.close')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-gray-500 text-sm leading-relaxed">
                  {t('loginPage.forgotPasswordDesc')}
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
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-transparent" />
                <button type="submit" disabled={forgotLoading}
                  className="w-full bg-blue-500 text-white font-bold py-2.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition shadow-sm text-sm">
                  {forgotLoading 
                    ? t('loginPage.sending') 
                    : t('loginPage.sendTempPassword')}
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