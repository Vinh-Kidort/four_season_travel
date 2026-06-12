import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../api/axios';
import { useTranslation } from 'react-i18next';
import FavoriteButton from '../components/FavoriteButton'; // ĐÃ THÊM
import CommentSection from '../components/CommentSection';

function LocationDetail() {
  const { id } = useParams();
  const [location,     setLocation]     = useState(null);
  const [relatedTours, setRelatedTours] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeImg,    setActiveImg]    = useState(0); 
  const [lightbox,     setLightbox]     = useState(null); 
  const { t, i18n } = useTranslation();

  useEffect(() => {
    Promise.all([
      axios.get(`/locations/${id}`),
      axios.get(`/tours/location/${id}`)
    ]).then(([locationRes, toursRes]) => {
      setLocation(locationRes.data);
      setRelatedTours(toursRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>
  );
  if (!location) return (
    <div className="text-center py-20 text-red-500">{t('location.notFoundDetail')}</div>
  );

  const isEng           = i18n.language === 'en';
  const displayName     = isEng && location.nameEn       ? location.nameEn       : location.name;
  const displayDesc     = isEng && location.descriptionEn? location.descriptionEn: location.description;
  const displayRegion   = isEng && location.regionEn     ? location.regionEn     : location.region;
  const displaySeason   = isEng && location.bestSeasonEn ? location.bestSeasonEn : location.bestSeason;
  const images          = location.images || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Nút quay lại */}
      <div className="mb-6">
        <Link to="/locations"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition group">
          <span className="flex items-center justify-center w-10 h-10 rounded-full
            bg-gray-100 group-hover:bg-blue-100 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </span>
          <span className="font-bold">Danh sách Địa điểm</span>
        </Link>
      </div>

      {/* ── PHẦN 1: THÔNG TIN ĐỊA ĐIỂM ── */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">

        {/* Ảnh bìa chính */}
        {images.length > 0 ? (
          <div className="relative">
            <img src={images[activeImg]} alt={displayName}
              className="w-full h-[420px] object-cover cursor-pointer"
              onClick={() => setLightbox(activeImg)} />
            
            {/* Số ảnh */}
            {images.length > 1 && (
              <span className="absolute bottom-4 right-4 bg-black bg-opacity-50
                text-white text-sm px-3 py-1 rounded-full z-10">
                {activeImg + 1} / {images.length}
              </span>
            )}
            {/* Nút prev/next */}
            {images.length > 1 && (
              <>
                <button onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-40
                    hover:bg-opacity-70 text-white w-10 h-10 rounded-full flex items-center
                    justify-center transition text-xl z-10">
                  ‹
                </button>
                <button onClick={() => setActiveImg(i => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-40
                    hover:bg-opacity-70 text-white w-10 h-10 rounded-full flex items-center
                    justify-center transition text-xl z-10">
                  ›
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-blue-100 h-[420px] flex items-center justify-center text-7xl relative">
             {/* ĐÃ THÊM NÚT YÊU THÍCH (Trường hợp không có ảnh) */}
            <div className="absolute top-4 right-4">
              <FavoriteButton itemId={location.id} itemType="LOCATION" />
            </div>
            🏞️
          </div>
        )}

        {/* Thumbnail ảnh nhỏ */}
        {images.length > 1 && (
          <div className="flex gap-2 px-4 py-3 bg-gray-50 border-b overflow-x-auto">
            {images.map((img, idx) => (
              <button key={idx} onClick={() => setActiveImg(idx)}
                className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                  activeImg === idx
                    ? 'border-blue-500 shadow-md'
                    : 'border-transparent hover:border-gray-300'
                }`}>
                <img src={img} alt={`thumb-${idx}`}
                  className="h-16 w-24 object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Thông tin địa điểm */}
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">{displayName}</h1>
          {/* VÙNG THÔNG TIN CÙNG HÀNG NHAU */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-8 pb-6 border-b border-gray-100">
            
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center">
                📌 {displayRegion}
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center">
                🌤️ {t('location.bestSeason')}: {displaySeason}
              </span>
            </div>

            {/* Dấu gạch đứng phân cách */}
            <div className="h-5 w-px bg-gray-300 hidden sm:block"></div>

            {/* Đánh giá (Đã bỏ mt-2 mb-4) */}
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-500 text-lg">⭐</span>
              <span className="font-bold text-gray-800">{location.averageRating || 0}</span>
              <span className="text-gray-500 text-sm">({location.reviewCount || 0} đánh giá)</span>
            </div>
            
            <div className="h-5 w-px bg-gray-300 hidden sm:block"></div>

            {/* Nút Yêu thích */}
            <div className="flex items-center">
              <FavoriteButton itemId={location.id} itemType="LOCATION" />
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line
            bg-gray-50 p-6 rounded-xl border">
            {displayDesc}
          </p>

          {/* Gallery ảnh sau description */}
          {images.length > 1 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-700 mb-4">
                 Hình ảnh ({images.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div key={idx}
                    className="relative group cursor-pointer rounded-xl overflow-hidden
                      shadow-sm hover:shadow-md transition aspect-square"
                    onClick={() => { setActiveImg(idx); setLightbox(idx); }}>
                    <img src={img} alt={`gallery-${idx}`}
                      className="w-full h-full object-cover
                        group-hover:scale-105 transition duration-300" />
                    <div className="absolute inset-0 bg-black bg-opacity-0
                      group-hover:bg-opacity-20 transition flex items-center justify-center">
                      <span className="text-white text-2xl opacity-0
                        group-hover:opacity-100 transition">🔍</span>
                    </div>
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 bg-blue-500 text-white
                        text-xs px-2 py-0.5 rounded-full font-medium">
                        Bìa
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    

      {/* ── PHẦN 2: TOUR TƯƠNG ỨNG ── */}
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        {t('location.toursHere')} {displayName}
      </h2>
      

      {relatedTours.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {relatedTours.map(tour => (
            <div key={tour.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg border">
              {tour.images && tour.images[0] ? (
                // ✅ SỬA LỖI ẢNH BỊ VỠ NẾU URL BỊ CHUYỂN THÀNH OBJECT
                <img src={typeof tour.images[0] === 'string' ? tour.images[0] : tour.images[0].url} alt={tour.name}
                  className="w-full h-40 object-cover" />
              ) : (
                <div className="bg-green-50 h-40 flex items-center justify-center text-5xl">
                  🧳
                </div>
              )}
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">
                  {tour.name}
                </h3>
                <div className="space-y-1 mb-4 text-sm text-gray-600 border-b pb-3">
                  <p>{t('location.departure')} <strong>{tour.departureDate || t('location.updating')}</strong></p>
                  <p>⏱️ {t('tour.duration')}: <strong>{tour.duration}</strong></p>
                  <p>👥 {t('tour.remaining')}: <strong>{tour.availableSlots} {t('toursPage.available')}</strong></p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-bold text-lg">
                    {tour.price?.toLocaleString('vi-VN')}đ
                  </span>
                  <Link to={`/tours/${tour.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg
                      hover:bg-blue-700 text-sm font-medium">
                    {t('location.details')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 p-8 rounded-xl text-center border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">{t('location.noTours')}</p>
        </div>
      )}

      <CommentSection itemId={id} itemType="LOCATION" />

      {/* ── Lightbox fullscreen ── */}
      {lightbox !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[300]
          flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white text-4xl
            hover:text-gray-300 transition leading-none">×</button>

          {images.length > 1 && (
            <button onClick={e => {
              e.stopPropagation();
              const prev = (lightbox - 1 + images.length) % images.length;
              setLightbox(prev); setActiveImg(prev);
            }} className="absolute left-4 text-white text-5xl hover:text-gray-300
              transition leading-none select-none">‹</button>
          )}

          <img src={images[lightbox]} alt="lightbox"
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()} />

          {images.length > 1 && (
            <button onClick={e => {
              e.stopPropagation();
              const next = (lightbox + 1) % images.length;
              setLightbox(next); setActiveImg(next);
            }} className="absolute right-4 text-white text-5xl hover:text-gray-300
              transition leading-none select-none">›</button>
          )}

          <span className="absolute bottom-4 text-white text-sm">
            {lightbox + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
}

export default LocationDetail;