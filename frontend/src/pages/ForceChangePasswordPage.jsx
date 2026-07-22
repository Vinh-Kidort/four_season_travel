import React, { useState } from 'react';
import axios from '../api/axios';
import { useTranslation } from 'react-i18next';

const validatePassword = (password, t) => {
  const errors = [];
  if (password.length < 8)
    errors.push(t('forceChangePasswordPage.pwRequirements.length'));
  if (!/[a-zA-Z]/.test(password))
    errors.push(t('forceChangePasswordPage.pwRequirements.letter'));
  if (!/[0-9]/.test(password))
    errors.push(t('forceChangePasswordPage.pwRequirements.number'));
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    errors.push(t('forceChangePasswordPage.pwRequirements.special'));
  return errors;
};

const EyeIcon = ({ isVisible }) => isVisible ? (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
    strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
    strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

// ── Password strength indicator ───────────────────────────────
function PasswordStrength({ password }) {
  const { t } = useTranslation();
  if (!password) return null;
  
  const errors   = validatePassword(password, t);
  const strength = 4 - errors.length;
  const colors   = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];
  const labels   = ['', t('forceChangePasswordPage.strength.weak'),
                        t('forceChangePasswordPage.strength.fair'),
                        t('forceChangePasswordPage.strength.good'),
                        t('forceChangePasswordPage.strength.strong')];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4].map(i => (
          <div key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i <= strength ? colors[strength] : 'bg-gray-200'
            }`} />
        ))}
      </div>
      {strength < 4 && errors.length > 0 && (
        <ul className="text-xs text-gray-400 space-y-0.5 mt-1">
          {errors.map((e, i) => (
            <li key={i} className="flex items-center gap-1">
              <span className="text-red-400">✗</span> {e}
            </li>
          ))}
        </ul>
      )}
      {strength === 4 && (
        <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
          <span>✓</span>
          {t('forceChangePasswordPage.strength.strongPw')}
        </p>
      )}
    </div>
  );
}

function ForceChangePasswordPage() {
  const { t } = useTranslation();

  const [form,    setForm]    = useState({ newPassword: '', confirmPassword: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState({ new: false, confirm: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError(t('forceChangePasswordPage.pwMismatch'));
      return;
    }
    const errs = validatePassword(form.newPassword, t);
    if (errs.length > 0) {
      setError(t('forceChangePasswordPage.pwTooWeak') + errs.join(', '));
      return;
    }

    setLoading(true);
    try {
      await axios.put('/auth/change-password', {
        oldPassword:        form.newPassword,
        oldPasswordConfirm: form.newPassword,
        newPassword:        form.newPassword,
        forceChange:        true,
      });
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || t('forceChangePasswordPage.pwError'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center
      justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8
        w-full max-w-sm sm:max-w-md">

        {/* Header */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="text-4xl sm:text-5xl mb-3">🔐</div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {t('forceChangePasswordPage.title')}
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            {t('forceChangePasswordPage.descPart1')}
            <br />
            {t('forceChangePasswordPage.descPart2')}
          </p>
        </div>

        {/* Warning box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl
          px-4 py-3 mb-4 sm:mb-5 text-xs sm:text-sm text-amber-700">
          ⚠️ {t('forceChangePasswordPage.warningDesc')}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-xs sm:text-sm
            px-4 py-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Mật khẩu mới */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('forceChangePasswordPage.newPassword')}
            </label>
            <div className="relative">
              <input
                type={showPw.new ? 'text' : 'password'}
                required
                value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
                placeholder={t('forceChangePasswordPage.placeholderNewPassword')}
                className="w-full border rounded-lg px-3 py-2 pr-10 text-sm
                  focus:ring-2 focus:ring-blue-400 outline-none" />
              <button type="button"
                onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2
                  text-gray-400 hover:text-gray-600 text-xs">
                <EyeIcon isVisible={showPw.new} />
              </button>
            </div>
            <PasswordStrength password={form.newPassword} />
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('forceChangePasswordPage.confirmNewPassword')}
            </label>
            <div className="relative">
              <input
                type={showPw.confirm ? 'text' : 'password'}
                required
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder={t('forceChangePasswordPage.placeholderConfirmPassword')}
                className={`w-full border rounded-lg px-3 py-2 pr-10 text-sm
                  focus:ring-2 focus:ring-blue-400 outline-none ${
                  form.confirmPassword && form.confirmPassword !== form.newPassword
                    ? 'border-red-400' : ''
                }`} />
              <button type="button"
                onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2
                  text-gray-400 hover:text-gray-600 text-xs">
                <EyeIcon isVisible={showPw.confirm} />
              </button>
            </div>
            {form.confirmPassword && form.confirmPassword !== form.newPassword && (
              <p className="text-red-400 text-xs mt-1">
                {t('forceChangePasswordPage.pwMismatchShort')}
              </p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-2.5 sm:py-3
              rounded-xl hover:bg-blue-700 disabled:opacity-50 transition text-sm sm:text-base">
            {loading
              ? t('forceChangePasswordPage.saving')
              : t('forceChangePasswordPage.saveBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForceChangePasswordPage;