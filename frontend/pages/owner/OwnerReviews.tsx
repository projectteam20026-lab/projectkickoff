import React, { useState, useEffect } from 'react';
import { backend } from '../../services/backend';
import { type OwnerReview } from '../../services/api';

const Stars: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'text-sm' }) => (
  <span className={`${size} inline-flex gap-0.5`}>
    {[1, 2, 3, 4, 5].map(i => (
      <i key={i} className={`fas fa-star ${i <= rating ? 'text-amber-400' : 'text-gray-200'}`} />
    ))}
  </span>
);

const OwnerReviews: React.FC = () => {
  const [reviews, setReviews]   = useState<OwnerReview[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filterField, setFilterField] = useState<string>('الكل');
  const [filterStar, setFilterStar]   = useState<number>(0);

  useEffect(() => {
    backend.getOwnerReviews().then(({ data, avgRating: avg }) => {
      setReviews(data);
      setAvgRating(avg);
      setLoading(false);
    });
  }, []);

  const fieldNames = ['الكل', ...Array.from(new Set(reviews.map(r => r.fieldName)))];

  const visible = reviews.filter(r => {
    const matchField = filterField === 'الكل' || r.fieldName === filterField;
    const matchStar  = filterStar === 0 || r.rating === filterStar;
    return matchField && matchStar;
  });

  const ratingCounts = [5, 4, 3, 2, 1].map(s => ({
    star:  s,
    count: reviews.filter(r => r.rating === s).length,
    pct:   reviews.length ? Math.round((reviews.filter(r => r.rating === s).length / reviews.length) * 100) : 0,
  }));

  return (
    <div className="space-y-5" dir="rtl">

      {/* Header */}
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">آراء العملاء</p>
        <h1 className="text-2xl font-black text-slate-900">التقييمات</h1>
      </div>

      {/* Summary */}
      {loading ? (
        <div className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex gap-6 flex-wrap">
            {/* Big rating */}
            <div className="text-center min-w-[100px]">
              <p className="text-5xl font-black text-slate-900">{avgRating.toFixed(1)}</p>
              <Stars rating={Math.round(avgRating)} size="text-lg" />
              <p className="text-xs text-slate-400 font-bold mt-1">{reviews.length} تقييم</p>
            </div>
            {/* Breakdown */}
            <div className="flex-1 space-y-2">
              {ratingCounts.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterStar(filterStar === star ? 0 : star)}
                    className={`text-xs font-bold w-5 text-end flex items-center gap-0.5 transition-colors ${
                      filterStar === star ? 'text-amber-500' : 'text-slate-500 hover:text-amber-500'
                    }`}>
                    {star} <i className="fas fa-star text-[8px]" />
                  </button>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-bold w-6">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {!loading && reviews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fieldNames.map(name => (
            <button key={name} onClick={() => setFilterField(name)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                filterField === name
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-gray-200 hover:border-slate-300'
              }`}>
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-14 text-center">
          <div className="text-4xl mb-3">⭐</div>
          <h3 className="font-black text-slate-800 mb-1">
            {reviews.length === 0 ? 'لا توجد تقييمات بعد' : 'لا توجد نتائج للفلتر المحدد'}
          </h3>
          <p className="text-slate-400 text-sm">
            {reviews.length === 0
              ? 'ستظهر تقييمات العملاء هنا بعد حجز ملاعبك'
              : 'غيّر الفلتر لرؤية تقييمات أخرى'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  {r.userAvatar
                    ? <img src={r.userAvatar} alt={r.userName} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-slate-500 font-black">
                        {r.userName?.charAt(0) || '?'}
                      </div>
                  }
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{r.userName || 'مجهول'}</span>
                      <span className="text-slate-300 mx-2">·</span>
                      <span className="text-xs text-slate-400 font-bold">{r.fieldName}</span>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  {r.comment && (
                    <p className="text-sm text-slate-600 leading-relaxed mt-1">{r.comment}</p>
                  )}
                  <p className="text-[11px] text-slate-300 mt-2 font-bold">
                    {new Date(r.createdAt).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerReviews;
