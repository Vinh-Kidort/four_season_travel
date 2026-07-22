import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../api/axios';
import { useTranslation } from 'react-i18next';
import FavoriteButton from '../components/FavoriteButton';
import CommentSection from '../components/CommentSection';

function ArticleDetail() {
  const { id } = useParams();
  const [article,  setArticle]  = useState(null);
  const [location, setLocation] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const { t, i18n } = useTranslation();
  const isEng = i18n.language === 'en';

  useEffect(() => {
    axios.get(`/articles/${id}`)
      .then(res => {
        setArticle(res.data);
        if (res.data.locationId) {
          axios.get(`/locations/${res.data.locationId}`)
            .then(locRes => setLocation(locRes.data))
            .catch(() => {});
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-10 w-10
        border-4 border-yellow-400 border-t-transparent" />
    </div>
  );
  if (!article) return (
    <div className="text-center py-20 text-red-500">
      {t('article.notFoundDetail')}
    </div>
  );

  const displayTitle   = isEng && article.titleEn   ? article.titleEn   : article.title;
  const displayContent = isEng && article.contentEn ? article.contentEn : article.content;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">

      {/* Nút quay lại */}
      <div className="mb-4 sm:mb-6">
        <Link to="/articles"
          className="inline-flex items-center gap-2 text-gray-500
            hover:text-blue-600 transition group">
          <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10
            rounded-full bg-gray-100 group-hover:bg-blue-100 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"/>
            </svg>
          </span>
          <span className="font-bold text-sm sm:text-base">
            {t('article.backToGuide')}
          </span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-5 sm:p-8 md:p-10 space-y-5 sm:space-y-6">

          {/* ── 1. TITLE ── */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold
            text-gray-900 leading-tight">
            {displayTitle}
          </h1>

          {/* ── 2. INFO + FAVORITE ── */}
          <div className="flex flex-wrap justify-between items-start gap-3
            pb-4 sm:pb-5 border-b border-gray-100">

            {/* Left — author, date, rating, location */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm
              flex-1 min-w-0">
              <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700
                px-2 sm:px-3 py-1 rounded-full font-medium truncate max-w-[150px]">
                ✍️ {article.authorName
                  || article.author?.split('@')[0]
                  || t('article.anonymous')}
              </span>

              <span className="text-gray-400 hidden sm:inline">·</span>

              <span className="text-gray-500 hidden sm:block">
                📅 {article.createdAt}
              </span>

              {/* Rating */}
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">⭐</span>
                <span className="font-bold text-gray-800 text-sm sm:text-base">
                  {article.averageRating || 0}
                </span>
                <span className="text-gray-400 text-xs hidden sm:inline">
                  ({article.reviewCount || 0}{' '}
                  {t('articlesDetail.review')})
                </span>
              </div>

              {location && (
                <>
                  <span className="text-gray-400 hidden sm:inline">·</span>
                  <Link to={`/locations/${location.id}`}
                    className="flex items-center gap-1 text-green-600
                      hover:text-green-800 font-medium transition
                      text-xs sm:text-sm">
                    📍 {isEng && location.nameEn
                      ? location.nameEn : location.name}
                  </Link>
                </>
              )}
            </div>

            {/* Right — Favorite */}
            <div className="flex-shrink-0">
              <FavoriteButton itemId={article.id} itemType="ARTICLE" />
            </div>
          </div>

          {/* ── 3. NỘI DUNG MỞ ĐẦU ── */}
          {displayContent && (
            <div className="text-gray-700 text-sm sm:text-base
              leading-relaxed whitespace-pre-line">
              {displayContent}
            </div>
          )}

          {/* ── 4. ẢNH BÌA ── */}
          {article.imageUrl && (
            <div className="rounded-xl overflow-hidden shadow-md">
              <img src={article.imageUrl} alt={displayTitle}
                className="w-full object-cover max-h-64 sm:max-h-96"/>
            </div>
          )}

          {/* ── 5,6,7... SECTIONS ── */}
          {article.sections?.length > 0 && (
            <div className="space-y-5 sm:space-y-6 pt-1">
              {article.sections.map((section, idx) => {
                const heading = isEng && section.headingEn
                  ? section.headingEn : section.heading;
                const body    = isEng && section.bodyEn
                  ? section.bodyEn    : section.body;

                return (
                  <div key={idx} className="space-y-2">
                    {heading && (
                      <h2 className="text-lg sm:text-xl font-bold
                        text-gray-800 leading-snug">
                        {heading}
                      </h2>
                    )}
                    {body && (
                      <div className="text-gray-700 text-sm sm:text-base
                        leading-relaxed whitespace-pre-line pl-0 sm:pl-1">
                        {body}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback */}
          {(!article.sections?.length && !displayContent) && (
            <p className="text-gray-400 italic text-center py-4 text-sm">
              {t('article.noContent')}
            </p>
          )}

          {/* Comment */}
          <CommentSection itemId={id} itemType="ARTICLE" />

        </div>
      </div>
    </div>
  );
}

export default ArticleDetail;