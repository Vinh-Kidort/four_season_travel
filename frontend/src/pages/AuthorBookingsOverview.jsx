import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

function fmtMoney(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('vi-VN') + 'đ';
}

function fmtDate(str) {
  if (!str) return '—';
  try { return new Date(str).toLocaleDateString('vi-VN'); } catch { return str; }
}

// ── Skeleton card ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-24 h-20 bg-gray-100 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="flex gap-2 mt-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-8 bg-gray-100 rounded-xl w-16" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tour card ─────────────────────────────────────────────────
function TourCard({ tour, bookings }) {
  const confirmed  = bookings.filter(b => b.status === 'confirmed').length;
  const checkedIn  = bookings.filter(b => b.status === 'checked_in').length;
  const pending    = bookings.filter(b => b.status === 'pending_payment').length;
  const noShow     = bookings.filter(b => b.status === 'no_show').length;
  const totalDeposit = bookings
    .filter(b => ['confirmed','checked_in'].includes(b.status))
    .reduce((s, b) => s + (b.depositAmount || 0), 0);

  const rawImg   = tour.images?.[0] || null;
  const coverImg = rawImg
    ? (typeof rawImg === 'string' ? rawImg : rawImg.url)
    : null;

  return (
    <Link
      to={`/author/tours/${tour.id}/bookings`}
      className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-300
        hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row"
    >
      {/* Ảnh bìa */}
      <div className="sm:w-44 h-36 sm:h-44 flex-shrink-0 bg-gray-100 overflow-hidden relative">
        {coverImg ? (
          <img src={coverImg} alt={tour.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">
            🧳
          </div>
        )}
        {/* Số departure */}
        {tour.departures?.length > 0 && (
          <span className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white
            text-xs font-bold px-2 py-0.5 rounded-full">
            {tour.departures.filter(d => d.status !== 'suspended').length} ngày KH
          </span>
        )}
      </div>

      {/* Nội dung */}
      <div className="flex-1 p-5 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 text-base truncate group-hover:text-blue-600 transition">
              {tour.name}
            </h3>
            {tour.departures?.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                Khởi hành gần nhất:{' '}
                {fmtDate(
                  [...(tour.departures || [])]
                    .filter(d => new Date(d.startDate) >= new Date())
                    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0]?.startDate
                  || tour.departures[0]?.startDate
                )}
              </p>
            )}
          </div>
          <span className="text-blue-500 text-lg flex-shrink-0 group-hover:translate-x-1 transition-transform">
            →
          </span>
        </div>

        {/* Thống kê bookings */}
        {bookings.length === 0 ? (
          <p className="text-gray-400 text-xs italic">Chưa có booking nào</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <span className="bg-gray-50 border border-gray-200 text-gray-600 text-xs
              font-semibold px-2.5 py-1 rounded-lg">
              📋 {bookings.length} booking
            </span>
            {confirmed > 0 && (
              <span className="bg-blue-50 border border-blue-200 text-blue-600 text-xs
                font-semibold px-2.5 py-1 rounded-lg">
                ✅ {confirmed} chờ check-in
              </span>
            )}
            {checkedIn > 0 && (
              <span className="bg-green-50 border border-green-200 text-green-600 text-xs
                font-semibold px-2.5 py-1 rounded-lg">
                🎯 {checkedIn} đã tham gia
              </span>
            )}
            {pending > 0 && (
              <span className="bg-yellow-50 border border-yellow-200 text-yellow-600 text-xs
                font-semibold px-2.5 py-1 rounded-lg">
                ⏳ {pending} chờ TT
              </span>
            )}
            {noShow > 0 && (
              <span className="bg-red-50 border border-red-200 text-red-500 text-xs
                font-semibold px-2.5 py-1 rounded-lg">
                ❌ {noShow} không đến
              </span>
            )}
            {totalDeposit > 0 && (
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs
                font-semibold px-2.5 py-1 rounded-lg">
                💰 {fmtMoney(totalDeposit)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AuthorBookingsOverview() {
  const navigate = useNavigate();
  const [tours,    setTours]    = useState([]);
  const [bookings, setBookings] = useState({});   // { tourId: [booking, ...] }
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    if (localStorage.getItem('userRole') !== 'AUTHOR') { navigate('/'); return; }

    const fetchAll = async () => {
      try {
        // Lấy tất cả tour đã duyệt của author
        const toursRes = await axios.get('/tours/my-tours');
        const approved = toursRes.data.filter(t => t.isApproved && !t.isRejected);
        setTours(approved);

        // Lấy bookings song song cho tất cả tour
        const results = await Promise.allSettled(
          approved.map(t => axios.get(`/bookings/tour/${t.id}`))
        );
        const map = {};
        approved.forEach((t, i) => {
          map[t.id] = results[i].status === 'fulfilled' ? results[i].value.data : [];
        });
        setBookings(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ── Tổng quan ───────────────────────────────────────────────
  const allBookings = Object.values(bookings).flat();
  const totalConfirmed = allBookings.filter(b => b.status === 'confirmed').length;
  const totalCheckedIn = allBookings.filter(b => b.status === 'checked_in').length;
  const totalDeposit   = allBookings
    .filter(b => ['confirmed','checked_in'].includes(b.status))
    .reduce((s, b) => s + (b.depositAmount || 0), 0);

  // ── Filter tour theo search ─────────────────────────────────
  const filtered = tours.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 min-h-[70vh]">

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition group mb-4"
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-full
            bg-gray-100 group-hover:bg-blue-100 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </span>
          <span className="font-bold">Quay lại</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">📋 Thông tin đặt tour</h1>
        <p className="text-gray-400 text-sm mt-1">
          Quản lý bookings và check-in khách hàng cho tất cả tour của bạn
        </p>
      </div>

      {/* Tổng quan */}
      {!loading && allBookings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Tour đang hoạt động', val: tours.length,      cls: 'text-gray-800'   },
            { label: 'Chờ check-in',         val: totalConfirmed,   cls: 'text-blue-600'   },
            { label: 'Đã tham gia',          val: totalCheckedIn,   cls: 'text-green-600'  },
            { label: 'Tổng cọc thu',         val: fmtMoney(totalDeposit), cls: 'text-indigo-600' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl px-5 py-4">
              <p className="text-gray-400 text-xs mb-1">{label}</p>
              <p className={`font-bold text-xl ${cls}`}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      {!loading && tours.length > 3 && (
        <div className="mb-5">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Tìm nhanh tên tour..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
              outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
          />
        </div>
      )}

      {/* Danh sách */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">🧳</p>
          <p>{search ? `Không tìm thấy tour "${search}"` : 'Bạn chưa có tour nào được duyệt'}</p>
          {!search && (
            <Link to="/author" className="text-blue-500 hover:underline text-sm mt-2 block">
              Tạo tour mới →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(tour => (
            <TourCard
              key={tour.id}
              tour={tour}
              bookings={bookings[tour.id] || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}