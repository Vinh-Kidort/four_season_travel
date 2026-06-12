import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../api/axios';
import { useTranslation } from 'react-i18next';
import FavoriteButton from '../components/FavoriteButton'; // ĐÃ THÊM
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
    <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>
  );
  if (!article) return (
    <div className="text-center py-20 text-red-500">{t('article.notFoundDetail')}</div>
  );

  const displayTitle   = isEng && article.titleEn   ? article.titleEn   : article.title;
  const displayContent = isEng && article.contentEn ? article.contentEn : article.content;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Nút quay lại */}
      <div className="mb-6">
        <Link to="/articles"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition group">
          <span className="flex items-center justify-center w-10 h-10 rounded-full
            bg-gray-100 group-hover:bg-blue-100 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </span>
          <span className="font-bold">Quay lại Cẩm nang</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8 md:p-10 space-y-6">

          {/* ── 1. TITLE ── */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            {displayTitle}
          </h1>

          {/* ── 2. INFO & FAVORITE BUTTON ── */}
          <div className="flex flex-wrap justify-between items-center pb-5 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700
                px-3 py-1 rounded-full font-medium">
                ✍️ {article.authorName || article.author?.split('@')[0] || 'Ẩn danh'}
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">📅 {article.createdAt}</span>
              {/* HIỆN SAO Ở ĐẦU TRANG */}
              <div className="flex items-center gap-2 mt-2 mb-4">
                <span className="text-yellow-500 text-xl">⭐</span>
                <span className="font-bold text-gray-800 text-lg">{article.averageRating || 0}</span>
                <span className="text-gray-500">({article.reviewCount || 0} lượt đánh giá)</span>
              </div>

              {location && (
                <>
                  <span className="text-gray-400">·</span>
                  <Link to={`/locations/${location.id}`}
                    className="flex items-center gap-1 text-green-600 hover:text-green-800
                      font-medium transition">
                    📍 {location.name}
                  </Link>
                </>
              )}
            </div>

            {/* ĐÃ THÊM NÚT YÊU THÍCH VÀO ĐÂY */}
            <div>
              <FavoriteButton itemId={article.id} itemType="ARTICLE" />
            </div>
          </div>

          {/* ── 3. NỘI DUNG MỞ ĐẦU ── */}
          {displayContent && (
            <div className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
              {displayContent}
            </div>
          )}

          {/* ── 4. ẢNH BÌA ── */}
          {article.imageUrl && (
            <div className="rounded-xl overflow-hidden shadow-md">
              <img src={article.imageUrl} alt={displayTitle}
                className="w-full object-cover max-h-96" />
            </div>
          )}

          {/* ── 5, 6, 7... SECTIONS CON ── */}
          {article.sections && article.sections.length > 0 && (
            <div className="space-y-6 pt-2">
              {article.sections.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  {section.heading && (
                    <h2 className="text-xl font-bold text-gray-800 leading-snug">
                      {section.heading}
                    </h2>
                  )}
                  {section.body && (
                    <div className="text-gray-700 text-base leading-relaxed whitespace-pre-line pl-1">
                      {section.body}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <CommentSection itemId={id} itemType="ARTICLE" />

          {/* Fallback */}
          {(!article.sections || article.sections.length === 0) && !displayContent && (
            <p className="text-gray-400 italic text-center py-4">
              Bài viết chưa có nội dung chi tiết.
            </p>
          )}

        </div>
      </div>
    </div>
  );
}

export default ArticleDetail;