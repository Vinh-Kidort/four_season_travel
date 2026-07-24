import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from '../api/axios';
import { getAiPredictUrl } from '../utils/aiConfig';

const AI_LOCATION_MAP = {
  'cau_vang_da_nang' : 'Cầu Vàng Đà Nẵng',
  'cho_ben_thanh' : 'Chợ Bến Thành',
  'cho_noi_cai_rang' : 'Chợ nổi Cái Răng',
  'chua_cau_hoi_an' : 'Chùa Cầu Hội An',
  'cot_co_lung_cu' : 'Cột cờ Lũng Cú',
  'dai_noi_hue' : 'Đại Nội Huế',
  'doi_cat_mui_ne' : 'Đồi cát Mũi Né',
  'doi_che_cau_dat' : 'Đồi chè Cầu Đất',
  'ganh_da_dia' : 'Gành Đá Dĩa',
  'ha_long_bay' : 'Vịnh Hạ Long',
  'hang_mua' : 'Hang Múa',
  'ho_guom' : 'Hồ Gươm',
  'hoi_an' : 'Hội An',
  'landmark_81' : 'Landmark 81',
  'lang_bac' : 'Lăng Bác',
  'ma_pi_leng' : 'Mã Pí Lèng',
  'nha_tho_duc_ba' : 'Nhà thờ Đức Bà',
  'quang_truong_lam_vien' : 'Quảng trường Lam Viên',
  'rung_tram_tra_su' : 'Rừng tràm Trà Sư',
  'ruong_bac_thang' : 'Ruộng bậc thang',
  'son_doong' : 'Hang Sơn Đoòng',
  'thac_ban_gioc' : 'Thác Bản Giốc',
  'thanh_dia_my_son' : 'Thánh địa Mỹ Sơn',
  'toa_thanh_tay_ninh' : 'Tòa thánh Tây Ninh',
  'trang_an' : 'Tràng An',
};

const getVietnameseName = (aiKey) => {
  if (!aiKey) return '';
  const cleanKey = aiKey.trim().toLowerCase();
  for (const [key, value] of Object.entries(AI_LOCATION_MAP)) {
    if (key.toLowerCase() === cleanKey) return value;
  }
  return aiKey;
};

const getDateByOffset = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};

function SearchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('q') || '';
  const urlDate = searchParams.get('date') || '';

  const [results,        setResults]        = useState({ tours: [], articles: [], locations: [] });
  const [loading,        setLoading]        = useState(false);
  const [activeTab,      setActiveTab]      = useState('all');
  const [sortBy,         setSortBy]         = useState('default');
  const [priceMax,       setPriceMax]       = useState(50000000);
  const [selectedDate,   setSelectedDate]   = useState('all');
  const [selectedLocIds, setSelectedLocIds] = useState([]);
  const [isAiLoading,    setIsAiLoading]    = useState(false);
  const [showFilter,     setShowFilter]     = useState(false); // mobile filter drawer
  const [aiToast,        setAiToast]        = useState(null);
  const fileInputRef = useRef(null);

  const TABS = [
    { key: 'all',       label: t('searchPage.tabAll')       },
    { key: 'tours',     label: t('searchPage.tabTours')     },
    { key: 'locations', label: t('searchPage.tabLocations') },
    { key: 'articles',  label: t('searchPage.tabArticles')  },
  ];

  const SORT_OPTIONS = [
    { key: 'default',    label: t('searchPage.sortDefault')   },
    { key: 'price_asc',  label: t('searchPage.sortPriceAsc')  },
    { key: 'price_desc', label: t('searchPage.sortPriceDesc') },
    { key: 'newest',     label: t('searchPage.sortNewest')    },
  ];

  const showToast = (type, title, message) => {
    setAiToast({ type, title, message });
    setTimeout(() => setAiToast(null), 5000);
  };

  useEffect(() => {
    if (!keyword.trim()) return;
    setLoading(true);
    setSelectedLocIds([]);
    setSelectedDate(urlDate || 'all');
    axios.get('/search', { params: { keyword, date: urlDate } })
      .then(res => { setResults(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [keyword, urlDate]);

  const toggleLocation = (id) => {
    setSelectedLocIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const matchDate = (tourDate) => {
    if (selectedDate === 'all' || !tourDate) return true;
    if (selectedDate === 'today')    return tourDate === getDateByOffset(0);
    if (selectedDate === 'tomorrow') return tourDate === getDateByOffset(1);
    return tourDate === selectedDate;
  };

  const getItems = () => {
    let items =
      activeTab === 'all'        ? [...results.tours, ...results.articles, ...results.locations]
      : activeTab === 'tours'    ? results.tours
      : activeTab === 'articles' ? results.articles
      :                            results.locations;

    items = items.filter(item => item.type !== 'tour' || Number(item.price) <= priceMax);
    items = items.filter(item => item.type !== 'tour' || matchDate(item.departureDate));

    if (selectedLocIds.length > 0) {
      items = items.filter(item => {
        if (item.type === 'location') return selectedLocIds.includes(item.id);
        if (item.type === 'tour') return (item.locationIds || []).some(lid => selectedLocIds.includes(lid));
        return true;
      });
    }

    if (sortBy === 'price_asc')  items = [...items].sort((a, b) => (a.price||0) - (b.price||0));
    if (sortBy === 'price_desc') items = [...items].sort((a, b) => (b.price||0) - (a.price||0));
    if (sortBy === 'newest')     items = [...items].sort((a, b) =>
      new Date(b.createdAt||0) - new Date(a.createdAt||0));

    return items;
  };

  const handleAiUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsAiLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const aiUrl = getAiPredictUrl(process.env);
      if (!aiUrl) {
        showToast('error', t('searchPage.aiError'), 'AI endpoint chưa được cấu hình.');
        return;
      }

      const res = await fetch(aiUrl, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        const { location, confidence } = data;
        if (confidence >= 60.0) {
          const realKeyword = getVietnameseName(location);
          showToast('success', t('searchPage.aiSuccess'), `${t('searchPage.aiResult')}: ${realKeyword} (${confidence.toFixed(1)}%)`);
          searchParams.set('q', realKeyword);
          setSearchParams(searchParams);
        } else {
          showToast('warning', t('searchPage.aiUnclear'), t('searchPage.aiUnclearDesc'));
        }
      } else {
        showToast('error', t('searchPage.aiError'), data.error);
      }
    } catch {
      showToast('error', t('searchPage.aiDisconnect'), t('searchPage.aiDisconnectDesc'));
    } finally {
      setIsAiLoading(false);
      event.target.value = '';
    }
  };

  const items = getItems();
  const total = results.tours.length + results.articles.length + results.locations.length;
  const maxPriceInResults = Math.max(...results.tours.map(t => Number(t.price) || 0), 50000000);
  const hasActiveFilter = selectedLocIds.length > 0 || selectedDate !== 'all' || priceMax < maxPriceInResults;

  // ── Sidebar filter content (dùng chung desktop + mobile drawer) ──
  const FilterContent = () => (
    <div className="space-y-4">
      {/* Filter giá */}
      {(activeTab === 'all' || activeTab === 'tours') && results.tours.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">{t('searchPage.filterPrice')}</h3>
          <input type="range"
            min="0" max={maxPriceInResults} step="500000"
            value={priceMax}
            onChange={e => setPriceMax(Number(e.target.value))}
            className="w-full accent-blue-600" />
          <div className="flex justify-between text-xs sm:text-sm mt-2">
            <span className="text-gray-400">0đ</span>
            <span className="font-bold text-blue-600">{priceMax.toLocaleString('vi-VN')}đ</span>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            {results.tours.filter(t => Number(t.price) <= priceMax).length} {t('searchPage.toursMatch')}
          </p>
        </div>
      )}

      {/* Filter ngày */}
      {(activeTab === 'all' || activeTab === 'tours') && results.tours.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">{t('searchPage.filterDate')}</h3>
          <div className="space-y-2">
            {[
              { key: 'all',      label: t('searchPage.dateAll')      },
              { key: 'today',    label: `${t('searchPage.dateToday')} (${getDateByOffset(0)})`    },
              { key: 'tomorrow', label: `${t('searchPage.dateTomorrow')} (${getDateByOffset(1)})` },
            ].map(opt => (
              <button key={opt.key}
                onClick={() => setSelectedDate(opt.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm border transition ${
                  selectedDate === opt.key
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}>
                {selectedDate === opt.key && '✓ '}{opt.label}
              </button>
            ))}
            <div className="mt-1">
              <p className="text-xs text-gray-400 mb-1">{t('searchPage.dateCustom')}</p>
              <input type="date"
                value={!['all','today','tomorrow'].includes(selectedDate) ? selectedDate : ''}
                onChange={e => setSelectedDate(e.target.value || 'all')}
                className={`w-full border rounded-lg px-3 py-2 text-xs sm:text-sm outline-none cursor-pointer ${
                  !['all','today','tomorrow'].includes(selectedDate)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter địa điểm */}
      {results.locations.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 text-sm">{t('searchPage.filterLocation')}</h3>
            {selectedLocIds.length > 0 && (
              <button onClick={() => setSelectedLocIds([])}
                className="text-xs text-blue-500 hover:text-blue-700">
                {t('searchPage.deselectAll')}
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {results.locations.map(loc => (
              <label key={loc.id} className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer group">
                <input type="checkbox"
                  checked={selectedLocIds.includes(loc.id)}
                  onChange={() => toggleLocation(loc.id)}
                  className="accent-blue-600 w-4 h-4 cursor-pointer flex-shrink-0"
                />
                <span className={`transition ${
                  selectedLocIds.includes(loc.id) ? 'text-blue-700 font-medium' : 'text-gray-600 group-hover:text-blue-600'
                }`}>{loc.name}</span>
              </label>
            ))}
          </div>
          {selectedLocIds.length > 0 && (
            <p className="text-xs text-blue-500 mt-2 font-medium">
              {t('searchPage.filteringBy')} {selectedLocIds.length} {t('searchPage.locations')}
            </p>
          )}
        </div>
      )}

      {/* Reset filter */}
      {hasActiveFilter && (
        <button
          onClick={() => { setSelectedLocIds([]); setSelectedDate('all'); setPriceMax(maxPriceInResults); }}
          className="w-full py-2 text-sm text-red-500 hover:text-red-700
            border border-red-200 hover:border-red-400 rounded-xl transition">
          🔄 {t('searchPage.resetFilters')}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* AI Toast */}
      {aiToast && (
        <div className={`fixed top-20 right-3 sm:right-4 z-[9999] p-4 rounded-xl shadow-2xl
          border-l-4 flex items-start gap-3 w-72 sm:w-80 bg-white transition-all duration-500 ${
          aiToast.type === 'success' ? 'border-green-500'
          : aiToast.type === 'warning' ? 'border-orange-500' : 'border-red-500'
        }`}>
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-bold ${
              aiToast.type === 'success' ? 'text-green-700'
              : aiToast.type === 'warning' ? 'text-orange-700' : 'text-red-700'
            }`}>{aiToast.title}</h4>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-snug">{aiToast.message}</p>
          </div>
          <button onClick={() => setAiToast(null)}
            className="text-gray-400 hover:text-gray-700 flex-shrink-0">✕</button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">

        {/* AI Upload box */}
        <div className="mb-5 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-2xl sm:text-3xl flex-shrink-0">🤖</span>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">
                  {t('searchPage.aiBoxTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  {t('searchPage.aiBoxDesc')}
                </p>
              </div>
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAiUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={isAiLoading}
              className={`flex-shrink-0 px-3 sm:px-5 py-2 rounded-lg font-bold text-white text-xs sm:text-sm transition ${
                isAiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}>
              {isAiLoading ? `⏳ ${t('searchPage.aiAnalyzing')}` : `📷 ${t('searchPage.aiUpload')}`}
            </button>
          </div>
        </div>

        {/* Header */}
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
          {t('searchPage.resultsFor')}{' '}
          <span className="text-blue-600">"{keyword}"</span>
        </h1>
        {urlDate && (
          <p className="text-gray-400 text-xs sm:text-sm mb-3">📅 {urlDate}</p>
        )}

        {/* Tabs — scroll ngang */}
        <div className="flex gap-0 border-b border-gray-200 mb-5 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium
                whitespace-nowrap transition border-b-2 flex-shrink-0 ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
              {tab.key === 'all'       && ` (${total})`}
              {tab.key === 'tours'     && ` (${results.tours.length})`}
              {tab.key === 'locations' && ` (${results.locations.length})`}
              {tab.key === 'articles'  && ` (${results.articles.length})`}
            </button>
          ))}
        </div>

        <div className="flex gap-5">

          {/* Sidebar — ẩn trên mobile */}
          <div className="w-56 flex-shrink-0 hidden lg:block">
            <FilterContent />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs sm:text-sm text-gray-500">
                  {t('searchPage.found')}{' '}
                  <strong className="text-gray-800">{items.length}</strong>{' '}
                  {t('searchPage.results')}
                </p>

                {/* Badge filter active */}
                {selectedDate !== 'all' && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full
                    flex items-center gap-1">
                    📅 {selectedDate === 'today' ? t('searchPage.dateToday')
                       : selectedDate === 'tomorrow' ? t('searchPage.dateTomorrow')
                       : selectedDate}
                    <button onClick={() => setSelectedDate('all')}
                      className="hover:text-red-500 ml-0.5">×</button>
                  </span>
                )}
                {selectedLocIds.length > 0 && (
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full
                    flex items-center gap-1">
                    📍 {selectedLocIds.length} {t('searchPage.locations')}
                    <button onClick={() => setSelectedLocIds([])}
                      className="hover:text-red-500 ml-0.5">×</button>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Nút mở filter trên mobile */}
                <button
                  onClick={() => setShowFilter(true)}
                  className="lg:hidden flex items-center gap-1 border border-gray-200
                    rounded-lg px-3 py-1.5 text-xs text-gray-600 bg-white hover:border-blue-400">
                  🔽 {t('searchPage.filter')}
                  {hasActiveFilter && (
                    <span className="bg-blue-600 text-white text-xs w-4 h-4 rounded-full
                      flex items-center justify-center">
                      {(selectedLocIds.length > 0 ? 1 : 0) + (selectedDate !== 'all' ? 1 : 0)}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                    {t('searchPage.sortBy')}
                  </span>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5
                      text-xs sm:text-sm outline-none focus:border-blue-400 bg-white cursor-pointer">
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                    <div className="h-36 sm:h-44 bg-gray-200" />
                    <div className="p-3 sm:p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && items.length === 0 && (
              <div className="text-center py-16 sm:py-20 bg-white rounded-xl border border-gray-100">
                <p className="text-4xl sm:text-5xl mb-4">🔍</p>
                <p className="text-gray-600 text-base sm:text-lg font-medium">
                  {t('searchPage.noResults')}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  {hasActiveFilter ? t('searchPage.tryRemoveFilter') : t('searchPage.tryOtherKeyword')}
                </p>
                {hasActiveFilter && (
                  <button
                    onClick={() => { setSelectedLocIds([]); setSelectedDate('all'); }}
                    className="mt-4 text-blue-600 text-sm hover:underline">
                    {t('searchPage.clearFilter')}
                  </button>
                )}
              </div>
            )}

            {/* Results grid — 2 cols mobile */}
            {!loading && items.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {items.map((item, idx) => (
                  <SearchResultCard key={`${item.type}-${item.id}-${idx}`} item={item} t={t} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-40"
            onClick={() => setShowFilter(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-gray-50
            overflow-y-auto p-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">{t('searchPage.filter')}</h2>
              <button onClick={() => setShowFilter(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <FilterContent />
            <button
              onClick={() => setShowFilter(false)}
              className="mt-4 w-full bg-blue-600 text-white font-bold py-3
                rounded-xl hover:bg-blue-700 transition text-sm">
              {t('searchPage.applyFilter')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card kết quả ──────────────────────────────────────────────
function SearchResultCard({ item, t }) {
  const to = item.type === 'tour'    ? `/tours/${item.id}`
           : item.type === 'article' ? `/articles/${item.id}`
           :                           `/locations/${item.id}`;

  const badge = item.type === 'tour'
    ? { label: t('searchPage.badgeTour'),     color: 'bg-green-100 text-green-700'  }
    : item.type === 'article'
    ? { label: t('searchPage.badgeArticle'),  color: 'bg-blue-100 text-blue-700'   }
    : { label: t('searchPage.badgeLocation'), color: 'bg-orange-100 text-orange-700' };

  return (
    <Link to={to}
      className="bg-white rounded-xl shadow-sm border border-gray-100
        hover:shadow-md transition overflow-hidden flex flex-col group">

      {/* Image */}
      <div className="relative overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name || item.title}
            className="w-full h-32 sm:h-44 object-cover group-hover:scale-105 transition duration-300" />
        ) : (
          <div className="w-full h-32 sm:h-44 bg-gradient-to-br from-blue-100 to-blue-50
            flex items-center justify-center text-3xl sm:text-4xl">
            {item.type === 'tour' ? '🧳' : item.type === 'article' ? '📖' : '📍'}
          </div>
        )}
        <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5
          rounded-full ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {/* Info */}
      <div className="p-2.5 sm:p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-bold text-gray-800 line-clamp-2 text-xs sm:text-sm leading-snug">
          {item.name || item.title}
        </h3>

        {item.type === 'tour' && (
          <>
            {item.departureDate && (
              <p className="text-xs text-gray-400">📅 {item.departureDate}</p>
            )}
            <p className="text-xs text-gray-400">
              ⏱️ {item.duration} · 👥 {item.availableSlots} {t('searchPage.slots')}
            </p>
            <div className="mt-auto pt-1.5 flex justify-between items-center">
              <p className="text-blue-600 font-bold text-xs sm:text-base">
                {Number(item.price).toLocaleString('vi-VN')}đ
              </p>
              <span className="bg-blue-600 text-white text-xs font-bold
                px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                {t('searchPage.bookNow')}
              </span>
            </div>
          </>
        )}
        {item.type === 'article' && (
          <p className="text-xs text-gray-400 mt-auto">
            ✍️ {item.author} · {item.createdAt}
          </p>
        )}
        {item.type === 'location' && (
          <p className="text-xs text-gray-400 mt-auto">📌 {item.region}</p>
        )}
      </div>
    </Link>
  );
}

export default SearchPage;