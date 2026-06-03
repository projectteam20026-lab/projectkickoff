import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type TourneyStatus = 'pending' | 'accepted' | 'declined';
type TourneyItem = {
  id: string; name: string; organizer: string; phone: string; email?: string;
  teams: number; format: string; startDate: string;
  days: string[]; time: string; notes: string; status: TourneyStatus;
};

const OwnerTournamentDetail: React.FC = () => {
  const location    = useLocation();
  const navigate    = useNavigate();
  const tournament  = location.state?.tournament as TourneyItem | undefined;
  const [status, setStatus] = useState<TourneyStatus>(tournament?.status || 'pending');
  const [toast,  setToast]  = useState<{msg:string;ok:boolean}|null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({msg, ok});
    setTimeout(() => setToast(null), 2500);
  };

  if (!tournament) return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="text-center">
        <i className="fas fa-trophy text-5xl text-gray-300 mb-4 block" />
        <p className="text-slate-500 font-bold mb-4">لم يتم العثور على بيانات البطولة</p>
        <button onClick={() => navigate('/owner')} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm">
          العودة للوحة التحكم
        </button>
      </div>
    </div>
  );

  const statusInfo = status==='accepted'
    ? { label:'مقبولة ✓', bg:'bg-emerald-500/20', text:'text-emerald-300', border:'border-emerald-500/30' }
    : status==='declined'
    ? { label:'مرفوضة ✕', bg:'bg-red-500/20', text:'text-red-300', border:'border-red-500/30' }
    : { label:'⏳ انتظار', bg:'bg-amber-500/20', text:'text-amber-300', border:'border-amber-500/30' };

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
          <button onClick={() => navigate('/owner', { state: { tab: 'tournaments' } })}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all shrink-0">
            <i className="fas fa-arrow-right text-sm" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">طلب بطولة</p>
            <h1 className="font-black text-base truncate">{tournament.name}</h1>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Hero card */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
          <div className="absolute -top-8 -end-8 w-32 h-32 bg-violet-500/15 rounded-full" />
          <div className="absolute -bottom-8 -start-8 w-40 h-40 bg-amber-400/10 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 bg-violet-500/20 rounded-2xl flex items-center justify-center shrink-0">
                <i className="fas fa-trophy text-violet-300 text-2xl" />
              </div>
              <div>
                <h2 className="font-black text-xl leading-tight">{tournament.name}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="bg-white/10 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-full">{tournament.format}</span>
                  <span className="bg-white/10 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-full">{tournament.teams} فريق</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              {[
                { icon:'fa-calendar-check', label:'تاريخ البداية', val:tournament.startDate },
                { icon:'fa-sun',            label:'وقت اللعب',     val:tournament.time      },
                { icon:'fa-sitemap',        label:'نظام البطولة',  val:tournament.format    },
              ].map((s,i) => (
                <div key={i} className="text-center">
                  <i className={`fas ${s.icon} text-slate-400 text-sm mb-1 block`} />
                  <p className="font-black text-white text-sm">{s.val}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Organizer */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <i className="fas fa-user-tie text-emerald-500" /> معلومات المنظِّم
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-violet-700">{tournament.organizer.charAt(0)}</span>
            </div>
            <div>
              <p className="font-black text-slate-900 text-lg">{tournament.organizer}</p>
              <a href={`tel:${tournament.phone}`} dir="ltr"
                className="flex items-center gap-2 text-emerald-600 font-bold text-sm mt-1 hover:text-emerald-700 transition-colors">
                <i className="fas fa-phone text-xs" />{tournament.phone}
              </a>
              {tournament.email && (
                <a href={`mailto:${tournament.email}`}
                  className="flex items-center gap-2 text-blue-500 font-bold text-sm mt-1 hover:text-blue-600 transition-colors">
                  <i className="fas fa-envelope text-xs" />{tournament.email}
                </a>
              )}
            </div>
          </div>
          <div className={`flex gap-3`}>
            <a href={`tel:${tournament.phone}`}
              className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
              <i className="fas fa-phone" /> الاتصال بالمنظِّم
            </a>
            {tournament.email && (
              <a href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(tournament.email)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                <i className="fas fa-envelope" /> مراسلة عبر Gmail
              </a>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <i className="fas fa-calendar-alt text-emerald-500" /> الجدول الزمني
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <i className="fas fa-calendar-check text-blue-500 text-sm" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">تاريخ البدء</p>
                <p className="font-black text-slate-800">{tournament.startDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                <i className="fas fa-calendar-week text-violet-500 text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">أيام اللعب</p>
                <div className="flex flex-wrap gap-1.5">
                  {tournament.days.map(d => (
                    <span key={d} className="bg-violet-100 text-violet-700 text-xs font-bold px-3 py-1 rounded-full">{d}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                <i className="fas fa-clock text-amber-500 text-sm" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">وقت اللعب</p>
                <p className="font-black text-slate-800">{tournament.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                <i className="fas fa-users text-emerald-500 text-sm" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">عدد الفرق المشاركة</p>
                <p className="font-black text-slate-800">{tournament.teams} فريق</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {tournament.notes ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h3 className="font-black text-amber-800 mb-2 flex items-center gap-2">
              <i className="fas fa-sticky-note text-amber-500" /> ملاحظات المنظِّم
            </h3>
            <p className="text-amber-900 text-sm leading-relaxed">{tournament.notes}</p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-slate-400 text-sm font-bold">لا توجد ملاحظات إضافية</p>
          </div>
        )}

        {/* Decision */}
        {status === 'pending' ? (
          <div className="bg-white rounded-2xl border-2 border-violet-200 shadow-sm p-5">
            <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
              <i className="fas fa-gavel text-violet-500" /> اتخاذ القرار
            </h3>
            <p className="text-xs text-slate-400 mb-4">بعد القبول، سيتم تثبيت المواعيد في كلندر الملعب</p>
            <div className="flex gap-3">
              <button onClick={() => { setStatus('accepted'); showToast('✅ تم قبول طلب البطولة', true); }}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-200">
                <i className="fas fa-check" /> قبول البطولة
              </button>
              <button onClick={() => { setStatus('declined'); showToast('❌ تم رفض الطلب', false); }}
                className="flex-1 py-3.5 border-2 border-red-200 text-red-500 hover:bg-red-50 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                <i className="fas fa-times" /> رفض الطلب
              </button>
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${status==='accepted'?'bg-emerald-50 border border-emerald-200':'bg-red-50 border border-red-200'}`}>
            <i className={`fas ${status==='accepted'?'fa-check-circle text-emerald-500':'fa-times-circle text-red-500'} text-2xl`} />
            <div>
              <p className={`font-black text-sm ${status==='accepted'?'text-emerald-700':'text-red-600'}`}>
                {status==='accepted' ? 'تم قبول هذه البطولة بنجاح 🎉' : 'تم رفض هذا الطلب'}
              </p>
              <p className={`text-xs mt-0.5 ${status==='accepted'?'text-emerald-500':'text-red-400'}`}>
                {status==='accepted' ? 'سيتواصل معك المنظِّم لتنسيق التفاصيل' : 'يمكن للمنظِّم إعادة إرسال طلب جديد'}
              </p>
            </div>
          </div>
        )}

        <button onClick={() => navigate('/owner', { state: { tab: 'tournaments' } })}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 transition-all">
          <i className="fas fa-arrow-right" /> العودة لقائمة البطولات
        </button>
      </div>
    </div>
  );
};

export default OwnerTournamentDetail;
