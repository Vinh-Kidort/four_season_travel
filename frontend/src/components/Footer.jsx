import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-slate-950 text-white mt-16">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">             
              {/* Thay bằng logo thật sau */}
              <div className=" h-12 rounded-lg bg-white p-2 hover:scale-110 transition">
                <img
                    src="/logo5.png"
                    alt="Four Season Travel"
                    className="w-full h-full object-contain"/>
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  Four Season Travel
                </h3>
                <p className="text-sm text-gray-400">
                  Explore Every Season
                </p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed text-sm">
              Mang đến cho bạn những trải nghiệm du lịch tuyệt vời nhất
              qua 4 mùa trong năm, khám phá các địa điểm nổi bật
              trong và ngoài nước.
            </p>
          </div>
          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">
              Liên kết nhanh
            </h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link
                  to="/"
                  className="hover:text-white transition">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link
                  to="/locations"
                  className="hover:text-white transition">
                  Địa điểm
                </Link>
              </li>
              <li>
                <Link
                  to="/tours"
                  className="hover:text-white transition">
                  Tour du lịch
                </Link>
              </li>
              <li>
                <Link
                  to="/articles"
                  className="hover:text-white transition">
                  Cẩm nang du lịch
                </Link>
              </li>
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">
              Liên hệ
            </h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>📍 123 Nguyễn Ảnh Thủ, TP.HCM </li>
              <li>📞 090.123.4567</li>
              <li>✉️ contact@fourseasontravel.com</li>
              <li>⏰ 08:00 - 22:00
              </li>
            </ul>
          </div>
          {/* Social */}
          <div>
            <h3 className="font-bold text-lg mb-4">
              Kết nối với chúng tôi
            </h3>
            <div className="flex gap-3">
              <div className="flex gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white p-2 hover:scale-110 transition">
                  <img
                    src="/social/facebook.png"
                    alt="Facebook"
                    className="w-full h-full object-contain"/>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white p-2 hover:scale-110 transition">
                  <img
                    src="/social/instagram.png"
                    alt="Instagram"
                    className="w-full h-full object-contain"/>
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white p-2 hover:scale-110 transition">
                  <img
                    src="/social/youtube.png"
                    alt="YouTube"
                    className="w-full h-full object-contain"/>
                </a>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Theo dõi chúng tôi để cập nhật
              các tour mới nhất.
            </p>
          </div>
        </div>
        {/* Payment Methods */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h3 className="font-bold mb-3">
                Phương thức thanh toán
              </h3>
              <div className="flex flex-wrap gap-3">
                {/* Thay bằng ảnh thật sau */}
                <div className="bg-white rounded-lg px-4 py-2 h-12 flex items-center">
                  <img
                    src="/payment/vnpay.png"
                    alt="VNPay"
                    className="h-10 object-contain"/>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 h-12 flex items-center">
                  <img
                    src="/payment/momo.png"
                    alt="MoMo"
                    className="h-8 object-contain"/>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 h-12 flex items-center">
                  <img
                    src="/payment/zalopay.png"
                    alt="ZaloPay"
                    className="h-8 object-contain"/>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 h-12 flex items-center">
                  <img
                    src="/payment/visa.png"
                    alt="Visa"
                    className="h-6 object-contain"/>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 h-12 flex items-center">
                  <img
                    src="/payment/mastercard.png"
                    alt="MasterCard"
                    className="h-6 object-contain"/>
                </div>
              </div>
            </div>
            <div className="text-gray-400 text-sm">
              Thanh toán an toàn & bảo mật SSL
            </div>
          </div>
        </div>
      </div>
      {/* Copyright */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} Four Season Travel.
            All rights reserved.
          </p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white">
              Điều khoản
            </a>
            <a href="#" className="hover:text-white">
              Chính sách bảo mật
            </a>
            <a href="#" className="hover:text-white">
              Hỗ trợ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;