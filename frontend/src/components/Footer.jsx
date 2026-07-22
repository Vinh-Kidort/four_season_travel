import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-slate-950 text-white mt-12 md:mt-16">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          
          {/* Cột 1: Brand & Slogan */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">             
              <div className="h-12 rounded-lg bg-white p-2 hover:scale-105 transition duration-300">
                <img
                  src="/logo5.png"
                  alt="Four Season Travel"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold leading-tight">
                  Four Season Travel
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Explore Every Season
                </p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed text-sm md:text-base">
              {t('footer.desc')}
            </p>
          </div>

          {/* Cột 2: Quick Links */}
          <div>
            <h3 className="font-bold text-base md:text-lg mb-4 text-blue-400 uppercase tracking-wider">
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-2.5 text-gray-400 text-sm md:text-base">
              <li>
                <Link to="/" className="hover:text-blue-400 transition duration-200">
                  {t('menu.home')}
                </Link>
              </li>
              <li>
                <Link to="/locations" className="hover:text-blue-400 transition duration-200">
                  {t('menu.locations')}
                </Link>
              </li>
              <li>
                <Link to="/tours" className="hover:text-blue-400 transition duration-200">
                  {t('menu.tours')}
                </Link>
              </li>
              <li>
                <Link to="/articles" className="hover:text-blue-400 transition duration-200">
                  {t('menu.articles')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Contact */}
          <div>
            <h3 className="font-bold text-base md:text-lg mb-4 text-blue-400 uppercase tracking-wider">
              {t('footer.contact')}
            </h3>
            <ul className="space-y-3 text-gray-400 text-sm md:text-base">
              <li className="flex items-start gap-2">
                <span>📍</span> <span>123 Nguyễn Ảnh Thủ, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span> <span>090.123.4567</span>
              </li>
              <li className="flex items-center gap-2 truncate">
                <span>✉️</span> <span>contact@fourseasontravel.com</span>
              </li>
              <li className="flex items-center gap-2">
                <span>⏰</span> <span>08:00 - 22:00</span>
              </li>
            </ul>
          </div>

          {/* Cột 4: Social Connections */}
          <div>
            <h3 className="font-bold text-base md:text-lg mb-4 text-blue-400 uppercase tracking-wider">
              {t('footer.connect')}
            </h3>
            <div className="flex gap-3 mb-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/10 p-2 hover:bg-white hover:scale-110 transition-all duration-300"
              >
                <img
                  src="/social/facebook.png"
                  alt="Facebook"
                  className="w-full h-full object-contain"
                />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/10 p-2 hover:bg-white hover:scale-110 transition-all duration-300"
              >
                <img
                  src="/social/instagram.png"
                  alt="Instagram"
                  className="w-full h-full object-contain"
                />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/10 p-2 hover:bg-white hover:scale-110 transition-all duration-300"
              >
                <img
                  src="/social/youtube.png"
                  alt="YouTube"
                  className="w-full h-full object-contain"
                />
              </a>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('footer.followUs')}
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h3 className="font-bold mb-3 text-sm md:text-base text-gray-300 uppercase tracking-wide">
                {t('footer.payment')}
              </h3>
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                <div className="bg-white rounded-lg px-3 py-1.5 h-10 flex items-center justify-center shadow-sm">
                  <img src="/payment/vnpay.png" alt="VNPay" className="h-7 object-contain" />
                </div>
                <div className="bg-white rounded-lg px-3 py-1.5 h-10 flex items-center justify-center shadow-sm">
                  <img src="/payment/momo.png" alt="MoMo" className="h-6 object-contain" />
                </div>
                <div className="bg-white rounded-lg px-3 py-1.5 h-10 flex items-center justify-center shadow-sm">
                  <img src="/payment/zalopay.png" alt="ZaloPay" className="h-6 object-contain" />
                </div>
                <div className="bg-white rounded-lg px-3 py-1.5 h-10 flex items-center justify-center shadow-sm">
                  <img src="/payment/visa.png" alt="Visa" className="h-5 object-contain" />
                </div>
                <div className="bg-white rounded-lg px-3 py-1.5 h-10 flex items-center justify-center shadow-sm">
                  <img src="/payment/mastercard.png" alt="MasterCard" className="h-5 object-contain" />
                </div>
              </div>
            </div>
            <div className="text-gray-400 text-xs sm:text-sm bg-gray-800/40 border border-gray-800/80 px-4 py-2 rounded-xl self-start lg:self-center">
              🛡️ {t('footer.secure')}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-gray-500">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} Four Season Travel. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="#" className="hover:text-blue-400 transition duration-200">
              {t('footer.terms')}
            </a>
            <a href="#" className="hover:text-blue-400 transition duration-200">
              {t('footer.privacy')}
            </a>
            <a href="#" className="hover:text-blue-400 transition duration-200">
              {t('footer.support')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;