import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';

// ── Component bảng dùng chung cho Tour và Article ─────────────
function ContentTable({ items, type, onDelete, onManageDep }) {
  if (items.length === 0) {
    return (
      <p className="text-gray-400 text-center py-8">
        {type === 'tours' ? 'Bạn chưa tạo Tour nào.' : 'Bạn chưa viết bài nào.'}
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b text-gray-500 text-xs uppercase tracking-wide">
          <th className="px-4 py-3 text-left w-[40%]">
            {type === 'tours' ? 'Tên Tour' : 'Tiêu đề'}
          </th>
          <th className="px-4 py-3 text-left w-[20%]">Ngày tạo</th>
          <th className="px-4 py-3 text-center w-[25%]">Trạng thái</th>
          <th className="px-4 py-3 text-center w-[15%]">Thao tác</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {items.map(item => {
          const title = type === 'tours' ? item.name : item.title;
          const detailUrl = type === 'tours' ? `/tours/${item.id}` : `/articles/${item.id}`;

          return (
            <tr key={item.id} className="hover:bg-gray-50 transition">
              {/* Cột tiêu đề — dài thì ... không xuống hàng */}
              <td className="px-4 py-3 max-w-0">
                <p className="font-medium text-gray-800 truncate" title={title}>
                  {title}
                </p>
              </td>

              {/* Cột ngày tạo */}
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                {item.createdAt || '—'}
              </td>

              {/* Cột trạng thái */}
              <td className="px-4 py-3 text-center">
                {item.isRejected ? (
                  <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                    ❌ Bị từ chối
                  </span>
                ) : item.isApproved ? (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 border border-green-200 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                    ✅ Đã duyệt
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-600 border border-yellow-200 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                    ⏳ Chờ duyệt
                  </span>
                )}
              </td>

              {/* Cột thao tác */}
              <td className="px-4 py-3 text-center">
                {item.isApproved && !item.isRejected ? (
                  <>
                    <Link
                      to={detailUrl}
                      className="inline-block bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700 transition whitespace-nowrap"
                    >
                      🌐 Xem Web
                    </Link>

                    {type === 'tours' && item.isApproved && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onManageDep(item); }}
                        className="inline-block bg-green-600 text-white px-3 py-1 rounded-lg
                          text-xs font-bold hover:bg-green-700 transition whitespace-nowrap ml-1">
                        📅 Ngày KH
                      </button>
                    )}

                    
                  </>
                ) : !item.isApproved && !item.isRejected ? (
                  // Chờ duyệt → nút xóa bản nháp
                  <button
                    onClick={() => onDelete(type, item.id)}
                    className="text-red-400 hover:text-red-600 text-xs font-bold underline transition whitespace-nowrap"
                  >
                    🗑️ Xóa nháp
                  </button>
                ) : (
                  // Bị từ chối → không có thao tác
                  <span className="text-gray-300 text-xs">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── AuthorDashboard ───────────────────────────────────────────
function AuthorDashboard() {
  const [myTours, setMyTours] = useState([]);
  const [myArticles, setMyArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [managingTour,  setManagingTour]  = useState(null); // tour đang quản lý
  const [departures,    setDepartures]    = useState([]);
  const [showDepModal,  setShowDepModal]  = useState(false);
  const [newDep, setNewDep] = useState({
    startDate: '', endDate: '', price: '', maxSlots: '', note: ''
  });

  // Thống kê nhanh
  const stats = (items) => ({
    total:    items.length,
    approved: items.filter(i => i.isApproved && !i.isRejected).length,
    pending:  items.filter(i => !i.isApproved && !i.isRejected).length,
    rejected: items.filter(i => i.isRejected).length,
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get('/tours/my-tours'),
      axios.get('/articles/my-articles')
    ])
    .then(([toursRes, articlesRes]) => {
      setMyTours(toursRes.data);
      setMyArticles(articlesRes.data);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAuthorDelete = async (type, id) => {
    if (!window.confirm('Xóa bản nháp này? Không thể hoàn tác!')) return;
    try {
      await axios.delete(`/${type}/${id}/author-delete`);
      fetchData(); // Reload không cần refresh trang
    } catch (error) {
      alert('❌ Lỗi: ' + (error.response?.data || 'Không xác định'));
    }
  };

  if (localStorage.getItem('userRole') !== 'AUTHOR') {
    return (
      <div className="text-center py-20 text-red-500 font-bold text-2xl">
        🚨 Bạn không có quyền truy cập trang này!
      </div>
    );
  }

  const openDepartureManager = async (tour) => {
    setManagingTour(tour);
    const res = await axios.get(`/tours/${tour.id}/departures`);
    setDepartures(res.data || []);
    setShowDepModal(true);
  };

  const handleAddDeparture = async () => {
    if (!newDep.startDate || !newDep.endDate || !newDep.price || !newDep.maxSlots) {
      alert('Vui lòng điền đủ thông tin!'); return;
    }

    // Parse số lượng chuẩn xác (Hệ cơ số 10)
    const slots = parseInt(newDep.maxSlots, 10);

    try {
      const res = await axios.post(`/tours/${managingTour.id}/departures`, {
        ...newDep,
        price: parseFloat(String(newDep.price).replace(/\./g, '')),
        maxSlots: slots,
        availableSlots: slots, // ĐÃ THÊM: Ép Backend nhận đúng số chỗ trống ban đầu bằng maxSlots
      });
      setDepartures(res.data);
      setNewDep({ startDate: '', endDate: '', price: '', maxSlots: '', note: '' });
    } catch (error) {
      alert('❌ Lỗi khi thêm ngày khởi hành: ' + (error.response?.data || 'Không xác định'));
    }
  };

  const handleToggleDep = async (depId) => {
    const res = await axios.put(`/tours/${managingTour.id}/departures/${depId}/toggle`);
    setDepartures(res.data);
  };

  const handleDeleteDep = async (depId) => {
    if (!window.confirm('Xóa ngày khởi hành này?')) return;
    const res = await axios.delete(`/tours/${managingTour.id}/departures/${depId}`);
    setDepartures(res.data);
  };

  const tourStats    = stats(myTours);
  const articleStats = stats(myArticles);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 min-h-[70vh]">
      <h1 className="text-3xl font-bold text-green-700 mb-8">✍️ Quản lý Nội dung (Author)</h1>

      {/* ── Nút tạo mới ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="text-4xl">🧳</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-800">Tạo Tour Du lịch Mới</h2>
            <p className="text-gray-400 text-sm">Đăng tải thông tin, lịch trình và giá vé.</p>
          </div>
          <Link to="/author/create-tour"
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition text-sm whitespace-nowrap">
            + Viết Tour Mới
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="text-4xl">📖</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-800">Viết Cẩm nang (Article)</h2>
            <p className="text-gray-400 text-sm">Chia sẻ kinh nghiệm du lịch, đánh giá địa điểm.</p>
          </div>
          <Link to="/author/create-article"
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition text-sm whitespace-nowrap">
            + Viết Bài Mới
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải dữ liệu...</div>
      ) : (
        <div className="space-y-8">

          {/* ── Bảng Tour ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header + thống kê */}
            <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-800">🧳 Tour tôi đã lên</h2>
              <div className="flex gap-3 text-xs font-medium">
                <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                  ✅ {tourStats.approved} duyệt
                </span>
                <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">
                  ⏳ {tourStats.pending} chờ
                </span>
                <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                  ❌ {tourStats.rejected} từ chối
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <ContentTable
                items={myTours}
                type="tours"
                onDelete={handleAuthorDelete}
                onManageDep={openDepartureManager}
              />
            </div>
          </div>

          {/* ── Bảng Article ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header + thống kê */}
            <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-800">📖 Bài viết của tôi</h2>
              <div className="flex gap-3 text-xs font-medium">
                <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                  ✅ {articleStats.approved} duyệt
                </span>
                <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">
                  ⏳ {articleStats.pending} chờ
                </span>
                <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                  ❌ {articleStats.rejected} từ chối
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <ContentTable
                items={myArticles}
                type="articles"
                onDelete={handleAuthorDelete}
                onManageDep={openDepartureManager}
              />
            </div>
          </div>

        </div>
      )}

      {showDepModal && managingTour && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center
          justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full
            max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex
              justify-between items-center">
              <div>
                <h2 className="font-bold text-lg text-gray-800">
                  📅 Quản lý ngày khởi hành
                </h2>
                <p className="text-sm text-gray-500">{managingTour.name}</p>
              </div>
              <button onClick={() => setShowDepModal(false)}
                className="text-gray-400 hover:text-red-500 text-2xl">×</button>
            </div>

            <div className="p-6 space-y-6">

              {/* Form thêm departure mới */}
              <div className="bg-gray-50 rounded-xl p-4 border">
                <h3 className="font-bold text-gray-700 mb-3">+ Thêm ngày mới</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Ngày bắt đầu *
                    </label>
                    <input type="date" value={newDep.startDate}
                      onChange={e => setNewDep({...newDep, startDate: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none
                        focus:ring-2 focus:ring-green-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Ngày kết thúc *
                    </label>
                    <input type="date" value={newDep.endDate}
                      onChange={e => setNewDep({...newDep, endDate: e.target.value})}
                      min={newDep.startDate}
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none
                        focus:ring-2 focus:ring-green-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Giá (VNĐ) *
                    </label>
                    <input type="text" value={newDep.price}
                      onChange={e => setNewDep({...newDep, price: e.target.value})}
                      placeholder="VD: 2500000"
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none
                        focus:ring-2 focus:ring-green-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Số chỗ tối đa *
                    </label>
                    <input type="number" value={newDep.maxSlots} min="1"
                      onChange={e => setNewDep({...newDep, maxSlots: e.target.value})}
                      placeholder="VD: 20"
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none
                        focus:ring-2 focus:ring-green-400" />
                  </div>
                </div>
                <input type="text" value={newDep.note}
                  onChange={e => setNewDep({...newDep, note: e.target.value})}
                  placeholder="Ghi chú (tùy chọn)"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none
                    focus:ring-2 focus:ring-green-400 mb-3" />

                {/* Preview tổng ngày */}
                {newDep.startDate && newDep.endDate && (
                  <p className="text-xs text-green-600 mb-3">
                    📅 {Math.abs(
                      (new Date(newDep.endDate) - new Date(newDep.startDate))
                      / (1000 * 60 * 60 * 24)
                    ) + 1} ngày
                  </p>
                )}

                <button onClick={handleAddDeparture}
                  className="w-full bg-green-600 text-white font-bold py-2 rounded-lg
                    hover:bg-green-700 transition text-sm">
                  + Thêm ngày khởi hành
                </button>
              </div>

              {/* Danh sách departures */}
              <div>
                <h3 className="font-bold text-gray-700 mb-3">
                  Danh sách ({departures.length})
                </h3>
                {departures.length === 0 ? (
                  <p className="text-gray-400 text-center py-4 border border-dashed rounded-xl">
                    Chưa có ngày khởi hành nào
                  </p>
                ) : (
                  <div className="space-y-3">
                    {departures
                      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                      .map(dep => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const startDate = new Date(dep.startDate);
                        startDate.setHours(0, 0, 0, 0);
                        const isPast = startDate < today; // ← Kiểm tra đã qua chưa

                        return (
                          <div key={dep.id}
                            className={`border rounded-xl p-4 flex justify-between
                              items-center ${
                              isPast
                                ? 'bg-gray-50 border-gray-200 opacity-60'  // ← Mờ nếu đã qua
                                : dep.status === 'suspended'
                                ? 'bg-red-50 border-red-200 opacity-70'
                                : 'bg-white border-gray-200'
                            }`}>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-gray-800 text-sm">
                                  {new Date(dep.startDate).toLocaleDateString('vi-VN')}
                                  {' → '}
                                  {new Date(dep.endDate).toLocaleDateString('vi-VN')}
                                  <span className="ml-2 font-normal text-gray-400 text-xs">
                                    ({dep.totalDays} ngày)
                                  </span>
                                </p>
                                {/* Badge trạng thái */}
                                {isPast ? (
                                  <span className="text-xs bg-gray-200 text-gray-500
                                    px-2 py-0.5 rounded-full">
                                    Đã qua
                                  </span>
                                ) : dep.status === 'suspended' ? (
                                  <span className="text-xs bg-red-100 text-red-600
                                    px-2 py-0.5 rounded-full">
                                    Tạm ngưng
                                  </span>
                                ) : (
                                  <span className="text-xs bg-green-100 text-green-600
                                    px-2 py-0.5 rounded-full">
                                    Đang mở
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-blue-600 font-bold mt-0.5">
                                {dep.price?.toLocaleString('vi-VN')}đ / khách
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                👥 {dep.availableSlots}/{dep.maxSlots} chỗ còn
                              </p>
                              {dep.note && (
                                <p className="text-xs text-orange-500 mt-1">⚠️ {dep.note}</p>
                              )}
                            </div>

                            {/* Chỉ hiện nút nếu chưa qua */}
                            {!isPast && (
                              <div className="flex flex-col gap-2 ml-4">
                                <button onClick={() => handleToggleDep(dep.id)}
                                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                                    dep.status === 'active'
                                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}>
                                  {dep.status === 'active' ? '⏸ Tạm ngưng' : '▶ Kích hoạt'}
                                </button>
                                <button onClick={() => handleDeleteDep(dep.id)}
                                  className="text-xs font-bold px-3 py-1.5 rounded-lg
                                    bg-red-50 text-red-500 hover:bg-red-100 transition">
                                  🗑 Xóa
                                </button>
                              </div>
                            )}

                            {/* Departure đã qua → chỉ cho xóa */}
                            {isPast && (
                              <button onClick={() => handleDeleteDep(dep.id)}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg
                                  bg-gray-100 text-gray-400 hover:bg-red-50
                                  hover:text-red-500 transition ml-4">
                                🗑 Xóa
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AuthorDashboard;