import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { useTranslation } from 'react-i18next';

function ArticlesPage() {
  const [articles,  setArticles]  = useState([]);
  const [locations, setLocations] = useState({});
  const [loading,   setLoading]   = useState(true);
  const { t, i18n } = useTranslation();
  const isEng = i18n.language === 'en';

  useEffect(() => {
    Promise.all([
      axios.get('/articles'),
      axios.get('/locations')
    ]).then(([artRes, locRes]) => {
      setArticles(artRes.data);
      const locMap = {};
      locRes.data.forEach(l => { locMap[l.id] = l.name; });
      setLocations(locMap);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-10 w-10
        border-4 border-yellow-400 border-t-transparent" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">

      {/* Header */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">
        {t('articlesPage.title')}
      </h1>

      {/* Grid — 2 cột mobile, 3 cột desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {articles.map(article => {
          const title   = isEng && article.titleEn   ? article.titleEn   : article.title;
          const summary = isEng && article.summaryEn ? article.summaryEn
                        : (article.summary || article.content);

          return (
            <div key={article.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden
                hover:shadow-md transition-all duration-200 flex flex-col
                border border-gray-100 group">

              {/* Ảnh */}
              <div className="relative h-32 sm:h-44 overflow-hidden">
                {article.imageUrl ? (
                  <img src={article.imageUrl} alt={title}
                    className="w-full h-full object-cover
                      group-hover:scale-105 transition duration-300"/>
                ) : (
                  <div className="bg-yellow-100 w-full h-full
                    flex items-center justify-center text-3xl sm:text-5xl">
                    📖
                  </div>
                )}

                {/* Rating badge */}
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur
                  px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <span className="text-yellow-500 text-xs">⭐</span>
                  <span className="text-yellow-600 font-bold text-xs">
                    {article.averageRating || 0}
                  </span>
                  <span className="text-gray-400 text-xs hidden sm:inline">
                    ({article.reviewCount || 0})
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-5 flex flex-col flex-grow">

                {/* Title */}
                <h2 className="font-bold text-gray-800 mb-1.5
                  text-sm sm:text-xl line-clamp-2
                  group-hover:text-blue-600 transition">
                  {title}
                </h2>

                {/* Author + date + location */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5
                  text-xs text-gray-500 mb-2">
                  <span className="font-medium text-gray-700 truncate max-w-[80px] sm:max-w-none">
                    ✍️ {article.authorName
                      || article.author?.split('@')[0]
                      || t('articlesPage.anonymous')}
                  </span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">📅 {article.createdAt}</span>
                  {article.locationId && locations[article.locationId] && (
                    <>
                      <span className="hidden sm:inline">·</span>
                      <span className="text-blue-500 font-medium truncate
                        max-w-[80px] sm:max-w-none">
                        📍 {locations[article.locationId]}
                      </span>
                    </>
                  )}
                </div>

                {/* Summary — ẩn trên mobile */}
                <p className="text-gray-500 text-sm line-clamp-3 mb-3
                  flex-grow hidden sm:block">
                  {summary}
                </p>

                <Link to={`/articles/${article.id}`}
                  className="text-blue-600 font-semibold hover:text-blue-800
                    self-start text-xs sm:text-sm mt-auto">
                  {t('articlesPage.readMore')}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {articles.length === 0 && (
        <p className="text-center text-gray-400 py-16">
          {t('articlesPage.noArticles')}
        </p>
      )}
    </div>
  );
}

export default ArticlesPage;