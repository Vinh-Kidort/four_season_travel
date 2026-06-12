import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { useTranslation } from 'react-i18next';

function ArticlesPage() {
  const [articles,   setArticles]   = useState([]);
  const [locations,  setLocations]  = useState({});  // map id → name
  const [loading,    setLoading]    = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    Promise.all([
      axios.get('/articles'),
      axios.get('/locations')
    ]).then(([artRes, locRes]) => {
      setArticles(artRes.data);
      // Tạo map id → name để tra cứu nhanh
      const locMap = {};
      locRes.data.forEach(l => { locMap[l.id] = l.name; });
      setLocations(locMap);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('articlesPage.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map(article => (
          <div key={article.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg flex flex-col">

            {/* Ảnh bìa kèm Rating */}
            <div className="relative h-48">
              {article.imageUrl ? (
                <img src={article.imageUrl} alt={article.title}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="bg-yellow-100 h-full flex items-center justify-center text-5xl">
                  📖
                </div>
              )}

              {/* Rating Badge */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 text-sm">
                <span className="text-yellow-500">⭐</span>
                <span className="text-yellow-600 font-bold">{article.averageRating || 0}</span>
                <span className="text-gray-500">({article.reviewCount || 0})</span>
              </div>
            </div>

            <div className="p-5 flex-grow flex flex-col justify-between">
              <div>
                {/* Tiêu đề */}
                <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                  {article.title}
                </h2>

                {/* Email + Ngày + Địa điểm */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mb-3">
                 <span className="font-medium text-gray-700">
                    ✍️ {article.authorName || article.author?.split('@')[0] || 'Ẩn danh'}
                  </span>
                  <span>·</span>
                  <span>📅 {article.createdAt}</span>
                  {/* ← THÊM: địa điểm */}
                  {article.locationId && locations[article.locationId] && (
                    <>
                      <span>·</span>
                      <span className="text-blue-600 font-medium">
                        📍 {locations[article.locationId]}
                      </span>
                    </>
                  )}
                </div>

                {/* Tóm tắt hoặc nội dung ngắn */}
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {article.summary || article.content}
                </p>
              </div>

              <Link to={`/articles/${article.id}`}
                className="text-blue-600 font-semibold hover:text-blue-800 self-start">
                {t('articlesPage.readMore')}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {articles.length === 0 && (
        <p className="text-center text-gray-400 py-20">{t('articlesPage.noArticles')}</p>
      )}
    </div>
  );
}

export default ArticlesPage;