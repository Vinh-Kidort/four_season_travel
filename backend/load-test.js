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
        tourId:         '6a2ad4a41efff56d35bd2948',
        customerName:   'Bong',
        customerEmail:  'b@gmail.com',
        numberOfPeople: 1,
    });

    const res = http.post(
        'http://localhost:8080/api/v1/bookings',
        payload,
        { headers: { 'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJiQGdtYWlsLmNvbSIsInJvbGUiOiJBVVRIT1IiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzg5MjkxNzI4LCJleHAiOjE3ODkyOTI2Mjh9.keNMZ2xYpOCDkg0xmMxRVyVx15IFFFWhm0irMnAmcxo' } }
    );

    check(res, {
        'status 201': r => r.status === 201,
        'response < 2s': r => r.timings.duration < 2000,
    });

    if (res.status !== 200 && res.status !== 201) {
        console.log("Lý do bị từ chối: " + res.body);
    }

    sleep(1);
}