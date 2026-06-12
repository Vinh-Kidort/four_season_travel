// src/pages/FavoritesPage.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getMyFavorites } from '../api/favoriteApi';
import FavoriteButton from '../components/FavoriteButton';

export default function FavoritesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | TOUR | LOCATION | ARTICLE

  useEffect(() => {
    getMyFavorites()
      .then(res => setFavorites(res.data))
      .catch((err) => {
        console.error('Lỗi tải favorites:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'TOUR', label: '🗺️ Tours' },
    { key: 'LOCATION', label: '📍 Địa điểm' },
    { key: 'ARTICLE', label: '📖 Bài viết' },
  ];

  const filtered = activeTab === 'ALL'
    ? favorites
    : favorites.filter(f => f.itemType === activeTab);

  const getLink = (fav) => {
    switch (fav.itemType) {
      case 'TOUR': return `/tours/${fav.data.id}`;
      case 'LOCATION': return `/locations/${fav.data.id}`;
      case 'ARTICLE': return `/articles/${fav.data.id}`;
      default: return '/';
    }
  };

  const getImage = (fav) => {
    if (!fav.data) return null;
    if (fav.itemType === 'TOUR') {
      const img = fav.data.images?.[0];
      return typeof img === 'string' ? img : img?.url;
    }
    if (fav.itemType === 'LOCATION') return fav.data.images?.[0];
    if (fav.itemType === 'ARTICLE') return fav.data.imageUrl;
    return null;
  };

  const getBadgeColor = (type) => ({
    TOUR: 'bg-blue-100 text-blue-700',
    LOCATION: 'bg-green-100 text-green-700',
    ARTICLE: 'bg-yellow-100 text-yellow-700',
  }[type]);

  const getBadgeLabel = (type) => ({
    TOUR: 'Tour',
    LOCATION: 'Địa điểm',
    ARTICLE: 'Bài viết',
  }[type]);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">❤️ Yêu thích của tôi</h1>
          <p className="text-gray-500 mt-1">Các tour, địa điểm và bài viết bạn đã lưu lại</p>
        </div>

        {/* Tabs - ĐÃ SỬA LỖI GIẬT LAYOUT (Luôn có border-b-4, chỉ đổi màu) */}
        <div className="flex border-b border-gray-200 mb-6 space-x-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 font-bold text-lg transition-all border-b-4 ${
                activeTab === tab.key
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.key !== 'ALL' && (
                <span className="ml-1 text-sm font-normal opacity-70">
                  ({favorites.filter(f => f.itemType === tab.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">🤍</div>
            <p className="text-lg">Chưa có mục yêu thích nào</p>
            <p className="text-sm mt-1">Hãy khám phá và lưu những nơi bạn thích!</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
            >
              Khám phá ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(fav => {
              const isActive = fav.isActive !== false; // mặc định true nếu không có field

              return (
                <div
                  key={fav.favoriteId}
                  onClick={() => isActive && navigate(getLink(fav))}
                  className={`bg-white rounded-2xl overflow-hidden shadow-sm
                    transition-all duration-200 group relative
                    ${isActive
                      ? 'hover:shadow-md cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'  // ← mờ khi ngưng
                    }`}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    {getImage(fav) ? (
                      <img
                        src={getImage(fav)}
                        alt={fav.data.name || fav.data.title}
                        className={`w-full h-full object-cover transition-transform duration-300
                          ${isActive ? 'group-hover:scale-105' : 'grayscale'}`}  // ← xám khi ngưng
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100
                        to-gray-200 flex items-center justify-center text-4xl">🏔️</div>
                    )}

                    {/* Badge ngưng hoạt động */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-black bg-opacity-40
                        flex items-center justify-center">
                        <span className="bg-red-500 text-white text-sm font-bold
                          px-4 py-2 rounded-full">
                          🚫 Đã ngưng hoạt động
                        </span>
                      </div>
                    )}

                    {/* Badge type — chỉ hiện khi active */}
                    {isActive && (
                      <span className={`absolute top-2 left-2 text-xs font-semibold
                        px-2 py-1 rounded-full ${getBadgeColor(fav.itemType)}`}>
                        {getBadgeLabel(fav.itemType)}
                      </span>
                    )}

                    {/* Nút bỏ yêu thích — luôn hiện */}
                    <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
                      <FavoriteButton
                        itemId={fav.data.id}
                        itemType={fav.itemType}
                        onUnfavorite={() => {
                          // Khi bỏ tim → xóa khỏi danh sách local ngay
                          setFavorites(prev =>
                            prev.filter(f => f.favoriteId !== fav.favoriteId)
                          );
                        }}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className={`font-semibold line-clamp-2 transition-colors
                      ${isActive
                        ? 'text-gray-800 group-hover:text-red-500'
                        : 'text-gray-400 line-through'  // ← gạch ngang khi ngưng
                      }`}>
                      {fav.data.name || fav.data.title}
                    </h3>
                    {!isActive ? (
                      <p className="text-red-400 text-xs mt-1 font-medium">
                        Bỏ tim để xóa khỏi danh sách
                      </p>
                    ) : (
                      <>
                        {fav.itemType === 'TOUR' && fav.data.price && (
                          <p className="text-red-500 font-bold mt-1 text-sm">
                            {Number(fav.data.price).toLocaleString('vi-VN')}₫
                          </p>
                        )}
                        {fav.itemType === 'LOCATION' && fav.data.description && (
                          <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                            {fav.data.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}