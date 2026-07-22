# 📋 Danh Sách Chi Tiết Tất Cả Trường "En" (Tiếng Anh)

## 📌 Trường "En" Theo Thực Thể (Entity)

### 🏨 TOURS (Chuyến du lịch)
| Trường | Loại | Nơi Tạo | Nơi Hiển Thị |
|--------|------|---------|-------------|
| `nameEn` | String | [CreateTourPage.jsx](src/pages/CreateTourPage.jsx#L14) | [TourDetail.jsx](src/pages/TourDetail.jsx#L43), [ToursPage.jsx](src/pages/ToursPage.jsx#L35), [HomePage.jsx](src/pages/HomePage.jsx#L63) |
| `itineraryEn` | Text | [CreateTourPage.jsx](src/pages/CreateTourPage.jsx#L14) | [TourDetail.jsx](src/pages/TourDetail.jsx#L44) |
| `experienceDescriptionEn` | Text | [CreateTourPage.jsx](src/pages/CreateTourPage.jsx#L14) | [TourDetail.jsx](src/pages/TourDetail.jsx#L45) |

### 📍 LOCATIONS (Địa điểm)
| Trường | Loại | Nơi Tạo | Nơi Hiển Thị |
|--------|------|---------|-------------|
| `nameEn` | String | [AdminDashboard.jsx](src/pages/AdminDashboard.jsx#L451) | [ArticleDetail.jsx](src/pages/ArticleDetail.jsx#L115), [LocationDetail.jsx](src/pages/LocationDetail.jsx#L41), [LocationsPage.jsx](src/pages/LocationsPage.jsx#L46), [HomePage.jsx](src/pages/HomePage.jsx#L62) |
| `descriptionEn` | Text | [AdminDashboard.jsx](src/pages/AdminDashboard.jsx#L582) | [LocationDetail.jsx](src/pages/LocationDetail.jsx#L42), [LocationsPage.jsx](src/pages/LocationsPage.jsx#L47) |
| `regionEn` | String | [AdminDashboard.jsx](src/pages/AdminDashboard.jsx#L470) | *(Chưa sử dụng)* |
| `bestSeasonEn` | String | [AdminDashboard.jsx](src/pages/AdminDashboard.jsx#L500) | *(Chưa sử dụng)* |

### 📰 ARTICLES (Bài viết)
| Trường | Loại | Nơi Tạo | Nơi Hiển Thị |
|--------|------|---------|-------------|
| `titleEn` | String | [CreateArticlePage.jsx](src/pages/CreateArticlePage.jsx#L14) | [ArticleDetail.jsx](src/pages/ArticleDetail.jsx#L42), [ArticlesPage.jsx](src/pages/ArticlesPage.jsx#L44), [HomePage.jsx](src/pages/HomePage.jsx#L64) |
| `summaryEn` | String | [CreateArticlePage.jsx](src/pages/CreateArticlePage.jsx#L14) | *(Chưa sử dụng)* |
| `contentEn` | Text | [CreateArticlePage.jsx](src/pages/CreateArticlePage.jsx#L14) | *(Chưa sử dụng)* |

---

## 🎯 Trường "En" Chưa Được Sử Dụng Để Hiển Thị

- `location.regionEn` - Tạo nhưng **không hiển thị**
- `location.bestSeasonEn` - Tạo nhưng **không hiển thị**
- `article.summaryEn` - Tạo nhưng **không hiển thị**
- `article.contentEn` - Tạo nhưng **không hiển thị**

**✅ Đề xuất:** Nên thêm logic hiển thị cho những trường này nếu muốn hỗ trợ đầy đủ tiếng Anh.

---

## 🔍 Kiểm Tra Chi Tiết Mỗi File

### CreateTourPage.jsx (Tạo Tour)
```javascript
const [form, setForm] = useState({
  name: '', nameEn: '',              // ← Thêm nameEn
  itinerary: '', itineraryEn: '',    // ← Thêm itineraryEn  
  experienceDescription: '', experienceDescriptionEn: '',  // ← Thêm experienceDescriptionEn
  // ...
});

// Gửi lên backend:
await axios.post('/tours', {
  name, nameEn,
  itinerary, itineraryEn,
  experienceDescription, experienceDescriptionEn,
  // ...
});
```

### CreateArticlePage.jsx (Viết Bài Viết)
```javascript
const [form, setForm] = useState({
  title: '', titleEn: '',           // ← Thêm titleEn
  summary: '', summaryEn: '',       // ← Thêm summaryEn
  content: '', contentEn: '',       // ← Thêm contentEn
  // ...
});

// Gửi lên backend:
await axios.post('/articles', {
  title, titleEn,
  summary, summaryEn,
  content, contentEn,
  // ...
});
```

### AdminDashboard.jsx (Quản Lý Địa Điểm)
```javascript
const [newLocation, setNewLocation] = useState({
  name: '', nameEn: '',                          // ← Thêm nameEn
  region: '', regionEn: '',                      // ← Thêm regionEn
  bestSeason: '', bestSeasonEn: '',             // ← Thêm bestSeasonEn
  description: '', descriptionEn: '',            // ← Thêm descriptionEn
  images: []
});

// Gửi lên backend:
await axios.post('/locations', newLocation);
```

### TourDetail.jsx (Hiển Thị Tour)
```javascript
const displayName = isEng && tour.nameEn ? tour.nameEn : tour.name;
const displayItinerary = isEng && tour.itineraryEn ? tour.itineraryEn : tour.itinerary;
const displayExperience = isEng && tour.experienceDescriptionEn ? tour.experienceDescriptionEn : tour.experienceDescription;
```

---

## 🚨 Các Vấn Đề Có Thể Xảy Ra

### ❌ Vấn đề 1: Backend không trả về các trường "En"
```
📊 Symptom: Dữ liệu gửi lên nhưng không thấy khi fetch lại
🔍 Nguyên nhân: API response không có field "En"
💡 Kiểm tra: 
   - Mở DevTools → Network
   - Xem response của GET /tours, GET /locations, GET /articles
   - Nếu không có "nameEn", "itineraryEn"... → Backend chưa trả về
```

### ❌ Vấn đề 2: Fallback logic không hoạt động
```javascript
// ❌ SAI: Nếu nameEn = "" thì hiển thị empty
const displayName = isEng ? tour.nameEn : tour.name;

// ✅ ĐÚNG: Nếu nameEn = "" hoặc không tồn tại → fallback sang tiếng Việt
const displayName = isEng && tour.nameEn ? tour.nameEn : tour.name;
```

---

## 📝 Ghi Chú Bổ Sung

### API Endpoints Cần Cập Nhật
- `POST /tours` - Chấp nhận nameEn, itineraryEn, experienceDescriptionEn
- `POST /articles` - Chấp nhận titleEn, summaryEn, contentEn
- `POST /locations` - Chấp nhận nameEn, regionEn, bestSeasonEn, descriptionEn
- `GET /tours` - Trả về các field "En"
- `GET /articles` - Trả về các field "En"
- `GET /locations` - Trả về các field "En"
- `GET /tours/:id` - Trả về các field "En"
- `GET /articles/:id` - Trả về các field "En"
- `GET /locations/:id` - Trả về các field "En"

### Schema Database Cần Thêm
```sql
-- Tours table
ALTER TABLE tours ADD COLUMN name_en VARCHAR(255);
ALTER TABLE tours ADD COLUMN itinerary_en LONGTEXT;
ALTER TABLE tours ADD COLUMN experience_description_en LONGTEXT;

-- Locations table
ALTER TABLE locations ADD COLUMN name_en VARCHAR(255);
ALTER TABLE locations ADD COLUMN region_en VARCHAR(50);
ALTER TABLE locations ADD COLUMN best_season_en VARCHAR(100);
ALTER TABLE locations ADD COLUMN description_en LONGTEXT;

-- Articles table
ALTER TABLE articles ADD COLUMN title_en VARCHAR(255);
ALTER TABLE articles ADD COLUMN summary_en TEXT;
ALTER TABLE articles ADD COLUMN content_en LONGTEXT;
```

