import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function ToursPage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/tours')
      .then(res => {
        setTours(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('toursPage.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tours.map(tour => (
          <div key={tour.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg
              flex flex-col cursor-pointer group"
            onClick={() => navigate(`/tours/${tour.id}`)}>

            
            {/* KIỂM TRA VÀ HIỂN THỊ ẢNH ĐẦU TIÊN CỦA TOUR */}
            <div className="relative h-56">
              {tour.images && tour.images.length > 0 ? (
                <img
                  src={tour.images[0]?.url}
                  alt={tour.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="bg-green-100 h-full flex items-center justify-center text-5xl">
                  🧳
                </div>
              )}

              {/* Rating Badge (Đã đồng bộ thiết kế) */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 text-sm">
                <span className="text-yellow-500">⭐</span>
                <span className="text-yellow-600 font-bold">{tour.averageRating || 0}</span>
                <span className="text-gray-500">({tour.reviewCount || 0})</span>
              </div>
            </div>

            {/* Các phần bên dưới giữ nguyên, bọc thêm class flex-grow để căn chỉnh đều */}
            <div className="p-5 flex-grow flex flex-col justify-between relative">
              <div>
                

                <h2 className="text-xl font-bold text-gray-800 mb-2 truncate">{tour.name}</h2>
                <p className="text-gray-500 text-sm mb-3 line-clamp-1">{tour.itinerary}</p>

                <div className="text-sm text-gray-600 mb-3 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span>⏱️ {tour.duration}</span>
                    {tour.region && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        📍 {tour.region}
                      </span>
                    )}
                  </div>

                  {tour.departures && tour.departures.filter(d => d.status === 'active').length > 0 && (
                    <div className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                      <span>📅</span>
                      <span>{tour.departures.filter(d => d.status === 'active').length} ngày khởi hành có sẵn</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-blue-600 font-bold text-lg">
                  {tour.price?.toLocaleString('vi-VN')}đ
                </span>
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  const activeDeps = (tour.departures || []).filter(d => {
                    if (d.status !== 'active') return false;
                    const startDate = new Date(d.startDate);
                    startDate.setHours(0, 0, 0, 0);
                    return startDate >= today;
                  });

                  // Không có departure → vẫn hiện tour, ẩn nút đặt
                  if (activeDeps.length === 0) {
                    return (
                      <span className="text-xs text-amber-600 font-medium bg-amber-50
                        px-3 py-1.5 rounded-lg border border-amber-200">
                        🗓️ Chưa có lịch
                      </span>
                    );
                  }

                  // 1 departure → đặt thẳng
                  // Nhiều departure → vào detail chọn
                  const bookingUrl = activeDeps.length === 1
                    ? `/booking/${tour.id}?depId=${activeDeps[0].id}`
                    : `/tours/${tour.id}`;

                  return (
                    <Link
                      to={bookingUrl}
                      onClick={e => e.stopPropagation()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg
                        hover:bg-blue-700 text-sm font-medium whitespace-nowrap">
                      {activeDeps.length > 1 ? 'Chọn ngày' : t('toursPage.bookNow')}
                    </Link>
                  );
                })()}
              </div>
            </div>
            
          </div>
        ))}
      </div>
      {tours.length === 0 && (
        <p className="text-center text-gray-400 py-20">{t('toursPage.noTours')}</p>
      )}
    </div>
  );
}

export default ToursPage;