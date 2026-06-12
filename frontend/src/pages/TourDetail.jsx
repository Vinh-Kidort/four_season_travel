import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate} from 'react-router-dom';
import axios from '../api/axios';
import { useTranslation } from 'react-i18next';
import FavoriteButton from '../components/FavoriteButton';
import CommentSection from '../components/CommentSection';

function TourDetail() {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const { t, i18n } = useTranslation();
  const isEng = i18n.language === 'en';
  const navigate = useNavigate();
  const infoRef = useRef(null);
  const [selectedDep, setSelectedDep] = useState(null);

  useEffect(() => {
    axios.get(`/tours/${id}`)
      .then(res => {
        setTour(res.data); // ← giữ data, không redirect
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>
  );
  
  if (!tour) return (
    <div className="text-center py-20 text-red-500 text-lg font-bold">{t('tour.notFoundDetail')}</div>
  );

  // Chuẩn hóa images
  const images = (tour.images || []).map(img =>
    typeof img === 'string' ? { url: img, caption: '' } : img
  );

  const displayName = isEng && tour.nameEn ? tour.nameEn : tour.name;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset về đầu ngày để so sánh chuẩn

  // thêm filter ngày
  const activeDepartures = (tour.departures || [])
    .filter(d => {
      if (d.status !== 'active') return false;
      // Ẩn departure đã qua ngày khởi hành
      const startDate = new Date(d.startDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate >= today;
    })
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── BREADCRUMB / QUAY LẠI ── */}
        <div className="mb-6">
          <Link to="/tours"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition group">
            <span className="flex items-center justify-center w-10 h-10 rounded-full
              bg-gray-100 group-hover:bg-blue-100 transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </span>
            <span className="font-bold">Danh sách Tour</span>
          </Link>
        </div>

        {/* Banner ngưng hoạt động */}
        {(tour.isRejected || !tour.isApproved) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-6 py-4
            flex items-center gap-3">
            <span className="text-2xl">🚫</span>
            <div>
              <p className="font-bold text-red-700">Tour này đã ngưng hoạt động</p>
              <p className="text-red-500 text-sm mt-0.5">
                Tour không còn nhận đặt chỗ. Vui lòng chọn tour khác.
              </p>
            </div>
            <Link to="/tours"
              className="ml-auto bg-red-500 text-white px-4 py-2 rounded-lg
                text-sm font-bold hover:bg-red-600 transition whitespace-nowrap">
              Xem tour khác
            </Link>
          </div>
        )}

        {/* ── HEADER: TÊN, BADGES & NÚT YÊU THÍCH ── */}
        
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
            {displayName}
          </h1>
          
          {/* VÙNG THÔNG TIN CÙNG HÀNG NHAU */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-8 pb-6 border-b border-gray-100">
            
            {/* Các Badge thông tin */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center ${
                tour.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {tour.status === 'active' ? 'Đang mở bán' : 'Đã đóng'}
              </span>
              
              <div className="flex items-center text-gray-600 text-sm font-medium bg-gray-100 px-3 py-1.5 rounded-md">
                <span className="mr-1.5">⏱️</span> {tour.duration}
              </div>

              <div className={`flex items-center text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                tour.availableSlots <= 5 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <span className="mr-1.5">👥</span> Còn {tour.availableSlots} chỗ
              </div>

              {tour.region && (
                <div className="flex items-center text-gray-600 text-sm font-medium
                  bg-gray-100 px-3 py-1.5 rounded-md">
                  <span className="mr-1.5">📍</span> {tour.region}
                </div>
              )}
            </div>

            {/* Dấu gạch đứng phân cách (Ẩn trên điện thoại) */}
            <div className="h-5 w-px bg-gray-300 hidden sm:block"></div>

            {/* Đánh giá (Đã bỏ các margin làm xê dịch) */}
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-500 text-lg">⭐</span>
              <span className="font-bold text-gray-800">{tour.averageRating || 0}</span>
              <span className="text-gray-500 text-sm">({tour.reviewCount || 0} đánh giá)</span>
            </div>

            <div className="h-5 w-px bg-gray-300 hidden sm:block"></div>

            {/* Nút yêu thích */}
            <div className="flex items-center">
              <FavoriteButton itemId={tour.id} itemType="TOUR" />
            </div>
          </div>
        </div>

        {/* ── GALLERY (AIRBNB STYLE) ── */}
        <div className="relative rounded-2xl overflow-hidden mb-12 bg-gray-100" style={{ height: '500px' }}>
          
          {/* ĐÃ XÓA FavoriteButton Ở ĐÂY */}

          {images.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">📸</div>
          ) : (
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-full">
              {/* Ảnh to nhất - Trái */}
              <div className="col-span-2 row-span-2 relative cursor-pointer group" onClick={() => setLightbox(0)}>
                <img src={images[0].url} alt={displayName} className="w-full h-full object-cover group-hover:brightness-90 transition duration-300" />
              </div>
              
              {/* 4 Ảnh nhỏ - Phải (Ẩn trên mobile) */}
              {images.slice(1, 5).map((img, idx) => (
                <div key={idx} className="hidden sm:block relative cursor-pointer group" onClick={() => setLightbox(idx + 1)}>
                  <img src={img.url} alt={`tour-${idx}`} className="w-full h-full object-cover group-hover:brightness-90 transition duration-300" />
                  {/* Lớp mờ xem thêm ở ảnh cuối cùng */}
                  {idx === 3 && images.length > 5 && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">+{images.length - 5}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {images.length > 0 && (
            <button onClick={() => setLightbox(0)} className="absolute bottom-4 right-4 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-900 hover:bg-gray-100 transition shadow-sm z-10 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Xem tất cả {images.length} ảnh
            </button>
          )}
        </div>

        {/* ── BỐ CỤC 2 CỘT ── */}
        <div className="flex flex-col lg:flex-row gap-12" ref={infoRef}>
          
          {/* CỘT TRÁI: NỘI DUNG (70%) */}
          <div className="lg:w-2/3">

            {/* ── Chọn ngày khởi hành ── */}
            {activeDepartures.length > 0 && (
              <div className="pb-8 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  📅 Chọn ngày khởi hành
                </h2>
                
                <div className="space-y-3">
                  {activeDepartures.map(dep => {
                    const isSelected = selectedDep?.id === dep.id;
                    const isFull     = dep.availableSlots <= 0;
                    return (
                      <button key={dep.id}
                        onClick={() => !isFull && setSelectedDep(dep)}
                        disabled={isFull}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          isFull
                            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-blue-300 bg-white'
                        }`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800">
                              {new Date(dep.startDate).toLocaleDateString('vi-VN', {
                                day: '2-digit', month: '2-digit', year: 'numeric'
                              })}
                              {' → '}
                              {new Date(dep.endDate).toLocaleDateString('vi-VN', {
                                day: '2-digit', month: '2-digit', year: 'numeric'
                              })}
                              <span className="ml-2 text-sm font-normal text-gray-500">
                                ({dep.totalDays} ngày)
                              </span>
                            </p>
                            <p className={`text-sm mt-0.5 ${
                              dep.availableSlots <= 5 ? 'text-red-500' : 'text-green-600'
                            }`}>
                              {isFull ? 'Hết chỗ' : `Còn ${dep.availableSlots} chỗ`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600 text-lg">
                              {dep.price.toLocaleString('vi-VN')}đ
                            </p>
                            <p className="text-xs text-gray-400">/ khách</p>
                          </div>
                        </div>
                        {dep.note && (
                          <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                            <span>⚠️</span> {dep.note}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Nếu không có ngày nào thì hiển thị thông báo */}
            {activeDepartures.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-xl border
              border-dashed border-gray-200">
              {(tour.departures || []).length > 0 ? (
                // Có departure nhưng tất cả đã qua
                <>
                  <p className="text-gray-400 text-sm">
                    🗓️ Các ngày khởi hành hiện tại đã kết thúc.
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Vui lòng quay lại sau để xem lịch khởi hành mới.
                  </p>
                </>
              ) : (
                // Chưa có departure nào
                <>
                  <p className="text-gray-400 text-sm">
                    🗓️ Chưa có ngày khởi hành cụ thể.
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Hãy liên hệ với chúng tôi để được tư vấn lịch trình phù hợp.
                  </p>
                </>
              )}
            </div>
          )}

            {/* Lịch trình */}
            {tour.itinerary && (
              <div className="py-8 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Lịch trình chi tiết</h2>
                <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                  {tour.itinerary}
                </div>
              </div>
            )}

            {/* Hình ảnh chi tiết (Dạng cuộn) */}
            {images.length > 0 && (
              <div className="py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Không gian & Trải nghiệm</h2>
                
                {tour.experienceDescription && (
                  <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed whitespace-pre-line mb-8 text-lg">
                    {tour.experienceDescription}
                  </div>
                )}

                <div className="space-y-10">
                  {images.map((img, idx) => (
                    <div key={idx} className="group">
                      <div className="overflow-hidden rounded-xl bg-gray-100 shadow-sm cursor-pointer" onClick={() => setLightbox(idx)}>
                        <img src={img.url} alt={img.caption || `Ảnh ${idx + 1}`} className="w-full h-auto max-h-[500px] object-cover group-hover:scale-[1.02] transition duration-500" />
                      </div>
                      {img.caption && (
                        <p className="mt-3 text-sm text-gray-500 italic text-center">▲ {img.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              
            )}
            <div className="py-10 border-t border-gray-200">
              <CommentSection
                itemId={tour.id}
                itemType="TOUR"
              />
            </div>


          </div>

          {/* CỘT PHẢI: STICKY BOOKING CARD (30%) */}
          {/* Cột phải — booking card */}
          <div className="lg:w-1/3">
            <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl shadow-xl p-6">

              {/* Giá — dùng selectedDep nếu có, fallback tour.price */}
              <div className="flex items-end gap-2 mb-4 pb-4 border-b border-gray-100">
                <span className="text-3xl font-extrabold text-blue-600 leading-none">
                  {(selectedDep?.price || tour.price)?.toLocaleString('vi-VN')}đ
                </span>
                <span className="text-gray-500 font-medium pb-1">/ khách</span>
              </div>

              {/* Departure đã chọn */}
              {selectedDep ? (
                <div className="bg-blue-50 rounded-xl p-3 mb-4 text-sm">
                  <p className="font-bold text-blue-700">📅 Ngày đã chọn</p>
                  <p className="text-blue-600 mt-1">
                    {new Date(selectedDep.startDate).toLocaleDateString('vi-VN')}
                    {' → '}
                    {new Date(selectedDep.endDate).toLocaleDateString('vi-VN')}
                    {' · '}{selectedDep.totalDays} ngày
                  </p>
                  <button onClick={() => setSelectedDep(null)}
                    className="text-xs text-gray-400 hover:text-red-400 mt-1">
                    ✕ Bỏ chọn
                  </button>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-700">
                  ⚠️ Vui lòng chọn ngày khởi hành
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                  <span className="text-gray-600">Còn trống</span>
                  <span className="font-bold">{selectedDep?.availableSlots ?? tour.availableSlots} chỗ</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                  <span className="text-gray-600">Tiền cọc (20%)</span>
                  <span className="font-bold text-amber-600">
                    {((selectedDep?.price || tour.price) * 0.2)?.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              {/* Nút đặt — truyền departureId qua URL */}
              {activeDepartures.length > 0 ? (
                // Có departure → cho đặt
                <button
                  onClick={() => {
                    if (selectedDep) {
                      navigate(`/booking/${tour.id}?depId=${selectedDep.id}`);
                    }
                  }}
                  className={`w-full block text-center font-bold text-lg py-4 rounded-xl
                    text-white transition duration-200 ${
                    selectedDep
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-md cursor-pointer'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}>
                  {selectedDep ? t('tour.bookTour') : 'Chọn ngày trước'}
                </button>
              ) : (
                // Không có departure khả dụng → hiện thông báo thay vì nút
                <div className="w-full text-center py-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-amber-700 font-bold text-sm">
                    🗓️ Chưa có lịch khởi hành
                  </p>
                  <p className="text-amber-500 text-xs mt-1">
                    Quay lại sau để xem lịch mới
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── MOBILE STICKY BOTTOM BAR (Chỉ hiện trên điện thoại) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Giá vé</p>
          <p className="text-blue-600 font-bold text-xl leading-none">
            {tour.price?.toLocaleString('vi-VN')}đ
          </p>
        </div>
        {activeDepartures.length > 0 ? (
          <button
            onClick={() => {
              if (selectedDep) {
                navigate(`/booking/${tour.id}?depId=${selectedDep.id}`);
              }
            }}
            className={`font-bold px-6 py-3 rounded-xl text-white transition ${
              selectedDep ? 'bg-blue-600 active:bg-blue-800 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
            }`}>
            {selectedDep ? 'Đặt ngay' : 'Chọn ngày'}
          </button>
        ) : (
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-amber-700 font-bold text-sm">Chưa có lịch</p>
          </div>
        )}
      </div>

      


      {/* ── LIGHTBOX (Giữ nguyên) ── */}
      {lightbox !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-[100] flex flex-col items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-5 text-white text-4xl hover:text-gray-300 transition leading-none z-10" onClick={() => setLightbox(null)}>×</button>
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white text-sm bg-white bg-opacity-20 px-4 py-1 rounded-full backdrop-blur-sm">
            {lightbox + 1} / {images.length}
          </span>

          {images.length > 1 && (
            <button onClick={e => { e.stopPropagation(); setLightbox(i => (i - 1 + images.length) % images.length); }} className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 text-white text-4xl md:text-6xl hover:text-gray-300 transition p-4">‹</button>
          )}

          <div className="flex flex-col items-center gap-4 max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <img src={images[lightbox]?.url} alt={images[lightbox]?.caption || ''} className="max-h-[80vh] max-w-full object-contain rounded-md" />
            {images[lightbox]?.caption && <p className="text-gray-300 text-sm text-center italic px-4 text-lg">▲ {images[lightbox].caption}</p>}
          </div>

          {images.length > 1 && (
            <button onClick={e => { e.stopPropagation(); setLightbox(i => (i + 1) % images.length); }} className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 text-white text-4xl md:text-6xl hover:text-gray-300 transition p-4">›</button>
          )}
        </div>
      )}

      {/* Spacer cho mobile bar */}
      <div className="h-24 lg:hidden"></div>
    </div>
  );
}

export default TourDetail;