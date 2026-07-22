import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../api/axios';
import { useTranslation } from 'react-i18next';
import FavoriteButton from '../components/FavoriteButton';
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
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-10 w-10
        border-4 border-blue-500 border-t-transparent" />
    </div>
  );
  if (!location) return (
    <div className="text-center py-20 text-red-500">
      {t('location.notFoundDetail')}
    </div>
  );

  const isEng       = i18n.language === 'en';
  const displayName = isEng && location.nameEn        ? location.nameEn        : location.name;
  const displayDesc = isEng && location.descriptionEn ? location.descriptionEn : location.description;
  const displayReg  = isEng && location.regionEn      ? location.regionEn      : location.region;
  const displaySeas = isEng && location.bestSeasonEn  ? location.bestSeasonEn  : location.bestSeason;
  const images      = location.images || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">

      {/* Nút quay lại */}
      <div className="mb-4 sm:mb-6">
        <Link to="/locations"
          className="inline-flex items-center gap-2 text-gray-500
            hover:text-blue-600 transition group">
          <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10
            rounded-full bg-gray-100 group-hover:bg-blue-100 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
            </svg>
          </span>
          <span className="font-bold text-sm sm:text-base">
            {t('location.backToLocations')}
          </span>
        </Link>
      </div>

      {/* ── Card chính ── */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 sm:mb-12">

        {/* Ảnh bìa */}
        {images.length > 0 ? (
          <div className="relative">
            <img src={images[activeImg]} alt={displayName}
              className="w-full h-52 sm:h-72 md:h-[400px] object-cover cursor-pointer"
              onClick={() => setLightbox(activeImg)} />
            {images.length > 1 && (
              <span className="absolute bottom-3 right-3 bg-black/50
                text-white text-xs px-2.5 py-1 rounded-full z-10">
                {activeImg + 1} / {images.length}
              </span>
            )}
            {images.length > 1 && (
              <>
                <button onClick={() => setActiveImg(i => (i-1+images.length)%images.length)}
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2
                    bg-black/40 hover:bg-black/70 text-white w-8 h-8 sm:w-10 sm:h-10
                    rounded-full flex items-center justify-center transition text-lg z-10">
                  ‹
                </button>
                <button onClick={() => setActiveImg(i => (i+1)%images.length)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2
                    bg-black/40 hover:bg-black/70 text-white w-8 h-8 sm:w-10 sm:h-10
                    rounded-full flex items-center justify-center transition text-lg z-10">
                  ›
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-blue-100 h-52 sm:h-64 flex items-center
            justify-center text-6xl relative">
            <div className="absolute top-4 right-4">
              <FavoriteButton itemId={location.id} itemType="LOCATION" />
            </div>
            🏞️
          </div>
        )}

        {/* Thumbnail bar */}
        {images.length > 1 && (
          <div className="flex gap-2 px-3 sm:px-4 py-2.5 bg-gray-50
            border-b overflow-x-auto no-scrollbar">
            {images.map((img, idx) => (
              <button key={idx} onClick={() => setActiveImg(idx)}
                className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                  activeImg === idx
                    ? 'border-blue-500 shadow'
                    : 'border-transparent hover:border-gray-300'
                }`}>
                <img src={img} alt={`thumb-${idx}`}
                  className="h-12 w-16 sm:h-14 sm:w-20 object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="p-4 sm:p-6 md:p-8">

          {/* Tên + Yêu thích */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
              {displayName}
            </h1>
            <div className="flex-shrink-0 mt-1">
              <FavoriteButton itemId={location.id} itemType="LOCATION" />
            </div>
          </div>

          {/* Tags + Rating */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3
            mb-5 pb-4 border-b border-gray-100">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full
              text-xs sm:text-sm font-medium">
              📌 {displayReg}
            </span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full
              text-xs sm:text-sm font-medium">
              🌤️ {t('location.bestSeason')} {displaySeas}
            </span>
            {location.averageRating > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">⭐</span>
                <span className="font-bold text-gray-800 text-sm">
                  {location.averageRating}
                </span>
                <span className="text-gray-400 text-xs">
                  ({location.reviewCount || 0} {t('location.reviews')})
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed
            whitespace-pre-line bg-gray-50 p-4 sm:p-5 rounded-xl border">
            {displayDesc}
          </p>

          {/* Gallery grid */}
          {images.length > 1 && (
            <div className="mt-6 sm:mt-8">
              <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-3">
                🖼️ {t('location.photos')} ({images.length})
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <div key={idx}
                    className="relative group cursor-pointer rounded-lg overflow-hidden
                      aspect-square shadow-sm hover:shadow-md transition"
                    onClick={() => { setActiveImg(idx); setLightbox(idx); }}>
                    <img src={img} alt={`gallery-${idx}`}
                      className="w-full h-full object-cover
                        group-hover:scale-105 transition duration-300" />
                    <div className="absolute inset-0 bg-black/0
                      group-hover:bg-black/20 transition" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-blue-500 text-white
                        text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                        {t('location.cover')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tour liên quan ── */}
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
        {t('location.toursHere')} {displayName}
      </h2>

      {relatedTours.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {relatedTours.map(tour => {
            const tourName = isEng && tour.nameEn ? tour.nameEn : tour.name;
            return (
              <div key={tour.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden
                  hover:shadow-md transition">
                {tour.images?.length > 0 ? (
                  <img
                    src={typeof tour.images[0] === 'string'
                      ? tour.images[0] : tour.images[0].url}
                    alt={tourName}
                    className="w-full h-36 sm:h-40 object-cover" />
                ) : (
                  <div className="bg-green-50 h-36 sm:h-40
                    flex items-center justify-center text-4xl">
                    🧳
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-2
                    line-clamp-2 text-sm sm:text-base">
                    {tourName}
                  </h3>
                  <div className="space-y-1 mb-3 text-xs sm:text-sm
                    text-gray-600 border-b pb-3">
                    <p>
                      {t('location.departure')}{' '}
                      <strong>{tour.departureDate || t('location.updating')}</strong>
                    </p>
                    <p>⏱️ {t('tour.duration')}: <strong>{tour.duration}</strong></p>
                    <p>
                      👥 {t('tour.remaining')}:{' '}
                      <strong>{tour.availableSlots} {t('toursPage.available')}</strong>
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600 font-bold text-base sm:text-lg">
                      {tour.price?.toLocaleString('vi-VN')}đ
                    </span>
                    <Link to={`/tours/${tour.id}`}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg
                        hover:bg-blue-700 text-xs sm:text-sm font-medium">
                      {t('location.details')}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 p-6 sm:p-8 rounded-xl text-center
          border border-dashed border-gray-300">
          <p className="text-gray-500">{t('location.noTours')}</p>
        </div>
      )}

      <CommentSection itemId={id} itemType="LOCATION" />

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 bg-black/90 z-[300]
          flex items-center justify-center p-3 sm:p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-3 right-3 sm:top-4 sm:right-4
            text-white text-3xl sm:text-4xl hover:text-gray-300 transition">
            ×
          </button>
          {images.length > 1 && (
            <button onClick={e => {
              e.stopPropagation();
              const prev = (lightbox-1+images.length)%images.length;
              setLightbox(prev); setActiveImg(prev);
            }} className="absolute left-2 sm:left-4 text-white text-4xl sm:text-5xl
              hover:text-gray-300 transition select-none">
              ‹
            </button>
          )}
          <img src={images[lightbox]} alt="lightbox"
            className="max-w-full max-h-[88vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()} />
          {images.length > 1 && (
            <button onClick={e => {
              e.stopPropagation();
              const next = (lightbox+1)%images.length;
              setLightbox(next); setActiveImg(next);
            }} className="absolute right-2 sm:right-4 text-white text-4xl sm:text-5xl
              hover:text-gray-300 transition select-none">
              ›
            </button>
          )}
          <span className="absolute bottom-3 text-white text-xs sm:text-sm">
            {lightbox+1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
}

export default LocationDetail;