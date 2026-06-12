import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from '../api/axios';

import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

// ── Validate mật khẩu phía frontend ─────────────────────────
const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('Ít nhất 8 ký tự');
  if (!/[a-zA-Z]/.test(password)) errors.push('Có ít nhất 1 chữ cái');
  if (!/[0-9]/.test(password)) errors.push('Có ít nhất 1 chữ số');
  if (!/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]/.test(password))
    errors.push('Có ít nhất 1 ký tự đặc biệt');
  return errors;
};

// ── Indicator độ mạnh mật khẩu ──────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const errors  = validatePassword(password);
  const strength = 4 - errors.length;
  const colors  = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i <= strength ? colors[strength] : 'bg-gray-200'
            }`} />
        ))}
      </div>
      {strength < 4 && (
        <ul className="text-xs text-gray-400 space-y-0.5 mt-1">
          {errors.map((e, i) => (
            <li key={i} className="flex items-center gap-1">
              <span className="text-red-400">✗</span> {e}
            </li>
          ))}
        </ul>
      )}
      {strength === 4 && (
        <p className="text-xs text-green-500 flex items-center gap-1">
          <span>✓</span> Mật khẩu mạnh
        </p>
      )}
    </div>
  );
}

const STEP = { FORM: 1, OTP: 2 };

function RegisterPage() {
  const { t } = useTranslation();
  
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [step, setStep] = useState(STEP.FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(''); // Lưu email đã gửi OTP

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: ''
  });

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = Array(6).fill(null).map(() => React.createRef());

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ── Bước 1: Gửi OTP ──────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    const pwErrors = validatePassword(form.password);
    if (pwErrors.length > 0) {
      setError('Mật khẩu chưa đủ mạnh. Vui lòng kiểm tra lại!');
      return;
    }

    setLoading(true);
    try {
      const captchaToken = await executeRecaptcha('register');
      await axios.post('/auth/register/send-otp', {
        name: form.name,
        email: form.email,
        password: form.password,
        captchaToken,
      });

      setEmailSent(form.email);
      setStep(STEP.OTP);
      startResendTimer();
    } catch (err) {
      setError(err.response?.data?.error || t('registerPage.errorConnect'));
    }
    setLoading(false);
  };

  // ── Countdown resend ─────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Resend OTP ────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    try {
      const captchaToken = await executeRecaptcha('resend_otp');
      await axios.post('/auth/register/send-otp', {
        name: form.name,
        email: form.email,
        password: form.password,
        captchaToken,
      });
      startResendTimer();
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi gửi lại OTP!');
    }
  };

  // ── OTP input handling ────────────────────────────────────────
  const handleOtpChange = (idx, value) => {
    if (!/^\d*$/.test(value)) return; // Chỉ cho phép nhập số
    const newOtp = [...otp];
    newOtp[idx]  = value.slice(-1); // Lấy ký tự cuối
    setOtp(newOtp);
    // Tự động nhảy sang ô tiếp theo
    if (value && idx < 5) otpRefs[idx + 1].current?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = paste.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
    otpRefs[Math.min(paste.length, 5)].current?.focus();
  };

  // ── Bước 2: Xác thực OTP ─────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số!');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/auth/register/verify-otp', {
        name: form.name,
        email: form.email,
        password: form.password,
        otp: otpString,
      });
      // Đăng nhập tự động bằng AuthContext
      const { token, role, email, name } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', name);
      localStorage.setItem('userRole', role || 'USER');

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'OTP không đúng!');
      setOtp(['', '', '', '', '', '']);
      otpRefs[0].current?.focus();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        {/* Logo & Header */}
        <div className="text-center mb-6">
          
          <h1 className="text-3xl font-bold text-gray-800">
            {step === STEP.FORM ? t('registerPage.title') : 'Xác thực email'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === STEP.FORM
              ? t('registerPage.subtitle')
              : `Nhập mã OTP đã gửi đến ${emailSent}`}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s, idx) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {idx < 1 && (
                <div className={`flex-1 h-0.5 transition-all ${
                  step > s ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 text-center font-medium">
            {error}
          </div>
        )}

        {/* ══ BƯỚC 1: FORM ══ */}
        {step === STEP.FORM && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('registerPage.fullName')}
              </label>
              <input name="name" type="text"
                value={form.name} onChange={handleChange}
                required placeholder={t('registerPage.placeholderName')}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('registerPage.email')}
              </label>
              <input name="email" type="email"
                value={form.email} onChange={handleChange}
                required placeholder={t('registerPage.placeholderEmail')}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('registerPage.password')}
              </label>
              <input name="password" type="password"
                value={form.password} onChange={handleChange}
                required placeholder={t('registerPage.placeholderPassword') || "Ít nhất 8 ký tự, số và ký tự đặc biệt"}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none" />
              <PasswordStrength password={form.password} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu
              </label>
              <input name="confirm" type="password"
                value={form.confirm} onChange={handleChange}
                required placeholder="Nhập lại mật khẩu"
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none ${
                  form.confirm && form.confirm !== form.password ? 'border-red-400' : ''
                }`} />
              {form.confirm && form.confirm !== form.password && (
                <p className="text-red-400 text-xs mt-1">Mật khẩu không khớp</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-sm">
              {loading ? '⏳ Đang gửi OTP...' : 'Tiếp tục'}
            </button>

            <p className="text-center text-sm text-gray-500">
              {t('registerPage.hasAccount')}{' '}
              <Link to="/login" className="text-blue-600 font-bold hover:underline">
                {t('registerPage.loginNow')}
              </Link>
            </p>
          </form>
        )}

        {/* ══ BƯỚC 2: OTP ══ */}
        {step === STEP.OTP && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Nhập mã 6 chữ số
              </label>
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all ${
                      digit
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    } focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}
                  />
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">
                Có thể paste (dán) mã từ email
              </p>
            </div>

            {/* Timer + resend */}
            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-gray-400">
                  Gửi lại sau <span className="font-bold text-blue-600">{resendTimer}s</span>
                </p>
              ) : (
                <button type="button" onClick={handleResend}
                  className="text-sm text-blue-600 hover:underline font-medium">
                  Gửi lại mã OTP
                </button>
              )}
            </div>

            <button type="submit" disabled={loading || otp.join('').length < 6}
              className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition shadow-sm">
              {loading ? '⏳ Đang xác thực...' : '✅ Xác nhận đăng ký'}
            </button>

            <button type="button"
              onClick={() => { setStep(STEP.FORM); setError(''); }}
              className="w-full text-gray-500 text-sm font-medium hover:text-gray-700 transition">
              Thay đổi thông tin
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default RegisterPage;