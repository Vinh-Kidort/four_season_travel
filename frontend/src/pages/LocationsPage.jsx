/* eslint-disable react/jsx-no-undef */
import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const { i18n, t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Gọi API Spring Boot lấy danh sách địa điểm
    axios.get('/locations')
      .then(res => {
        setLocations(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(t('locationsPage.error'));
        setLoading(false);
      });
  }, [t]);

  if (loading) return (
    <div className="text-center py-20 text-gray-500">{t('locationsPage.loading')}</div>
  );

  if (error) return (
    <div className="text-center py-20 text-red-500">{error}</div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">

      {/* Header */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">
        {t('locationsPage.title')}
      </h1>

      {/* Grid — 2 cột mobile, 3 cột tablet+ */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {locations.map(location => {
          const isEng = i18n.language === 'en';
          const displayTitle  = isEng && location.nameEn        ? location.nameEn        : location.name;
          const displayDesc   = isEng && location.descriptionEn ? location.descriptionEn : location.description;
          const displayRegion = isEng && location.regionEn      ? location.regionEn      : location.region;

          return (
            <Link to={`/locations/${location.id}`} key={location.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden
                hover:shadow-md transition-all duration-200 block group">

              {/* Ảnh — nhỏ hơn trên mobile */}
              <div className="relative h-32 sm:h-44 md:h-48 overflow-hidden">
                {location.images?.length > 0 ? (
                  <img src={location.images[0]} alt={displayTitle}
                    className="w-full h-full object-cover
                      group-hover:scale-105 transition duration-300" />
                ) : (
                  <div className="bg-blue-100 w-full h-full
                    flex items-center justify-center text-3xl sm:text-5xl">
                    🏝️
                  </div>
                )}

                {/* Rating badge — nhỏ hơn trên mobile */}
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur
                  px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <span className="text-yellow-500 text-xs">⭐</span>
                  <span className="text-yellow-600 font-bold text-xs">
                    {location.averageRating || 0}
                  </span>
                  {/* Ẩn số lượt đánh giá trên mobile */}
                  <span className="text-gray-500 text-xs hidden sm:inline">
                    ({location.reviewCount || 0})
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 sm:p-5">
                <h2 className="font-bold text-gray-800 mb-1
                  text-sm sm:text-xl line-clamp-1">
                  {displayTitle}
                </h2>
                <span className="inline-block text-xs text-blue-600 bg-blue-50
                  px-2 py-0.5 rounded-full">
                  {displayRegion}
                </span>
                {/* Description — ẩn trên mobile */}
                <p className="text-gray-500 mt-2 text-sm line-clamp-2 hidden sm:block">
                  {displayDesc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {locations.length === 0 && (
        <p className="text-center text-gray-400 py-20">
          {t('locationsPage.noLocations')}
        </p>
      )}
    </div>
  );
}

export default LocationsPage;