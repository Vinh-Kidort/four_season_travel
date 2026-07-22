import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function ToursPage() {
  const [tours,   setTours]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const isEng    = i18n.language === 'en';
  const navigate = useNavigate();
  const [regionsMap, setRegionsMap] = useState({});

  useEffect(() => {
    Promise.all([
      axios.get('/tours'),
      axios.get('/locations')
    ]).then(([tourRes, locRes]) => {
      const regMap = {};
      locRes.data.forEach(loc => {
        regMap[loc.id] = isEng && loc.regionEn ? loc.regionEn : loc.region;
      });
      setRegionsMap(regMap);
      setTours(tourRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isEng]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-10 w-10
        border-4 border-blue-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">
        {t('toursPage.title')}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {tours.map(tour => {
          const tourName      = isEng && tour.nameEn      ? tour.nameEn      : tour.name;
          const tourDuration  = isEng && tour.durationEn  ? tour.durationEn  : tour.duration;
          const tourItinerary = isEng && tour.itineraryEn ? tour.itineraryEn : tour.itinerary;

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const activeDeps = (tour.departures || []).filter(d => {
            if (d.status !== 'active') return false;
            const s = new Date(d.startDate);
            s.setHours(0, 0, 0, 0);
            return s >= today;
          });

          const bookingUrl = activeDeps.length === 1
            ? `/booking/${tour.id}?depId=${activeDeps[0].id}`
            : `/tours/${tour.id}`;

          return (
            <div key={tour.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden
                hover:shadow-md transition-all duration-200 flex flex-col
                cursor-pointer group border border-gray-100"
              onClick={() => navigate(`/tours/${tour.id}`)}>

              {/* Ảnh */}
              <div className="relative h-32 sm:h-44 md:h-48 overflow-hidden">
                {tour.images?.length > 0 ? (
                  <img src={tour.images[0]?.url} alt={tourName}
                    className="w-full h-full object-cover
                      group-hover:scale-105 transition duration-300"/>
                ) : (
                  <div className="bg-green-100 w-full h-full
                    flex items-center justify-center text-3xl sm:text-5xl">
                    🧳
                  </div>
                )}

                {/* Rating badge */}
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur
                  px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <span className="text-yellow-500 text-xs">⭐</span>
                  <span className="text-yellow-600 font-bold text-xs">
                    {tour.averageRating || 0}
                  </span>
                  <span className="text-gray-400 text-xs hidden sm:inline">
                    ({tour.reviewCount || 0})
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 sm:p-5 flex flex-col flex-grow">
                <h2 className="font-bold text-gray-800 mb-1 text-sm sm:text-lg
                  line-clamp-2 group-hover:text-blue-600 transition">
                  {tourName}
                </h2>

                {/* Itinerary — ẩn trên mobile */}
                <p
                  className="text-gray-500 text-xs sm:text-sm mb-2 hidden sm:block"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {tourItinerary}
                </p>

                <div className="text-xs sm:text-sm text-gray-600 space-y-1 mb-3">
                  <div className="flex justify-between items-center">
                    <span>⏱️ {tourDuration}</span>
                    {(tour.region || (tour.locationIds?.length > 0 && regionsMap[tour.locationIds[0]])) && (
                      <span className="text-xs bg-gray-100 text-gray-500
                        px-1.5 py-0.5 rounded-full hidden sm:block">
                        📍 {isEng && tour.regionEn
                          ? tour.regionEn
                          : (tour.region || regionsMap[tour.locationIds[0]])}
                      </span>
                    )}
                  </div>

                  {activeDeps.length > 0 && (
                    <div className="flex items-center gap-1 text-green-600 font-medium">
                      <span>📅</span>
                      <span className="text-xs sm:text-sm">
                        {activeDeps.length}{' '}
                        {t('toursPage.departures', { count: activeDeps.length })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Giá + nút */}
                <div className="flex items-center justify-between mt-auto pt-2
                  border-t border-gray-100">
                  <span className="text-blue-600 font-bold text-sm sm:text-lg">
                    {tour.price?.toLocaleString('vi-VN')}đ
                  </span>

                  {activeDeps.length === 0 ? (
                    <span className="text-xs text-amber-600 bg-amber-50
                      px-2 py-1 rounded-lg border border-amber-200 whitespace-nowrap">
                      🗓️ {t('toursPage.noSchedule')}
                    </span>
                  ) : (
                    <Link to={bookingUrl}
                      onClick={e => e.stopPropagation()}
                      className="bg-blue-600 text-white px-2 sm:px-4 py-1.5
                        rounded-lg hover:bg-blue-700 text-xs sm:text-sm
                        font-medium whitespace-nowrap">
                      {activeDeps.length > 1
                        ? t('toursPage.chooseDate')
                        : t('toursPage.bookNow')}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tours.length === 0 && (
        <p className="text-center text-gray-400 py-16">
          {t('toursPage.noTours')}
        </p>
      )}
    </div>
  );
}

export default ToursPage; 