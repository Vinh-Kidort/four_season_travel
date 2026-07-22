import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../api/axios';
import { tokenManager } from '../api/tokenManager';

// ── Star Icon ─────────────────────────────────────────────────
function StarIcon({ filled, onMouseEnter, onMouseLeave, onClick }) {
  return (
    <svg
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={`w-5 h-5 sm:w-6 sm:h-6 cursor-pointer transition ${
        filled ? 'text-yellow-400' : 'text-gray-300'
      }`}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

// ── Main ──────────────────────────────────────────────────────
function CommentSection({ itemId, itemType }) {
  const { t } = useTranslation();

  const [reviews,     setReviews]     = useState([]);
  const [content,     setContent]     = useState('');
  const [rating,      setRating]      = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [error,       setError]       = useState('');
  const [hasJoined,     setHasJoined]     = useState(false);
  const [joinedLoading, setJoinedLoading] = useState(false);

  const isLoggedIn = !!tokenManager.getToken();
  const userEmail  = localStorage.getItem('userEmail');
  const userName   = localStorage.getItem('userName') || userEmail?.split('@')[0] || 'User';
  const isTour     = itemType === 'TOUR';

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`/reviews/${itemId}`);
      setReviews(res.data);
    } catch {}
  };

  const checkJoined = async () => {
    if (!isTour || !isLoggedIn) return;
    setJoinedLoading(true);
    try {
      const res = await axios.get(`/bookings/check-joined?tourId=${itemId}`);
      setHasJoined(res.data?.joined === true);
    } catch { setHasJoined(false); }
    finally { setJoinedLoading(false); }
  };

  useEffect(() => {
    fetchReviews();
    checkJoined();
  }, [itemId]);

  const canRate = !isTour || hasJoined;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!content.trim()) return;
    const effectiveRating = canRate ? rating : 0;
    try {
      await axios.post('/reviews', { itemId, itemType, userEmail, userName, content, rating: effectiveRating });
      setContent(''); setRating(0); setHoverRating(0);
      await fetchReviews();
    } catch (err) {
      setError(err.response?.data || t('comment.error'));
    }
  };

  const ratedReviews  = reviews.filter(r => r.rating > 0);
  const averageRating = ratedReviews.length > 0
    ? (ratedReviews.reduce((s, r) => s + r.rating, 0) / ratedReviews.length).toFixed(1)
    : null;

  return (
    <section className="mt-8 sm:mt-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between
        gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900">
            ⭐ {t('comment.title')}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{t('comment.subtitle')}</p>
        </div>
        {averageRating && (
          <div className="bg-gray-50 rounded-xl px-4 sm:px-5 py-3 sm:py-4
            border flex-shrink-0 flex sm:block items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {averageRating}
              </span>
              <span className="text-yellow-500 text-lg sm:text-xl">⭐</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              {ratedReviews.length} {t('comment.ratedReviews')}
            </p>
          </div>
        )}
      </div>

      {/* Form */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 mb-6 sm:mb-8">
          {/* Avatar */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white
            flex items-center justify-center font-bold flex-shrink-0 text-sm sm:text-base">
            {userName.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                isTour && !hasJoined
                  ? t('comment.placeholderNoJoin')
                  : t('comment.placeholder')
              }
              rows="2"
              className="w-full border border-gray-300 rounded-xl px-3 sm:px-4
                py-2.5 sm:py-3 text-sm resize-none focus:ring-2 focus:ring-blue-500
                focus:border-blue-500 outline-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mt-2 sm:mt-3">
              {/* Stars */}
              {canRate ? (
                <div className="flex items-center gap-0.5 sm:gap-1">
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
                      className="text-xs text-red-500 ml-1.5">
                      {t('comment.clearRating')}
                    </button>
                  )}
                </div>
              ) : (
                !joinedLoading && isTour && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>⭐</span>
                    <span>{t('comment.ratingGateMsg')}</span>
                  </div>
                )
              )}

              <button type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium
                  px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg transition text-sm
                  whitespace-nowrap">
                {t('comment.submit')}
              </button>
            </div>

            {error && <p className="text-red-500 text-xs sm:text-sm mt-2">{error}</p>}
          </div>
        </form>
      ) : (
        <div className="bg-blue-50 text-blue-700 border border-blue-100 rounded-lg
          px-4 py-3 mb-6 sm:mb-8 text-sm">
          {t('comment.loginPrompt')}
        </div>
      )}

      {/* List */}
      <div className="space-y-4 sm:space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {t('comment.empty')}
          </div>
        ) : (
          reviews.map(rev => (
            <div key={rev.id} className="flex gap-2 sm:gap-3">
              {/* Avatar */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200
                text-gray-700 flex items-center justify-center font-semibold
                flex-shrink-0 text-sm sm:text-base">
                {rev.userName?.charAt(0).toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex-1 border-b border-gray-100 pb-4 sm:pb-5 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="font-semibold text-gray-800 text-sm sm:text-base">
                    {rev.userName}
                  </span>
                  <span className="text-xs text-gray-400">{rev.createdAt}</span>
                  {rev.rating > 0 && (
                    <span className="text-xs sm:text-sm text-yellow-500">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 sm:mt-2 text-gray-700 text-sm leading-relaxed
                  whitespace-pre-wrap">
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