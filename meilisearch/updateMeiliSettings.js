const HOST = 'http://127.0.0.1:7700';
const API_KEY = 'fourSeasonMasterKey2024'; // <-- ĐIỀN MASTER KEY CỦA BẠN VÀO ĐÂY

const indexes = ['tours', 'locations'];

async function updateSettings() {
  for (const indexName of indexes) {
    console.log(`⏳ Đang cấu hình cho bảng: ${indexName}...`);

    const url = `${HOST}/indexes/${indexName}/settings`;
    
    const settings = {
      // 1. MỞ LẠI CỘT MÔ TẢ, NHƯNG ĐẶT Ở CUỐI CÙNG
      // Tên trùng khớp sẽ được ưu tiên số 1. Cụm từ dài ("cầu vàng") sẽ rớt xuống số 4, 5.
      searchableAttributes: [
        'name',
        'aliases',
        'region',
        'description', // Cho bảng Locations
        'itinerary'    // Cho bảng Tours
      ],
      
      // 2. KHẮT KHE CHÍNH TẢ CHO TIẾNG VIỆT
      // Phải 6 chữ cái mới được sai 1 chữ (Tránh lỗi 'Trang' -> 'Trung')
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 6, 
          twoTypos: 10
        },
        disableOnWords: [],
        disableOnAttributes: []
      },
      
      // 3. LUẬT CHẤM ĐIỂM ƯU TIÊN
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute', // Rất quan trọng: Bắt buộc tuân thủ thứ tự ở searchableAttributes
        'sort',
        'exactness'
      ]
    };

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const err = await response.json();
        console.error(`❌ Lỗi cấu hình ${indexName}:`, err);
      } else {
        console.log(`✅ Đã cấu hình [${indexName}] thành công!`);
      }
    } catch (error) {
      console.error(`❌ Lỗi kết nối:`, error.message);
    }
  }
}

updateSettings();