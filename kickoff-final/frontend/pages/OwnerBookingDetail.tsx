import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Booking } from '../types';

const OwnerBookingDetail: React.FC = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const booking   = location.state?.booking as Booking | undefined;
  const [status, setStatus] = useState(booking?.status || '');
  const [toast,  setToast]  = useState<{msg:string;ok:boolean}|null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({msg, ok});
    setTimeout(() => setToast(null), 2500);
  };

  if (!booking) return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="text-center">
        <i className="fas fa-calendar-times text-5xl text-gray-300 mb-4 block" />
        <p className="text-slate-500 font-bold mb-4">لم يتم العثور على بيانات الحجز</p>
        <button onClick={() => navigate('/owner')} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm">
          العودة للوحة التحكم
        </button>
      </div>
    </div>
  );

  const statusColor = status==='مؤكد' ? 'emerald' : status==='ملغي' ? 'red' : 'amber';
  const payMethod   = (booking as any).paymentMethod;

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
          <button onClick={() => navigate('/owner', { state: { tab: 'bookings' } })}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all shrink-0">
            <i className="fas fa-arrow-right text-sm" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">تفاصيل الحجز</p>
            <h1 className="font-black text-base truncate">{booking.fieldName}</h1>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 ${
            statusColor==='emerald'?'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30':
            statusColor==='red'    ?'bg-red-500/20 text-red-300 border border-red-500/30':
                                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>{status}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Status timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-900 mb-5 flex items-center gap-2">
            <i className="fas fa-stream text-emerald-500" /> مسار الحجز
          </h3>
          {status !== 'ملغي' ? (
            <div className="flex items-center">
              {['قيد الانتظار','مؤكد','منتهي'].map((s,i) => {
                const order   = ['قيد الانتظار','مؤكد','منتهي'];
                const curIdx  = order.indexOf(status);
                const done    = i < curIdx;
                const current = i === curIdx;
                return (
                  <React.Fragment key={s}>
                    {i > 0 && <div className={`flex-1 h-0.5 mx-1 ${done||current?'bg-emerald-400':'bg-gray-200'}`} />}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                        current ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200' :
                        done    ? 'bg-emerald-100 border-emerald-400 text-emerald-600' :
                                  'bg-gray-100 border-gray-200 text-gray-300'
                      }`}>
                        {done ? <i className="fas fa-check text-xs" /> : <span className="text-xs font-black">{i+1}</span>}
                      </div>
                      <span className={`text-[10px] font-bold ${current?'text-emerald-600':done?'text-slate-500':'text-slate-300'}`}>{s}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <i className="fas fa-times text-red-500 text-lg" />
              </div>
              <div>
                <p className="font-black text-red-700">الحجز ملغي</p>
                <p className="text-xs text-red-500 mt-0.5">تم إلغاء هذا الحجز</p>
              </div>
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <i className="fas fa-info-circle text-emerald-500" /> معلومات الحجز
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon:'fa-futbol',      label:'الملعب',          val:booking.fieldName,    ltr:false },
              { icon:'fa-hashtag',     label:'رقم الحجز',       val:`#${booking.id.slice(-6).toUpperCase()}`, ltr:true },
              { icon:'fa-calendar',    label:'التاريخ',          val:booking.date,         ltr:true  },
              { icon:'fa-clock',       label:'الوقت',            val:booking.timeSlot,     ltr:true  },
              { icon:'fa-money-bill',  label:'المبلغ',           val:`${booking.price} د.أ`, ltr:false },
              { icon:'fa-credit-card', label:'طريقة الدفع',     val:payMethod==='visa'?'فيزا / بطاقة':'كاش', ltr:false },
            ].map(f => (
              <div key={f.label} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <i className={`fas ${f.icon} text-slate-400 text-[10px]`} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{f.label}</p>
                </div>
                <p className="font-black text-slate-800 text-sm" dir={f.ltr?'ltr':'rtl'}>{f.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment badge */}
        <div className={`rounded-2xl p-4 flex items-center gap-4 border ${payMethod==='visa'?'bg-blue-50 border-blue-200':'bg-green-50 border-green-200'}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${payMethod==='visa'?'bg-blue-100':'bg-green-100'}`}>
            <i className={`fas ${payMethod==='visa'?'fa-credit-card text-blue-600':'fa-money-bill-wave text-green-600'} text-xl`} />
          </div>
          <div>
            <p className={`font-black text-base ${payMethod==='visa'?'text-blue-800':'text-green-800'}`}>
              {payMethod==='visa' ? 'دفع إلكتروني — فيزا / بطاقة' : 'دفع نقدي — كاش'}
            </p>
            <p className={`text-sm mt-0.5 ${payMethod==='visa'?'text-blue-500':'text-green-500'}`}>
              {payMethod==='visa' ? 'تم الدفع إلكترونياً مسبقاً' : 'يُدفع عند الحضور'}
            </p>
          </div>
          <p className={`text-xl font-black ms-auto shrink-0 ${payMethod==='visa'?'text-blue-700':'text-green-700'}`}>{booking.price} د.أ</p>
        </div>

        {/* Actions */}
        {status === 'قيد الانتظار' && (
          <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-5">
            <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
              <i className="fas fa-tasks text-amber-500" /> إجراء مطلوب
            </h3>
            <p className="text-xs text-slate-400 mb-4">الحجز بانتظار موافقتك — اقبل أو ارفض</p>
            <div className="flex gap-3">
              <button onClick={() => { setStatus('مؤكد'); showToast('✅ تم قبول الحجز بنجاح', true); }}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-200">
                <i className="fas fa-check" /> قبول الحجز
              </button>
              <button onClick={() => { setStatus('ملغي'); showToast('❌ تم رفض الحجز', false); }}
                className="flex-1 py-3.5 border-2 border-red-200 text-red-500 hover:bg-red-50 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                <i className="fas fa-times" /> رفض الحجز
              </button>
            </div>
          </div>
        )}

        <button onClick={() => navigate('/owner', { state: { tab: 'bookings' } })}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 transition-all">
          <i className="fas fa-arrow-right" /> العودة لقائمة الحجوزات
        </button>
      </div>
    </div>
  );
};

export default OwnerBookingDetail;
