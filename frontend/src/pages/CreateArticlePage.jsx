import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { uploadImageToCloudinary } from '../api/uploadImage';

function CreateArticlePage() {
  const navigate = useNavigate();
  const [locations,      setLocations]      = useState([]);
  const [message,        setMessage]        = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting,   setIsSubmitting]   = useState(false);

  const [form, setForm] = useState({
    title:      '',
    summary:    '',   // ← THÊM: tóm tắt
    content:    '',
    locationId: '',
    imageUrl:   '',
    author:     localStorage.getItem('userEmail'),
    sections:   []    // ← THÊM: sections con
  });

  useEffect(() => {
    axios.get('/locations').then(res => setLocations(res.data));
  }, []);

  // ── Xử lý sections ───────────────────────────────────────
  const addSection = () => {
    setForm(prev => ({
      ...prev,
      sections: [...prev.sections, { heading: '', body: '' }]
    }));
  };

  const updateSection = (idx, field, value) => {
    setForm(prev => {
      const updated = [...prev.sections];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, sections: updated };
    });
  };

  const removeSection = (idx) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== idx)
    }));
  };

  const moveSectionUp = (idx) => {
    if (idx === 0) return;
    setForm(prev => {
      const s = [...prev.sections];
      [s[idx-1], s[idx]] = [s[idx], s[idx-1]];
      return { ...prev, sections: s };
    });
  };

  const moveSectionDown = (idx) => {
    setForm(prev => {
      if (idx === prev.sections.length - 1) return prev;
      const s = [...prev.sections];
      [s[idx], s[idx+1]] = [s[idx+1], s[idx]];
      return { ...prev, sections: s };
    });
  };

  // ── Upload ảnh ────────────────────────────────────────────
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setForm(prev => ({ ...prev, imageUrl }));
    } catch {
      setMessage('❌ Lỗi upload ảnh!');
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...form,
        author:    localStorage.getItem('userEmail'),
        createdAt: new Date().toISOString().split('T')[0]
      };
      await axios.post('/articles', dataToSubmit);
      setMessage('✅ Đăng bài viết thành công! Chờ Admin duyệt.');
      setTimeout(() => navigate('/author'), 2000);
    } catch {
      setMessage('❌ Đăng bài thất bại. Vui lòng thử lại!');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">✍️ Viết Cẩm nang mới</h1>
        <button onClick={() => navigate('/author')}
          className="text-gray-500 hover:text-blue-600 font-medium">
           Quay lại
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg font-bold ${
          message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>{message}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md space-y-6">

        {/* Tiêu đề */}
        <div>
          <label className="block font-bold text-gray-700 mb-2">
            Tiêu đề bài viết <span className="text-red-500">*</span>
          </label>
          <input type="text" required
            placeholder="VD: Kinh nghiệm du lịch Hội An tự túc"
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
        </div>

        {/* Địa điểm + Ảnh bìa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-bold text-gray-700 mb-2">
              Gắn với Địa điểm <span className="text-red-500">*</span>
            </label>
            <select required
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              onChange={e => setForm({ ...form, locationId: e.target.value })}>
              <option value="">-- Chọn địa điểm --</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-2">Ảnh Bìa</label>
            {!form.imageUrl ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition">
                <input type="file" accept="image/*"
                  onChange={handleImageChange} disabled={uploadingImage}
                  className="w-full text-sm text-gray-500" />
                {uploadingImage && (
                  <p className="text-blue-500 text-sm mt-2">⏳ Đang tải ảnh...</p>
                )}
              </div>
            ) : (
              <div className="relative group">
                <img src={form.imageUrl} alt="Cover"
                  className="h-32 w-full object-cover rounded-lg shadow-sm" />
                <button type="button"
                  onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full
                    w-6 h-6 text-sm flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition">×</button>
              </div>
            )}
          </div>
        </div>

        {/* Tóm tắt */}
        <div>
          <label className="block font-bold text-gray-700 mb-2">
            Tóm tắt ngắn
            <span className="text-gray-400 font-normal text-sm ml-2">(hiển thị ở danh sách bài viết)</span>
          </label>
          <input type="text"
            placeholder="VD: Những kinh nghiệm không thể bỏ qua khi đến Hội An"
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={e => setForm({ ...form, summary: e.target.value })}
          />
        </div>

        {/* Nội dung chính */}
        <div>
          <label className="block font-bold text-gray-700 mb-2">
            Nội dung mở đầu <span className="text-red-500">*</span>
          </label>
          <textarea required rows="5"
            placeholder="Giới thiệu tổng quan về địa điểm / trải nghiệm của bạn..."
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={e => setForm({ ...form, content: e.target.value })}
          />
        </div>

        {/* ── Sections động ── */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <label className="block font-bold text-gray-700">
                Các mục nội dung chi tiết
              </label>
              <p className="text-gray-400 text-sm">
                Mỗi mục có tiêu đề in đậm và nội dung riêng
              </p>
            </div>
            <button type="button" onClick={addSection}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2
                rounded-lg hover:bg-blue-700 transition text-sm font-bold">
              + Thêm mục
            </button>
          </div>

          {form.sections.length === 0 && (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <p className="text-gray-400 text-sm">Chưa có mục nào</p>
              <button type="button" onClick={addSection}
                className="mt-2 text-blue-500 hover:text-blue-700 text-sm font-medium">
                + Thêm mục đầu tiên
              </button>
            </div>
          )}

          <div className="space-y-4">
            {form.sections.map((section, idx) => (
              <div key={idx}
                className="border border-gray-200 rounded-xl p-5 bg-gray-50 relative">

                {/* Header section */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-gray-500">
                    Mục {idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    {/* Di chuyển lên/xuống */}
                    <button type="button" onClick={() => moveSectionUp(idx)}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">
                      ▲
                    </button>
                    <button type="button" onClick={() => moveSectionDown(idx)}
                      disabled={idx === form.sections.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">
                      ▼
                    </button>
                    {/* Xóa */}
                    <button type="button" onClick={() => removeSection(idx)}
                      className="p-1 text-red-400 hover:text-red-600 text-sm ml-1">
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Tiêu đề mục — in đậm */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Tiêu đề mục <span className="text-xs text-gray-400">(sẽ in đậm)</span>
                  </label>
                  <input type="text"
                    value={section.heading}
                    onChange={e => updateSection(idx, 'heading', e.target.value)}
                    placeholder={`VD: ${idx + 1}. Kiểm tra xe kỹ trước khi xuất phát`}
                    className="w-full border rounded-lg px-3 py-2 font-bold text-gray-800
                      focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                  />
                </div>

                {/* Nội dung mục */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nội dung mục
                  </label>
                  <textarea
                    value={section.body}
                    onChange={e => updateSection(idx, 'body', e.target.value)}
                    rows="4"
                    placeholder="Nội dung chi tiết của mục này..."
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2
                      focus:ring-blue-400 outline-none bg-white text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Nút thêm ở cuối nếu đã có sections */}
          {form.sections.length > 0 && (
            <button type="button" onClick={addSection}
              className="mt-3 w-full py-2.5 border-2 border-dashed border-blue-300
                text-blue-500 hover:border-blue-500 hover:text-blue-700
                rounded-xl text-sm font-medium transition">
              + Thêm mục mới
            </button>
          )}
        </div>

        {/* Nút submit */}
        <button type="submit" disabled={isSubmitting || uploadingImage}
          className={`w-full text-white font-bold py-3 rounded-lg transition text-lg ${
            isSubmitting || uploadingImage
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}>
          {isSubmitting ? '⏳ Đang đăng bài...'
           : uploadingImage ? '⏳ Chờ ảnh tải xong...'
           : '📤 Xuất bản Bài viết'}
        </button>
        <p className="text-center text-gray-400 text-sm">
          Bài viết sẽ được Admin duyệt trước khi hiển thị.
        </p>
      </form>
    </div>
  );
}

export default CreateArticlePage;