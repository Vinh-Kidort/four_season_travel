import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

// ── Star picker ───────────────────────────────────────────────
function StarIcon({ filled, onMouseEnter, onMouseLeave, onClick }) {
  return (
    <svg
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={`w-6 h-6 cursor-pointer transition ${
        filled ? 'text-yellow-400' : 'text-gray-300'
      }`}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────
function CommentSection({ itemId, itemType }) {
  const [reviews,     setReviews]     = useState([]);
  const [content,     setContent]     = useState('');
  const [rating,      setRating]      = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [error,       setError]       = useState('');

  // Tour-specific: đã check-in chưa?
  const [hasJoined,     setHasJoined]     = useState(false);
  const [joinedLoading, setJoinedLoading] = useState(false);

  const isLoggedIn = !!localStorage.getItem('token');
  const userEmail  = localStorage.getItem('userEmail');
  const userName   =
    localStorage.getItem('userName') ||
    userEmail?.split('@')[0] ||
    'User';

  const isTour = itemType === 'TOUR';

  // ── Fetch reviews ─────────────────────────────────────────
  const fetchReviews = async () => {
    try {
      const res = await axios.get(`/reviews/${itemId}`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Kiểm tra user đã check-in tour chưa ──────────────────
  const checkJoined = async () => {
    if (!isTour || !isLoggedIn) return;
    setJoinedLoading(true);
    try {
      const res = await axios.get(`/bookings/check-joined?tourId=${itemId}`);
      setHasJoined(res.data?.joined === true);
    } catch {
      setHasJoined(false);
    } finally {
      setJoinedLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    console.log('CommentSection itemId:', itemId, 'itemType:', itemType);
    checkJoined();
  }, [itemId]);

 
  // Tour: chỉ được nếu đã check-in
  const canRate = !isTour || hasJoined;

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!content.trim()) return;

    // Nếu là tour mà chưa check-in → không cho gửi kèm sao
    const effectiveRating = canRate ? rating : 0;

    try {
      await axios.post('/reviews', {
        itemId,
        itemType,
        userEmail,
        userName,
        content,
        rating: effectiveRating,
      });
      setContent('');
      setRating(0);
      setHoverRating(0);
      await fetchReviews();
    } catch (err) {
      setError(err.response?.data || 'Lỗi khi đăng bình luận');
    }
  };

  // ── Tính điểm trung bình ──────────────────────────────────
  const ratedReviews = reviews.filter(r => r.rating > 0);
  const averageRating = ratedReviews.length > 0
    ? (ratedReviews.reduce((s, r) => s + r.rating, 0) / ratedReviews.length).toFixed(1)
    : null;

  return (
    <section className="mt-12">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">⭐ Đánh giá từ khách hàng</h2>
          <p className="text-gray-500 mt-1">Chia sẻ trải nghiệm thực tế từ du khách</p>
        </div>
        {averageRating && (
          <div className="bg-gray-50 rounded-xl px-5 py-4 border flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-900">{averageRating}</span>
              <span className="text-yellow-500 text-xl">⭐</span>
            </div>
            <p className="text-sm text-gray-500">{ratedReviews.length} đánh giá có sao</p>
          </div>
        )}
      </div>

      {/* ── Form gửi bình luận ── */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center
            justify-center font-bold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                isTour && !hasJoined
                  ? 'Bạn có thể bình luận, nhưng chỉ khách đã tham gia tour mới được đánh giá sao...'
                  : 'Chia sẻ trải nghiệm của bạn...'
              }
              rows="2"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 mt-3">

              {/* Sao — chỉ hiện nếu được rating */}
              {canRate ? (
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(star => (
                    <StarIcon
                      key={star}
                      filled={star <= (hoverRating || rating)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    />
                  ))}
                  {rating > 0 && (
                    <button type="button" onClick={() => setRating(0)}
                      className="text-xs text-red-500 ml-2">
                      Xóa
                    </button>
                  )}
                </div>
              ) : (
                /* Tour chưa check-in → thông báo thay chỗ sao */
                !joinedLoading && isTour && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>⭐</span>
                    <span>Chỉ khách đã được check-in mới có thể đánh giá sao</span>
                  </div>
                )
              )}

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium
                  px-5 py-2 rounded-lg transition"
              >
                Gửi bình luận
              </button>
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        </form>
      ) : (
        <div className="bg-blue-50 text-blue-700 border border-blue-100 rounded-lg
          px-4 py-3 mb-8 text-sm">
          Vui lòng đăng nhập để bình luận.
        </div>
      )}

      {/* ── Danh sách bình luận ── */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Chưa có bình luận nào.</div>
        ) : (
          reviews.map(rev => (
            <div key={rev.id} className="flex gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center
                justify-center font-semibold shrink-0">
                {rev.userName?.charAt(0).toUpperCase()}
              </div>

              {/* Nội dung */}
              <div className="flex-1 border-b border-gray-100 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-800">{rev.userName}</span>
                  <span className="text-xs text-gray-400">{rev.createdAt}</span>
                  {rev.rating > 0 && (
                    <span className="text-sm text-yellow-500">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {rev.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default CommentSection;