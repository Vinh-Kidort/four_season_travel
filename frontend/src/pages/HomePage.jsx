import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchBar } from '../components/Navbar';
import axios from '../api/axios';

function HomePage() {
  const { t, i18n } = useTranslation();
  const isEng = i18n.language === 'en';
  const searchBarRef = useRef(null);
  const NAVBAR_HEIGHT = 65;

  const [topLocations, setTopLocations] = useState([]);
  const [topArticles,  setTopArticles]  = useState([]);
  const [topTours,     setTopTours]     = useState([]);
  const [locationsMap, setLocationsMap] = useState({});

  const locationScrollRef = useRef(null);
  const articleScrollRef  = useRef(null);
  const tourScrollRef     = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!searchBarRef.current) return;
      const searchBottom = searchBarRef.current.getBoundingClientRect().bottom;
      window.dispatchEvent(new CustomEvent('toggleNavbarSearch', {
        detail: searchBottom <= NAVBAR_HEIGHT,
      }));
    };

    Promise.all([
      axios.get('/locations'),
      axios.get('/articles'),
      axios.get('/tours'),
    ]).then(([locRes, artRes, tourRes]) => {
      const locMap = {};
      locRes.data.forEach(l => { locMap[l.id] = l.name; });
      setLocationsMap(locMap);

      const sortFn = (a, b) =>
        (b.averageRating || 0) !== (a.averageRating || 0)
          ? (b.averageRating || 0) - (a.averageRating || 0)
          : (b.reviewCount  || 0) - (a.reviewCount  || 0);

      setTopLocations(locRes.data.sort(sortFn).slice(0, 10));
      setTopArticles(artRes.data.sort(sortFn).slice(0, 10));
      setTopTours(tourRes.data.sort(sortFn).slice(0, 10));
    }).catch(err => {
      if (err.message === 'CLIENT_RATE_LIMIT_EXCEEDED') return;
      console.error('HomePage load error:', err);
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollLeft  = ref => ref.current?.scrollBy({ left: -350, behavior: 'smooth' });
  const scrollRight = ref => ref.current?.scrollBy({ left:  350, behavior: 'smooth' });

  // ── Helper lấy tên theo ngôn ngữ ──────────────────────────
  const getLocName  = loc  => isEng && loc.nameEn       ? loc.nameEn       : loc.name;
  const getTourName = tour => isEng && tour.nameEn       ? tour.nameEn      : tour.name;
  const getArtTitle = art  => isEng && art.titleEn       ? art.titleEn      : art.title;
  const getArtDesc  = art  => isEng && art.contentEn     ? art.contentEn    : art.content;
  const getRegion   = loc  => isEng && loc.regionEn      ? loc.regionEn     : loc.region;

  // ── Reusable scroll row ────────────────────────────────────
  const ScrollRow = ({ scrollRef, children }) => (
    <div className="relative group">
      {/* Prev button — chỉ desktop */}
      <button onClick={() => scrollLeft(scrollRef)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10
          bg-white w-10 h-10 rounded-full shadow-lg border border-gray-100
          items-center justify-center text-gray-600 hover:text-blue-600
          hover:scale-110 transition opacity-0 group-hover:opacity-100
          hidden md:flex">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
        </svg>
      </button>

      <div ref={scrollRef}
       className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 snap-x snap-mandatory
        no-scrollbar scroll-smooth w-full">
        {children}
      </div>

      {/* Next button — chỉ desktop */}
      <button onClick={() => scrollRight(scrollRef)}
        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10
          bg-white w-10 h-10 rounded-full shadow-lg border border-gray-100
          items-center justify-center text-gray-600 hover:text-blue-600
          hover:scale-110 transition opacity-0 group-hover:opacity-100
          hidden md:flex">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
        </svg>
      </button>
    </div>
  );

  // ── Rating badge ───────────────────────────────────────────
  const RatingBadge = ({ rating, count }) => (
    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur
      px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 text-xs">
      <span className="text-yellow-500">⭐</span>
      <span className="text-yellow-600 font-bold">{rating || 0}</span>
      <span className="text-gray-400">({count || 0})</span>
    </div>
  );

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ── */}
      <div className="relative text-white text-center bg-cover bg-center bg-no-repeat
        py-20 sm:py-28 md:py-36 px-4 overflow-hidden w-full"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555921015-5532091f6026?q=80&w=2070&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Title — nhỏ hơn trên mobile */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg leading-tight">
            {t('homePage.title')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl mb-8 text-gray-100 drop-shadow-md">
            {t('homePage.subtitle')}
          </p>

          {/* SearchBar — full width trên mobile */}
          <div className="flex justify-center px-0 sm:px-4 relative z-10" ref={searchBarRef}>
            <div className="w-full max-w-2xl drop-shadow-2xl">
              <SearchBar />
            </div>
          </div>

          {/* Quick keywords — ẩn khi quá nhỏ */}
          <div className="hidden sm:flex flex-wrap justify-center gap-2 mt-5">
            {['Hội An', 'Đà Lạt', 'Phú Quốc', 'Sapa', 'Hạ Long'].map(kw => (
              <Link key={kw} to={`/search?q=${kw}`}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white
                  text-sm px-4 py-1.5 rounded-full transition border border-white/30">
                {kw}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Links ── */}
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Link to="/locations"
          className="bg-white rounded-xl shadow-md p-6 sm:p-8 hover:shadow-lg text-center transition">
          <div className="text-4xl sm:text-5xl mb-3">🗺️</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
            {t('homePage.locations')}
          </h2>
          <p className="text-gray-500 text-sm sm:text-base">{t('homePage.locationsDesc')}</p>
        </Link>
        <Link to="/tours"
          className="bg-white rounded-xl shadow-md p-6 sm:p-8 hover:shadow-lg text-center transition">
          <div className="text-4xl sm:text-5xl mb-3">🧳</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
            {t('homePage.tours')}
          </h2>
          <p className="text-gray-500 text-sm sm:text-base">{t('homePage.toursDesc')}</p>
        </Link>
      </div>

      {/* ── Section Header reusable ── */}
      {/* ================= ĐỊA ĐIỂM ================= */}
      <div className="bg-gray-50 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                ❤️ {t('homePage.topLocations', 'Top Địa Điểm Được Yêu Thích')}
              </h2>
              <p className="text-gray-500 text-sm mt-1 hidden sm:block">
                {t('homePage.topLocationsDesc', 'Dựa trên đánh giá thực tế của hàng ngàn du khách')}
              </p>
            </div>
            <Link to="/locations"
              className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full
                border-2 border-blue-100 bg-blue-50 text-blue-700 font-bold text-sm
                hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
              {t('homePage.viewAll', 'Xem tất cả')} →
            </Link>
          </div>

          <ScrollRow scrollRef={locationScrollRef}>
            {topLocations.map(loc => (
              <Link to={`/locations/${loc.id}`} key={loc.id}
                className="w-[200px] xs:w-[220px] sm:w-[260px] md:w-[320px] flex-none snap-start
                  bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl
                  transition-all duration-300 group flex-shrink-0">
                <div className="relative h-40 sm:h-48">
                  {loc.images?.length > 0 ? (
                    <img src={loc.images[0]} alt={getLocName(loc)}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
                  ) : (
                    <div className="bg-blue-100 w-full h-full flex justify-center items-center text-4xl">🏝️</div>
                  )}
                  <RatingBadge rating={loc.averageRating} count={loc.reviewCount} />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base sm:text-lg text-gray-800 line-clamp-1">
                    {getLocName(loc)}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">{getRegion(loc)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">({loc.reviewCount || 0} {t('homePage.reviews', 'đánh giá')})</p>
                </div>
              </Link>
            ))}
          </ScrollRow>

          <div className="mt-3 text-center md:hidden">
            <Link to="/locations" className="text-blue-600 font-bold text-sm hover:underline">
              {t('homePage.viewAllLocations', 'Xem tất cả địa điểm')} →
            </Link>
          </div>
        </div>
      </div>

      {/* ================= TOUR ================= */}
      <div className="bg-white py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                🧳 {t('homePage.topTours', 'Các Tour Du Lịch Hàng Đầu')}
              </h2>
              <p className="text-gray-500 text-sm mt-1 hidden sm:block">
                {t('homePage.topToursDesc', 'Trải nghiệm tuyệt vời với những tour có đánh giá cao nhất')}
              </p>
            </div>
            <Link to="/tours"
              className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full
                border-2 border-green-100 bg-green-50 text-green-700 font-bold text-sm
                hover:bg-green-600 hover:text-white hover:border-green-600 transition-all">
              {t('homePage.viewAll', 'Xem tất cả')} →
            </Link>
          </div>

          <ScrollRow scrollRef={tourScrollRef}>
            {topTours.map(tour => (
              <Link to={`/tours/${tour.id}`} key={tour.id}
                className="w-[200px] xs:w-[220px] sm:w-[280px] md:w-[340px] flex-none snap-start
                  group flex flex-col bg-white rounded-xl shadow-sm border border-gray-100
                  hover:shadow-xl transition-all duration-300 flex-shrink-0">
                <div className="relative h-44 sm:h-52 overflow-hidden rounded-t-xl">
                  {tour.images?.length > 0 ? (
                    <img src={tour.images[0]?.url} alt={getTourName(tour)}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
                  ) : (
                    <div className="bg-green-100 w-full h-full flex justify-center items-center text-4xl">🧳</div>
                  )}
                  <RatingBadge rating={tour.averageRating} count={tour.reviewCount} />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-2
                    line-clamp-2 group-hover:text-blue-600 transition">
                    {getTourName(tour)}
                  </h3>
                  <div className="text-xs sm:text-sm text-gray-500 space-y-1 mb-3 flex-grow">
                    <div>⏱️ {tour.duration}</div>
                    <div className="line-clamp-1">📍 {tour.itinerary}</div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-blue-600 font-bold text-base sm:text-lg">
                      {tour.price?.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-xs bg-green-50 text-green-600
                      px-2 py-0.5 rounded-full font-medium">
                      {t('toursPage.bookNow')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </ScrollRow>

          <div className="mt-3 text-center md:hidden">
            <Link to="/tours" className="text-green-600 font-bold text-sm hover:underline">
              {t('homePage.viewAllTours', 'Xem tất cả tour')} →
            </Link>
          </div>
        </div>
      </div>

      {/* ================= BÀI VIẾT ================= */}
      <div className="bg-gray-50 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                📖 {t('homePage.topArticles', 'Cẩm Nang Du Lịch Nổi Bật')}
              </h2>
              <p className="text-gray-500 text-sm mt-1 hidden sm:block">
                {t('homePage.topArticlesDesc', 'Những bài viết được cộng đồng đánh giá cao nhất')}
              </p>
            </div>
            <Link to="/articles"
              className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full
                border-2 border-yellow-100 bg-yellow-50 text-yellow-700 font-bold text-sm
                hover:bg-yellow-500 hover:text-white hover:border-yellow-500 transition-all">
              {t('homePage.viewAll', 'Xem tất cả')} →
            </Link>
          </div>

          <ScrollRow scrollRef={articleScrollRef}>
            {topArticles.map(article => (
              <Link to={`/articles/${article.id}`} key={article.id}
                className="w-[200px] xs:w-[220px] sm:w-[280px] md:w-[360px] flex-none snap-start
                  group flex flex-col bg-white rounded-xl shadow-sm border border-gray-100
                  hover:shadow-xl transition-all duration-300 flex-shrink-0">
                <div className="relative h-44 sm:h-52 overflow-hidden rounded-t-xl">
                  {article.imageUrl ? (
                    <img src={article.imageUrl} alt={getArtTitle(article)}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
                  ) : (
                    <div className="bg-yellow-100 w-full h-full flex justify-center items-center text-4xl">📖</div>
                  )}
                  <RatingBadge rating={article.averageRating} count={article.reviewCount} />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-2
                    line-clamp-2 group-hover:text-blue-600 transition">
                    {getArtTitle(article)}
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 mb-3 flex-grow">
                    {getArtDesc(article)}
                  </p>
                  <div className="flex items-center justify-between pt-3
                    border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 flex-shrink-0 bg-blue-100 text-blue-600
                        rounded-full flex items-center justify-center font-bold text-xs">
                        {article.author?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-700 truncate max-w-[100px]">
                        {article.authorName || article.author?.split('@')[0] || 'Ẩn danh'}
                      </span>
                    </div>
                    {article.locationId && locationsMap[article.locationId] && (
                      <div className="text-xs text-blue-600 font-medium bg-blue-50
                        px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ml-2">
                        <span>📍</span>
                        <span className="truncate max-w-[80px]">
                          {locationsMap[article.locationId]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </ScrollRow>

          <div className="mt-3 text-center md:hidden">
            <Link to="/articles" className="text-yellow-600 font-bold text-sm hover:underline">
              {t('homePage.viewAllArticles', 'Xem tất cả cẩm nang')} →
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}

export default HomePage;