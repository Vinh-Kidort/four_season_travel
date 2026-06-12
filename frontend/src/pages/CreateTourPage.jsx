import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { uploadImageToCloudinary } from '../api/uploadImage';

// ── Hàm format giá tiền có dấu chấm ──────────────────────────
const formatPrice = (value) => {
  const raw = value.replace(/\./g, '');
  if (isNaN(raw) || raw === '') return '';
  return parseInt(raw).toLocaleString('vi-VN');
};

// ── Sinh tự động các lựa chọn thời gian ──────────────────────
const generateDurationOptions = () => {
  const options = [];
  for (let days = 1; days <= 14; days++) {
    if (days === 1) {
      options.push(`1 Ngày`);
    } else {
      options.push(`${days} Ngày ${days - 1} Đêm`);
    }
  }
  return options;
};

function CreateTourPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [priceDisplay, setPriceDisplay] = useState(''); // Hiển thị giá có dấu chấm

  const [form, setForm] = useState({
    name: '',
    region: '',   
    price: 0,
    duration: '',
    departureDate: '',
    maxSlots: '',
    itinerary: '',
    experienceDescription: '',
    locationIds: [],
    images: []
  });

  useEffect(() => {
    axios.get('/locations').then(res => setLocations(res.data));
  }, []);

  // ── Xử lý giá tiền ───────────────────────────────────────────
  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/\./g, ''); // Bỏ dấu chấm cũ
    if (raw === '' || /^\d+$/.test(raw)) {
      setPriceDisplay(raw ? parseInt(raw).toLocaleString('vi-VN') : '');
      setForm({ ...form, price: raw ? parseFloat(raw) : 0 });
    }
  };

  // ── Xử lý checkbox địa điểm ──────────────────────────────────
  const handleCheckboxChange = (locId) => {
    setForm(prev => {
      const isSelected = prev.locationIds.includes(locId);
      return {
        ...prev,
        locationIds: isSelected
          ? prev.locationIds.filter(id => id !== locId)
          : [...prev.locationIds, locId]
      };
    });
  };

  // ── Xử lý upload ảnh ─────────────────────────────────────────
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setForm(prev => ({
        ...prev,
        images: [...prev.images, { url: imageUrl, caption: '' }]
      }));
    } catch {
      setMessage('❌ Lỗi upload ảnh! Vui lòng thử lại.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // ── Xóa ảnh đã upload ────────────────────────────────────────
  const handleRemoveImage = (idx) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx)
    }));
  };

  const handleCaptionChange = (idx, value) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.map((img, i) =>
        i === idx ? { ...img, caption: value } : img
      )
    }));
  };

  // ── Submit form ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.locationIds.length === 0) {
      setMessage('❌ Vui lòng chọn ít nhất 1 địa điểm!');
      return;
    }
    if (!form.duration) {
      setMessage('❌ Vui lòng chọn thời gian tour!');
      return;
    }
    if (!form.departureDate) {
      setMessage('❌ Vui lòng chọn ngày khởi hành!');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        name:          form.name,
        region:        form.region,
        locationIds:   form.locationIds,
        price:         parseFloat(String(form.price).replace(/\./g, '')), // Xóa dấu chấm trước khi parse
        duration:      form.duration,
        departureDate: form.departureDate,
        maxSlots:      parseInt(String(form.maxSlots), 10),
        // ← KHÔNG gửi availableSlots, để backend tự set = maxSlots
        itinerary:     form.itinerary,
        experienceDescription: form.experienceDescription,
        images:        form.images,
        author:        localStorage.getItem('userEmail'),
        createdAt:     new Date().toISOString().split('T')[0]
      };

      console.log('Data gửi lên:', dataToSubmit); // Debug
      await axios.post('/tours', dataToSubmit);
      setMessage('✅ Tạo Tour thành công! Chờ Admin duyệt.');
      setTimeout(() => navigate('/author'), 2000);
    } catch {
      setMessage('❌ Tạo Tour thất bại. Vui lòng thử lại!');
      setIsSubmitting(false);
    }
  };

  // ── Tính ngày tối thiểu cho date picker (hôm nay) ────────────
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">🧳 Tạo Tour Du Lịch Mới</h1>
        
        <Link 
          to="/author" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition group"
        >
          {/* Nút tròn chứa icon mũi tên */}
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-100 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </span>
          <span className="font-bold">Quay lại</span>
        </Link>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg font-bold ${
          message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md space-y-6">

        {/* Tên tour */}
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            Tên Tour <span className="text-red-500">*</span>
          </label>
          <input
            type="text" required
            placeholder="VD: Tour Đà Lạt mùa hoa dã quỳ"
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* Địa điểm */}
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            Địa điểm tham quan <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal text-sm ml-2">
              (Đã chọn: {form.locationIds.length})
            </span>
          </label>

          {locations.length === 0 ? (
            <p className="text-gray-400 text-sm p-4 border rounded-lg">
              Chưa có địa điểm nào.
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {['Miền Bắc', 'Miền Trung', 'Miền Nam'].map(region => {
                const regionLocs = locations
                  .filter(l => l.region === region)
                  .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

                if (regionLocs.length === 0) return null;

                const allSelected = regionLocs.every(l =>
                  form.locationIds.includes(l.id));

                const toggleRegion = () => {
                  if (allSelected) {
                    // Bỏ chọn tất cả trong vùng
                    setForm(prev => ({
                      ...prev,
                      locationIds: prev.locationIds.filter(
                        id => !regionLocs.map(l => l.id).includes(id)
                      )
                    }));
                  } else {
                    // Chọn tất cả trong vùng
                    const newIds = regionLocs
                      .map(l => l.id)
                      .filter(id => !form.locationIds.includes(id));
                    setForm(prev => ({
                      ...prev,
                      locationIds: [...prev.locationIds, ...newIds]
                    }));
                  }
                };

                return (
                  <div key={region} className="border-b last:border-b-0">
                    {/* Header vùng */}
                    <div className="flex items-center justify-between
                      bg-gray-100 px-4 py-2 border-b">
                      <span className="font-bold text-gray-700 text-sm">
                        📍 {region}
                        <span className="ml-2 text-gray-400 font-normal">
                          ({regionLocs.filter(l =>
                            form.locationIds.includes(l.id)).length}/{regionLocs.length})
                        </span>
                      </span>
                      <button type="button" onClick={toggleRegion}
                        className={`text-xs font-medium px-2 py-0.5 rounded transition ${
                          allSelected
                            ? 'text-red-500 hover:text-red-700'
                            : 'text-green-600 hover:text-green-800'
                        }`}>
                        {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </button>
                    </div>

                    {/* Danh sách địa điểm */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gray-50">
                      {regionLocs.map(loc => (
                        <label key={loc.id}
                          className={`flex items-center gap-2 cursor-pointer p-2
                            rounded-lg border text-sm transition ${
                            form.locationIds.includes(loc.id)
                              ? 'bg-green-50 border-green-400 text-green-700 font-medium'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                          }`}>
                          <input type="checkbox"
                            className="w-4 h-4 accent-green-600 flex-shrink-0"
                            checked={form.locationIds.includes(loc.id)}
                            onChange={() => handleCheckboxChange(loc.id)}
                          />
                          <span className="truncate">{loc.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Giá + Thời gian + Ngày khởi hành + Số khách */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Giá tiền — có dấu chấm */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Giá tiền (VNĐ) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={priceDisplay}
                onChange={handlePriceChange}
                placeholder="VD: 2.500.000"
                className="w-full border rounded-lg px-4 py-2 pr-14 focus:ring-2 focus:ring-green-400 outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                VNĐ
              </span>
            </div>
            {form.price > 0 && (
              <p className="text-green-600 text-sm mt-1 font-medium">
                {form.price.toLocaleString('vi-VN')} đồng
              </p>
            )}
          </div>

          {/* Thời gian — dropdown */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Thời gian <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.duration}
              onChange={e => setForm({ ...form, duration: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none bg-white"
            >
              <option value="">-- Chọn thời gian --</option>
              {generateDurationOptions().map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Ngày khởi hành — date picker */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Ngày khởi hành <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={form.departureDate}
              onChange={e => setForm({ ...form, departureDate: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
            />
            {form.departureDate && (
              <p className="text-gray-500 text-sm mt-1">
                📅 {new Date(form.departureDate).toLocaleDateString('vi-VN', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            )}
          </div>

          {/* Số lượng khách */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Số lượng khách <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              max="500"
              placeholder="VD: 20"
              value={form.maxSlots}
              onChange={e => setForm({ ...form, maxSlots: e.target.value })}
              // THÊM DÒNG NÀY ĐỂ NGĂN TRÌNH DUYỆT TỰ TRỪ SỐ KHI LĂN CHUỘT
              onWheel={(e) => e.target.blur()} 
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
            />
          </div>
          {/* Vùng miền */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Vùng miền <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.region}
              onChange={e => setForm({ ...form, region: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2
                focus:ring-green-400 outline-none bg-white"
            >
              <option value="">-- Chọn vùng miền --</option>
              <option value="Miền Bắc">🌿 Miền Bắc</option>
              <option value="Miền Trung">🌤️ Miền Trung</option>
              <option value="Miền Nam">☀️ Miền Nam</option>
            </select>
          </div>
        </div>

        {/* Lịch trình */}
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            Lịch trình chi tiết <span className="text-red-500">*</span>
          </label>
          <textarea
            required rows="8"
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
            placeholder={
              `Ngày 1: Khởi hành từ TP.HCM, đến Đà Lạt, nhận phòng khách sạn...\nNgày 2: Tham quan hồ Xuân Hương, chợ Đà Lạt...\nNgày 3: Tự do tham quan, trả phòng, về TP.HCM.`
            }
            onChange={e => setForm({ ...form, itinerary: e.target.value })}
          />
        </div>

        {/* Mô tả Trải nghiệm / Không gian */}
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            Mô tả Không gian & Trải nghiệm (Tùy chọn)
          </label>
          <textarea
            rows="4"
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
            placeholder="VD: Đến với Đà Lạt, bạn sẽ chìm đắm trong sương mù, tận hưởng không khí se lạnh bên ly cafe..."
            onChange={e => setForm({ ...form, experienceDescription: e.target.value })}
          />
        </div>

        
        {/* Upload ảnh */}
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            Ảnh Tour
            <span className="text-gray-400 font-normal text-sm ml-2">
              ({form.images.length} ảnh đã chọn)
            </span>
          </label>

          {/* Nút upload */}
          <div className="border-2 border-dashed border-gray-300 p-5 rounded-lg bg-gray-50 hover:border-green-400 transition">
            <input
              type="file" accept="image/*"
              onChange={handleImageChange}
              disabled={uploadingImage}
              className="w-full text-sm text-gray-500"
            />
            {uploadingImage && (
              <div className="flex items-center gap-2 mt-3 text-blue-500 text-sm">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Đang tải ảnh lên...
              </div>
            )}
          </div>

          {/* Danh sách ảnh — 1 ảnh 1 dòng */}
          {form.images.length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              {form.images.map((img, idx) => (
                <div key={idx}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl
                    border border-gray-200 hover:border-green-300 transition">

                  {/* Ảnh nhỏ */}
                  <div className="relative flex-shrink-0">
                    <img src={img.url} alt={`preview-${idx}`}
                      className="h-20 w-28 object-cover rounded-lg shadow" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-blue-500 text-white
                        text-xs px-1.5 py-0.5 rounded-full font-medium">
                        Bìa
                      </span>
                    )}
                  </div>

                  {/* Input mô tả */}
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-xs text-gray-400 font-medium">
                      Ảnh {idx + 1}{idx === 0 ? ' · Ảnh bìa chính' : ''}
                    </span>
                    <input
                      type="text"
                      value={img.caption}
                      onChange={e => handleCaptionChange(idx, e.target.value)}
                      placeholder={
                        idx === 0
                          ? 'VD: Toàn cảnh điểm đến...'
                          : 'VD: Khung cảnh buổi sáng, chợ địa phương...'
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm
                        focus:ring-2 focus:ring-green-400 outline-none bg-white"
                    />
                  </div>

                  {/* Nút xóa */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="flex-shrink-0 text-gray-300 hover:text-red-500
                      transition p-1 rounded-full hover:bg-red-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-gray-400 text-xs mt-2">
            Ảnh đầu tiên sẽ là ảnh bìa hiển thị trên danh sách tour.
          </p>
        </div>

        {/* Nút submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full text-white font-bold py-3 rounded-lg transition text-lg ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}>
          {isSubmitting ? ' Đang lưu dữ liệu...' : ' Đăng Tour Mới'}
        </button>
      </form>
    </div>
  );
}

export default CreateTourPage;