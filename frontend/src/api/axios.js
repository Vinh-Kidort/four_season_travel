import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1' ,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Trạm kiểm soát Đầu vào
api.interceptors.request.use((config) => {
    
    // 1. Kiểm tra xem có đang bị phạt đếm ngược không
   const unlockTime = localStorage.getItem('unlockTime');
    if (unlockTime && Date.now() < parseInt(unlockTime)) {
        // Trả về Reject thay vì fake Resolve
        return Promise.reject(new Error('CLIENT_RATE_LIMIT_EXCEEDED'));
    }

    // 2. Nếu bình thường -> Nhét token
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Trạm kiểm soát Đầu ra (Giữ nguyên của bạn)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 429) {
            const retryAfter = error.response.data?.retryAfter || 60; 
            const unlockTime = Date.now() + (retryAfter * 1000);
            localStorage.setItem('unlockTime', unlockTime);
            window.dispatchEvent(new Event('rateLimitExceeded'));
        }
        return Promise.reject(error);
    }
);

export default api;