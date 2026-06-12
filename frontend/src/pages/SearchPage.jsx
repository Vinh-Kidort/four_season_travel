import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from '../api/axios';
import axiosAI from 'axios';


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

const TABS = [
  { key: 'all',       label: 'Tất cả' },
  { key: 'tours',     label: 'Tour & Trải nghiệm' },
  { key: 'locations', label: 'Địa điểm' },
  { key: 'articles',  label: 'Bài viết' },
];

const SORT_OPTIONS = [
  { key: 'default',    label: 'Nên đặt' },
  { key: 'price_asc',  label: 'Giá thấp nhất' },
  { key: 'price_desc', label: 'Giá cao nhất' },
  { key: 'newest',     label: 'Mới nhất' },
];

// Lấy ngày theo offset
const getDateByOffset = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0]; // yyyy-MM-dd
};

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('q') || '';
  const urlDate = searchParams.get('date') || '';

  const [results,          setResults]          = useState({ tours: [], articles: [], locations: [] });
  const [loading,          setLoading]          = useState(false);
  const [activeTab,        setActiveTab]        = useState('all');
  const [sortBy,           setSortBy]           = useState('default');
  const [priceMax,         setPriceMax]         = useState(50000000);
  const [selectedDate,     setSelectedDate]     = useState('all'); // 'all' | 'today' | 'tomorrow' | string date
  const [selectedLocIds,   setSelectedLocIds]   = useState([]);   // mảng id địa điểm được chọn
  const [isAiLoading, setIsAiLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [aiToast, setAiToast] = useState(null);

  const showToast = (type, title, message) => {
    setAiToast({ type, title, message });
    setTimeout(() => setAiToast(null), 5000); // Tự tắt sau 5 giây
  };

  useEffect(() => {
    if (!keyword.trim()) return;
    setLoading(true);
    // Reset filter khi search mới
    setSelectedLocIds([]);
    setSelectedDate(urlDate || 'all');
    axios.get('/search', { params: { keyword, date: urlDate } })
      .then(res => { setResults(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [keyword, urlDate]);

  // ── Toggle chọn/bỏ địa điểm ──────────────────────────────
  const toggleLocation = (id) => {
    setSelectedLocIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // ── Logic filter ngày ────────────────────────────────────
  const matchDate = (tourDate) => {
    if (selectedDate === 'all' || !tourDate) return true;
    if (selectedDate === 'today')    return tourDate === getDateByOffset(0);
    if (selectedDate === 'tomorrow') return tourDate === getDateByOffset(1);
    return tourDate === selectedDate; // date cụ thể
  };

  // ── Lấy items đã filter + sort ───────────────────────────
  const getItems = () => {
    let items =
      activeTab === 'all'       ? [...results.tours, ...results.articles, ...results.locations]
      : activeTab === 'tours'   ? results.tours
      : activeTab === 'articles'? results.articles
      :                           results.locations;

    // Filter giá (tour)
    items = items.filter(item =>
      item.type !== 'tour' || (Number(item.price) <= priceMax)
    );

    // Filter ngày (tour)
    items = items.filter(item =>
      item.type !== 'tour' || matchDate(item.departureDate)
    );

    // Filter địa điểm — chỉ áp dụng khi có chọn
    if (selectedLocIds.length > 0) {
      items = items.filter(item => {
        if (item.type === 'location') return selectedLocIds.includes(item.id);
        if (item.type === 'tour') {
          // Tour có locationIds chứa bất kỳ địa điểm nào được chọn
          return (item.locationIds || []).some(lid => selectedLocIds.includes(lid));
        }
        return true; // article không lọc theo địa điểm
      });
    }

    // Sắp xếp
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
      const res = await fetch(process.env.REACT_APP_AI_PREDICT_URL, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        const { location, confidence } = data;
        
        if (confidence >= 60.0) {
          const realKeyword = getVietnameseName(location);
          
          // Hiện Box thông báo thành công
          showToast(
            'success', 
            'Nhận diện thành công!', 
            `AI phân tích ảnh này là: ${realKeyword} (${confidence.toFixed(1)}%)`
          );
          
          searchParams.set('q', realKeyword);
          setSearchParams(searchParams);
          
        } else {
          // Hiện Box thông báo khi độ tự tin thấp
          showToast(
            'warning',
            'Hình ảnh chưa rõ ràng ',
            'Hệ thống không chắc chắn đây là địa điểm nào. Bạn thử góc chụp khác nhé!'
          );
        }
      } else {
        showToast('error', 'Lỗi Server AI', data.error);
      }
    } catch (error) {
      console.error('Lỗi nhận diện AI:', error);
      showToast('error', 'Mất kết nối', 'Máy chủ AI đang bận hoặc chưa bật!');
    } finally {
      setIsAiLoading(false);
      event.target.value = ''; 
    }
  };

  const items = getItems();
  const total = results.tours.length + results.articles.length + results.locations.length;

  // Giá max thực tế trong kết quả (để set range đúng)
  const maxPriceInResults = Math.max(
    ...results.tours.map(t => Number(t.price) || 0), 50000000
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── MỚI THÊM: GIAO DIỆN BOX THÔNG BÁO ── */}
      {aiToast && (
        <div className={`fixed top-24 right-4 z-[9999] p-4 rounded-xl shadow-2xl border-l-4 flex items-start gap-3 w-80 bg-white transition-all duration-500 animate-fade-in-down ${
          aiToast.type === 'success' ? 'border-green-500' :
          aiToast.type === 'warning' ? 'border-orange-500' : 'border-red-500'
        }`}>
          <div className="flex-shrink-0 mt-0.5">
            {aiToast.type === 'success' }
            {aiToast.type === 'warning' }
            {aiToast.type === 'error' }
          </div>
          
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

          <button onClick={() => setAiToast(null)} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
            ✕
          </button>
        </div>
      )}
      {/* ── KẾT THÚC VÙNG THÔNG BÁO ── */}

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── MỚI THÊM: VÙNG TÌM KIẾM BẰNG HÌNH ẢNH ── */}
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <div>
              <h3 className="font-bold text-gray-800">Không biết tên địa điểm này?</h3>
              <p className="text-sm text-gray-500">Tải ảnh lên, AI của chúng tôi sẽ tìm giúp bạn!</p>
            </div>
          </div>
          
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleAiUpload} 
            className="hidden" 
          />
          
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={isAiLoading}
            className={`px-5 py-2 rounded-lg font-bold text-white transition ${
              isAiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isAiLoading ? '⏳ Đang phân tích...' : '📷 Tải ảnh lên'}
          </button>
        </div>
        {/* ── KẾT THÚC VÙNG AI ── */}

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Hoạt động khớp với <span className="text-blue-600">"{keyword}"</span>
        </h1>
        {urlDate && <p className="text-gray-400 text-sm mb-3">📅 Ngày: {urlDate}</p>}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 ${
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

        <div className="flex gap-6">

          {/* ── Sidebar ── */}
          <div className="w-64 flex-shrink-0 hidden lg:block space-y-4">

            {/* Filter giá */}
            {(activeTab === 'all' || activeTab === 'tours') && results.tours.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Giá</h3>
                <input type="range"
                  min="0" max={maxPriceInResults} step="500000"
                  value={priceMax}
                  onChange={e => setPriceMax(Number(e.target.value))}
                  className="w-full accent-blue-600" />
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-400">0đ</span>
                  <span className="font-bold text-blue-600">
                    {priceMax.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                {/* Hiện số tour sau filter */}
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {results.tours.filter(t => Number(t.price) <= priceMax).length} tour phù hợp
                </p>
              </div>
            )}

            {/* Filter ngày khởi hành */}
            {(activeTab === 'all' || activeTab === 'tours') && results.tours.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3">Ngày khởi hành</h3>
                <div className="space-y-2">
                  {[
                    { key: 'all',      label: 'Mọi ngày' },
                    { key: 'today',    label: `Hôm nay (${getDateByOffset(0)})` },
                    { key: 'tomorrow', label: `Ngày mai (${getDateByOffset(1)})` },
                  ].map(opt => (
                    <button key={opt.key}
                      onClick={() => setSelectedDate(opt.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition ${
                        selectedDate === opt.key
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                      }`}>
                      {selectedDate === opt.key && '✓ '}{opt.label}
                    </button>
                  ))}

                  {/* Chọn ngày cụ thể */}
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 mb-1">Hoặc chọn ngày:</p>
                    <input type="date"
                      value={!['all','today','tomorrow'].includes(selectedDate) ? selectedDate : ''}
                      onChange={e => setSelectedDate(e.target.value || 'all')}
                      className={`w-full border rounded-lg px-3 py-2 text-sm outline-none cursor-pointer ${
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
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-800">Địa điểm</h3>
                  {selectedLocIds.length > 0 && (
                    <button onClick={() => setSelectedLocIds([])}
                      className="text-xs text-blue-500 hover:text-blue-700">
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {results.locations.map(loc => (
                    <label key={loc.id}
                      className="flex items-center gap-2 text-sm cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedLocIds.includes(loc.id)}
                        onChange={() => toggleLocation(loc.id)}
                        className="accent-blue-600 w-4 h-4 cursor-pointer"
                      />
                      <span className={`transition ${
                        selectedLocIds.includes(loc.id)
                          ? 'text-blue-700 font-medium'
                          : 'text-gray-600 group-hover:text-blue-600'
                      }`}>
                        {loc.name}
                      </span>
                    </label>
                  ))}
                </div>
                {/* Badge số địa điểm đang chọn */}
                {selectedLocIds.length > 0 && (
                  <p className="text-xs text-blue-500 mt-3 font-medium">
                    Đang lọc theo {selectedLocIds.length} địa điểm
                  </p>
                )}
              </div>
            )}

            {/* Nút reset toàn bộ filter */}
            {(selectedLocIds.length > 0 ||
              selectedDate !== 'all' ||
              priceMax < maxPriceInResults) && (
              <button
                onClick={() => {
                  setSelectedLocIds([]);
                  setSelectedDate('all');
                  setPriceMax(maxPriceInResults);
                }}
                className="w-full py-2 text-sm text-red-500 hover:text-red-700
                  border border-red-200 hover:border-red-400 rounded-xl transition">
                🔄 Xóa tất cả bộ lọc
              </button>
            )}
          </div>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">
                  Tìm thấy <strong className="text-gray-800">{items.length}</strong> kết quả
                </p>
                {/* Badge filter đang active */}
                {selectedDate !== 'all' && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    📅 {selectedDate === 'today' ? 'Hôm nay'
                       : selectedDate === 'tomorrow' ? 'Ngày mai'
                       : selectedDate}
                    <button onClick={() => setSelectedDate('all')} className="ml-1 hover:text-red-500">×</button>
                  </span>
                )}
                {selectedLocIds.length > 0 && (
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                    📍 {selectedLocIds.length} địa điểm
                    <button onClick={() => setSelectedLocIds([])} className="ml-1 hover:text-red-500">×</button>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sắp xếp theo</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm
                    outline-none focus:border-blue-400 bg-white cursor-pointer">
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                    <div className="h-44 bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Không có kết quả */}
            {!loading && items.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-gray-600 text-lg font-medium">Không tìm thấy kết quả</p>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedLocIds.length > 0 || selectedDate !== 'all'
                    ? 'Thử bỏ bớt bộ lọc nhé!'
                    : 'Thử tìm với từ khóa khác nhé!'}
                </p>
                {(selectedLocIds.length > 0 || selectedDate !== 'all') && (
                  <button
                    onClick={() => { setSelectedLocIds([]); setSelectedDate('all'); }}
                    className="mt-4 text-blue-600 text-sm hover:underline">
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            )}

            {/* Kết quả */}
            {!loading && items.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((item, idx) => (
                  <SearchResultCard key={`${item.type}-${item.id}-${idx}`} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Card kết quả ──────────────────────────────────────────────
function SearchResultCard({ item }) {
  const to = item.type === 'tour'    ? `/tours/${item.id}`
           : item.type === 'article' ? `/articles/${item.id}`
           :                           `/locations/${item.id}`;

  const badge = item.type === 'tour'
    ? { label: 'Tour',      color: 'bg-green-100 text-green-700' }
    : item.type === 'article'
    ? { label: 'Bài viết',  color: 'bg-blue-100 text-blue-700' }
    : { label: 'Địa điểm',  color: 'bg-orange-100 text-orange-700' };

  return (
    <Link to={to}
      className="bg-white rounded-xl shadow-sm border border-gray-100
        hover:shadow-md transition overflow-hidden flex flex-col group">
      <div className="relative overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name || item.title}
            className="w-full h-44 object-cover group-hover:scale-105 transition duration-300" />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-blue-100 to-blue-50
            flex items-center justify-center text-4xl">
            {item.type === 'tour' ? '🧳' : item.type === 'article' ? '📖' : '📍'}
          </div>
        )}
        <span className={`absolute top-3 left-3 text-xs font-bold px-2 py-0.5
          rounded-full ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <h3 className="font-bold text-gray-800 line-clamp-2 text-sm leading-snug">
          {item.name || item.title}
        </h3>

        {item.type === 'tour' && (
          <>
            {item.departureDate && (
              <p className="text-xs text-gray-400">📅 {item.departureDate}</p>
            )}
            <p className="text-xs text-gray-400">⏱️ {item.duration} · 👥 {item.availableSlots} chỗ</p>
            <div className="mt-auto pt-2 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400">Từ</p>
                <p className="text-blue-600 font-bold text-base">
                  {Number(item.price).toLocaleString('vi-VN')}đ
                </p>
              </div>
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                Đặt ngay
              </span>
            </div>
          </>
        )}
        {item.type === 'article' && (
          <p className="text-xs text-gray-400 mt-auto">✍️ {item.author} · {item.createdAt}</p>
        )}
        {item.type === 'location' && (
          <p className="text-xs text-gray-400 mt-auto">📌 {item.region}</p>
        )}
      </div>
    </Link>
  );
}

export default SearchPage;