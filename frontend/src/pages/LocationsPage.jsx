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
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('locationsPage.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {locations.map(location => {
          // --- TẠO LOGIC CHỌN NGÔN NGỮ Ở ĐÂY ---
          // Nếu ngôn ngữ là 'en' VÀ có dữ liệu nameEn thì dùng nameEn, ngược lại dùng name
          const isEng = i18n.language === 'en';
          
          const displayTitle = isEng && location.nameEn ? location.nameEn : location.name;
          const displayDesc = isEng && location.descriptionEn ? location.descriptionEn : location.description;
          const displayRegion = isEng && location.regionEn ? location.regionEn : location.region;

          return (
            <Link to={`/locations/${location.id}`} key={location.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg block">
            {/* KIỂM TRA: Nếu có ảnh thì in ảnh đầu tiên, nếu không có thì in Emoji mặc định */}
            <div className="relative h-48">
              {location.images && location.images.length > 0 ? (
                <img 
                  src={location.images[0]} 
                  alt={location.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="bg-blue-100 h-full flex items-center justify-center text-5xl">
                  🏝️
                </div>
              )}

              {/* Rating Badge */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 text-sm">
                <span className="text-yellow-500">⭐</span>
                <span className="text-yellow-600 font-bold">{location.averageRating || 0}</span>
                <span className="text-gray-500">({location.reviewCount || 0})</span>
              </div>
            </div>
              <div className="p-5">
                
                {/* THAY BIẾN VÀO ĐÂY */}
                <h2 className="text-xl font-bold text-gray-800 mb-1">{displayTitle}</h2>
                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {displayRegion}
                </span>
                <p className="text-gray-500 mt-3 text-sm line-clamp-2">{displayDesc}</p>
                
              </div>
            </Link>
          );
        })}
      </div>

      {locations.length === 0 && (
        <p className="text-center text-gray-400 py-20">{t('locationsPage.noLocations')}</p>
      )}
    </div>
  );
}

export default LocationsPage;