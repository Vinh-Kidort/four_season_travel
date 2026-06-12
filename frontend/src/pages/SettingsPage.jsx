import React, { useState, useEffect } from 'react';
import axios from '../api/axios';


// ── Biểu tượng Con Mắt (SVG) ────────────────────────────────
const EyeIcon = ({ isVisible }) => {
  return isVisible ? (
    // Icon Mắt Mở
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ) : (
    // Icon Mắt Đóng
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
};

// ── Hàm Validate Mật khẩu ──────────────────────────────
const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('Ít nhất 8 ký tự');
  if (!/[a-zA-Z]/.test(password)) errors.push('Có ít nhất 1 chữ cái');
  if (!/[0-9]/.test(password)) errors.push('Có ít nhất 1 chữ số');
  if (!/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]/.test(password))
    errors.push('Có ít nhất 1 ký tự đặc biệt');
  return errors;
};

// ── Component Chỉ báo độ mạnh mật khẩu ──────────────────────────────
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


function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account'); 
  
  // ── State Dữ liệu Hồ sơ ──
  const [formData, setFormData] = useState({
    name: '',
    email: localStorage.getItem('userEmail') || '',
    phone: '',
    dob: '',
    gender: 'Khác'
  });
  const [message, setMessage] = useState('');

  // ── State Đổi mật khẩu ──
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [pwForm, setPwForm] = useState({
    oldPassword: '', oldPasswordConfirm: '', newPassword: '', confirmNew: ''
  });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState({
    old: false, oldConfirm: false, new: false, confirmNew: false
  });

  // ── Lấy dữ liệu khi Load trang ──
  useEffect(() => {
    // 1. Lấy thông tin user hiện tại
    axios.get('/users/me')
      .then(res => {
        if(res.data) setFormData({...formData, ...res.data});
      })
      .catch(err => console.log("Lỗi tải thông tin user"));

    // 2. Lấy trạng thái Bắt buộc đổi mật khẩu (Quên mật khẩu)
    axios.get('/auth/must-change-password')
      .then(res => {
        setMustChangePassword(res.data.mustChange);
        if(res.data.mustChange) {
            setActiveTab('security'); // Tự động nhảy sang tab bảo mật nếu đang bị ép đổi pass
        }
      })
      .catch(err => console.log("Lỗi tải trạng thái mật khẩu"));
  
  }, []);

  // ── Xử lý Lưu Hồ sơ ──
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    axios.put('/users/me', formData)
      .then(res => {
        setMessage('✅ Cập nhật hồ sơ thành công!');
        localStorage.setItem('userName', formData.name);

        let accounts = JSON.parse(localStorage.getItem('savedAccounts')) || [];
        accounts = accounts.map(acc => {
            if (acc.email === formData.email) return { ...acc, name: formData.name };
            return acc;
        });
        localStorage.setItem('savedAccounts', JSON.stringify(accounts));
        
        setTimeout(() => { window.location.reload(); }, 1000);
      })
      .catch(err => setMessage('❌ Có lỗi xảy ra!'));
  };

  // ── Xử lý Đổi mật khẩu ──
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');

    // Kiểm tra khớp mật khẩu mới
    if (pwForm.newPassword !== pwForm.confirmNew) {
      setPwError('Mật khẩu mới xác nhận không khớp!'); return;
    }
    // Validate độ mạnh
    const errs = validatePassword(pwForm.newPassword);
    if (errs.length > 0) {
      setPwError('Mật khẩu mới chưa đủ mạnh: ' + errs.join(', ')); return;
    }

    setPwLoading(true);
    try {
      await axios.put('/auth/change-password', {
        oldPassword:        pwForm.oldPassword,
        oldPasswordConfirm: pwForm.oldPasswordConfirm,
        newPassword:        pwForm.newPassword,
      });
      setPwSuccess('✅ Đổi mật khẩu thành công!');
      setPwForm({ oldPassword:'', oldPasswordConfirm:'', newPassword:'', confirmNew:'' });
      setMustChangePassword(false); // Đổi xong thì tắt cờ báo động
    } catch (err) {
      setPwError(err.response?.data?.error || 'Lỗi đổi mật khẩu!');
    }
    setPwLoading(false);
  };


  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [deleteError,     setDeleteError]     = useState('');

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await axios.delete('/auth/delete-account');
      // Xóa localStorage và redirect về trang chủ
      localStorage.clear();
      window.location.href = '/';
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Lỗi xóa tài khoản!');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 min-h-[70vh]">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Cài đặt</h1>

      {/* Thanh Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('account')}
          className={`pb-4 px-4 text-lg font-medium transition whitespace-nowrap ${activeTab === 'account' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Thông tin tài khoản
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-4 px-4 text-lg font-medium transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'security' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Mật khẩu & Bảo mật
          {mustChangePassword && <span className="flex w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
        </button>
      </div>

      {/* Nội dung Tab: Thông tin tài khoản */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 animate-fade-in">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Dữ liệu cá nhân</h2>
          {message && <div className="mb-6 p-3 bg-blue-50 text-blue-700 rounded-lg">{message}</div>}

          <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên đầy đủ</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email (Không thể thay đổi)</label>
              <input type="email" value={formData.email} disabled className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div className="pt-4 text-right">
              <button type="submit" className="bg-blue-600 text-white font-bold py-2.5 px-8 rounded-xl hover:bg-blue-700 transition shadow-md">
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Nội dung Tab: Mật khẩu & Bảo mật */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in">
          
          {mustChangePassword && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold">Bạn đang sử dụng mật khẩu tạm thời!</p>
                <p className="text-sm mt-0.5">Vui lòng tạo mật khẩu mới để bảo mật tài khoản của bạn.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              🔐 Đổi mật khẩu
            </h2>

            {pwError && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{pwError}</div>}
            {pwSuccess && <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-lg mb-6">{pwSuccess}</div>}

            <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl">

              {/* CHỈ HIỆN MẬT KHẨU CŨ NẾU KHÔNG PHẢI TRẠNG THÁI QUÊN PASS */}
              {!mustChangePassword && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">Xác nhận mật khẩu hiện tại</p>

                  {[
                    { key: 'oldPassword', label: 'Mật khẩu hiện tại', placeholder: 'Nhập mật khẩu hiện tại' },
                    { key: 'oldPasswordConfirm', label: 'Nhập lại mật khẩu hiện tại', placeholder: 'Nhập lại để xác nhận' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                      <div className="relative">
                        <input
                          type={showPw[field.key] ? 'text' : 'password'}
                          required
                          value={pwForm[field.key]}
                          onChange={e => setPwForm({...pwForm, [field.key]: e.target.value})}
                          placeholder={field.placeholder}
                          className="w-full border rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        
                        {/* NÚT BẤM CON MẮT MỚI */}
                        <button type="button" onClick={() => setShowPw(p => ({...p, [field.key]: !p[field.key]}))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition">
                          <EyeIcon isVisible={showPw[field.key]} />
                        </button>

                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mật khẩu mới */}
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 space-y-4">
                <p className="text-sm font-bold text-blue-700 uppercase tracking-wider">Thiết lập mật khẩu mới</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showPw.new ? 'text' : 'password'}
                      required
                      value={pwForm.newPassword}
                      onChange={e => setPwForm({...pwForm, newPassword: e.target.value})}
                      placeholder="Ít nhất 8 ký tự, số và ký tự đặc biệt"
                      className="w-full border rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" />
                    
                    {/* NÚT BẤM CON MẮT MỚI */}
                    <button type="button" onClick={() => setShowPw(p => ({...p, new: !p.new}))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition">
                      <EyeIcon isVisible={showPw.new} />
                    </button>

                  </div>
                  <PasswordStrength password={pwForm.newPassword} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showPw.confirmNew ? 'text' : 'password'}
                      required
                      value={pwForm.confirmNew}
                      onChange={e => setPwForm({...pwForm, confirmNew: e.target.value})}
                      placeholder="Nhập lại mật khẩu mới"
                      className={`w-full border rounded-lg px-4 py-2.5 pr-10 focus:ring-2 outline-none text-sm bg-white ${
                        pwForm.confirmNew && pwForm.confirmNew !== pwForm.newPassword ? 'border-red-400 focus:ring-red-400' : 'focus:ring-blue-500'
                      }`} />
                    
                    {/* NÚT BẤM CON MẮT MỚI */}
                    <button type="button" onClick={() => setShowPw(p => ({...p, confirmNew: !p.confirmNew}))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition">
                      <EyeIcon isVisible={showPw.confirmNew} />
                    </button>

                  </div>
                  {pwForm.confirmNew && pwForm.confirmNew !== pwForm.newPassword && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">Mật khẩu không khớp</p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={pwLoading}
                  className="bg-blue-600 text-white font-bold px-8 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-md w-full sm:w-auto">
                  {pwLoading ? '⏳ Đang xử lý...' : '🔐 Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          </div>

          {/* ── Vùng nguy hiểm ── */}
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
            <h2 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              ⚠️ Vùng nguy hiểm
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Các hành động dưới đây không thể hoàn tác. Hãy suy nghĩ kỹ trước khi thực hiện.
            </p>
            <div className="border border-red-200 rounded-xl p-4 flex
              justify-between items-center gap-4">
              <div>
                <p className="font-bold text-gray-800">Xóa tài khoản</p>
                <p className="text-gray-400 text-sm mt-0.5">
                  Tài khoản sẽ bị vô hiệu hóa vĩnh viễn. Dữ liệu lịch sử
                  được ẩn danh hóa, không thể khôi phục.
                </p>
              </div>
              <button
                onClick={() => { setShowDeleteModal(true); setDeleteError(''); }}
                className="flex-shrink-0 bg-red-50 text-red-600 border border-red-300
                  font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition text-sm">
                Xóa tài khoản
              </button>
            </div>
          </div>

          {/* ── Modal xác nhận xóa ── */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50
              flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

                {/* Header */}
                <div className="text-center mb-5">
                  <div className="text-5xl mb-3">🗑️</div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Xóa tài khoản?
                  </h3>
                  <p className="text-gray-500 text-sm mt-2">
                    Hành động này <strong>không thể hoàn tác</strong>.
                  </p>
                </div>

                {/* Danh sách hậu quả */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                  <p className="font-bold text-red-700 text-sm mb-2">
                    Điều gì sẽ xảy ra:
                  </p>
                  <ul className="space-y-1.5 text-sm text-red-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">❌</span>
                      Tài khoản bị vô hiệu hóa, không thể đăng nhập lại
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">👤</span>
                      Tên và email được ẩn danh hóa thành "Khách ẩn danh"
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">💾</span>
                      Lịch sử đặt tour và đánh giá được giữ lại (ẩn danh)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">🗑️</span>
                      Danh sách yêu thích bị xóa hoàn toàn
                    </li>
                  </ul>
                </div>

                {/* Cảnh báo nếu có booking */}
                {deleteError && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl
                    p-4 mb-4 flex gap-3">
                    <span className="text-2xl flex-shrink-0">⚠️</span>
                    <p className="text-amber-800 text-sm font-medium">
                      {deleteError}
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setDeleteError(''); }}
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-3
                      rounded-xl hover:bg-gray-200 transition">
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="flex-1 bg-red-600 text-white font-bold py-3
                      rounded-xl hover:bg-red-700 disabled:opacity-50 transition">
                    {deleteLoading ? '⏳ Đang xử lý...' : '🗑️ Xóa tài khoản'}
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