import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

// ── Helpers ───────────────────────────────────────────────────
const STATUS_MAP = {
  pending_payment: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-700 border-yellow-200'    },
  confirmed:       { label: 'Chờ check-in',   color: 'bg-sky-100 text-sky-700 border-sky-200'             },
  checked_in:      { label: 'Đã tham gia',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  no_show:         { label: 'Không tham gia', color: 'bg-red-100 text-red-700 border-red-200'             },
  cancelled:       { label: 'Đã hủy',         color: 'bg-gray-100 text-gray-500 border-gray-200'          },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center border px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>
      {s.label}
    </span>
  );
}

function fmtDate(str) {
  if (!str) return '—';
  try { return new Date(str).toLocaleDateString('vi-VN'); } catch { return str; }
}
function fmtDateTime(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return str; }
}
function fmtMoney(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('vi-VN') + 'đ';
}

// Kiểm tra ngày hôm nay có đúng bằng startDate không
function isTodayStartDate(startDate) {
  if (!startDate) return false;
  const today = new Date();
  const start = new Date(startDate);
  return (
    today.getFullYear() === start.getFullYear() &&
    today.getMonth()    === start.getMonth()    &&
    today.getDate()     === start.getDate()
  );
}

// ── Modal xác nhận check-in ───────────────────────────────────
function CheckInModal({ booking, onConfirm, onClose, loading }) {
  if (!booking) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center
      justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
            justify-center text-3xl">
            ✅
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-800 text-center mb-1">
          Xác nhận Check-in
        </h3>
        <p className="text-gray-400 text-sm text-center mb-5">
          Xác nhận khách đã đến và thu 80% còn lại?
        </p>

        {/* Thông tin khách */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Khách hàng</span>
            <span className="font-semibold text-gray-800">{booking.customerName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Mã booking</span>
            <span className="font-mono font-bold text-gray-700">{booking.bookingCode}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Số người</span>
            <span className="font-semibold text-gray-800">{booking.numberOfPeople} người</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Tiền cọc đã thu</span>
            <span className="font-bold text-blue-600">{fmtMoney(booking.depositAmount)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
            <span className="text-gray-400">80% còn lại</span>
            <span className="font-bold text-green-600 text-base">
              {fmtMoney((booking.totalPrice || 0) - (booking.depositAmount || 0))}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-2.5
              rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-green-600 text-white font-bold py-2.5
              rounded-xl hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? '⏳ Đang xử lý...' : '✅ Check-in'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal xác nhận no-show ────────────────────────────────────
function NoShowModal({ booking, onConfirm, onClose, loading }) {
  if (!booking) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center
      justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center
            justify-center text-3xl">
            ❌
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-800 text-center mb-1">
          Đánh dấu Không tham gia
        </h3>
        <p className="text-gray-400 text-sm text-center mb-5">
          Khách hàng không xuất hiện vào ngày khởi hành?
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Khách hàng</span>
            <span className="font-semibold text-gray-800">{booking.customerName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Mã booking</span>
            <span className="font-mono font-bold text-gray-700">{booking.bookingCode}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Tiền cọc</span>
            <span className="font-bold text-red-500">{fmtMoney(booking.depositAmount)} (không hoàn)</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-2.5
              rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
            Hủy
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-500 text-white font-bold py-2.5
              rounded-xl hover:bg-red-600 transition disabled:opacity-50">
            {loading ? '⏳...' : '❌ Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Thống kê summary cho 1 departure ─────────────────────────
function DepStats({ bookings }) {
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const checkedIn = bookings.filter(b => b.status === 'checked_in').length;
  const noShow    = bookings.filter(b => b.status === 'no_show').length;
  const revenue   = bookings
    .filter(b => ['confirmed', 'checked_in'].includes(b.status))
    .reduce((s, b) => s + (b.depositAmount || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
      {[
        { label: 'Tổng',         val: bookings.length, cls: 'text-gray-700'    },
        { label: 'Chờ check-in', val: confirmed,        cls: 'text-sky-600'     },
        { label: 'Đã tham gia',  val: checkedIn,        cls: 'text-emerald-600' },
        { label: 'Không đến',    val: noShow,           cls: 'text-red-500'     },
        { label: 'Tiền cọc thu', val: fmtMoney(revenue),cls: 'text-indigo-600'  },
      ].map(({ label, val, cls }) => (
        <div key={label} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          <p className="text-gray-400 text-xs mb-0.5">{label}</p>
          <p className={`font-bold text-sm ${cls}`}>{val}</p>
        </div>
      ))}
    </div>
  );
}

// ── Hàng booking trong bảng ───────────────────────────────────
function BookingRow({ booking, onCheckIn, onNoShow, actionLoading, canCheckInToday }) {
  const canAct    = booking.status === 'confirmed';
  const isLoading = actionLoading === booking.id;

  return (
    <tr className="hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
      {/* Tên + email + phone */}
      <td className="px-4 py-3">
        <p className="font-semibold text-gray-800 text-sm">{booking.customerName}</p>
        <p className="text-gray-400 text-xs mt-0.5">{booking.customerEmail}</p>
        <p className="text-gray-400 text-xs">{booking.customerPhone || '—'}</p>
      </td>

      {/* Mã booking */}
      <td className="px-4 py-3 text-center">
        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
          {booking.bookingCode}
        </span>
      </td>

      {/* Số người */}
      <td className="px-4 py-3 text-center text-sm text-gray-700">
        {booking.numberOfPeople} người
      </td>

      {/* Tiền cọc */}
      <td className="px-4 py-3 text-center">
        <span className="text-blue-600 font-bold text-sm">
          {fmtMoney(booking.depositAmount)}
        </span>
      </td>

      {/* Ngày đặt */}
      <td className="px-4 py-3 text-center text-xs text-gray-400 whitespace-nowrap">
        {fmtDate(booking.createdAt)}
      </td>

      {/* Trạng thái */}
      <td className="px-4 py-3 text-center">
        <StatusBadge status={booking.status} />
        {booking.checkedInAt && (
          <p className="text-xs text-emerald-500 mt-1">{fmtDateTime(booking.checkedInAt)}</p>
        )}
      </td>

      {/* Thao tác */}
      <td className="px-4 py-3 text-center">
        {isLoading ? (
          <span className="text-gray-400 text-xs">Đang xử lý...</span>
        ) : canAct ? (
          <div className="flex flex-col gap-1.5 items-center">
            {/* Check-in — chỉ active đúng ngày startDate */}
            {canCheckInToday ? (
              <button
                onClick={() => onCheckIn(booking)}
                className="bg-green-600 text-white text-xs font-bold px-3 py-1.5
                  rounded-lg hover:bg-green-700 transition whitespace-nowrap w-full"
              >
                ✅ Check-in
              </button>
            ) : (
              <div className="group relative w-full">
                <button
                  disabled
                  className="bg-gray-100 text-gray-400 text-xs font-bold px-3 py-1.5
                    rounded-lg cursor-not-allowed whitespace-nowrap w-full"
                >
                  ✅ Check-in
                </button>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                  bg-gray-800 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap
                  opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                  Chỉ check-in được vào ngày khởi hành
                </div>
              </div>
            )}
            <button
              onClick={() => onNoShow(booking)}
              className="bg-red-50 text-red-500 border border-red-200 text-xs font-bold
                px-3 py-1.5 rounded-lg hover:bg-red-100 transition whitespace-nowrap w-full"
            >
              ❌ Không đến
            </button>
          </div>
        ) : (
          <div className="text-center">
            {booking.status === 'checked_in' && (
              <span className="text-emerald-500 text-xs font-bold">Đã check-in</span>
            )}
            {booking.status === 'no_show' && (
              <span className="text-red-400 text-xs font-bold">Không đến</span>
            )}
            {(booking.status === 'pending_payment' || booking.status === 'cancelled') && (
              <span className="text-gray-300 text-xs">—</span>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

// ── DepartureSection ──────────────────────────────────────────
function DepartureSection({ departure, bookings, onCheckIn, onNoShow, actionLoading }) {
  const [expanded, setExpanded] = useState(true);
  const [filter,   setFilter]   = useState('all');

  const todayIsStart   = isTodayStartDate(departure?.startDate);
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const checkedCount   = bookings.filter(b => b.status === 'checked_in').length;

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const depLabel = departure
    ? `${fmtDate(departure.startDate)} → ${fmtDate(departure.endDate)} (${departure.totalDays || '?'} ngày)`
    : 'Chưa xác định ngày';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-blue-600
          border-b border-blue-700 hover:bg-blue-700 transition text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-lg">📅</span>
          <span className="font-bold text-white text-base">{depLabel}</span>

          {/* Badge trạng thái ngày */}
          {todayIsStart && (
            <span className="bg-green-400 text-white text-xs font-bold px-2 py-0.5
              rounded-full animate-pulse">
              🟢 Hôm nay khởi hành
            </span>
          )}
          {departure?.status === 'suspended' && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Đã tạm ngưng
            </span>
          )}

          <div className="flex gap-2 text-xs">
            <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">
              {confirmedCount} chờ check-in
            </span>
            <span className="bg-white text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {checkedCount} đã tham gia
            </span>
          </div>
        </div>
        <span className="text-blue-200 text-sm ml-4">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="p-5">
          {/* Cảnh báo chưa đến ngày */}
          {departure && !todayIsStart && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4
              flex items-center gap-3 text-sm">
              <span className="text-xl">⏰</span>
              <div>
                <p className="font-semibold text-amber-700">Chưa đến ngày khởi hành</p>
                <p className="text-amber-600 text-xs mt-0.5">
                  Check-in chỉ được phép vào ngày{' '}
                  <strong>{fmtDate(departure.startDate)}</strong>
                </p>
              </div>
            </div>
          )}

          <DepStats bookings={bookings} />

          {/* Filter tabs */}
          <div className="flex gap-1 mb-4 border-b border-gray-100 overflow-x-auto">
            {[
              { key: 'all',             label: `Tất cả (${bookings.length})`                                          },
              { key: 'confirmed',       label: `Chờ check-in (${confirmedCount})`                                     },
              { key: 'checked_in',      label: `Đã tham gia (${checkedCount})`                                        },
              { key: 'pending_payment', label: `Chờ TT (${bookings.filter(b=>b.status==='pending_payment').length})`  },
              { key: 'no_show',         label: `Không đến (${bookings.filter(b=>b.status==='no_show').length})`       },
            ].map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition ${
                  filter === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Không có booking nào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-4 py-2 text-left">Khách hàng</th>
                    <th className="px-4 py-2 text-center">Mã booking</th>
                    <th className="px-4 py-2 text-center">Số người</th>
                    <th className="px-4 py-2 text-center">Tiền cọc</th>
                    <th className="px-4 py-2 text-center">Ngày đặt</th>
                    <th className="px-4 py-2 text-center">Trạng thái</th>
                    <th className="px-4 py-2 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <BookingRow
                      key={b.id}
                      booking={b}
                      onCheckIn={onCheckIn}
                      onNoShow={onNoShow}
                      actionLoading={actionLoading}
                      canCheckInToday={todayIsStart}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function TourBookingsPage() {
  const { tourId } = useParams();
  const navigate   = useNavigate();

  const [bookings,      setBookings]      = useState([]);
  const [departures,    setDepartures]    = useState([]);
  const [tour,          setTour]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error,         setError]         = useState('');

  // Modal state
  const [checkInTarget, setCheckInTarget] = useState(null);
  const [noShowTarget,  setNoShowTarget]  = useState(null);
  const [modalLoading,  setModalLoading]  = useState(false);

  const fetchAll = async () => {
    try {
      const [bookRes, depRes, tourRes] = await Promise.all([
        axios.get(`/bookings/tour/${tourId}`),
        axios.get(`/tours/${tourId}/departures`),
        axios.get(`/tours/${tourId}`),
      ]);
      setBookings(bookRes.data   || []);
      setDepartures(depRes.data  || []);
      setTour(tourRes.data       || null);
    } catch (e) {
      setError(e.response?.data || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('userRole') !== 'AUTHOR') { navigate('/'); return; }
    fetchAll();
  }, [tourId]);

  // ── Check-in (qua modal) ───────────────────────────────────
  const handleCheckIn = (booking) => setCheckInTarget(booking);

  const confirmCheckIn = async () => {
    setModalLoading(true);
    try {
      const res = await axios.put(`/bookings/${checkInTarget.id}/check-in`);
      setBookings(prev => prev.map(b => b.id === checkInTarget.id ? res.data : b));
      setCheckInTarget(null);
    } catch (e) {
      alert('❌ ' + (e.response?.data || 'Lỗi check-in!'));
    } finally {
      setModalLoading(false);
    }
  };

  // ── No-show (qua modal) ────────────────────────────────────
  const handleNoShow = (booking) => setNoShowTarget(booking);

  const confirmNoShow = async () => {
    setModalLoading(true);
    try {
      const res = await axios.put(`/bookings/${noShowTarget.id}/no-show`);
      setBookings(prev => prev.map(b => b.id === noShowTarget.id ? res.data : b));
      setNoShowTarget(null);
    } catch (e) {
      alert('❌ ' + (e.response?.data || 'Lỗi cập nhật!'));
    } finally {
      setModalLoading(false);
    }
  };

  // ── Group bookings theo departureId ───────────────────────
  const grouped = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      const key = b.departureId || '__no_dep__';
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [bookings]);

  const totalRevenue = bookings
    .filter(b => ['confirmed', 'checked_in'].includes(b.status))
    .reduce((s, b) => s + (b.depositAmount || 0), 0);

  const coverImg = tour?.images?.[0];

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center text-gray-400">
      Đang tải dữ liệu...
    </div>
  );
  if (error) return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center text-red-500 font-semibold">
      {error}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 min-h-[70vh]">

      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition group"
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-full
            bg-gray-100 group-hover:bg-blue-100 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </span>
          <span className="font-bold">Thông tin đặt tour</span>
        </button>
        <span className="text-gray-300">›</span>
        <span className="text-gray-600 font-medium truncate max-w-xs">
          {tour?.name || 'Tour'}
        </span>
      </div>

      {/* ── Tour header có ảnh ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
        <div className="flex flex-col sm:flex-row">
          {/* Ảnh bìa */}
          {coverImg && (
            <div className="sm:w-48 sm:h-48 flex-shrink-0 overflow-hidden">
              <img
                src={typeof coverImg === 'string' ? coverImg : coverImg.url}
                alt={tour?.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Thông tin + nút */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800 mb-1">{tour?.name}</h1>
              <p className="text-gray-400 text-sm">
                {departures.length} ngày khởi hành &middot; {bookings.length} booking
              </p>
            </div>

            {/* Tổng quan */}
            <div className="flex flex-wrap gap-3 mt-4">
              {[
                { label: 'Tổng booking', val: bookings.length,                                        cls: 'text-gray-700'    },
                { label: 'Chờ check-in', val: bookings.filter(b=>b.status==='confirmed').length,      cls: 'text-sky-600'     },
                { label: 'Đã tham gia',  val: bookings.filter(b=>b.status==='checked_in').length,     cls: 'text-emerald-600' },
                { label: 'Tổng cọc',     val: fmtMoney(totalRevenue),                                 cls: 'text-indigo-600'  },
              ].map(({ label, val, cls }) => (
                <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2">
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className={`font-bold text-sm ${cls}`}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Nút làm mới */}
          <div className="p-4 flex items-start justify-end">
            <button onClick={fetchAll}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm
                font-medium hover:bg-gray-200 transition whitespace-nowrap">
              🔄 Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Không có booking */}
      {bookings.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16
          text-gray-400">
          <p className="text-4xl mb-3">🎫</p>
          <p>Tour này chưa có booking nào</p>
        </div>
      )}

      {/* Nhóm theo departure */}
      {[...departures]
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .map(dep => {
          const depBookings = grouped[dep.id] || [];
          if (depBookings.length === 0) return null;
          return (
            <DepartureSection
              key={dep.id}
              departure={dep}
              bookings={depBookings}
              onCheckIn={handleCheckIn}
              onNoShow={handleNoShow}
              actionLoading={actionLoading}
            />
          );
        })
      }

      {/* Bookings không có departure */}
      {grouped['__no_dep__']?.length > 0 && (
        <DepartureSection
          departure={null}
          bookings={grouped['__no_dep__']}
          onCheckIn={handleCheckIn}
          onNoShow={handleNoShow}
          actionLoading={actionLoading}
        />
      )}

      {/* ── Modals ── */}
      <CheckInModal
        booking={checkInTarget}
        onConfirm={confirmCheckIn}
        onClose={() => setCheckInTarget(null)}
        loading={modalLoading}
      />
      <NoShowModal
        booking={noShowTarget}
        onConfirm={confirmNoShow}
        onClose={() => setNoShowTarget(null)}
        loading={modalLoading}
      />

    </div>
  );
}