import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import axios from './api/axios'; // Đã thêm import axios cho Guard

// Import Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Import Pages
import HomePage from './pages/HomePage';
import LocationsPage from './pages/LocationsPage';
import ToursPage from './pages/ToursPage';
import TourDetail from './pages/TourDetail';
import BookingPage from './pages/BookingPage';
import ArticlesPage from './pages/ArticlesPage';
import ArticleDetail from './pages/ArticleDetail';
import LocationDetail from './pages/LocationDetail';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import AuthorDashboard from './pages/AuthorDashboard';
import CreateArticlePage from './pages/CreateArticlePage';
import CreateTourPage from './pages/CreateTourPage';
import RevenuePage from './pages/RevenuePage';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import MyBookingPage from './pages/MyBookingPage';
import TourBookingsPage from './pages/TourBookingsPage';
import AuthorBookingsOverview from './pages/AuthorBookingsOverview';

// IMPORT FILE RIÊNG ĐỔI MẬT KHẨU BẮT BUỘC
import ForceChangePasswordPage from './pages/ForceChangePasswordPage';

// ── KHỞI TẠO COMPONENT GUARD BẢO VỆ NGAY TRONG FILE APP ─────────────────
function ForceChangePasswordGuard({ children }) {
  const [mustChange, setMustChange] = useState(false);
  const [checked, setChecked] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { 
      setChecked(true); 
      return; 
    }
    axios.get('/auth/must-change-password')
      .then(res => {
        setMustChange(res.data.mustChange);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [token]);

  if (!checked) return null; // Đang check kiểm tra trạng thái thì tạm để trống
  if (mustChange) return <ForceChangePasswordPage />; // Bị dính mật khẩu tạm -> Ép sang trang đổi
  return children; // Hợp lệ -> Cho đi tiếp vào các trang bên trong
}

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // =======================================================
  // LOGIC MÀN HÌNH KHÓA CHỐNG SPAM (Giữ nguyên)
  // =======================================================
  const isDetailPage = /^\/(locations|tours|articles)\/[^/]+$/.test(location.pathname);
  const shouldShowRecaptcha = 
    location.pathname === '/login' || 
    location.pathname === '/register' || 
    isDetailPage;

  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const checkLock = () => {
      const unlockTime = localStorage.getItem('unlockTime');
      if (unlockTime) {
        const remaining = Math.ceil((parseInt(unlockTime) - Date.now()) / 1000);
        if (remaining > 0) {
          setIsLocked(true);
          setTimeLeft(remaining);
        } else {
          setIsLocked(false);
          localStorage.removeItem('unlockTime');
        }
      }
    };

    checkLock();
    const handleRateLimit = () => checkLock();
    window.addEventListener('rateLimitExceeded', handleRateLimit);

    const handleBeforeUnload = (e) => {
      const unlockTime = localStorage.getItem('unlockTime');
      if (unlockTime && Date.now() < parseInt(unlockTime)) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    let interval;
    if (isLocked) {
      interval = setInterval(() => {
        checkLock();
      }, 1000);
    }

    return () => {
      window.removeEventListener('rateLimitExceeded', handleRateLimit);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
    };
  }, [isLocked]);

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl text-center max-w-md w-full border border-gray-100">
          <div className="text-7xl mb-6 animate-bounce">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Phát hiện spam!</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Hệ thống nhận thấy thao tác tải trang quá nhanh. Để bảo vệ hệ thống, vui lòng đợi bộ đếm kết thúc.
          </p>
          <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 mb-6">
            <div className="text-5xl font-black text-red-600 mb-1">{timeLeft}</div>
            <div className="text-sm text-red-400 font-bold uppercase tracking-widest">giây</div>
          </div>
          <p className="text-xs text-gray-400">*Dù bạn có cố tình tải lại trang thì bộ đếm vẫn tiếp tục chạy.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!shouldShowRecaptcha && (
        <style>{`
          .grecaptcha-badge {
            visibility: hidden !important;
            opacity: 0 !important;
          }
        `}</style>
      )}

      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          
          {/* ── BỌC TOÀN BỘ KHỐI ROUTES VÀO BÊN TRONG GUARD ── */}
          <ForceChangePasswordGuard>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/tours" element={<ToursPage />} />
              <Route path="/articles" element={<ArticlesPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              
              <Route path="/booking/:tourId" element={<BookingPage />} />
              <Route path="/my-bookings" element={<MyBookingPage />} />
              
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/locations/:id" element={<LocationDetail />} />
              <Route path="/tours/:id" element={<TourDetail />} />
              <Route path="/articles/:id" element={<ArticleDetail />} />
              
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/revenue" element={<RevenuePage />} />

              <Route path="/author" element={<AuthorDashboard />} />
              <Route path="/author/create-article" element={<CreateArticlePage />} />
              <Route path="/author/create-tour" element={<CreateTourPage />} />
              
              <Route path="/author/tours/:tourId/bookings" element={<TourBookingsPage />} />
              <Route path="/author/bookings" element={<AuthorBookingsOverview />} />
            </Routes>
          </ForceChangePasswordGuard>
          {/* ── KẾT THÚC BỌC GUARD ── */}

        </main>

        {isHomePage && <Footer />}
      </div>
    </div>
  );
}

export default App;