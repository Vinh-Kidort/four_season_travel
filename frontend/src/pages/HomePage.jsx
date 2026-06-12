import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchBar } from '../components/Navbar'; 
import axios from '../api/axios';

function HomePage() {
  const { t } = useTranslation();
  const searchBarRef = useRef(null); 
  const NAVBAR_HEIGHT = 65; 
  const [topLocations, setTopLocations] = useState([]);
  const [topArticles, setTopArticles] = useState([]);
  const [topTours, setTopTours] = useState([]);
  const [locationsMap, setLocationsMap] = useState({});

  // Tạo Ref để điều khiển thanh cuộn
  const locationScrollRef = useRef(null);
  const articleScrollRef = useRef(null);
  const tourScrollRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!searchBarRef.current) return;
      const searchBottom = searchBarRef.current.getBoundingClientRect().bottom;
      const shouldShow = searchBottom <= NAVBAR_HEIGHT;

      window.dispatchEvent(
        new CustomEvent('toggleNavbarSearch', {
          detail: shouldShow,
        })
      );
    };

    Promise.all([
      axios.get('/locations'),
      axios.get('/articles'),
      axios.get('/tours')
    ])
      .then(([locRes, artRes, tourRes]) => {
        // Xử lý dữ liệu Locations
        const locMap = {};
        locRes.data.forEach(l => { locMap[l.id] = l.name; });
        setLocationsMap(locMap);

        const sortedLocs = locRes.data.sort((a, b) => {
          if ((b.averageRating || 0) === (a.averageRating || 0)) {
            return (b.reviewCount || 0) - (a.reviewCount || 0);
          }
          return (b.averageRating || 0) - (a.averageRating || 0);
        }).slice(0, 10);
        setTopLocations(sortedLocs);

        // Xử lý dữ liệu Articles
        const sortedArts = artRes.data.sort((a, b) => {
          if ((b.averageRating || 0) === (a.averageRating || 0)) {
            return (b.reviewCount || 0) - (a.reviewCount || 0);
          }
          return (b.averageRating || 0) - (a.averageRating || 0);
        }).slice(0, 10);
        setTopArticles(sortedArts);

        // Xử lý dữ liệu Tours
        const sortedTours = tourRes.data.sort((a, b) => {
          if ((b.averageRating || 0) === (a.averageRating || 0)) {
            return (b.reviewCount || 0) - (a.reviewCount || 0);
          }
          return (b.averageRating || 0) - (a.averageRating || 0);
        }).slice(0, 10);
        setTopTours(sortedTours);
      })
      .catch((error) => {
        // [THÊM MỚI] Bắt lỗi khi bị chặn Rate Limit
        if (error.message === 'CLIENT_RATE_LIMIT_EXCEEDED') {
          console.warn("HomePage: Tạm ngưng lấy dữ liệu do đang bị khóa Rate Limit.");
          return; // Kết thúc êm đẹp
        }
        console.error("Lỗi khi tải dữ liệu HomePage:", error);
      });

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Hàm xử lý bấm nút Trái/Phải
  const scrollLeft = (ref) => {
    if (ref.current) ref.current.scrollBy({ left: -350, behavior: 'smooth' });
  };
  const scrollRight = (ref) => {
    if (ref.current) ref.current.scrollBy({ left: 350, behavior: 'smooth' });
  };

  return (
    <div>
      {/* ── Hero ── */}
      <div 
        className="relative text-white text-center py-32 px-4 bg-cover bg-center bg-no-repeat"
        style={{ 
          // Bạn có thể thay link ảnh Unsplash này bằng ảnh của dự án
          backgroundImage: "url('https://images.unsplash.com/photo-1555921015-5532091f6026?q=80&w=2070&auto=format&fit=crop')" 
        }}
      >
        {/* Lớp phủ mờ (Overlay) giúp chữ và thanh tìm kiếm nổi bật rõ ràng trên nền ảnh */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-3 drop-shadow-lg">{t('homePage.title')}</h1>
          <p className="text-xl mb-10 text-gray-100 drop-shadow-md">{t('homePage.subtitle')}</p>

          <div className="flex justify-center px-4 relative z-10" ref={searchBarRef}>
            <div className="w-full max-w-2xl drop-shadow-2xl">
              <SearchBar />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-6 relative z-0">
            {['Hội An', 'Đà Lạt', 'Phú Quốc', 'Sapa', 'Hạ Long'].map(kw => (
              <Link key={kw} to={`/search?q=${kw}`}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-sm px-4 py-1.5 rounded-full transition border border-white/30 shadow-sm">
                {kw}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Links ── */}
      <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link to="/locations" className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg text-center transition">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('homePage.locations')}</h2>
          <p className="text-gray-500">{t('homePage.locationsDesc')}</p>
        </Link>
        <Link to="/tours" className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg text-center transition">
          <div className="text-5xl mb-4">🧳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('homePage.tours')}</h2>
          <p className="text-gray-500">{t('homePage.toursDesc')}</p>
        </Link>
      </div>

      {/* ================= LƯỚT NGANG: ĐỊA ĐIỂM YÊU THÍCH ================= */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* HEADER: Tiêu đề bên trái, Nút Xem tất cả bên phải */}
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">❤️ Top Địa Điểm Được Yêu Thích</h2>
              <p className="text-gray-500 mt-2">Dựa trên đánh giá thực tế của hàng ngàn du khách</p>
            </div>
            {/* NÚT XEM TẤT CẢ ĐÃ ĐƯỢC BO VIỀN */}
            <Link 
              to="/locations" 
              className="hidden md:flex items-center gap-2 px-5 py-2 rounded-full border-2 border-blue-100 bg-blue-50 text-blue-700 font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 shadow-sm"
            >
              Xem tất cả <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="relative group">
            <button 
              onClick={() => scrollLeft(locationScrollRef)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 z-10 bg-white w-12 h-12 rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:scale-110 transition opacity-0 group-hover:opacity-100 hidden md:flex"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
            </button>

            <div ref={locationScrollRef} className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory no-scrollbar scroll-smooth">
              {topLocations.map(loc => (
                <Link 
                  to={`/locations/${loc.id}`} 
                  key={loc.id} 
                  className="w-[280px] md:w-[320px] flex-none snap-start bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 block group flex-shrink-0"
                >
                  <div className="relative h-48">
                    {loc.images && loc.images.length > 0 ? (
                      <img src={loc.images[0]} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="bg-blue-100 w-full h-full flex justify-center items-center text-4xl">🏝️</div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 text-sm">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-yellow-600 font-bold">{loc.averageRating || 0}</span>
                      <span className="text-gray-500">({loc.reviewCount || 0})</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-xl text-gray-800 line-clamp-1">{loc.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{loc.region}</p>
                    <p className="text-sm text-gray-400">({loc.reviewCount || 0} bài đánh giá)</p>
                  </div>
                </Link>
              ))}
            </div>

            <button 
              onClick={() => scrollRight(locationScrollRef)}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-5 z-10 bg-white w-12 h-12 rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:scale-110 transition opacity-0 group-hover:opacity-100 hidden md:flex"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
          
          {/* Nút Xem tất cả cho giao diện Mobile (Nằm dưới cùng) */}
          <div className="mt-4 text-center md:hidden">
            <Link to="/locations" className="text-blue-600 font-bold hover:underline">
              Xem tất cả địa điểm &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* ================= LƯỚT NGANG: TOUR ĐÁNG CHÚ Ý ================= */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">🧳 Các Tour Du Lịch Hàng Đầu</h2>
              <p className="text-gray-500 mt-2">Trải nghiệm tuyệt vời với những tour có đánh giá cao nhất</p>
            </div>
            <Link 
              to="/tours" 
              className="hidden md:flex items-center gap-2 px-5 py-2 rounded-full border-2 border-green-100 bg-green-50 text-green-700 font-bold hover:bg-green-600 hover:text-white hover:border-green-600 transition-all duration-300 shadow-sm"
            >
              Xem tất cả <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="relative group">
            <button 
              onClick={() => scrollLeft(tourScrollRef)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 z-10 bg-white w-12 h-12 rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:scale-110 transition opacity-0 group-hover:opacity-100 hidden md:flex"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
            </button>

            <div ref={tourScrollRef} className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory no-scrollbar scroll-smooth">
              {topTours.map(tour => (
                <Link 
                  to={`/tours/${tour.id}`} 
                  key={tour.id} 
                  className="w-[300px] md:w-[340px] flex-none snap-start group flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 flex-shrink-0"
                >
                  <div className="relative h-52 overflow-hidden rounded-t-xl">
                    {tour.images && tour.images.length > 0 ? (
                      <img src={tour.images[0]?.url} alt={tour.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="bg-green-100 w-full h-full flex justify-center items-center text-4xl">🧳</div>
                    )}
                    
                    {/* Rating Badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 text-sm">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-yellow-600 font-bold">{tour.averageRating || 0}</span>
                      <span className="text-gray-500">({tour.reviewCount || 0})</span>
                    </div>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-xl text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                      {tour.name}
                    </h3>
                    <div className="text-sm text-gray-500 space-y-1 mb-4 flex-grow">
                      <div>⏱️ {tour.duration}</div>
                      <div className="line-clamp-1">📍 {tour.itinerary}</div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <span className="text-blue-600 font-bold text-lg">
                        {tour.price?.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <button 
              onClick={() => scrollRight(tourScrollRef)}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-5 z-10 bg-white w-12 h-12 rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:scale-110 transition opacity-0 group-hover:opacity-100 hidden md:flex"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
          
          <div className="mt-4 text-center md:hidden">
            <Link to="/tours" className="text-green-600 font-bold hover:underline">
              Xem tất cả tour &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* ================= LƯỚT NGANG: BÀI VIẾT HỮU ÍCH ================= */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* HEADER: Tiêu đề bên trái, Nút Xem tất cả bên phải */}
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">📖 Cẩm Nang Du Lịch Nổi Bật</h2>
              <p className="text-gray-500 mt-2">Những bài viết được cộng đồng đánh giá cao nhất</p>
            </div>
            {/* NÚT XEM TẤT CẢ ĐÃ ĐƯỢC BO VIỀN (Dùng tone màu vàng/cam hợp với Bài viết) */}
            <Link 
              to="/articles" 
              className="hidden md:flex items-center gap-2 px-5 py-2 rounded-full border-2 border-yellow-100 bg-yellow-50 text-yellow-700 font-bold hover:bg-yellow-500 hover:text-white hover:border-yellow-500 transition-all duration-300 shadow-sm"
            >
              Xem tất cả <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="relative group">
            <button 
              onClick={() => scrollLeft(articleScrollRef)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 z-10 bg-white w-12 h-12 rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:scale-110 transition opacity-0 group-hover:opacity-100 hidden md:flex"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
            </button>

            <div ref={articleScrollRef} className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory no-scrollbar scroll-smooth">
              {topArticles.map(article => (
                <Link 
                  to={`/articles/${article.id}`} 
                  key={article.id} 
                  className="w-[300px] md:w-[360px] flex-none snap-start group flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 flex-shrink-0"
                >
                  <div className="relative h-52 overflow-hidden rounded-t-xl">
                    {article.imageUrl ? (
                      <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="bg-yellow-100 w-full h-full flex justify-center items-center text-4xl">📖</div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 text-sm">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-yellow-600 font-bold">{article.averageRating || 0}</span>
                      <span className="text-gray-500">({article.reviewCount || 0})</span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="font-bold text-xl text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition">
                      {article.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-grow">
                      {article.content}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      
                      {/* BÊN TRÁI: Avatar và Username */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 flex-shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                          {article.author ? article.author.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <span className="text-sm font-bold text-gray-700 truncate max-w-[120px]">
                          {article.authorName || article.author?.split('@')[0] || 'Ẩn danh'}
                        </span>
                      </div>

                      {/* BÊN PHẢI: Địa điểm */}
                      {article.locationId && locationsMap[article.locationId] && (
                        <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                          <span>📍</span>
                          <span className="truncate max-w-[100px]">{locationsMap[article.locationId]}</span>
                        </div>
                      )}
                      
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <button 
              onClick={() => scrollRight(articleScrollRef)}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-5 z-10 bg-white w-12 h-12 rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:scale-110 transition opacity-0 group-hover:opacity-100 hidden md:flex"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
          
          {/* Nút Xem tất cả cho giao diện Mobile (Nằm dưới cùng) */}
          <div className="mt-4 text-center md:hidden">
            <Link to="/articles" className="text-blue-600 font-bold hover:underline">
              Xem tất cả cẩm nang &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;