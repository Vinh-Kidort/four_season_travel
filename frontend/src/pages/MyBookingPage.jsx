import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

// ── Badge trạng thái ─────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending_payment: { label: '⏳ Chờ thanh toán', color: 'bg-yellow-100 text-yellow-700' },
    confirmed:       { label: '✅ Đã xác nhận',    color: 'bg-blue-100 text-blue-700'   },
    checked_in:      { label: '🎯 Đã tham gia',    color: 'bg-green-100 text-green-700' },
    no_show:         { label: '❌ Không tham gia',  color: 'bg-red-100 text-red-700'    },
    cancelled:       { label: '🚫 Đã hủy',         color: 'bg-gray-100 text-gray-600'  },
  };
  const s = map[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.color}`}>
      {s.label}
    </span>
  );
}

// ── Star Rating Component ────────────────────────────────────
function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-2xl transition-transform ${
            !readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
          }`}>
          <span className={(hover || value) >= star
            ? 'text-yellow-400' : 'text-gray-200'}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Modal hủy booking ────────────────────────────────────────
function CancelModal({ booking, onConfirm, onClose }) {
  const [reason, setReason] = useState('');

  const days = (() => {
    try {
      if (booking.departureInfo) {
        const dateStr = booking.departureInfo.split(' → ')[0];
        const start   = new Date(dateStr);
        const today   = new Date();
        return Math.ceil((start - today) / (1000 * 60 * 60 * 24));
      }
    } catch {}
    return null;
  })();

  const refundPolicy = days === null    ? null
    : days >= 7  ? { text: 'Hoàn 100% tiền cọc', color: 'text-green-600',
        amount: booking.depositAmount }
    : days >= 3  ? { text: 'Hoàn 50% tiền cọc',  color: 'text-yellow-600',
        amount: booking.depositAmount * 0.5 }
    : { text: 'Mất 100% tiền cọc (sát ngày)',     color: 'text-red-600',
        amount: 0 };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center
      justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">🚫 Hủy đặt tour</h3>
        <p className="text-gray-500 text-sm mb-4">
          Mã booking: <strong>{booking.bookingCode}</strong>
        </p>

        {/* Chính sách hoàn tiền */}
        {refundPolicy && (
          <div className={`border rounded-xl p-4 mb-4 ${
            refundPolicy.amount > 0
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`font-bold text-sm ${refundPolicy.color}`}>
              💰 {refundPolicy.text}
            </p>
            {refundPolicy.amount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Số tiền hoàn:{' '}
                <strong>{refundPolicy.amount.toLocaleString('vi-VN')}đ</strong>
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Ngày khởi hành còn {days} ngày nữa
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lý do hủy (tùy chọn)
          </label>
          <textarea rows="3" value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Nhập lý do hủy..."
            className="w-full border rounded-lg px-3 py-2 text-sm
              focus:ring-2 focus:ring-red-400 outline-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-2.5
              rounded-xl hover:bg-gray-200 transition">
            Giữ đặt chỗ
          </button>
          <button onClick={() => onConfirm(reason)}
            className="flex-1 bg-red-500 text-white font-bold py-2.5
              rounded-xl hover:bg-red-600 transition">
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal rating ─────────────────────────────────────────────
function RatingModal({ booking, onConfirm, onClose }) {
  const [rating, setRating]     = useState(5);
  const [review, setReview]     = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onConfirm(rating, review);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center
      justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-1">
          ⭐ Đánh giá tour
        </h3>
        <p className="text-gray-500 text-sm mb-5">{booking.tourName}</p>

        <div className="flex justify-center mb-4">
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div className="text-center text-sm text-gray-500 mb-4">
          {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời!'][rating]}
        </div>

        <textarea rows="4" value={review}
          onChange={e => setReview(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn..."
          className="w-full border rounded-xl px-4 py-3 text-sm
            focus:ring-2 focus:ring-yellow-400 outline-none mb-4" />

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-2.5
              rounded-xl hover:bg-gray-200 transition">
            Để sau
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-yellow-400 text-white font-bold py-2.5
              rounded-xl hover:bg-yellow-500 disabled:opacity-50 transition">
            {loading ? '⏳...' : '📤 Gửi đánh giá'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function MyBookingsPage() {
  const navigate             = useNavigate();
  const [bookings, setBookings]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [ratingTarget, setRatingTarget] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    axios.get('/bookings/my-bookings')
      .then(res => setBookings(res.data))
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'all',       label: 'Tất cả' },
    { key: 'confirmed', label: '✅ Đã xác nhận' },
    { key: 'checked_in',label: '🎯 Đã tham gia' },
    { key: 'cancelled', label: '🚫 Đã hủy' },
  ];

  const filtered = activeTab === 'all'
    ? bookings
    : bookings.filter(b => b.status === activeTab);

  // Hủy booking
  const handleCancel = async (reason) => {
    try {
      const res = await axios.put(
        `/bookings/${cancelTarget.id}/cancel-by-user`,
        { reason });
      setBookings(prev =>
        prev.map(b => b.id === cancelTarget.id ? res.data : b));
      setCancelTarget(null);
    } catch (err) {
      alert('❌ ' + (err.response?.data || 'Lỗi hủy booking!'));
    }
  };

  // Rating
  const handleRate = async (rating, reviewText) => {
    try {
      const res = await axios.post(
        `/bookings/${ratingTarget.id}/rate`,
        { rating, reviewText });
      setBookings(prev =>
        prev.map(b => b.id === ratingTarget.id ? res.data : b));
      setRatingTarget(null);
    } catch (err) {
      alert('❌ ' + (err.response?.data || 'Lỗi đánh giá!'));
    }
  };

  // Tính ngày còn lại đến khởi hành
  const getDaysLeft = (b) => {
    try {
      const dateStr = b.departureInfo?.split(' → ')[0];
      if (!dateStr) return null;
      const diff = Math.ceil(
        (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
      return diff;
    } catch { return null; }
  };

  if (loading) return (
    <div className="text-center py-20 text-gray-400">Đang tải...</div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        🎫 Lịch sử đặt tour
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap
              border-b-2 transition ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
            <span className="ml-1 text-xs text-gray-400">
              ({tab.key === 'all'
                ? bookings.length
                : bookings.filter(b => b.status === tab.key).length})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">🎫</p>
          <p>Chưa có booking nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(b => {
            const daysLeft = getDaysLeft(b);
            const canCancel = ['confirmed'].includes(b.status);
            const canRate   = b.status === 'checked_in' && !b.rating;

            return (
              <div key={b.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {b.tourName}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Mã: <span className="font-mono font-bold text-gray-600">
                        {b.bookingCode}
                      </span>
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Ngày đặt</p>
                    <p className="font-medium text-gray-700 mt-0.5">
                      {b.createdAt
                        ? new Date(b.createdAt).toLocaleDateString('vi-VN')
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Khởi hành</p>
                    <p className="font-medium text-gray-700 mt-0.5">
                      {b.departureInfo || '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Số người</p>
                    <p className="font-medium text-gray-700 mt-0.5">
                      {b.numberOfPeople} người
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Tiền cọc</p>
                    <p className="font-bold text-blue-600 mt-0.5">
                      {b.depositAmount?.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>

                {/* Nhắc nhở 80% tiền còn lại */}
                {b.status === 'confirmed' && daysLeft !== null && daysLeft >= 0 && (
                  <div className={`rounded-xl p-4 mb-4 flex items-start gap-3 ${
                    daysLeft <= 3
                      ? 'bg-red-50 border border-red-200'
                      : daysLeft <= 7
                      ? 'bg-orange-50 border border-orange-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <span className="text-xl flex-shrink-0">
                      {daysLeft <= 3 ? '🔴' : daysLeft <= 7 ? '🟡' : '💡'}
                    </span>
                    <div>
                      <p className={`font-bold text-sm ${
                        daysLeft <= 3 ? 'text-red-700'
                        : daysLeft <= 7 ? 'text-orange-700'
                        : 'text-blue-700'
                      }`}>
                        {daysLeft === 0
                          ? 'Tour khởi hành hôm nay!'
                          : `Còn ${daysLeft} ngày đến ngày khởi hành`}
                      </p>
                      <p className={`text-xs mt-1 ${
                        daysLeft <= 3 ? 'text-red-600'
                        : daysLeft <= 7 ? 'text-orange-600'
                        : 'text-blue-600'
                      }`}>
                        💰 Nhớ mang theo{' '}
                        <strong>
                          {(b.totalPrice - b.depositAmount)
                            ?.toLocaleString('vi-VN')}đ
                        </strong>
                        {' '}(80% còn lại) để thanh toán trực tiếp khi tham gia.
                      </p>
                    </div>
                  </div>
                )}

                {/* Booking đã hủy — info hoàn tiền */}
                {b.status === 'cancelled' && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
                    <p className="text-gray-600">
                      Lý do: {b.cancelReason || 'Không có'}
                    </p>
                    {b.refundAmount > 0 ? (
                      <p className="text-green-600 font-bold mt-1">
                        💰 Hoàn tiền:{' '}
                        {b.refundAmount.toLocaleString('vi-VN')}đ
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          b.refundStatus === 'refunded'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {b.refundStatus === 'refunded' ? 'Đã hoàn' : 'Đang xử lý'}
                        </span>
                      </p>
                    ) : (
                      <p className="text-red-500 font-medium mt-1">
                        💸 Không được hoàn tiền cọc
                      </p>
                    )}
                  </div>
                )}

                {/* Rating đã có */}
                {b.rating && (
                  <div className="bg-yellow-50 border border-yellow-200
                    rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating value={b.rating} readonly />
                      <span className="text-sm text-gray-500">
                        {new Date(b.ratedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    {b.reviewText && (
                      <p className="text-sm text-gray-600 italic">
                        "{b.reviewText}"
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 flex-wrap">
                  <Link to={`/tours/${b.tourId}`}
                    className="bg-blue-50 text-blue-600 font-medium px-4 py-2
                      rounded-xl text-sm hover:bg-blue-100 transition">
                    Xem tour
                  </Link>

                  {canCancel && (
                    <button onClick={() => setCancelTarget(b)}
                      className="bg-red-50 text-red-500 font-medium px-4 py-2
                        rounded-xl text-sm hover:bg-red-100 transition">
                      🚫 Hủy đặt chỗ
                    </button>
                  )}

                  {canRate && (
                    <button onClick={() => setRatingTarget(b)}
                      className="bg-yellow-400 text-white font-bold px-4 py-2
                        rounded-xl text-sm hover:bg-yellow-500 transition
                        animate-pulse">
                      ⭐ Đánh giá tour
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}
      {ratingTarget && (
        <RatingModal
          booking={ratingTarget}
          onConfirm={handleRate}
          onClose={() => setRatingTarget(null)}
        />
      )}
    </div>
  );
}