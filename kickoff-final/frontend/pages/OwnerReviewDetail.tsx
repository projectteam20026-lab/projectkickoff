import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type ReviewItem = { id:string; name:string; avatar:string; rating:number; comment:string; date:string };

const OwnerReviewDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const review   = location.state?.review as ReviewItem | undefined;
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({msg, ok});
    setTimeout(() => setToast(null), 2500);
  };

  if (!review) return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="text-center">
        <i className="fas fa-star text-5xl text-gray-300 mb-4 block" />
        <p className="text-slate-500 font-bold mb-4">لم يتم العثور على بيانات التقييم</p>
        <button onClick={() => navigate('/owner')} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm">
          العودة
        </button>
      </div>
    </div>
  );

  const sentiment =
    review.rating >= 5 ? { emoji:'🌟', label:'ممتاز', color:'text-emerald-600', bg:'bg-emerald-50', border:'border-emerald-200' } :
    review.rating >= 4 ? { emoji:'😊', label:'جيد جداً', color:'text-blue-600', bg:'bg-blue-50', border:'border-blue-200' } :
    review.rating >= 3 ? { emoji:'😐', label:'متوسط', color:'text-amber-600', bg:'bg-amber-50', border:'border-amber-200' } :
                         { emoji:'😞', label:'سيء', color:'text-red-600', bg:'bg-red-50', border:'border-red-200' };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-sans">
      {toast && (
        <div className={`fixed top-6 inset-x-0 mx-auto w-fit z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white ${toast.ok?'bg-emerald-500':'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/owner', { state: { tab: 'reviews' } })}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all shrink-0">
            <i className="fas fa-arrow-right text-sm" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">تفاصيل التقييم</p>
            <h1 className="font-black text-base">{review.name}</h1>
          </div>
          <div className="flex items-center gap-1 bg-amber-400/20 border border-amber-400/30 px-3 py-1.5 rounded-xl shrink-0">
            <i className="fas fa-star text-amber-400 text-xs" />
            <span className="text-amber-300 font-black text-sm">{review.rating}/5</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Reviewer card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start gap-4 mb-5">
            <img src={review.avatar} alt={review.name} className="w-16 h-16 rounded-2xl object-cover shrink-0 shadow-sm" />
            <div className="flex-1">
              <p className="font-black text-slate-900 text-xl">{review.name}</p>
              <div className="flex items-center gap-1 mt-2">
                {[1,2,3,4,5].map(s => (
                  <i key={s} className={`fas fa-star text-lg ${review.rating>=s?'text-amber-400':'text-gray-200'}`} />
                ))}
                <span className="text-slate-500 text-sm font-bold ms-2">{review.rating} من 5</span>
              </div>
              <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-1.5">
                <i className="fas fa-calendar text-xs" />{review.date}
              </p>
            </div>
          </div>

          {/* Sentiment badge */}
          <div className={`flex items-center gap-3 rounded-xl p-3 mb-4 border ${sentiment.bg} ${sentiment.border}`}>
            <span className="text-2xl">{sentiment.emoji}</span>
            <p className={`font-black text-sm ${sentiment.color}`}>{sentiment.label}</p>
          </div>

          {/* Comment */}
          <div className="bg-gray-50 rounded-xl p-4 border-r-4 border-amber-400">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">نص التقييم</p>
            <p className="text-slate-700 leading-relaxed">{review.comment}</p>
          </div>
        </div>

        {/* Stars breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <i className="fas fa-chart-bar text-emerald-500" /> تفاصيل التقييم
          </h3>
          <div className="flex justify-between gap-2">
            {[1,2,3,4,5].map(n => (
              <div key={n} className="flex flex-col items-center gap-2 flex-1">
                <div className={`w-full aspect-square rounded-xl flex items-center justify-center max-w-[48px] mx-auto border-2 ${
                  review.rating===n ? 'bg-amber-100 border-amber-400' : review.rating>n ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <i className={`fas fa-star text-sm ${review.rating>=n?'text-amber-400':'text-gray-200'}`} />
                </div>
                <span className="text-[11px] font-bold text-slate-400">{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reply */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
            <i className="fas fa-reply text-emerald-500" /> ردّك على التقييم
          </h3>
          <p className="text-xs text-slate-400 mb-4">ردّك سيظهر للعميل وللزوار تحت تقييمه</p>
          {replySent ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <i className="fas fa-check-circle text-emerald-500 text-xl mt-0.5" />
              <div>
                <p className="font-bold text-emerald-700 mb-1">تم إرسال ردك بنجاح ✅</p>
                <p className="text-emerald-600 text-sm leading-relaxed italic">"{replyText}"</p>
              </div>
            </div>
          ) : (
            <>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={4}
                placeholder={`اكتب ردك على تقييم ${review.name}...\nمثال: شكراً لك على تقييمك الكريم، نسعد دائماً باستقبالك وسنعمل على توفير تجربة أفضل.`}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none text-sm bg-gray-50 resize-none mb-3"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { if(replyText.trim()) { setReplySent(true); showToast('✅ تم إرسال ردك', true); } }}
                  disabled={!replyText.trim()}
                  className="flex-1 py-3 bg-slate-900 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
                  <i className="fas fa-paper-plane" /> إرسال الرد
                </button>
                <button onClick={() => setReplyText('')} className="px-4 py-3 border border-gray-200 text-slate-400 hover:text-slate-600 rounded-xl text-sm transition-colors">
                  <i className="fas fa-eraser" />
                </button>
              </div>
            </>
          )}
        </div>

        <button onClick={() => navigate('/owner', { state: { tab: 'reviews' } })}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 transition-all">
          <i className="fas fa-arrow-right" /> العودة لقائمة التقييمات
        </button>
      </div>
    </div>
  );
};

export default OwnerReviewDetail;
