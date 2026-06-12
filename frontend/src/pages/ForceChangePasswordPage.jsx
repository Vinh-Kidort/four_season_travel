import React, { useState } from 'react';
import axios from '../api/axios';

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8)          errors.push('Ít nhất 8 ký tự');
  if (!/[a-zA-Z]/.test(password))   errors.push('Có ít nhất 1 chữ cái');
  if (!/[0-9]/.test(password))      errors.push('Có ít nhất 1 chữ số');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    errors.push('Có ít nhất 1 ký tự đặc biệt');
  return errors;
};

function ForceChangePasswordPage() {
  const [form,    setForm]    = useState({
    newPassword: '', confirmPassword: ''
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!'); return;
    }
    const errs = validatePassword(form.newPassword);
    if (errs.length > 0) {
      setError('Mật khẩu chưa đủ mạnh: ' + errs.join(', ')); return;
    }

    setLoading(true);
    try {
      // Dùng mật khẩu tạm (đang là mật khẩu hiện tại) làm oldPassword
      await axios.put('/auth/change-password', {
        oldPassword:        form.newPassword, // ← dummy, backend skip check khi mustChange
        oldPasswordConfirm: form.newPassword,
        newPassword:        form.newPassword,
        forceChange:        true,             // ← flag để backend skip check old
      });
      // Reload để ForceGuard check lại
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi đổi mật khẩu!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center
      justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800">
            Đặt mật khẩu mới
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Bạn đang dùng mật khẩu tạm thời.<br />
            Vui lòng đặt mật khẩu mới để tiếp tục.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl
          px-4 py-3 mb-5 text-sm text-amber-700">
          ⚠️ Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ cái,
          số và ký tự đặc biệt.
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3
            rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu mới
            </label>
            <input type="password" required
              value={form.newPassword}
              onChange={e => setForm({...form, newPassword: e.target.value})}
              placeholder="Nhập mật khẩu mới"
              className="w-full border rounded-lg px-3 py-2
                focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Xác nhận mật khẩu mới
            </label>
            <input type="password" required
              value={form.confirmPassword}
              onChange={e => setForm({...form, confirmPassword: e.target.value})}
              placeholder="Nhập lại mật khẩu mới"
              className={`w-full border rounded-lg px-3 py-2
                focus:ring-2 focus:ring-blue-400 outline-none ${
                form.confirmPassword && form.confirmPassword !== form.newPassword
                  ? 'border-red-400' : ''
              }`} />
            {form.confirmPassword &&
              form.confirmPassword !== form.newPassword && (
              <p className="text-red-400 text-xs mt-1">
                Mật khẩu không khớp
              </p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3
              rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? '⏳ Đang lưu...' : ' Lưu mật khẩu mới'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForceChangePasswordPage;