// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Từ điển các ngôn ngữ (Bạn có thể thêm Tiếng Pháp, Nhật... vào đây sau)
const resources = {
  vn: {
    translation: {
      "menu": {
        "home": "Trang chủ",
        "locations": "Địa điểm",
        "tours": "Tour du lịch",
        "articles": "Cẩm nang",
        "login": "Đăng nhập",
        "register": "Đăng ký",
        "logout": "Đăng xuất"
      },
      "common": {
        "loading": "Đang tải...",
        "notFound": "Không tìm thấy!",
        "backList": "← Quay lại danh sách"
      },
      "article": {
        "author": "✍️ Tác giả:",
        "posted": "📅 Ngày đăng:",
        "notFoundDetail": "Không tìm thấy bài viết!",
        "noArticles": "Chưa có bài viết nào."
      },
      "tour": {
        "duration": "⏱️ Thời gian:",
        "slots": "👥 Số chỗ:",
        "remaining": "Còn lại:",
        "status": "📌 Trạng thái:",
        "active": "Đang mở",
        "closed": "Đã đóng",
        "itinerary": "Lịch trình chi tiết:",
        "bookTour": "Tiến hành đặt Tour",
        "fullSlots": "Đã hết chỗ",
        "notFoundDetail": "Không tìm thấy tour!"
      },
      "location": {
        "bestSeason": "Mùa đẹp nhất:",
        "toursHere": "Các Tour đi qua",
        "departure": "📅 Khởi hành:",
        "updating": "Đang cập nhật",
        "details": "Xem chi tiết",
        "noTours": "Hiện tại chưa có Tour nào mở bán cho địa điểm này.",
        "notFoundDetail": "Không tìm thấy địa điểm!"
      },
      "homePage": {
        "title": "Khám Phá Việt Nam",
        "subtitle": "Những hành trình tuyệt vời đang chờ đón bạn",
        "viewTours": "Xem các tour",
        "locations": "Địa điểm",
        "locationsDesc": "Khám phá các địa điểm du lịch nổi tiếng",
        "tours": "Tour du lịch",
        "toursDesc": "Đặt tour với giá tốt nhất"
      },
      "articlesPage": {
        "title": "Cẩm nang du lịch",
        "readMore": "Đọc tiếp ",
        "noArticles": "Chưa có bài viết nào."
      },
      "toursPage": {
        "title": "Tour du lịch",
        "days": "ngày",
        "available": "chỗ",
        "departureDate": "Khởi hành",
        "bookNow": "Đặt ngay",
        "noTours": "Chưa có tour nào."
      },
      "locationsPage": {
        "title": "Địa điểm du lịch",
        "loading": "Đang tải...",
        "error": "Không thể tải dữ liệu!",
        "noLocations": "Chưa có địa điểm nào."
      },
      "bookingPage": {
        "title": "Đặt tour",
        "fullName": "Họ tên",
        "email": "Email",
        "phone": "Số điện thoại",
        "numberOfPeople": "Số người",
        "totalPrice": "Tổng tiền:",
        "confirmBooking": "Xác nhận đặt tour",
        "successMessage": "✅ Đặt tour thành công!",
        "errorMessage": "❌ Đặt tour thất bại, vui lòng thử lại!",
        "placeholderName": "Nguyễn Văn A",
        "placeholderEmail": "example@email.com",
        "placeholderPhone": "0901234567"
      },
      "loginPage": {
        "title": "Chào mừng trở lại",
        "subtitle": "Vui lòng đăng nhập để tiếp tục",
        "email": "Email",
        "password": "Mật khẩu",
        "login": "Đăng nhập",
        "noAccount": "Chưa có tài khoản?",
        "signUpNow": "Đăng ký ngay",
        "placeholderEmail": "Nhập email của bạn",
        "placeholderPassword": "••••••••",
        "errorMessage": "Đăng nhập thất bại! Vui lòng kiểm tra lại email và mật khẩu."
      },
      "registerPage": {
        "title": "Đăng ký tài khoản",
        "subtitle": "Đăng ký để trải nghiệm trọn vẹn Four Season Travel",
        "fullName": "Họ và Tên",
        "email": "Email",
        "password": "Mật khẩu",
        "register": "Đăng ký tài khoản",
        "hasAccount": "Đã có tài khoản?",
        "loginNow": "Đăng nhập",
        "placeholderName": "Nguyễn Văn A",
        "placeholderEmail": "example@gmail.com",
        "placeholderPassword": "Tạo mật khẩu (ít nhất 8 ký tự)",
        "successMessage": "✅ Đăng ký thành công! Đang chuyển đến trang đăng nhập...",
        "errorConnect": "Lỗi kết nối đến máy chủ!"
      }
    }
  },
  en: {
    translation: {
      "menu": {
        "home": "Home",
        "locations": "Locations",
        "tours": "Tours",
        "articles": "Travel Guide",
        "login": "Log In",
        "register": "Sign Up",
        "logout": "Logout"
      },
      "common": {
        "loading": "Loading...",
        "notFound": "Not found!",
        "backList": "← Back to list"
      },
      "article": {
        "author": "✍️ Author:",
        "posted": "📅 Posted:",
        "notFoundDetail": "Article not found!",
        "noArticles": "No articles yet."
      },
      "tour": {
        "duration": "⏱️ Duration:",
        "slots": "👥 Slots:",
        "remaining": "Remaining:",
        "status": "📌 Status:",
        "active": "Open",
        "closed": "Closed",
        "itinerary": "Detailed Itinerary:",
        "bookTour": "Book Tour",
        "fullSlots": "Fully Booked",
        "notFoundDetail": "Tour not found!"
      },
      "location": {
        "bestSeason": "Best Season:",
        "toursHere": "Tours visiting",
        "departure": "📅 Departure:",
        "updating": "Updating",
        "details": "View Details",
        "noTours": "No tours available for this location yet.",
        "notFoundDetail": "Location not found!"
      },
      "homePage": {
        "title": "Discover Vietnam",
        "subtitle": "Great journeys are waiting for you",
        "viewTours": "View Tours",
        "locations": "Locations",
        "locationsDesc": "Explore famous tourist destinations",
        "tours": "Tours",
        "toursDesc": "Book tours at the best price"
      },
      "articlesPage": {
        "title": "Travel Guide",
        "readMore": "Read More →",
        "noArticles": "No articles yet."
      },
      "toursPage": {
        "title": "Tours",
        "days": "days",
        "available": "spots left",
        "departureDate": "Departure",
        "bookNow": "Book Now",
        "noTours": "No tours yet."
      },
      "locationsPage": {
        "title": "Tourist Locations",
        "loading": "Loading...",
        "error": "Unable to load data!",
        "noLocations": "No locations yet."
      },
      "bookingPage": {
        "title": "Book Tour",
        "fullName": "Full Name",
        "email": "Email",
        "phone": "Phone Number",
        "numberOfPeople": "Number of People",
        "totalPrice": "Total Price:",
        "confirmBooking": "Confirm Booking",
        "successMessage": "✅ Tour booked successfully!",
        "errorMessage": "❌ Booking failed, please try again!",
        "placeholderName": "John Doe",
        "placeholderEmail": "example@email.com",
        "placeholderPhone": "0901234567"
      },
      "loginPage": {
        "title": "Welcome Back",
        "subtitle": "Please log in to continue",
        "email": "Email",
        "password": "Password",
        "login": "Log In",
        "noAccount": "Don't have an account?",
        "signUpNow": "Sign up now",
        "placeholderEmail": "Enter your email",
        "placeholderPassword": "••••••••",
        "errorMessage": "Login failed! Please check your email and password."
      },
      "registerPage": {
        "title": "Create Account",
        "subtitle": "Sign up to experience the full Four Season Travel",
        "fullName": "Full Name",
        "email": "Email",
        "password": "Password",
        "register": "Create Account",
        "hasAccount": "Already have an account?",
        "loginNow": "Log in",
        "placeholderName": "John Doe",
        "placeholderEmail": "example@gmail.com",
        "placeholderPassword": "Create password (at least 6 characters)"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "vn", // Ngôn ngữ mặc định
    fallbackLng: "vn", // Nếu lỗi thì quay về tiếng Việt
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;