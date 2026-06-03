import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getReviewsAPI,
  createReviewAPI,
  deleteReviewAPI,
  ReviewData,
} from '../services/api';

interface Props {
  fieldId: string;
  fieldName: string;
}

const StarRating: React.FC<{ value: number; onChange?: (v: number) => void; size?: string }> = ({
  value,
  onChange,
  size = 'text-xl',
}) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1 items-center" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`${size} transition-colors ${!onChange ? 'cursor-default' : 'cursor-pointer'}`}
          disabled={!onChange}
        >
          <i
            className={`fa${(hover || value) >= star ? 's' : 'r'} fa-star`}
            style={{ color: (hover || value) >= star ? '#f59e0b' : '#d1d5db' }}
          />
        </button>
      ))}
    </div>
  );
};

const FieldReviews: React.FC<Props> = ({ fieldId, fieldName }) => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    const data = await getReviewsAPI(fieldId);
    setReviews(data);
    // Pre-fill if user already reviewed
    if (user) {
      const mine = data.find((r) => r.userId === user.id);
      if (mine) {
        setMyRating(mine.rating);
        setMyComment(mine.comment);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [fieldId]);

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myRating) return setError('يرجى اختيار تقييم');
    setSubmitting(true);
    setError('');
    const result = await createReviewAPI(fieldId, myRating, myComment);
    setSubmitting(false);
    if (result.success) {
      setSuccess('تم إرسال تقييمك بنجاح ✅');
      setTimeout(() => setSuccess(''), 3000);
      fetchReviews();
    } else {
      setError(result.error || 'حدث خطأ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل تريد حذف تقييمك؟')) return;
    const ok = await deleteReviewAPI(id);
    if (ok) {
      setMyRating(0);
      setMyComment('');
      fetchReviews();
    }
  };

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6" dir="rtl">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <i className="fas fa-star text-amber-400"></i>
        التقييمات والمراجعات
      </h3>

      {/* Summary */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 mb-8 p-5 bg-slate-50 rounded-2xl">
          <div className="text-center flex-shrink-0">
            <p className="text-5xl font-black text-slate-900">{avgRating}</p>
            <StarRating value={Math.round(avgRating)} size="text-lg" />
            <p className="text-sm text-slate-500 mt-1">{reviews.length} تقييم</p>
          </div>
          <div className="flex-1 space-y-2">
            {ratingDist.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-4 text-center">{star}</span>
                <i className="fas fa-star text-amber-400 text-xs"></i>
                <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-4 text-center">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
          <p className="font-semibold text-slate-800 mb-3">
            {reviews.find((r) => r.userId === user?.id) ? 'تعديل تقييمك' : `قيّم ${fieldName}`}
          </p>
          <div className="mb-3">
            <StarRating value={myRating} onChange={setMyRating} size="text-2xl" />
          </div>
          <textarea
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder="اكتب مراجعتك هنا (اختياري)..."
            rows={3}
            maxLength={500}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 resize-none transition-all"
          />
          <p className="text-xs text-slate-400 text-left mt-1">{myComment.length}/500</p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl mt-2 border border-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 text-sm px-4 py-2 rounded-xl mt-2 border border-green-100">
              {success}
            </div>
          )}

          <div className="flex gap-3 mt-3">
            <button
              type="submit"
              disabled={submitting || !myRating}
              className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin ml-2"></i>جاري الإرسال...
                </>
              ) : (
                'إرسال التقييم'
              )}
            </button>
            {reviews.find((r) => r.userId === user?.id) && (
              <button
                type="button"
                onClick={() => {
                  const mine = reviews.find((r) => r.userId === user?.id);
                  if (mine) handleDelete(mine.id);
                }}
                className="bg-red-50 text-red-500 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-red-100 transition-all border border-red-100"
              >
                حذف تقييمي
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="mb-8 p-5 bg-slate-50 rounded-2xl text-center border border-slate-100">
          <i className="fas fa-lock text-slate-400 text-xl mb-2"></i>
          <p className="text-slate-500 text-sm">سجّل دخولك لتترك تقييمك</p>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <i className="fas fa-comment-slash text-3xl mb-3"></i>
          <p className="font-medium">لا توجد تقييمات حتى الآن</p>
          <p className="text-sm">كن أول من يقيّم هذا الملعب</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
              <img
                src={
                  review.userAvatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=10b981&color=fff`
                }
                alt={review.userName}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-bold text-slate-800 text-sm">{review.userName}</p>
                  <span className="text-xs text-slate-400">
                    {new Date(review.createdAt).toLocaleDateString('ar-JO')}
                  </span>
                </div>
                <StarRating value={review.rating} size="text-sm" />
                {review.comment && (
                  <p className="text-slate-600 text-sm mt-1 leading-relaxed">{review.comment}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FieldReviews;
