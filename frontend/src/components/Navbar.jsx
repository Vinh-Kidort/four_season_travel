import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Meilisearch } from 'meilisearch';


const USE_ATLAS = import.meta.env.VITE_USE_ATLAS_SEARCH === 'true';

const meiliClient = new Meilisearch({
  host: process.env.REACT_APP_MEILISEARCH_HOST ,
  apiKey: process.env.REACT_APP_MEILISEARCH_API_KEY,
});

const POPULAR_KEYWORDS = [
  'Hội An', 'Đà Nẵng', 'Phú Quốc', 'Sapa', 'Hạ Long',
  'Đà Lạt', 'Nha Trang', 'Huế', 'Mũi Né', 'Cần Thơ'
];

const SEARCH_HISTORY_KEY = 'fst_search_history';

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
  return aiKey; // Nếu không tìm thấy, trả về key gốc
};

// ── SearchBar ──────────────────────────────────────────────────
export function SearchBar({ compact = false }) {
  const navigate     = useNavigate();
  const fileRef      = useRef(null);
  const dropdownRef  = useRef(null);
  const inputRef     = useRef(null);

  const [keyword,      setKeyword]      = useState('');
  const [date,         setDate]         = useState('');
  const [results,      setResults]      = useState({ tours: [], articles: [], locations: [] });
  const [isSearching,  setIsSearching]  = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused,    setIsFocused]    = useState(false);
  const [isAiLoading,  setIsAiLoading]  = useState(false);

  const [aiToast, setAiToast] = useState(null);

  const [history,      setHistory]      = useState(() => {
    try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || []; }
    catch { return []; }
  });

  const totalResults = results.tours.length + results.articles.length + results.locations.length;

  // ── Debounce search realtime ──────────────────────────────
  useEffect(() => {
    if (!keyword.trim()) {
      setResults({ tours: [], articles: [], locations: [] });
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (USE_ATLAS) {
          // ── Prod: gọi qua backend API ──────────────────────────
          const res = await fetch(
            `/api/v1/search?keyword=${encodeURIComponent(keyword)}`,
            { headers: { 'Content-Type': 'application/json' } }
          );
          const data = await res.json();
          setResults({
            tours:     data.tours     || [],
            articles:  data.articles  || [],
            locations: data.locations || [],
          });
        } else {
          // ── Local: gọi thẳng Meilisearch ──────────────────────
          const [tourRes, articleRes, locationRes] = await Promise.all([
            meiliClient.index('tours').search(keyword,     { limit: 3 }),
            meiliClient.index('articles').search(keyword,  { limit: 2 }),
            meiliClient.index('locations').search(keyword, { limit: 3 }),
          ]);
          setResults({
            tours:     tourRes.hits,
            articles:  articleRes.hits,
            locations: locationRes.hits,
          });
        }
      } catch {
        setResults({ tours: [], articles: [], locations: [] });
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // ── Đóng dropdown khi click ra ngoài ─────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Lưu lịch sử tìm kiếm ─────────────────────────────────
  const saveHistory = (kw) => {
    const newHistory = [kw, ...history.filter(h => h !== kw)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  // ── Submit tìm kiếm ───────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    saveHistory(keyword.trim());
    setShowDropdown(false);
    setIsFocused(false);
    const params = new URLSearchParams({ q: keyword.trim() });
    if (date) params.append('date', date);
    navigate(`/search?${params.toString()}`);
  };

  const handleSelectKeyword = (kw) => {
    saveHistory(kw);
    setShowDropdown(false);
    setIsFocused(false);
    setKeyword('');
    navigate(`/search?q=${encodeURIComponent(kw)}`);
  };

  const handleSelectItem = (type, id) => {
    setShowDropdown(false);
    setIsFocused(false);
    setKeyword('');
    if (type === 'tour')     navigate(`/tours/${id}`);
    if (type === 'article')  navigate(`/articles/${id}`);
    if (type === 'location') navigate(`/locations/${id}`);
  };

  const showToast = (type, title, message) => {
    setAiToast({ type, title, message });
    setTimeout(() => setAiToast(null), 5000);
  };

  const handleAiUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsAiLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(process.env.REACT_APP_AI_PREDICT_URL, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        const { location, confidence } = data;
        
        if (confidence >= 60.0) {
          // Lấy tên tiếng Việt bằng hàm thông minh
          const realKeyword = getVietnameseName(location);
          
          saveHistory(realKeyword);
          setShowDropdown(false);
          setIsFocused(false);
          setKeyword(realKeyword); 
          
          // GỌI BOX THÔNG BÁO THÀNH CÔNG
          showToast(
            'success', 
            'Nhận diện thành công!', 
            `AI phân tích ảnh này là: ${realKeyword} (${confidence.toFixed(1)}%)`
          );
          
          navigate(`/search?q=${encodeURIComponent(realKeyword)}`);
        } else {
          // GỌI BOX THÔNG BÁO THẤT BẠI
          showToast(
            'warning',
            'Hình ảnh chưa rõ ràng 🤔',
            'Hệ thống không chắc chắn đây là địa điểm nào. Bạn thử góc chụp khác nhé!'
          );
        }
      } else {
        showToast('error', 'Lỗi Server AI', data.error);
      }
    } catch (error) {
      console.error('Lỗi kết nối AI:', error);
      showToast('error', 'Mất kết nối', 'Máy chủ AI đang bận hoặc chưa bật!');
    } finally {
      setIsAiLoading(false);
      e.target.value = ''; 
    }
  };

  const showDefault = isFocused && !keyword.trim();
  const showResults = isFocused && keyword.trim();

  return (
    <div className="relative w-full" ref={dropdownRef}>
      
      {/* ── MỚI THÊM: GIAO DIỆN BOX THÔNG BÁO (TOAST) ── */}
      {aiToast && (
        <div className={`fixed top-24 right-4 z-[9999] p-4 rounded-xl shadow-2xl border-l-4 flex items-start gap-3 w-80 bg-white transition-all duration-500 animate-fade-in-down ${
          aiToast.type === 'success' ? 'border-green-500' :
          aiToast.type === 'warning' ? 'border-orange-500' : 'border-red-500'
        }`}>
          {/* Icon theo trạng thái */}
          <div className="flex-shrink-0 mt-0.5">
            {aiToast.type === 'success' }
            {aiToast.type === 'warning' }
            {aiToast.type === 'error' }
          </div>
          
          {/* Nội dung */}
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-bold ${
              aiToast.type === 'success' ? 'text-green-700' :
              aiToast.type === 'warning' ? 'text-orange-700' : 'text-red-700'
            }`}>
              {aiToast.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1 leading-snug">
              {aiToast.message}
            </p>
          </div>

          {/* Nút đóng */}
          <button onClick={() => setAiToast(null)} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
            ✕
          </button>
        </div>
      )}

      {/* ── Input form ── */}
      <form onSubmit={handleSubmit}
        className={`flex items-center gap-1.5 bg-white border rounded-xl
          shadow-sm px-3 py-1.5 w-full transition-all ${
          isFocused ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'
        }`}>
        {isSearching ? (
          <svg className="animate-spin h-4 w-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        ) : (
          <span className="text-gray-400 text-sm flex-shrink-0">🔍</span>
        )}

        <input
          ref={inputRef}
          type="text"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onFocus={() => { setIsFocused(true); setShowDropdown(true); }}
          placeholder={compact ? "Tìm kiếm..." : "Tìm theo điểm đến, hoạt động..."}
          className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-sm bg-transparent min-w-0"
        />

        {keyword && (
          <button type="button" onClick={() => { setKeyword(''); inputRef.current?.focus(); }}
            className="text-gray-300 hover:text-gray-500 flex-shrink-0 text-lg leading-none">
            ×
          </button>
        )}

        {!compact && (
          <>
            <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="outline-none text-gray-400 text-xs bg-transparent w-24 cursor-pointer flex-shrink-0" />
          </>
        )}

        <div className="h-4 w-px bg-gray-200 flex-shrink-0" />

        {/* Nút upload AI */}
        <button 
          type="button" 
          onClick={() => fileRef.current?.click()}
          disabled={isAiLoading}
          title="Tìm bằng hình ảnh (AI)"
          className={`text-xs flex-shrink-0 transition hidden sm:block ${
            isAiLoading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-400 hover:text-blue-600 hover:scale-110'
          }`}>
          {isAiLoading ? (
            <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : '📷'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAiUpload} />

        <button type="submit"
          className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold hover:bg-blue-700 transition text-xs flex-shrink-0">
          Tìm
        </button>
      </form>

      {/* ── Dropdown (Giữ nguyên như code cũ của bạn) ── */}
      {showDropdown && (showDefault || showResults) && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl
          shadow-2xl border border-gray-100 z-[200] overflow-hidden">
          
          {showDefault && (
            <div className="p-4 space-y-5">
              {history.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-700">Lịch sử tìm kiếm</span>
                    <button onClick={clearHistory} className="text-gray-400 hover:text-red-400 transition text-xs">🗑️ Xóa</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((h, i) => (
                      <button key={i} onClick={() => handleSelectKeyword(h)}
                        className="flex items-center gap-1.5 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 text-sm px-3 py-1.5 rounded-full transition">
                        🕐 {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">Mọi người đang tìm kiếm</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_KEYWORDS.map((kw, i) => (
                    <button key={i} onClick={() => handleSelectKeyword(kw)}
                      className="bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 text-sm px-3 py-1.5 rounded-full transition">
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showResults && (
            <div className="max-h-[400px] overflow-y-auto">
              {isSearching ? (
                <div className="px-4 py-6 text-sm text-gray-400 text-center">🔍 Đang tìm...</div>
              ) : totalResults === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-gray-400 text-sm">Không tìm thấy "<strong>{keyword}</strong>"</p>
                </div>
              ) : (
                <>
                  {/* ... Code map tours, locations, articles giữ nguyên ... */}
                  {results.tours.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 uppercase">🧳 Tour</div>
                      {results.tours.map(item => (
                        <button key={item.id} type="button" onClick={() => handleSelectItem('tour', item.id)}
                          className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition border-b border-gray-50 flex items-center gap-3">
                          <span className="text-xl flex-shrink-0">🧳</span>
                          <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.locations.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 uppercase">📍 Địa điểm</div>
                      {results.locations.map(item => (
                        <button key={item.id} type="button" onClick={() => handleSelectItem('location', item.id)}
                          className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition border-b border-gray-50 flex items-center gap-3">
                          <span className="text-xl flex-shrink-0">📍</span>
                          <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => handleSelectKeyword(keyword)}
                    className="w-full py-3 text-center text-blue-600 font-bold text-sm hover:bg-blue-50 transition border-t border-gray-100">
                    Xem tất cả kết quả cho "{keyword}" →
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────
function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const [showStickySearch, setShowStickySearch] = useState(false);
  
  const langRef = useRef(null);
  const userRef = useRef(null);

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleToggleSearch = (e) => {
      setShowStickySearch(e.detail);
    };

    window.addEventListener('toggleNavbarSearch', handleToggleSearch);
    
    if (!isHomePage) {
      setShowStickySearch(false);
    }

    return () => {
      window.removeEventListener('toggleNavbarSearch', handleToggleSearch);
    };
  }, [isHomePage]);

  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target))
        setIsLangOpen(false);
      if (userRef.current && !userRef.current.contains(e.target))
        setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const changeLanguage = (lng) => { i18n.changeLanguage(lng); setIsLangOpen(false); };

  const handleLogout = () => {
    ['token','userEmail','userRole','userName'].forEach(k => localStorage.removeItem(k));
    setAuthInfo({ token: null, userName: '', userEmail: '', userRole: '' });
    navigate('/login');
  };

  useEffect(() => {
    setAuthInfo({
      token:     localStorage.getItem('token'),
      userName:  localStorage.getItem('userName')  || '',
      userEmail: localStorage.getItem('userEmail') || '',
      userRole:  localStorage.getItem('userRole')  || '',
    });
  }, [location.pathname]); // sync lại mỗi khi đổi trang

  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsLangOpen(false);
  }, [location.pathname]);

  const [authInfo, setAuthInfo] = useState(() => {
  const token     = localStorage.getItem('token');
  const userName  = localStorage.getItem('userName')  || '';
  const userEmail = localStorage.getItem('userEmail') || '';
  const userRole  = localStorage.getItem('userRole')  || '';
  return { token, userName, userEmail, userRole };
  });

  const { token, userName, userEmail, userRole } = authInfo;
  const avatarChar  = (userName || userEmail || '?').charAt(0).toUpperCase();
  const displayName = userName || (userEmail ? userEmail.split('@')[0] : '');

  const shouldShowSearch = !isHomePage || showStickySearch;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-6">

        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img
            src="/logo.png"
            alt="Four Season Travel"
            className="h-12 w-auto object-contain"
          />
          
        </Link>

        {/* SearchBar */}
        <div className="flex-1 max-w-lg transition-all duration-300">
          {shouldShowSearch ? (
            <div className="animate-fade-in">
              <SearchBar compact />
            </div>
          ) : (
            <div className="w-full h-8"></div> 
          )}
        </div>

        <div className="flex-1" />

        {/* Menu links - ĐÃ SỬA CẨM NANG HẾT VIỀN */}
        <div className="hidden md:flex items-center gap-5 flex-shrink-0 border-r border-gray-200 pr-5">
          <Link to="/locations" className="text-gray-600 hover:text-blue-600 font-medium text-base whitespace-nowrap transition">
            {t('menu.locations')}
          </Link>
          <Link to="/tours" className="text-gray-600 hover:text-blue-600 font-medium text-base whitespace-nowrap transition">
            {t('menu.tours')}
          </Link>
          <Link to="/articles" className="text-gray-600 hover:text-blue-600 font-medium text-base whitespace-nowrap transition">
            {t('menu.articles')}
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Ngôn ngữ */}
          <div className="relative" ref={langRef}>
            <button onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1 font-bold text-gray-700 bg-gray-100 px-2.5 py-1.5 rounded-lg hover:bg-gray-200 transition text-xs">
              🌐 {i18n.language ? i18n.language.toUpperCase() : 'VN'}
            </button>
            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-24 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                {['vn','en'].map(lng => (
                  <button key={lng} onClick={() => changeLanguage(lng)}
                    className={`w-full text-left px-3 py-2 text-base hover:bg-blue-50 ${i18n.language === lng ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                    {lng === 'vn' ? '🇻🇳 VN' : '🇬🇧 EN'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tài khoản - ĐÃ KHÔI PHỤC ĐẦY ĐỦ MENU */}
          {token ? (
            <div className="relative" ref={userRef}>
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {avatarChar}
                </span>
                <span className="text-base font-bold text-blue-800 hidden sm:block max-w-[80px] truncate">
                  {displayName}
                </span>
                <span className="text-gray-400 text-xs">▼</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-4 text-white">
                    <p className="font-bold leading-tight">{userName || 'Người dùng'}</p>
                    <p className="text-xs text-blue-100 truncate mt-0.5">{userEmail}</p>
                    <span className="text-xs font-bold bg-white text-blue-600 inline-block px-2 py-0.5 rounded mt-2 uppercase">
                      {userRole === 'ADMIN' ? 'Quản trị viên' :
                       userRole === 'AUTHOR' ? 'Sáng tạo nội dung' : 'Thành viên'}
                    </span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    {userRole === 'ADMIN' && (<>
                      <Link to="/admin" onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-purple-700 hover:bg-purple-50 rounded-lg font-bold text-base transition">
                        ⚙️ Quản lý Hệ thống
                      </Link>
                      <Link to="/admin/revenue" onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-yellow-700 hover:bg-yellow-50 rounded-lg font-bold text-base transition">
                        💰 Báo cáo Doanh thu
                      </Link>
                    </>)}
                    {userRole === 'AUTHOR' && (
                      <>
                        <Link to="/author" onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-green-700 hover:bg-green-50 rounded-lg font-bold text-base transition">
                          ✍️ Quản lý Nội dung
                        </Link>
                        <Link to="/author/bookings" onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-blue-700 hover:bg-blue-50 rounded-lg font-bold text-base transition">
                          📋 Thông tin đặt tour
                        </Link>
                      </>
                    )}

                    <Link to="/favorites" onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-lg text-base transition font-semibold">
                      ❤️ Yêu thích của tôi
                    </Link>
                    <Link to="/my-bookings" onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-700
                        hover:bg-blue-50 rounded-lg text-sm transition">
                      🎫 Lịch sử đặt tour
                    </Link>
                    <Link to="/settings" onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-blue-50 rounded-lg text-base transition">
                      👤 Chỉnh sửa hồ sơ
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-base transition">
                      🚪 Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-gray-700 font-semibold hover:text-blue-600 text-base transition">
                {t('menu.login')}
              </Link>
              <Link to="/register" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition text-base">
                {t('menu.register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;