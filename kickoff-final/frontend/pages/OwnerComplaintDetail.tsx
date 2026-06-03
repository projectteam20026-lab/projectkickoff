import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type ComplaintItem = { id:string; from:string; date:string; text:string; resolved:boolean };

const OwnerComplaintDetail: React.FC = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const complaint = location.state?.complaint as ComplaintItem | undefined;
  const [resolved, setResolved] = useState(complaint?.resolved || false);
  const [note,     setNote]     = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({msg, ok});
    setTimeout(() => setToast(null), 2500);
  };

  if (!complaint) return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="text-center">
        <i className="fas fa-exclamation-circle text-5xl text-gray-300 mb-4 block" />
        <p className="text-slate-500 font-bold mb-4">لم يتم العثور على بيانات الشكوى</p>
        <button onClick={() => navigate('/owner')} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm">
          العودة
        </button>
      </div>
    </div>
  );

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
          <button onClick={() => navigate('/owner', { state: { tab: 'settings', sub: 'complaints' } })}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all shrink-0">
            <i className="fas fa-arrow-right text-sm" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">تفاصيل الشكوى</p>
            <h1 className="font-black text-base truncate">{complaint.from}</h1>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 border ${
            resolved
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/20 text-red-300 border-red-500/30'
          }`}>{resolved ? '✓ محلولة' : '⚠ مفتوحة'}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Complaint card */}
        <div className={`rounded-2xl p-5 border-2 shadow-sm ${resolved?'bg-white border-gray-100':'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${resolved?'bg-emerald-100':'bg-red-100'}`}>
              <i className={`fas ${resolved?'fa-check-circle text-emerald-500':'fa-exclamation-triangle text-red-500'} text-2xl`} />
            </div>
            <div>
              <p className="font-black text-slate-900 text-xl">{complaint.from}</p>
              <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                <i className="fas fa-calendar text-xs" />{complaint.date}
                <span className="mx-1">·</span>
                <span className={`font-bold ${resolved?'text-emerald-600':'text-red-500'}`}>
                  {resolved ? 'محلولة' : 'مفتوحة'}
                </span>
              </p>
            </div>
          </div>

          <div className={`rounded-xl p-4 border-r-4 ${resolved?'bg-gray-50 border-emerald-400':'bg-white border-red-400'}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">نص الشكوى</p>
            <p className="text-slate-700 leading-relaxed">{complaint.text}</p>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <i className="fas fa-info-circle text-emerald-500" /> تفاصيل الشكوى
          </h3>
          <div className="space-y-2">
            {[
              { icon:'fa-user',       label:'المُقدِّم', val:complaint.from  },
              { icon:'fa-calendar',   label:'التاريخ',   val:complaint.date  },
              { icon:'fa-flag',       label:'الحالة',    val:resolved?'محلولة ✅':'مفتوحة — بحاجة للمعالجة' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <i className={`fas ${f.icon} text-slate-500 text-xs`} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{f.label}</p>
                  <p className="font-bold text-slate-800 text-sm">{f.val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Internal note */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
            <i className="fas fa-sticky-note text-blue-500" /> ملاحظة داخلية
          </h3>
          <p className="text-xs text-slate-400 mb-4">للمتابعة الداخلية فقط — لن تُرسل للعميل</p>
          {noteSaved ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
              <i className="fas fa-sticky-note text-blue-500 mt-0.5" />
              <p className="text-blue-700 text-sm leading-relaxed italic">"{note}"</p>
            </div>
          ) : (
            <>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                placeholder="أضف ملاحظة داخلية للمتابعة، مثال: تم إصلاح الإضاءة في 2026-06-05..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm bg-gray-50 resize-none mb-3" />
              <button onClick={() => { if(note.trim()) { setNoteSaved(true); showToast('✅ تم حفظ الملاحظة', true); } }}
                disabled={!note.trim()}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold rounded-xl text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                <i className="fas fa-save" /> حفظ الملاحظة
              </button>
            </>
          )}
        </div>

        {/* Resolve */}
        {!resolved ? (
          <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-5">
            <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
              <i className="fas fa-tools text-red-500" /> معالجة الشكوى
            </h3>
            <p className="text-xs text-slate-400 mb-4">بعد التأكد من حل المشكلة اضغط الزر لإغلاق الشكوى</p>
            <button onClick={() => { setResolved(true); showToast('✅ تم حل الشكوى بنجاح', true); }}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-200">
              <i className="fas fa-check-circle" /> تم حل الشكوى
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
              <i className="fas fa-check-circle text-emerald-500 text-2xl" />
            </div>
            <div>
              <p className="font-black text-emerald-700 text-base">تم حل هذه الشكوى بنجاح 🎉</p>
              <p className="text-emerald-500 text-sm mt-0.5">يمكنك العودة لقائمة الشكاوي</p>
            </div>
          </div>
        )}

        <button onClick={() => navigate('/owner', { state: { tab: 'settings', sub: 'complaints' } })}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 transition-all">
          <i className="fas fa-arrow-right" /> العودة لقائمة الشكاوي
        </button>
      </div>
    </div>
  );
};

export default OwnerComplaintDetail;
