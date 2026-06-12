import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Kiểm tra nếu là lỗi reCAPTCHA
    const isRecaptchaError = error.message && error.message.includes('hpm');
    if (isRecaptchaError) {
      console.warn('⚠️ reCAPTCHA Error detected, continuing without reCAPTCHA:', error);
      return { hasError: false }; // Không dừng app, chỉ cảnh báo
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log để debug
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="fixed inset-0 z-[9999] bg-red-50 flex items-center justify-center px-4">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h1 className="text-xl font-bold text-red-600 mb-4">Có lỗi xảy ra</h1>
            <p className="text-gray-600">{this.state.error.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
