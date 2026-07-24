import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../api/axios';

// ── Eye Icon ──────────────────────────────────────────────────
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

// ── Password validation ───────────────────────────────────────
const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('Ít nhất 8 ký tự');
  if (!/[a-zA-Z]/.test(password)) errors.push('Có ít nhất 1 chữ cái');
  if (!/[0-9]/.test(password)) errors.push('Có ít nhất 1 chữ số');
  if (!/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]/.test(password))
    errors.push('Có ít nhất 1 ký tự đặc biệt');
  return errors;
};

function PasswordStrength({ password }) {
  const { t } = useTranslation();
  if (!password) return null;
  const errors   = validatePassword(password);
  const strength = 4 - errors.length;
  const colors   = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
            i <= strength ? colors[strength] : 'bg-gray-200'
          }`} />
        ))}
      </div>
      {strength < 4 ? (
        <ul className="text-xs text-gray-400 space-y-0.5 mt-1">
          {errors.map((e, i) => (
            <li key={i} className="flex items-center gap-1">
              <span className="text-red-400">✗</span> {e}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-green-500 flex items-center gap-1">
          <span>✓</span> {t('settings.strongPassword')}
        </p>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('account');

  const [formData, setFormData] = useState({
    name:   '',
    email:  localStorage.getItem('userEmail') || '',
    phone:  '',
    dob:    '',
    gender: 'Khác',
  });
  const [message, setMessage] = useState('');

  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [pwForm, setPwForm] = useState({
    oldPassword: '', oldPasswordConfirm: '', newPassword: '', confirmNew: '',
  });
  const [pwError,   setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState({
    old: false, oldConfirm: false, new: false, confirmNew: false,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [deleteError,     setDeleteError]     = useState('');

  useEffect(() => {
    axios.get('/users/me')
      .then(res => { if (res.data) setFormData(prev => ({ ...prev, ...res.data })); })
      .catch(() => {});
    axios.get('/auth/must-change-password')
      .then(res => {
        setMustChangePassword(res.data.mustChange);
        if (res.data.mustChange) setActiveTab('security');
      })
      .catch(() => {});
  }, []);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    axios.put('/users/me', formData)
      .then(() => {
        setMessage('✅ ' + t('settings.updateSuccess'));
        localStorage.setItem('userName', formData.name);
        localStorage.setItem('userEmail', formData.email);
        let accounts = JSON.parse(localStorage.getItem('savedAccounts')) || [];
        accounts = accounts.map(acc =>
          acc.email === formData.email ? { ...acc, name: formData.name } : acc
        );
        localStorage.setItem('savedAccounts', JSON.stringify(accounts));
      })
      .catch(() => setMessage('❌ ' + t('settings.updateError')));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwForm.newPassword !== pwForm.confirmNew) {
      setPwError(t('settings.pwMismatch')); return;
    }
    const errs = validatePassword(pwForm.newPassword);
    if (errs.length > 0) { setPwError(t('settings.pwWeak') + errs.join(', ')); return; }
    setPwLoading(true);
    try {
      await axios.put('/auth/change-password', {
        oldPassword:        pwForm.oldPassword,
        oldPasswordConfirm: pwForm.oldPasswordConfirm,
        newPassword:        pwForm.newPassword,
      });
      setPwSuccess('✅ ' + t('settings.pwSuccess'));
      setPwForm({ oldPassword:'', oldPasswordConfirm:'', newPassword:'', confirmNew:'' });
      setMustChangePassword(false);
    } catch (err) {
      setPwError(err.response?.data?.error || t('settings.pwError'));
    }
    setPwLoading(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true); setDeleteError('');
    try {
      await axios.delete('/auth/delete-account');
      localStorage.clear();
      window.location.href = '/';
    } catch (err) {
      setDeleteError(err.response?.data?.error || t('settings.deleteError'));
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 min-h-[70vh]">

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">
        {t('settings.title')}
      </h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 sm:mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('account')}
          className={`pb-3 px-3 sm:px-4 text-sm sm:text-base font-medium transition
            whitespace-nowrap ${
            activeTab === 'account'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('settings.tabAccount')}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-3 sm:px-4 text-sm sm:text-base font-medium transition
            flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('settings.tabSecurity')}
          {mustChangePassword && (
            <span className="flex w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* ── Tab: Thông tin tài khoản ── */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100
          p-5 sm:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-5 sm:mb-6">
            {t('settings.personalData')}
          </h2>

          {message && (
            <div className="mb-5 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-5 sm:space-y-6">
            {/* Tên */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('settings.fullName')}
              </label>
              <input type="text" required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 text-sm
                  focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('settings.email')}
                <span className="text-gray-400 font-normal ml-1 text-xs">
                  ({t('settings.emailLocked')})
                </span>
              </label>
              <input type="email" value={formData.email} disabled
                className="w-full border rounded-lg px-4 py-2.5 text-sm
                  bg-gray-100 text-gray-500 cursor-not-allowed" />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('settings.phone')}
              </label>
              <input type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('settings.phonePlaceholder')}
                className="w-full border rounded-lg px-4 py-2.5 text-sm
                  focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {/* DOB + Gender — stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('settings.dob')}
                </label>
                <input type="date"
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2.5 text-sm
                    focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('settings.gender')}
                </label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2.5 text-sm
                    focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="Nam">{t('settings.genderMale')}</option>
                  <option value="Nữ">{t('settings.genderFemale')}</option>
                  <option value="Khác">{t('settings.genderOther')}</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end">
              <button type="submit"
                className="w-full sm:w-auto bg-blue-600 text-white font-bold
                  py-2.5 px-8 rounded-xl hover:bg-blue-700 transition shadow-md text-sm">
                {t('settings.saveChanges')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab: Bảo mật ── */}
      {activeTab === 'security' && (
        <div className="space-y-5 sm:space-y-6">

          {/* Cảnh báo mật khẩu tạm */}
          {mustChangePassword && (
            <div className="bg-red-50 border border-red-200 text-red-700
              px-4 sm:px-6 py-4 rounded-xl flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="font-bold text-sm sm:text-base">
                  {t('settings.tempPasswordWarning')}
                </p>
                <p className="text-sm mt-0.5">{t('settings.tempPasswordDesc')}</p>
              </div>
            </div>
          )}

          {/* Form đổi mật khẩu */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100
            p-5 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-5">
              🔐 {t('settings.changePassword')}
            </h2>

            {pwError && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3
                rounded-lg mb-5">{pwError}</div>
            )}
            {pwSuccess && (
              <div className="bg-green-50 text-green-600 text-sm px-4 py-3
                rounded-lg mb-5">{pwSuccess}</div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5 max-w-xl">

              {/* Mật khẩu cũ */}
              {!mustChangePassword && (
                <div className="bg-gray-50 rounded-xl p-4 sm:p-5
                  border border-gray-200 space-y-4">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t('settings.confirmCurrentPw')}
                  </p>
                  {[
                    { key: 'oldPassword',        label: t('settings.currentPw'),       ph: t('settings.currentPwPh')  },
                    { key: 'oldPasswordConfirm', label: t('settings.confirmCurrentPw2'), ph: t('settings.confirmCurrentPw2Ph') },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {field.label}
                      </label>
                      <div className="relative">
                        <input
                          type={showPw[field.key] ? 'text' : 'password'}
                          required
                          value={pwForm[field.key]}
                          onChange={e => setPwForm({ ...pwForm, [field.key]: e.target.value })}
                          placeholder={field.ph}
                          className="w-full border rounded-lg px-4 py-2.5 pr-10
                            focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                        <button type="button"
                          onClick={() => setShowPw(p => ({ ...p, [field.key]: !p[field.key] }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center
                            text-gray-400 hover:text-gray-600 transition">
                          <EyeIcon isVisible={showPw[field.key]} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mật khẩu mới */}
              <div className="bg-blue-50 rounded-xl p-4 sm:p-5
                border border-blue-100 space-y-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  {t('settings.newPasswordSection')}
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('settings.newPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPw.new ? 'text' : 'password'} required
                      value={pwForm.newPassword}
                      onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      placeholder={t('settings.newPasswordPh')}
                      className="w-full border rounded-lg px-4 py-2.5 pr-10
                        focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                    />
                    <button type="button"
                      onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center
                        text-gray-400 hover:text-gray-600 transition">
                      <EyeIcon isVisible={showPw.new} />
                    </button>
                  </div>
                  <PasswordStrength password={pwForm.newPassword} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('settings.confirmNewPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPw.confirmNew ? 'text' : 'password'} required
                      value={pwForm.confirmNew}
                      onChange={e => setPwForm({ ...pwForm, confirmNew: e.target.value })}
                      placeholder={t('settings.confirmNewPasswordPh')}
                      className={`w-full border rounded-lg px-4 py-2.5 pr-10
                        focus:ring-2 outline-none text-sm bg-white ${
                        pwForm.confirmNew && pwForm.confirmNew !== pwForm.newPassword
                          ? 'border-red-400 focus:ring-red-400'
                          : 'focus:ring-blue-500'
                      }`}
                    />
                    <button type="button"
                      onClick={() => setShowPw(p => ({ ...p, confirmNew: !p.confirmNew }))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center
                        text-gray-400 hover:text-gray-600 transition">
                      <EyeIcon isVisible={showPw.confirmNew} />
                    </button>
                  </div>
                  {pwForm.confirmNew && pwForm.confirmNew !== pwForm.newPassword && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">
                      {t('settings.pwMismatch')}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-1">
                <button type="submit" disabled={pwLoading}
                  className="w-full sm:w-auto bg-blue-600 text-white font-bold
                    px-8 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50
                    transition shadow-md text-sm">
                  {pwLoading ? '⏳ ' + t('settings.processing') : '🔐 ' + t('settings.updatePassword')}
                </button>
              </div>
            </form>
          </div>

          {/* Vùng nguy hiểm */}
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-red-600 mb-2">
              ⚠️ {t('settings.dangerZone')}
            </h2>
            <p className="text-gray-500 text-sm mb-4">{t('settings.dangerZoneDesc')}</p>

            <div className="border border-red-200 rounded-xl p-4 flex
              flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-sm sm:text-base">
                  {t('settings.deleteAccount')}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                  {t('settings.deleteAccountDesc')}
                </p>
              </div>
              <button
                onClick={() => { setShowDeleteModal(true); setDeleteError(''); }}
                className="w-full sm:w-auto flex-shrink-0 bg-red-50 text-red-600
                  border border-red-300 font-bold px-4 py-2 rounded-xl
                  hover:bg-red-100 transition text-sm">
                {t('settings.deleteAccount')}
              </button>
            </div>
          </div>

          {/* Modal xóa tài khoản */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50
              flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl
                w-full sm:max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">

                <div className="text-center mb-5">
                  <div className="text-4xl sm:text-5xl mb-3">🗑️</div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                    {t('settings.deleteConfirmTitle')}
                  </h3>
                  <p className="text-gray-500 text-sm mt-2">
                    {t('settings.deleteConfirmDesc')}
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                  <p className="font-bold text-red-700 text-sm mb-2">
                    {t('settings.deleteWhatHappens')}
                  </p>
                  <ul className="space-y-1.5 text-sm text-red-600">
                    {['deleteConsequence1','deleteConsequence2','deleteConsequence3','deleteConsequence4']
                      .map((key, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0">
                          {['❌','👤','💾','🗑️'][i]}
                        </span>
                        {t(`settings.${key}`)}
                      </li>
                    ))}
                  </ul>
                </div>

                {deleteError && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl
                    p-4 mb-4 flex gap-3">
                    <span className="text-xl flex-shrink-0">⚠️</span>
                    <p className="text-amber-800 text-sm font-medium">{deleteError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setDeleteError(''); }}
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-3
                      rounded-xl hover:bg-gray-200 transition text-sm">
                    {t('settings.cancel')}
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="flex-1 bg-red-600 text-white font-bold py-3
                      rounded-xl hover:bg-red-700 disabled:opacity-50 transition text-sm">
                    {deleteLoading
                      ? '⏳ ' + t('settings.processing')
                      : '🗑️ ' + t('settings.deleteAccount')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SettingsPage;