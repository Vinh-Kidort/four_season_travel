import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 50  }, // tăng lên 50 users
        { duration: '60s', target: 100 }, // giữ 100 users
        { duration: '30s', target: 0   }, // giảm về 0
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% request < 2 giây
        http_req_failed:   ['rate<0.01'],  // lỗi < 1%
    },
};

export default function () {
    const payload = JSON.stringify({
        tourId:         '6a3df7e3bfa2325e3e26fbe3',
        customerName:   'Test User',
        customerEmail:  'test@test.com',
        numberOfPeople: 1,
        bookingCode:    'FST-TEST-001',
    });

    const res = http.post(
        'http://localhost:8080/api/v1/bookings',
        payload,
        { headers: { 'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_TOKEN' } }
    );

    check(res, {
        'status 201': r => r.status === 201,
        'response < 2s': r => r.timings.duration < 2000,
    });

    sleep(1);
}