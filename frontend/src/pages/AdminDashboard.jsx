import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { uploadImageToCloudinary } from '../api/uploadImage';

// ============================================================
// CUSTOM DIALOG COMPONENT (Thay thế alert/confirm của trình duyệt)
// ============================================================
function Dialog({ dialog, onConfirm, onCancel }) {
  if (!dialog.show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        {/* Icon */}
        <div className="text-5xl mb-3">{dialog.icon || 'ℹ️'}</div>

        {/* Tiêu đề */}
        {dialog.title && (
          <h3 className="text-lg font-bold text-gray-800 mb-2">{dialog.title}</h3>
        )}

        {/* Nội dung */}
        <p className="text-gray-600 text-sm mb-6">{dialog.message}</p>

        {/* Nút */}
        <div className="flex gap-3 justify-center">
          {/* Nếu là confirm thì hiện cả 2 nút, alert thì chỉ hiện OK */}
          {dialog.type === 'confirm' && (
            <button onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-200">
              {dialog.cancelText || 'Hủy'}
            </button>
          )}
          <button onClick={onConfirm}
            className={`flex-1 font-bold py-2 rounded-lg text-white ${
              dialog.variant === 'danger' ? 'bg-red-500 hover:bg-red-600' :
              dialog.variant === 'success' ? 'bg-green-500 hover:bg-green-600' :
              'bg-blue-500 hover:bg-blue-600'
            }`}>
            {dialog.confirmText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('tours');
  const [filter, setFilter] = useState('pending');
  const [data, setData] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [newLocation, setNewLocation] = useState({
    
    name: '', region: '', bestSeason: '', description: '', images: []
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // ---- DIALOG STATE ----
  const [dialog, setDialog] = useState({ show: false });
  const [dialogResolve, setDialogResolve] = useState(null);

  // Hàm mở dialog — trả về Promise (true = xác nhận, false = hủy)
  const showDialog = (options) => {
    return new Promise((resolve) => {
      setDialog({ show: true, ...options });
      setDialogResolve(() => resolve);
    });
  };

  const handleDialogConfirm = () => {
    setDialog({ show: false });
    if (dialogResolve) dialogResolve(true);
  };

  const handleDialogCancel = () => {
    setDialog({ show: false });
    if (dialogResolve) dialogResolve(false);
  };

  // ---- UPLOAD ẢNH ----
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setNewLocation(prev => ({ ...prev, images: [...prev.images, imageUrl] }));
    } catch {
      showDialog({
        type: 'alert', icon: '❌', variant: 'danger',
        title: 'Lỗi upload',
        message: 'Không thể tải ảnh lên. Vui lòng thử lại!',
        confirmText: 'Đóng'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // ---- LẤY DỮ LIỆU ----
  const fetchAllData = () => {
    setLoading(true);
    axios.get('/users').then(res => setUsers(res.data)).catch(console.log);
    axios.get('/locations').then(res => setLocations(res.data)).catch(console.log);
    axios.get('/bookings/pending').then(res => setBookings(res.data)).catch(console.log);


    if (activeTab === 'locations') {
      setData([]);
      setLoading(false);
      return;
    }

    let endpoint = '';
  if (activeTab === 'tours')
    endpoint = filter === 'pending' ? '/tours/pending' : '/tours/approved';
  else if (activeTab === 'articles')
    endpoint = filter === 'pending' ? '/articles/pending' : '/articles/approved';

    axios.get(endpoint)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchAllData(); }, [activeTab, filter]);

  // ---- CÁC HÀM XỬ LÝ ----
  const handleApprove = async (type, id) => {
    try {
      await axios.put(`/${type}/${id}/approve`);
      setPreviewItem(null);
      fetchAllData();
      await showDialog({
        type: 'alert', icon: '✅', variant: 'success',
        title: 'Duyệt thành công!',
        message: 'Nội dung đã được duyệt và hiển thị trên web.',
        confirmText: 'OK'
      });
    } catch {
      showDialog({
        type: 'alert', icon: '❌', variant: 'danger',
        title: 'Lỗi!', message: 'Có lỗi xảy ra khi duyệt. Thử lại nhé!',
        confirmText: 'Đóng'
      });
    }
  };

  const handleReject = async (type, id) => {
    const confirmed = await showDialog({
      type: 'confirm', icon: '🗑️', variant: 'danger',
      title: 'Ngưng hoạt động / Xóa?',
      message: 'Nội dung này sẽ chuyển sang trạng thái ngưng hoạt động. Bạn chắc chắn chứ?',
      confirmText: 'Đồng ý', cancelText: 'Hủy'
    });
    
    if (!confirmed) return;
    
    try {
      // ✅ ĐÃ SỬA: Dùng axios.delete thay vì axios.put, và xóa chữ '/reject'
      await axios.put(`/${type}/${id}/reject`);
      
      setPreviewItem(null);
      fetchAllData();
      
      await showDialog({
        type: 'alert', icon: '✅', variant: 'success',
        title: 'Đã xử lý!', message: 'Nội dung đã được ngưng hoạt động thành công.',
        confirmText: 'OK'
      });
    } catch (error) {
      console.error("Lỗi xóa:", error);
      showDialog({
        type: 'alert', icon: '❌', variant: 'danger',
        title: 'Lỗi!', message: 'Có lỗi xảy ra khi xử lý. Thử lại nhé!',
        confirmText: 'Đóng'
      });
    }
  };

  const handleDeleteLocation = async (id) => {
    const confirmed = await showDialog({
      type: 'confirm', icon: '⚠️', variant: 'danger',
      title: 'Xóa địa điểm?',
      message: 'Hành động này không thể hoàn tác và có thể gây lỗi cho các Tour đang gắn với địa điểm này!',
      confirmText: 'Xóa', cancelText: 'Hủy'
    });
    if (!confirmed) return;
    try {
      await axios.delete(`/locations/${id}`);
      fetchAllData();
      showDialog({
        type: 'alert', icon: '✅', variant: 'success',
        title: 'Đã xóa!', message: 'Địa điểm đã được xóa khỏi hệ thống.',
        confirmText: 'OK'
      });
    } catch {
      showDialog({
        type: 'alert', icon: '❌', variant: 'danger',
        title: 'Lỗi!', message: 'Không thể xóa địa điểm này.',
        confirmText: 'Đóng'
      });
    }
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/locations', newLocation);
      setNewLocation({ name: '', region: '', bestSeason: '', description: '', images: [] });
      fetchAllData();
      showDialog({
        type: 'alert', icon: '✅', variant: 'success',
        title: 'Tạo thành công!',
        message: `Địa điểm "${newLocation.name}" đã được thêm vào hệ thống.`,
        confirmText: 'OK'
      });
    } catch {
      showDialog({
        type: 'alert', icon: '❌', variant: 'danger',
        title: 'Lỗi!', message: 'Không thể tạo địa điểm. Vui lòng thử lại!',
        confirmText: 'Đóng'
      });
    }
  };

  const handleUpgradeUser = async (id) => {
    const user = users.find(u => u.id === id);
    const confirmed = await showDialog({
      type: 'confirm', icon: '🌟', variant: 'success',
      title: 'Nâng cấp Author?',
      message: `Bạn muốn nâng cấp tài khoản "${user?.email}" lên Author?`,
      confirmText: 'Nâng cấp', cancelText: 'Hủy'
    });
    if (!confirmed) return;
    try {
      await axios.put(`/users/${id}/upgrade`);
      fetchAllData();
      showDialog({
        type: 'alert', icon: '🌟', variant: 'success',
        title: 'Thành công!', message: 'Tài khoản đã được nâng cấp lên Author.',
        confirmText: 'OK'
      });
    } catch {
      showDialog({
        type: 'alert', icon: '❌', variant: 'danger',
        title: 'Lỗi!', message: 'Không thể nâng cấp tài khoản này.',
        confirmText: 'Đóng'
      });
    }
  };

  const handleDeleteUser = async (id, email) => {
    const confirmed = await showDialog({
      type: 'confirm', icon: '🗑️', variant: 'danger',
      title: 'Xóa tài khoản?',
      message: `Bạn chắc chắn muốn xóa tài khoản "${email}"? Hành động này không thể hoàn tác!`,
      confirmText: 'Xóa', cancelText: 'Hủy'
    });
    if (!confirmed) return;
    try {
      await axios.delete(`/users/${id}`);
      fetchAllData();
      showDialog({
        type: 'alert', icon: '✅', variant: 'success',
        title: 'Đã xóa!',
        message: `Tài khoản "${email}" đã bị xóa khỏi hệ thống.`,
        confirmText: 'OK'
      });
    } catch {
      showDialog({
        type: 'alert', icon: '❌', variant: 'danger',
        title: 'Lỗi!', message: 'Không thể xóa tài khoản này. Thử lại nhé!',
        confirmText: 'Đóng'
      });
    }
  };

  const handleConfirmBooking = async (id) => {
  const confirmed = await showDialog({
    type: 'confirm', icon: '💳', variant: 'success',
    title: 'Xác nhận đã nhận cọc?',
    message: 'Bạn xác nhận đã nhận được tiền cọc từ khách hàng?',
    confirmText: 'Xác nhận', cancelText: 'Hủy'
  });
    if (!confirmed) return;
    try {
      await axios.put(`/bookings/${id}/confirm`);
      fetchAllData();
      showDialog({
        type: 'alert', icon: '✅', variant: 'success',
        title: 'Thành công!',
        message: 'Booking đã được xác nhận. Doanh thu đã được cập nhật.',
        confirmText: 'OK'
      });
    } catch {
      showDialog({
        type: 'alert', icon: '❌', variant: 'danger',
        title: 'Lỗi!', message: 'Không thể xác nhận booking.',
        confirmText: 'Đóng'
      });
    }
  };

  const handleSync = async () => {
    try {
      await axios.post('/search/sync');
      showDialog({
        type: 'alert', icon: '✅', variant: 'success',
        title: 'Sync thành công!',
        message: 'Dữ liệu tìm kiếm đã được cập nhật.',
        confirmText: 'OK'
      });
    } catch {
      showDialog({
        type: 'alert', icon: '❌', variant: 'danger',
        title: 'Lỗi sync!',
        message: 'Không thể đồng bộ dữ liệu tìm kiếm.',
        confirmText: 'Đóng'
      });
    }
  };

  const handleResetSearch = async () => {
    const confirmed = await showDialog({
      type: 'confirm', icon: '🔄', variant: 'danger',
      title: 'Reset Meilisearch?',
      message: 'Xóa toàn bộ index cũ và sync lại data mới từ MongoDB.',
      confirmText: 'Reset', cancelText: 'Hủy'
    });
    if (!confirmed) return;

    try {
      await axios.post('/search/sync/reset');
      showDialog({
        type: 'alert', icon: '✅', variant: 'success',
        title: 'Reset thành công!',
        message: 'Dữ liệu tìm kiếm đã được làm mới.',
        confirmText: 'OK'
      });
    } catch {
      showDialog({
        type: 'alert', icon: '❌', variant: 'danger',
        title: 'Lỗi!',
        message: 'Không thể reset. Kiểm tra Meilisearch đang chạy chưa.',
        confirmText: 'Đóng'
      });
    }
  };

  // Thêm nút này vào header AdminDashboard
  <button onClick={handleSync}
    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">
    🔄 Sync tìm kiếm
  </button>

  if (localStorage.getItem('userRole') !== 'ADMIN')
    return <div className="text-center py-20 text-red-500 font-bold text-2xl">🚨 Bạn không có quyền!</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 min-h-[70vh]">

      {/* CUSTOM DIALOG — luôn render ở đây */}
      <Dialog
        dialog={dialog}
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-purple-700">⚙️ Quản lý Hệ thống (Admin)</h1>
        <button onClick={handleResetSearch}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">
          Reset Search
        </button>
      </div>

      {/* ================= TẦNG 1: QUẢN LÝ NỘI DUNG ================= */}
      <div className="bg-white rounded-xl shadow-md border p-6 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Quản lý Nội dung (Web Content)</h2>

        {/* TABS */}
        <div className="flex border-b mb-6 space-x-6">
          <button onClick={() => { setActiveTab('tours'); setFilter('pending'); }}
            className={`pb-3 font-bold text-lg ${activeTab === 'tours' ? 'border-b-4 border-purple-600 text-purple-700' : 'text-gray-500'}`}>
            🧳 Duyệt Tour
          </button>
          <button onClick={() => { setActiveTab('articles'); setFilter('pending'); }}
            className={`pb-3 font-bold text-lg ${activeTab === 'articles' ? 'border-b-4 border-purple-600 text-purple-700' : 'text-gray-500'}`}>
            📖 Duyệt Bài Viết
          </button>
          <button onClick={() => setActiveTab('locations')}
            className={`pb-3 font-bold text-lg ${activeTab === 'locations' ? 'border-b-4 border-purple-600 text-purple-700' : 'text-gray-500'}`}>
            📍 Quản lý Địa điểm
          </button>
        </div>

        {/* BỘ LỌC */}
        {activeTab !== 'locations' && (
          <div className="flex gap-4 mb-4">
            <button onClick={() => setFilter('pending')}
              className={`px-4 py-1 rounded-full text-sm font-bold ${filter === 'pending' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
              Đang chờ duyệt
            </button>
            <button onClick={() => setFilter('approved')}
              className={`px-4 py-1 rounded-full text-sm font-bold ${filter === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              Đã duyệt (Trên Web)
            </button>
          </div>
        )}

        {/* NỘI DUNG */}
        {activeTab === 'locations' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form thêm địa điểm */}
            <div className="lg:col-span-1 bg-gray-50 p-6 rounded-xl border">
              <h3 className="font-bold text-lg mb-4">Thêm Địa điểm mới</h3>
              <form onSubmit={handleCreateLocation} className="space-y-4">
                <input type="text" placeholder="Tên địa điểm (VD: Đà Lạt)" required
                  value={newLocation.name}
                  onChange={e => setNewLocation({ ...newLocation, name: e.target.value })}
                  className="w-full border p-2 rounded" />
                <select required
                  value={newLocation.region}
                  onChange={e => setNewLocation({ ...newLocation, region: e.target.value })}
                  className="w-full border p-2 rounded bg-white">
                  <option value="">-- Chọn vùng miền --</option>
                  <option value="Miền Bắc">📍 Miền Bắc</option>
                  <option value="Miền Trung">📍 Miền Trung</option>
                  <option value="Miền Nam">📍 Miền Nam</option>
                </select>
                <input type="text" placeholder="Mùa đẹp nhất (VD: Mùa Thu)" required
                  value={newLocation.bestSeason}
                  onChange={e => setNewLocation({ ...newLocation, bestSeason: e.target.value })}
                  className="w-full border p-2 rounded" />

                {/* ── Upload ảnh ── */}
                <div className="border border-dashed border-gray-400 p-4 rounded bg-white">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Tải ảnh lên
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    Ảnh đầu tiên = ảnh bìa chính. Các ảnh sau hiện trong gallery.
                  </p>
                  <input type="file" accept="image/*" onChange={handleImageChange}
                    disabled={uploadingImage} className="w-full text-sm" />
                  {uploadingImage && (
                    <p className="text-blue-500 text-sm mt-2">⏳ Đang tải ảnh...</p>
                  )}

                  {/* Preview ảnh đã upload */}
                  {newLocation.images.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {/* Ảnh bìa */}
                      <p className="text-xs font-bold text-gray-500 uppercase">Ảnh bìa</p>
                      <div className="relative group inline-block">
                        <img src={newLocation.images[0]} alt="cover"
                          className="h-24 w-full object-cover rounded-lg shadow border-2 border-blue-400" />
                        <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                          Bìa
                        </span>
                        <button type="button"
                          onClick={() => setNewLocation(prev => ({
                            ...prev, images: prev.images.filter((_, i) => i !== 0)
                          }))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full
                            w-5 h-5 text-xs flex items-center justify-center
                            opacity-0 group-hover:opacity-100 transition">×</button>
                      </div>

                      {/* Ảnh gallery */}
                      {newLocation.images.length > 1 && (
                        <>
                          <p className="text-xs font-bold text-gray-500 uppercase mt-2">Gallery</p>
                          <div className="flex gap-2 flex-wrap">
                            {newLocation.images.slice(1).map((img, idx) => (
                              <div key={idx} className="relative group">
                                <img src={img} alt={`gallery-${idx}`}
                                  className="h-16 w-16 object-cover rounded shadow" />
                                <button type="button"
                                  onClick={() => setNewLocation(prev => ({
                                    ...prev,
                                    images: prev.images.filter((_, i) => i !== idx + 1)
                                  }))}
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white
                                    rounded-full w-4 h-4 text-xs flex items-center justify-center
                                    opacity-0 group-hover:opacity-100 transition">×</button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <textarea placeholder="Mô tả..." rows="3" required
                  value={newLocation.description}
                  onChange={e => setNewLocation({ ...newLocation, description: e.target.value })}
                  className="w-full border p-2 rounded" />
                <button type="submit"
                  className="w-full bg-purple-600 text-white font-bold py-2 rounded hover:bg-purple-700">
                  Tạo Địa điểm
                </button>
              </form>
            </div>

            {/* Bảng danh sách */}
            <div className="lg:col-span-2">
              <table className="w-full text-left border-collapse border">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="p-3">Ảnh</th>
                    <th className="p-3">Tên Địa điểm</th>
                    <th className="p-3">Vùng miền</th>
                    <th className="p-3">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {['Miền Bắc', 'Miền Trung', 'Miền Nam'].map(region => {
                    const regionLocs = locations
                      .filter(l => l.region === region)
                      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

                    if (regionLocs.length === 0) return null;

                    return (
                      <React.Fragment key={region}>
                        {/* Header vùng */}
                        <tr className="bg-purple-50">
                          <td colSpan={4}
                            className="px-3 py-2 font-bold text-purple-700 text-sm">
                            📍 {region}
                            <span className="ml-2 font-normal text-purple-400">
                              ({regionLocs.length} địa điểm)
                            </span>
                          </td>
                        </tr>
                        {/* Các địa điểm trong vùng */}
                        {regionLocs.map(loc => (
                          <tr key={loc.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              {loc.images && loc.images[0] ? (
                                <img src={loc.images[0]} alt={loc.name}
                                  className="w-12 h-12 object-cover rounded-lg" />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg
                                  flex items-center justify-center text-xl">
                                  🏞️
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-bold">{loc.name}</td>
                            <td className="p-3 text-gray-500 text-sm">{loc.region}</td>
                            <td className="p-3">
                              <button onClick={() => handleDeleteLocation(loc.id)}
                                className="text-red-500 font-bold hover:underline text-sm">
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}

                  {/* Địa điểm không thuộc 3 vùng trên */}
                  {locations.filter(l =>
                    !['Miền Bắc', 'Miền Trung', 'Miền Nam'].includes(l.region)
                  ).length > 0 && (
                    <React.Fragment>
                      <tr className="bg-gray-100">
                        <td colSpan={4}
                          className="px-3 py-2 font-bold text-gray-500 text-sm">
                          📍 Khác
                        </td>
                      </tr>
                      {locations
                        .filter(l =>
                          !['Miền Bắc', 'Miền Trung', 'Miền Nam'].includes(l.region))
                        .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
                        .map(loc => (
                          <tr key={loc.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              {loc.images?.[0] ? (
                                <img src={loc.images[0]} alt={loc.name}
                                  className="w-12 h-12 object-cover rounded-lg" />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg
                                  flex items-center justify-center text-xl">🏞️</div>
                              )}
                            </td>
                            <td className="p-3 font-bold">{loc.name}</td>
                            <td className="p-3 text-gray-500 text-sm">{loc.region}</td>
                            <td className="p-3">
                              <button onClick={() => handleDeleteLocation(loc.id)}
                                className="text-red-500 font-bold hover:underline text-sm">
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse border mt-4">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                <th className="p-3">{activeTab === 'tours' ? 'Tên Tour' : 'Tiêu đề'}</th>
                <th className="p-3">Người đăng</th>
                <th className="p-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-bold text-blue-600 cursor-pointer hover:underline"
                    onClick={() => setPreviewItem(item)}>
                    {activeTab === 'tours' ? item.name : item.title}
                  </td>
                  <td className="p-3 text-gray-600">{item.author}</td>
                  <td className="p-3 flex justify-center gap-2">
                    <button onClick={() => setPreviewItem(item)}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-medium">
                      Xem trước & Quyết định
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= TẦNG 2: QUẢN LÝ TÀI KHOẢN ================= */}
        <div className="bg-white rounded-xl shadow-md border p-6">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Quản lý Tài khoản (Users)</h2>
          <p className="text-gray-500 text-sm mb-6">
            Tổng cộng: <span className="font-bold text-gray-700">{users.length}</span> tài khoản
          </p>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Họ Tên</th>
                <th className="px-4 py-3">Quyền hạn</th>
                <th className="px-4 py-3 text-center w-40">Nâng cấp</th>
                <th className="px-4 py-3 text-center w-32">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b hover:bg-gray-50 align-middle">

                  {/* Email */}
                  <td className="px-4 py-3 font-medium text-gray-800">{user.email}</td>

                  {/* Tên */}
                  <td className="px-4 py-3 text-gray-600">{user.name}</td>

                  {/* Role badge */}
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.role === 'ADMIN'  ? 'bg-purple-100 text-purple-700' :
                      user.role === 'AUTHOR' ? 'bg-green-100 text-green-700' :
                                              'bg-gray-100 text-gray-600'
                    }`}>
                      {user.role === 'ADMIN'  ? '👑 ADMIN'  :
                      user.role === 'AUTHOR' ? '✍️ AUTHOR' : '👤 USER'}
                    </span>
                  </td>

                  {/* Cột Nâng cấp — riêng biệt */}
                  <td className="px-4 py-3 text-center">
                    {user.role === 'USER' ? (
                      <button
                        onClick={() => handleUpgradeUser(user.id)}
                        className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 whitespace-nowrap">
                        ⬆️ Lên Author
                      </button>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>

                  {/* Cột Xóa — riêng biệt */}
                  <td className="px-4 py-3 text-center">
                    {user.role !== 'ADMIN' ? (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-500 hover:text-white transition whitespace-nowrap">
                        Xóa
                      </button>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      
      {/* ================= TẦNG 3: XÁC NHẬN BOOKING ================= */}
      <div className="bg-white rounded-xl shadow-md border p-6 mt-8">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Xác nhận Booking (Tiền cọc)</h2>
        <p className="text-gray-500 text-sm mb-6">
          Các đơn đặt tour chờ xác nhận nhận tiền cọc —
          <span className="font-bold text-yellow-600 ml-1">{bookings.length} đơn</span>
        </p>

        {bookings.length === 0 ? (
          <p className="text-center text-gray-400 py-8 border border-dashed rounded-xl">
            ✅ Không có đơn nào chờ xác nhận.
          </p>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 text-xs uppercase">
                <th className="px-4 py-3">Mã đặt tour</th>
                <th className="px-4 py-3">Tour</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Số người</th>
                <th className="px-4 py-3 text-right">Tiền cọc</th>
                <th className="px-4 py-3 text-center">Xác nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-blue-600 font-bold">{b.bookingCode}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-[180px] truncate">{b.tourName}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <p>{b.customerName}</p>
                    <p className="text-xs text-gray-400">{b.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-center">{b.numberOfPeople} người</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">
                    {b.depositAmount?.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleConfirmBooking(b.id)}
                      className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition whitespace-nowrap">
                      ✅ Đã nhận cọc
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


      {/* ================= MODAL PREVIEW ================= */}
      {previewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-8 py-4 flex justify-between items-center z-10">
              <div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${activeTab === 'tours' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {activeTab === 'tours' ? '🧳 Tour du lịch' : '📖 Bài viết'}
                </span>
                <h2 className="text-xl font-bold text-gray-800 mt-1">
                  {activeTab === 'tours' ? previewItem.name : previewItem.title}
                </h2>
                <p className="text-sm text-gray-500">
                  Đăng bởi: <span className="font-medium text-gray-700">{previewItem.author}</span>
                </p>
              </div>
              <button onClick={() => setPreviewItem(null)}
                className="text-gray-400 hover:text-red-500 text-3xl font-bold leading-none ml-4">
                &times;
              </button>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* TOUR */}
              {activeTab === 'tours' && (
                <>
                  {previewItem.images?.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {previewItem.images.map((img, idx) => (
                        <div key={idx} className="flex-shrink-0">
                          <img
                            src={typeof img === 'string' ? img : img.url}  // ← handle cả 2 format
                            alt={typeof img === 'string' ? `tour-${idx}` : (img.caption || `tour-${idx}`)}
                            className="h-40 w-56 object-cover rounded-lg shadow"
                          />
                          {typeof img !== 'string' && img.caption && (
                            <p className="text-xs text-gray-400 text-center mt-1 italic">{img.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-700 mb-3">📋 Thông tin chung</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">Giá tiền</p>
                        <p className="font-bold text-green-700">{previewItem.price?.toLocaleString('vi-VN')}đ</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">Thời gian</p>
                        <p className="font-bold text-blue-700">{previewItem.duration}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">Ngày khởi hành</p>
                        <p className="font-bold text-orange-700">{previewItem.departureDate}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">Số lượng khách</p>
                        <p className="font-bold text-purple-700">{previewItem.maxSlots} người</p>
                      </div>
                    </div>
                  </div>
                  {previewItem.locationIds?.length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-700 mb-2">📍 Địa điểm tham quan</h3>
                      <div className="flex flex-wrap gap-2">
                        {previewItem.locationIds.map((locId, idx) => {
                          const loc = locations.find(l => l.id === locId);
                          return (
                            <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                              📍 {loc ? loc.name : locId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-700 mb-2">🗓️ Lịch trình chi tiết</h3>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {previewItem.itinerary || 'Chưa có lịch trình'}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-right">Ngày tạo: {previewItem.createdAt}</p>
                </>
              )}

              {/* BÀI VIẾT */}
              {activeTab === 'articles' && (
                <>
                  {previewItem.imageUrl && (
                    <div>
                      <h3 className="font-bold text-gray-700 mb-2">🖼️ Ảnh bìa</h3>
                      <img src={previewItem.imageUrl} alt="cover"
                        className="w-full h-56 object-cover rounded-lg shadow" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-700 mb-3">📋 Thông tin bài viết</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Địa điểm gắn với</p>
                        <p className="font-bold text-blue-700">
                          {(() => {
                            const loc = locations.find(l => l.id === previewItem.locationId);
                            return loc ? `📍 ${loc.name}` : 'Chưa gắn địa điểm';
                          })()}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Ngày đăng</p>
                        <p className="font-bold text-gray-700">{previewItem.createdAt}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700 mb-2">📝 Nội dung bài viết</h3>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {previewItem.content || 'Chưa có nội dung'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer nút hành động */}
            <div className="sticky bottom-0 bg-white border-t px-8 py-4 flex gap-4 justify-end">
              <button onClick={() => setPreviewItem(null)}
                className="bg-gray-100 text-gray-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-200">
                Đóng
              </button>
              <button onClick={() => handleReject(activeTab, previewItem.id)}
                className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-600">
                🗑️ Từ chối / Xóa
              </button>
              {filter === 'pending' && (
                <button onClick={() => handleApprove(activeTab, previewItem.id)}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600">
                  ✅ Duyệt lên Web
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;