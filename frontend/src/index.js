import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Chỉ khởi tạo reCAPTCHA nếu script đã load
const initializeApp = () => {
  root.render(
    <BrowserRouter>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <GoogleReCaptchaProvider 
          reCaptchaKey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
          language="vi"
        >
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </GoogleReCaptchaProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
};

// Đợi reCAPTCHA script load xong
if (window.grecaptcha) {
  initializeApp();
} else {
  window.addEventListener('load', initializeApp);
  // Fallback nếu script không load sau 5 giây
  setTimeout(initializeApp, 5000);
}