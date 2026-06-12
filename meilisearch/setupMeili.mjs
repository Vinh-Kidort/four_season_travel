// setupMeili.mjs — Gọi backend sync thay vì dùng data mẫu
const BACKEND = 'http://localhost:8080/api/v1';

// Lấy token admin từ login
async function getAdminToken() {
  const res = await fetch(`${BACKEND}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: '123@gmail.com',    // ← Thay bằng email admin thật
      password: '123456'          // ← Thay bằng password admin thật
    })
  });
  const data = await res.json();
  return data.token;
}

async function setup() {
  try {
    console.log('1. Đang đăng nhập Admin...');
    const token = await getAdminToken();
    if (!token) throw new Error('Không lấy được token!');
    console.log('✅ Đăng nhập thành công!');

    console.log('2. Đang xóa index cũ (data mẫu)...');
    const HOST   = 'http://127.0.0.1:7700';
    const API_KEY = 'fourSeasonMasterKey2024';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    };

    // Xóa index cũ để tránh trùng data mẫu
    await fetch(`${HOST}/indexes/tours`,     { method: 'DELETE', headers });
    await fetch(`${HOST}/indexes/articles`,  { method: 'DELETE', headers });
    await fetch(`${HOST}/indexes/locations`, { method: 'DELETE', headers });
    console.log('✅ Đã xóa index cũ!');

    // Đợi Meilisearch xử lý xong
    await new Promise(r => setTimeout(r, 1000));

    console.log('3. Đang sync data thật từ MongoDB...');
    const syncRes = await fetch(`${BACKEND}/search/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (syncRes.ok) {
      console.log('✅ Sync thành công! Data thật từ MongoDB đã lên Meilisearch!');
    } else {
      const err = await syncRes.text();
      throw new Error(`Sync thất bại: ${err}`);
    }

    // Cấu hình thêm synonyms cho locations
    console.log('4. Cấu hình synonyms...');
    await fetch(`${HOST}/indexes/locations/settings/synonyms`, {
      method: 'PUT', headers,
      body: JSON.stringify({
        'hcm':  ['thành phố hồ chí minh', 'sài gòn', 'sg'],
        'sg':   ['thành phố hồ chí minh', 'sài gòn', 'hcm'],
        'hn':   ['hà nội', 'hanoi'],
        'đn':   ['đà nẵng', 'da nang'],
        'đl':   ['đà lạt', 'da lat'],
        'pq':   ['phú quốc', 'phu quoc'],
      })
    });
    console.log('✅ Synonyms OK!');

    console.log('\n🎉 HOÀN TẤT! Meilisearch đã có data thật từ MongoDB!');
    console.log('→ Thử search tại: http://127.0.0.1:7700');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.log('\n💡 Kiểm tra:');
    console.log('   1. meilisearch.exe đang chạy chưa?');
    console.log('   2. Spring Boot đang chạy chưa?');
    console.log('   3. Email/password admin đúng chưa?');
  }
}

setup();