import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from '../api/axios';
import { tokenManager } from '../api/tokenManager';

// ── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const { t } = useTranslation();
  const map = {
    pending_payment: { label: t('myBookings.statusPending'),   color: 'bg-yellow-100 text-yellow-700' },
    confirmed:       { label: t('myBookings.statusConfirmed'), color: 'bg-blue-100 text-blue-700'    },
    checked_in:      { label: t('myBookings.statusCheckedIn'), color: 'bg-green-100 text-green-700'  },
    no_show:         { label: t('myBookings.statusNoShow'),    color: 'bg-red-100 text-red-700'      },
    cancelled:       { label: t('myBookings.statusCancelled'), color: 'bg-gray-100 text-gray-600'    },
  };
  const s = map[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.color}`}>
      {s.label}
    </span>
  );
}

// ── Star Rating ───────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5 sm:gap-1">
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-xl sm:text-2xl transition-transform ${
            !readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
          }`}>
          <span className={(hover || value) >= star ? 'text-yellow-400' : 'text-gray-200'}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Modal hủy booking ─────────────────────────────────────────
function CancelModal({ booking, onConfirm, onClose }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  const days = (() => {
    try {
      if (booking.departureInfo) {
        const start = new Date(booking.departureInfo.split(' → ')[0]);
        return Math.ceil((start - new Date()) / (1000 * 60 * 60 * 24));
      }
    } catch {}
    return null;
  })();

  const refundPolicy = days === null ? null
    : days >= 7 ? { text: t('myBookings.refund100'), color: 'text-green-600', amount: booking.depositAmount }
    : days >= 3 ? { text: t('myBookings.refund50'),  color: 'text-yellow-600', amount: booking.depositAmount * 0.5 }
    : { text: t('myBookings.refund0'), color: 'text-red-600', amount: 0 };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center
      justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl
        w-full sm:max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">

        <h3 className="text-lg font-bold text-gray-800 mb-2">
          🚫 {t('myBookings.cancelTitle')}
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          {t('myBookings.bookingCode')}: <strong>{booking.bookingCode}</strong>
        </p>

        {refundPolicy && (
          <div className={`border rounded-xl p-4 mb-4 ${
            refundPolicy.amount > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <p className={`font-bold text-sm ${refundPolicy.color}`}>
              💰 {refundPolicy.text}
            </p>
            {refundPolicy.amount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {t('myBookings.refundAmount')}:{' '}
                <strong>{refundPolicy.amount.toLocaleString('vi-VN')}đ</strong>
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {t('myBookings.daysLeft', { days })}
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('myBookings.cancelReason')}
          </label>
          <textarea rows="3" value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={t('myBookings.cancelReasonPh')}
            className="w-full border rounded-lg px-3 py-2 text-sm
              focus:ring-2 focus:ring-red-400 outline-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-3
              rounded-xl hover:bg-gray-200 transition text-sm">
            {t('myBookings.keepBooking')}
          </button>
          <button onClick={() => onConfirm(reason)}
            className="flex-1 bg-red-500 text-white font-bold py-3
              rounded-xl hover:bg-red-600 transition text-sm">
            {t('myBookings.confirmCancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal rating ──────────────────────────────────────────────
function RatingModal({ booking, onConfirm, onClose }) {
  const { t } = useTranslation();
  const [rating,  setRating]  = useState(5);
  const [review,  setReview]  = useState('');
  const [loading, setLoading] = useState(false);

  const ratingLabels = ['', t('myBookings.ratingVeryBad'), t('myBookings.ratingBad'),
    t('myBookings.ratingOk'), t('myBookings.ratingGood'), t('myBookings.ratingGreat')];

  const handleSubmit = async () => {
    setLoading(true);
    await onConfirm(rating, review);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center
      justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl
        w-full sm:max-w-md p-5 sm:p-6">

        <h3 className="text-lg font-bold text-gray-800 mb-1">
          ⭐ {t('myBookings.rateTitle')}
        </h3>
        <p className="text-gray-500 text-sm mb-5">{booking.tourName}</p>

        <div className="flex justify-center mb-3">
          <StarRating value={rating} onChange={setRating} />
        </div>
        <div className="text-center text-sm text-gray-500 mb-4">
          {ratingLabels[rating]}
        </div>

        <textarea rows="4" value={review}
          onChange={e => setReview(e.target.value)}
          placeholder={t('myBookings.reviewPh')}
          className="w-full border rounded-xl px-4 py-3 text-sm
            focus:ring-2 focus:ring-yellow-400 outline-none mb-4" />

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-3
              rounded-xl hover:bg-gray-200 transition text-sm">
            {t('myBookings.rateLater')}
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-yellow-400 text-white font-bold py-3
              rounded-xl hover:bg-yellow-500 disabled:opacity-50 transition text-sm">
            {loading ? '⏳...' : '📤 ' + t('myBookings.submitReview')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function MyBookingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [bookings,      setBookings]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState('all');
  const [cancelTarget,  setCancelTarget]  = useState(null);
  const [ratingTarget,  setRatingTarget]  = useState(null);

  useEffect(() => {
    if (!tokenManager.getToken()) { navigate('/login'); return; }
    axios.get('/bookings/my-bookings')
      .then(res => setBookings(res.data))
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'all',        label: t('myBookings.tabAll')       },
    { key: 'confirmed',  label: t('myBookings.tabConfirmed') },
    { key: 'checked_in', label: t('myBookings.tabCheckedIn') },
    { key: 'cancelled',  label: t('myBookings.tabCancelled') },
  ];

  const filtered = activeTab === 'all'
    ? bookings
    : bookings.filter(b => b.status === activeTab);

  const handleCancel = async (reason) => {
    try {
      const res = await axios.put(`/bookings/${cancelTarget.id}/cancel-by-user`, { reason });
      setBookings(prev => prev.map(b => b.id === cancelTarget.id ? res.data : b));
      setCancelTarget(null);
    } catch (err) {
      alert('❌ ' + (err.response?.data || t('myBookings.cancelError')));
    }
  };

  const handleRate = async (rating, reviewText) => {
    try {
      const res = await axios.post(`/bookings/${ratingTarget.id}/rate`, { rating, reviewText });
      setBookings(prev => prev.map(b => b.id === ratingTarget.id ? res.data : b));
      setRatingTarget(null);
    } catch (err) {
      alert('❌ ' + (err.response?.data || t('myBookings.rateError')));
    }
  };

  const getDaysLeft = (b) => {
    try {
      const dateStr = b.departureInfo?.split(' → ')[0];
      if (!dateStr) return null;
      return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    } catch { return null; }
  };

  if (loading) return (
    <div className="text-center py-20 text-gray-400">{t('common.loading')}</div>
  );

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-10">

      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5 sm:mb-6">
        🎫 {t('myBookings.title')}
      </h1>

      {/* Tabs — scroll ngang trên mobile */}
      <div className="flex gap-0 border-b mb-5 sm:mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium
              whitespace-nowrap border-b-2 transition flex-shrink-0 ${
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
        <div className="text-center py-16 sm:py-20 text-gray-400">
          <p className="text-4xl sm:text-5xl mb-3">🎫</p>
          <p className="text-sm sm:text-base">{t('myBookings.empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(b => {
            const daysLeft  = getDaysLeft(b);
            const canCancel = b.status === 'confirmed';
            const canRate   = b.status === 'checked_in' && !b.rating;

            return (
              <div key={b.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">

                {/* Header: tên tour + badge */}
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 text-base sm:text-lg truncate">
                      {b.tourName}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                      {t('myBookings.code')}:{' '}
                      <span className="font-mono font-bold text-gray-600">
                        {b.bookingCode}
                      </span>
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={b.status} />
                  </div>
                </div>

                {/* Info grid — 2 cols mobile, 4 cols desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
                    <p className="text-gray-400 text-xs">{t('myBookings.bookedDate')}</p>
                    <p className="font-medium text-gray-700 text-xs sm:text-sm mt-0.5">
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
                    <p className="text-gray-400 text-xs">{t('myBookings.departure')}</p>
                    <p className="font-medium text-gray-700 text-xs sm:text-sm mt-0.5 leading-tight">
                      {b.departureInfo || '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
                    <p className="text-gray-400 text-xs">{t('myBookings.people')}</p>
                    <p className="font-medium text-gray-700 text-xs sm:text-sm mt-0.5">
                      {b.numberOfPeople} {t('myBookings.peopleUnit')}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
                    <p className="text-gray-400 text-xs">{t('myBookings.deposit')}</p>
                    <p className="font-bold text-blue-600 text-xs sm:text-sm mt-0.5">
                      {b.depositAmount?.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>

                {/* Nhắc nhở 80% còn lại */}
                {b.status === 'confirmed' && daysLeft !== null && daysLeft >= 0 && (
                  <div className={`rounded-xl p-3 sm:p-4 mb-4 flex items-start gap-2 sm:gap-3 ${
                    daysLeft <= 3 ? 'bg-red-50 border border-red-200'
                    : daysLeft <= 7 ? 'bg-orange-50 border border-orange-200'
                    : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <span className="text-lg sm:text-xl flex-shrink-0">
                      {daysLeft <= 3 ? '🔴' : daysLeft <= 7 ? '🟡' : '💡'}
                    </span>
                    <div>
                      <p className={`font-bold text-xs sm:text-sm ${
                        daysLeft <= 3 ? 'text-red-700'
                        : daysLeft <= 7 ? 'text-orange-700'
                        : 'text-blue-700'
                      }`}>
                        {daysLeft === 0
                          ? t('myBookings.departureToday')
                          : t('myBookings.daysUntilDeparture', { days: daysLeft })}
                      </p>
                      <p className={`text-xs mt-1 ${
                        daysLeft <= 3 ? 'text-red-600'
                        : daysLeft <= 7 ? 'text-orange-600'
                        : 'text-blue-600'
                      }`}>
                        💰 {t('myBookings.bring')}{' '}
                        <strong>
                          {(b.totalPrice - b.depositAmount)?.toLocaleString('vi-VN')}đ
                        </strong>
                        {' '}{t('myBookings.remainingNote')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Đã hủy */}
                {b.status === 'cancelled' && (
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 text-xs sm:text-sm">
                    <p className="text-gray-600">
                      {t('myBookings.reason')}: {b.cancelReason || t('myBookings.noReason')}
                    </p>
                    {b.refundAmount > 0 ? (
                      <p className="text-green-600 font-bold mt-1">
                        💰 {t('myBookings.refunded')}:{' '}
                        {b.refundAmount.toLocaleString('vi-VN')}đ
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          b.refundStatus === 'refunded'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {b.refundStatus === 'refunded'
                            ? t('myBookings.refundDone')
                            : t('myBookings.refundProcessing')}
                        </span>
                      </p>
                    ) : (
                      <p className="text-red-500 font-medium mt-1">
                        💸 {t('myBookings.noRefund')}
                      </p>
                    )}
                  </div>
                )}

                {/* Rating đã có */}
                {b.rating && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl
                    p-3 sm:p-4 mb-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <StarRating value={b.rating} readonly />
                      <span className="text-xs sm:text-sm text-gray-500">
                        {new Date(b.ratedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    {b.reviewText && (
                      <p className="text-xs sm:text-sm text-gray-600 italic">
                        "{b.reviewText}"
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                  <Link to={`/tours/${b.tourId}`}
                    className="bg-blue-50 text-blue-600 font-medium px-3 sm:px-4
                      py-2 rounded-xl text-xs sm:text-sm hover:bg-blue-100 transition">
                    {t('myBookings.viewTour')}
                  </Link>

                  {canCancel && (
                    <button onClick={() => setCancelTarget(b)}
                      className="bg-red-50 text-red-500 font-medium px-3 sm:px-4
                        py-2 rounded-xl text-xs sm:text-sm hover:bg-red-100 transition">
                      🚫 {t('myBookings.cancelBooking')}
                    </button>
                  )}

                  {canRate && (
                    <button onClick={() => setRatingTarget(b)}
                      className="bg-yellow-400 text-white font-bold px-3 sm:px-4
                        py-2 rounded-xl text-xs sm:text-sm hover:bg-yellow-500
                        transition animate-pulse">
                      ⭐ {t('myBookings.rateTour')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cancelTarget && (
        <CancelModal booking={cancelTarget} onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)} />
      )}
      {ratingTarget && (
        <RatingModal booking={ratingTarget} onConfirm={handleRate}
          onClose={() => setRatingTarget(null)} />
      )}
    </div>
  );
}