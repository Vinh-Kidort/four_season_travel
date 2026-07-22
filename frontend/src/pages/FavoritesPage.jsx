import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getMyFavorites } from '../api/favoriteApi';
import FavoriteButton from '../components/FavoriteButton';

export default function FavoritesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    getMyFavorites()
      .then(res => setFavorites(res.data))
      .catch(err => {
        if (err.response?.status === 401) navigate('/login');
      })
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'ALL',      label: t('favorites.tabAll')      },
    { key: 'TOUR',     label: t('favorites.tabTour')     },
    { key: 'LOCATION', label: t('favorites.tabLocation') },
    { key: 'ARTICLE',  label: t('favorites.tabArticle')  },
  ];

  const filtered = activeTab === 'ALL'
    ? favorites
    : favorites.filter(f => f.itemType === activeTab);

  const getLink = (fav) => ({
    TOUR:     `/tours/${fav.data.id}`,
    LOCATION: `/locations/${fav.data.id}`,
    ARTICLE:  `/articles/${fav.data.id}`,
  }[fav.itemType] || '/');

  const getImage = (fav) => {
    if (!fav.data) return null;
    if (fav.itemType === 'TOUR') {
      const img = fav.data.images?.[0];
      return typeof img === 'string' ? img : img?.url;
    }
    if (fav.itemType === 'LOCATION') return fav.data.images?.[0];
    if (fav.itemType === 'ARTICLE')  return fav.data.imageUrl;
    return null;
  };

  const getBadgeColor = (type) => ({
    TOUR:     'bg-blue-100 text-blue-700',
    LOCATION: 'bg-green-100 text-green-700',
    ARTICLE:  'bg-yellow-100 text-yellow-700',
  }[type]);

  const getBadgeLabel = (type) => ({
    TOUR:     t('favorites.badgeTour'),
    LOCATION: t('favorites.badgeLocation'),
    ARTICLE:  t('favorites.badgeArticle'),
  }[type]);

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            ❤️ {t('favorites.title')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t('favorites.subtitle')}</p>
        </div>

        {/* Tabs — scroll ngang trên mobile */}
        <div className="flex border-b border-gray-200 mb-5 sm:mb-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 font-bold text-sm sm:text-base transition-all
                border-b-4 whitespace-nowrap px-3 sm:px-4 flex-shrink-0 ${
                activeTab === tab.key
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.key !== 'ALL' && (
                <span className="ml-1 text-xs font-normal opacity-70">
                  ({favorites.filter(f => f.itemType === tab.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow animate-pulse">
                <div className="h-36 sm:h-48 bg-gray-200" />
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>

        /* Empty state */
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 sm:py-20 text-gray-400">
            <div className="text-5xl sm:text-6xl mb-4">🤍</div>
            <p className="text-base sm:text-lg font-medium">{t('favorites.empty')}</p>
            <p className="text-xs sm:text-sm mt-1">{t('favorites.emptyDesc')}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-2.5 bg-red-500 text-white rounded-full
                hover:bg-red-600 transition text-sm font-medium">
              {t('favorites.explore')}
            </button>
          </div>

        /* Grid */
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {filtered.map(fav => {
              const isActive = fav.isActive !== false;
              const imgSrc   = getImage(fav);
              const title    = fav.data?.name || fav.data?.title || '';

              return (
                <div
                  key={fav.favoriteId}
                  onClick={() => isActive && navigate(getLink(fav))}
                  className={`bg-white rounded-2xl overflow-hidden shadow-sm
                    transition-all duration-200 group relative ${
                    isActive
                      ? 'hover:shadow-md cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-36 sm:h-48 overflow-hidden">
                    {imgSrc ? (
                      <img src={imgSrc} alt={title}
                        className={`w-full h-full object-cover transition-transform
                          duration-300 ${isActive ? 'group-hover:scale-105' : 'grayscale'}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100
                        to-gray-200 flex items-center justify-center text-3xl sm:text-4xl">
                        🏔️
                      </div>
                    )}

                    {/* Overlay ngưng hoạt động */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-black bg-opacity-40
                        flex items-center justify-center p-2">
                        <span className="bg-red-500 text-white text-xs font-bold
                          px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-center leading-tight">
                          🚫 {t('favorites.inactive')}
                        </span>
                      </div>
                    )}

                    {/* Badge type */}
                    {isActive && (
                      <span className={`absolute top-2 left-2 text-xs font-semibold
                        px-2 py-0.5 rounded-full ${getBadgeColor(fav.itemType)}`}>
                        {getBadgeLabel(fav.itemType)}
                      </span>
                    )}

                    {/* Nút bỏ yêu thích */}
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2"
                      onClick={e => e.stopPropagation()}>
                      <FavoriteButton
                        itemId={fav.data.id}
                        itemType={fav.itemType}
                        onUnfavorite={() =>
                          setFavorites(prev =>
                            prev.filter(f => f.favoriteId !== fav.favoriteId)
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 sm:p-4">
                    <h3 className={`font-semibold text-sm sm:text-base line-clamp-2
                      transition-colors ${
                      isActive
                        ? 'text-gray-800 group-hover:text-red-500'
                        : 'text-gray-400 line-through'
                    }`}>
                      {title}
                    </h3>

                    {!isActive ? (
                      <p className="text-red-400 text-xs mt-1 font-medium">
                        {t('favorites.removeHint')}
                      </p>
                    ) : (
                      <>
                        {fav.itemType === 'TOUR' && fav.data.price && (
                          <p className="text-red-500 font-bold mt-1 text-xs sm:text-sm">
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