import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Field } from '../types';
import { getFieldByIdAPI, getAvailableSlotsAPI } from '../services/api';
import { backend } from '../services/backend';
import { useAuth } from '../contexts/AuthContext';
import FieldReviews from '../components/FieldReviews';

/* ── helpers ─────────────────────────────────────────────────────────── */
const AMENITY_ICONS: Record<string, string> = {
  Parking: 'fa-parking', WiFi: 'fa-wifi', Cafeteria: 'fa-coffee',
  Lighting: 'fa-lightbulb', 'Changing Rooms': 'fa-door-open',
  Showers: 'fa-shower', Security: 'fa-shield-alt', 'First Aid': 'fa-first-aid',
  'Spectator Area': 'fa-users', 'مواقف': 'fa-parking', 'إضاءة': 'fa-lightbulb',
  'مياه': 'fa-tint', 'غرف تغيير': 'fa-door-open', 'دورات مياه': 'fa-restroom',
  'كافتيريا': 'fa-coffee', 'واي فاي': 'fa-wifi',
};

const toTime = (h: string) => {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + (mm || 0);
};
const fromTime = (mins: number) => {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

function genSlots(open: string, close: string, durMins: number): string[] {
  const start = toTime(open);
  const end   = toTime(close);
  const slots: string[] = [];
  for (let t = start; t + durMins <= end; t += 60) {
    slots.push(`${fromTime(t)} - ${fromTime(t + durMins)}`);
  }
  return slots;
}

type PayMethod = 'cash' | 'visa';
type Step = 1 | 2 | 3 | 4;

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=900&q=80';

/* ── component ──────────────────────────────────────────────────────── */
const FieldDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [field,      setField]      = useState<Field | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [imgIdx,     setImgIdx]     = useState(0);
  const [liked,      setLiked]      = useState(false);

  /* booking state */
  const [step,        setStep]       = useState<Step>(1);
  const [date,        setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [durMins,     setDurMins]    = useState(60);
  const [slot,        setSlot]       = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsLoading,setSlotsLoading] = useState(false);
  const [payMethod,   setPayMethod]  = useState<PayMethod>('cash');
  const [booking,     setBooking]    = useState(false);
  const [bookError,   setBookError]  = useState('');
  /* visa form */
  const [cardName,   setCardName]   = useState('');
  const [cardNum,    setCardNum]    = useState('');
  const [cardExp,    setCardExp]    = useState('');
  const [cardCvv,    setCardCvv]    = useState('');

  useEffect(() => {
    if (!id) return;
    getFieldByIdAPI(id).then(f => { setField(f); setLoading(false); });
  }, [id]);

  /* fetch booked slots when field/date changes */
  useEffect(() => {
    if (!field?.id || !date) return;
    setSlotsLoading(true);
    setSlot(null);
    getAvailableSlotsAPI(field.id, date).then(({ booked }) => {
      setBookedSlots(booked);
      setSlotsLoading(false);
    });
  }, [field?.id, date]);

  const timeSlots = useMemo(() => {
    if (!field) return [];
    const open  = field.availableHours?.start || '08:00';
    const close = field.availableHours?.end   || '22:00';
    return genSlots(open, close, durMins);
  }, [field, durMins]);

  const totalPrice = field ? Math.round((field.pricePerHour * durMins) / 60) : 0;

  const handleBook = async () => {
    if (!field || !slot) return;
    if (!user) { navigate('/login'); return; }
    setBooking(true); setBookError('');
    const res = await backend.createBooking({ fieldId: field.id, date, timeSlot: slot });
    setBooking(false);
    if (res.success) setStep(4);
    else setBookError(res.error || 'حدث خطأ، حاول مجدداً');
  };

  const formatCardNum = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  /* ── loading ─────────────────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!field) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center">
        <div className="text-5xl mb-4">🏟️</div>
        <h2 className="text-xl font-black text-slate-800 mb-2">الملعب غير موجود</h2>
        <button onClick={() => navigate('/explore')} className="text-emerald-600 font-bold hover:underline">
          تصفح الملاعب
        </button>
      </div>
    </div>
  );

  const images = field.images?.filter(Boolean).length ? field.images : [DEFAULT_IMG];

  /* ── step indicator ──────────────────────────────────────────────── */
  const StepBar = () => (
    <div className="flex items-center justify-center gap-0 mb-1" dir="ltr">
      {[3, 2, 1].map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && <div className={`h-px w-8 ${step >= (4 - i) ? 'bg-white/60' : 'bg-white/20'}`} />}
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all
            ${step === s || (s === 1 && step === 4) ? 'bg-white text-emerald-600 border-white' :
              step > s ? 'bg-emerald-400 border-emerald-400 text-white' :
              'bg-transparent border-white/40 text-white/60'}`}>
            {step > s && s !== step ? <i className="fas fa-check text-[9px]" /> : s}
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  /* ── booking card ────────────────────────────────────────────────── */
  const BookingCard = () => (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 sticky top-4">
      {/* Header */}
      <div className="bg-emerald-500 px-5 py-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-lg flex items-center gap-2">
            <i className="fas fa-calendar-check text-sm" /> احجز الآن
          </h3>
          <span className="text-emerald-100 text-sm font-bold">{field.pricePerHour} د.أ/ساعة</span>
        </div>
        <StepBar />
      </div>

      <div className="p-5">

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Date */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-black text-slate-700 mb-2">
                <i className="fas fa-calendar text-emerald-500 text-xs" /> اختر التاريخ
              </label>
              <input type="date" value={date} min={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-emerald-400 outline-none" />
            </div>

            {/* Duration */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-black text-slate-700 mb-2">
                <i className="fas fa-hourglass-half text-emerald-500 text-xs" /> مدة الحجز
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mins: 60,  label: '1 ساعة',       sub: 'ساعة كاملة'   },
                  { mins: 90,  label: '1.5 ساعة',     sub: 'ساعة ونصف'    },
                  { mins: 120, label: '2 ساعة',        sub: 'ساعتان كاملتان' },
                ].map(d => (
                  <button key={d.mins} onClick={() => { setDurMins(d.mins); setSlot(null); }}
                    className={`py-2.5 px-2 rounded-xl text-center border-2 transition-all ${
                      durMins === d.mins
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200'
                        : 'border-gray-200 text-slate-600 hover:border-emerald-300'
                    }`}>
                    <div className="text-sm font-black">{d.label}</div>
                    <div className={`text-[10px] font-bold ${durMins === d.mins ? 'text-emerald-100' : 'text-slate-400'}`}>{d.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-black text-slate-700 mb-2">
                <i className="fas fa-clock text-emerald-500 text-xs" /> وقت البداية
                {slotsLoading && <i className="fas fa-spinner fa-spin text-emerald-400 text-xs ms-1" />}
              </label>
              {slotsLoading ? (
                <div className="flex justify-center py-5">
                  <div className="w-7 h-7 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : timeSlots.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-4 font-bold">لا توجد أوقات متاحة لهذا اليوم</p>
              ) : (
                <div className="grid grid-cols-3 gap-2" dir="ltr">
                  {timeSlots.map(s => {
                    const startPart = s.split(' - ')[0];
                    const isBooked  = bookedSlots.some(b => b.startsWith(startPart));
                    const isSel     = slot === s;
                    return (
                      <button key={s} onClick={() => !isBooked && setSlot(s)} disabled={isBooked}
                        className={`py-2 px-1 rounded-xl text-center text-xs font-bold border-2 transition-all ${
                          isBooked  ? 'bg-red-50 border-red-100 text-red-300 line-through cursor-not-allowed'
                          : isSel   ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200 scale-105'
                          :           'border-gray-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}>
                        <div>{s.split(' - ')[0]}</div>
                        <div className={`text-[9px] font-bold ${isSel ? 'text-emerald-100' : 'text-slate-400'}`}>
                          → {s.split(' - ')[1]}
                        </div>
                        {isBooked && <div className="text-[9px] text-red-300 mt-0.5">محجوز</div>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Total */}
            {slot && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs text-emerald-600 font-bold">المجموع</p>
                  <p className="text-[11px] text-emerald-500" dir="ltr">{slot}</p>
                </div>
                <p className="text-2xl font-black text-emerald-600">{totalPrice} <span className="text-sm font-bold">د.أ</span></p>
              </div>
            )}

            <button onClick={() => { if (!user) { navigate('/login'); return; } setStep(2); }}
              disabled={!slot}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
              <span>متابعة</span> <i className="fas fa-arrow-left text-sm" />
            </button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-4">
            <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
              <i className="fas fa-credit-card text-emerald-500" /> طريقة الدفع
            </h4>

            {/* Method selector */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPayMethod('cash')}
                className={`p-3.5 rounded-xl border-2 text-center transition-all ${
                  payMethod === 'cash' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="text-2xl mb-1">💵</div>
                <div className="font-black text-sm text-slate-800">كاش</div>
                <div className="text-[10px] text-slate-400 font-bold">دفع عند الحضور</div>
              </button>
              <button onClick={() => setPayMethod('visa')}
                className={`p-3.5 rounded-xl border-2 text-center transition-all ${
                  payMethod === 'visa' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="text-2xl mb-1">💳</div>
                <div className="font-black text-sm text-slate-800">بطاقة فيزا</div>
                <div className="text-[10px] text-slate-400 font-bold">حجز مؤكد فوراً</div>
              </button>
            </div>

            {/* Cash info */}
            {payMethod === 'cash' && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
                <p className="font-black text-emerald-800 text-sm flex items-center gap-2">
                  <i className="fas fa-store-alt" /> الدفع عند الحضور
                </p>
                <p className="text-[11px] text-emerald-600 font-bold">سيتم الدفع مباشرة في الملعب</p>
                <ul className="space-y-1.5 mt-2">
                  {['حجزك سيكون قيد الانتظار حتى تأكيد الدفع',
                    'احضر قبل موعدك بـ 15 دقيقة',
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-emerald-700 font-bold">
                      <i className="fas fa-check-circle text-emerald-500 mt-0.5 flex-shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between pt-2 border-t border-emerald-200 mt-2">
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <i className="fas fa-info-circle" /> المبلغ المطلوب:
                  </span>
                  <span className="font-black text-emerald-800">{totalPrice} د.أ</span>
                </div>
              </div>
            )}

            {/* Visa form */}
            {payMethod === 'visa' && (
              <div className="space-y-3">
                {/* Card mockup */}
                <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-4 text-white">
                  <div className="flex justify-between mb-4">
                    <div className="w-8 h-6 bg-yellow-400 rounded-sm opacity-80" />
                    <span className="text-blue-300 font-black text-lg italic">VISA</span>
                  </div>
                  <p className="font-mono text-sm tracking-widest mb-3 text-slate-300">
                    {cardNum || '•••• •••• •••• ••••'}
                  </p>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{cardName || 'اسم حامل البطاقة'}</span>
                    <span dir="ltr">{cardExp || 'MM/YY'}</span>
                  </div>
                </div>
                {/* Fields */}
                <input value={cardName} onChange={e => setCardName(e.target.value)}
                  placeholder="اسم حامل البطاطة" dir="rtl"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
                <input value={cardNum} onChange={e => setCardNum(formatCardNum(e.target.value))}
                  placeholder="0000 0000 0000 0000" dir="ltr" maxLength={19}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-400 outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={cardExp} onChange={e => setCardExp(e.target.value)}
                    placeholder="MM/YY" dir="ltr" maxLength={5}
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-400 outline-none text-center" />
                  <input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g,'').slice(0,3))}
                    placeholder="CVV" dir="ltr" maxLength={3}
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-400 outline-none text-center" />
                </div>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-700 text-[11px] font-bold rounded-xl px-3 py-2">
                  <i className="fas fa-lock flex-shrink-0" /> بيانات تجريبية — لا تدخل بطاطة حقيقية
                </div>
              </div>
            )}

            {bookError && (
              <p className="text-red-500 text-xs font-bold flex items-center gap-1.5">
                <i className="fas fa-exclamation-circle" /> {bookError}
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(3)}
                className={`flex-1 py-3 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg
                  ${payMethod === 'visa' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'}`}>
                <i className={`fas ${payMethod === 'visa' ? 'fa-credit-card' : 'fa-arrow-left'} text-xs`} />
                {payMethod === 'visa' ? `دفع ${totalPrice} د.أ` : 'متابعة'}
              </button>
              <button onClick={() => setStep(1)}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold rounded-xl text-sm transition-colors">
                رجوع
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-4">
            <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
              <i className="fas fa-clipboard-check text-emerald-500" /> تأكيد تفاصيل الحجز
            </h4>
            <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
              {[
                { label: 'الملعب',  val: field.name },
                { label: 'التاريخ', val: date },
                { label: 'الوقت',   val: slot || '', dir: 'ltr' },
                { label: 'المدة',   val: `${durMins === 60 ? '1 ساعة' : durMins === 90 ? '1.5 ساعة' : '2 ساعة'}` },
                { label: 'المبلغ',  val: `${totalPrice} د.أ`, bold: true },
              ].map(row => (
                <div key={row.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-400 font-bold">{row.label}</span>
                  <span className={`font-${row.bold ? 'black text-emerald-600' : 'bold text-slate-800'}`} dir={row.dir as any}>{row.val}</span>
                </div>
              ))}
            </div>

            {bookError && (
              <p className="text-red-500 text-xs font-bold flex items-center gap-1.5">
                <i className="fas fa-exclamation-circle" /> {bookError}
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={handleBook} disabled={booking}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-60">
                {booking
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحجز...</>
                  : <><span>الدفع</span><i className="fas fa-arrow-left text-xs" /></>}
              </button>
              <button onClick={() => setStep(1)}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold rounded-xl text-sm flex items-center gap-1.5 transition-colors">
                <i className="fas fa-edit text-xs" /> تعديل
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4 — Success ── */}
        {step === 4 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">✅</div>
            <h3 className="text-xl font-black text-slate-900">تم الحجز بنجاح!</h3>
            <p className="text-sm text-slate-500">{field.name} · {date} · <span dir="ltr">{slot}</span></p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/bookings')}
                className="flex-1 py-2.5 bg-emerald-500 text-white font-bold rounded-xl text-sm hover:bg-emerald-600">
                حجوزاتي
              </button>
              <button onClick={() => { setStep(1); setSlot(null); }}
                className="flex-1 py-2.5 bg-gray-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-gray-200">
                حجز جديد
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ── main render ────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ── Hero image ─────────────────────────────────────────────── */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-slate-900">
        <img
          src={images[imgIdx]}
          alt={field.name}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMG; }}
        />

        {/* Prev/Next */}
        {images.length > 1 && (
          <>
            <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all">
              <i className="fas fa-chevron-left text-xs" />
            </button>
            <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all">
              <i className="fas fa-chevron-right text-xs" />
            </button>
          </>
        )}

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="absolute top-4 right-4 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all">
          <i className="fas fa-arrow-right text-sm" />
        </button>

        {/* Like */}
        <button onClick={() => setLiked(l => !l)}
          className="absolute top-4 left-4 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all">
          <i className={`${liked ? 'fas text-red-400' : 'far'} fa-heart text-sm`} />
        </button>

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? 'bg-white scale-125' : 'bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>

      {/* ── Field info bar ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {/* Name + location + badges */}
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="bg-emerald-100 text-emerald-700 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                  {field.turfType || 'عشب صناعي'}
                </span>
                <span className="bg-blue-100 text-blue-700 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                  {field.type}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{field.name}</h1>
              <p className="text-slate-500 text-sm font-bold flex items-center gap-1.5 mt-1">
                <i className="fas fa-map-marker-alt text-emerald-500 text-xs" />
                {field.city && `${field.city} — `}{field.location}
              </p>
            </div>
            {/* Price */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-emerald-600 leading-none">{field.pricePerHour}</p>
              <p className="text-[11px] font-bold text-emerald-400 mt-0.5">د.أ / ساعة</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-4 mb-2">
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: 'fa-tag',   color: 'text-purple-500',  val: `${field.pricePerHour} د.أ`, label: 'السعر' },
            { icon: 'fa-leaf',  color: 'text-emerald-500', val: field.turfType?.replace('عشب ','') || 'صناعي', label: 'العشب' },
            { icon: 'fa-users', color: 'text-blue-500',    val: field.type,                   label: 'النوع' },
            { icon: 'fa-star',  color: 'text-amber-400',   val: field.rating?.toFixed(1) || '—', label: 'التقييم' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <i className={`fas ${c.icon} ${c.color} text-lg mb-1`} />
              <p className="font-black text-slate-800 text-sm">{c.val}</p>
              <p className="text-[10px] text-slate-400 font-bold">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content grid ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Right: field details */}
          <div className="lg:col-span-3 space-y-5">

            {/* Description */}
            {field.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-black text-slate-900 mb-3 flex items-center gap-2">
                  <i className="fas fa-info-circle text-emerald-500" /> عن الملعب
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">{field.description}</p>
              </div>
            )}

            {/* Amenities */}
            {field.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-mountain text-emerald-500" /> الخدمات المتوفرة
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {field.amenities.map(a => (
                    <div key={a} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                      <i className={`fas ${AMENITY_ICONS[a] || 'fa-check-circle'} text-emerald-500 text-sm`} />
                      <span className="text-sm font-bold text-slate-700">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                <i className="fas fa-map text-emerald-500" /> الموقع
              </h2>
              {/* Map placeholder */}
              <div className="h-40 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl flex flex-col items-center justify-center gap-2 border border-emerald-100 mb-3">
                <i className="fas fa-map-marker-alt text-3xl text-emerald-500" />
                <p className="font-black text-slate-700">{field.city && `${field.city} - `}{field.location}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 font-bold">{field.address || field.location}</p>
                <a href={`https://www.google.com/maps/search/${encodeURIComponent(field.name + ' ' + (field.city || '') + ' ' + field.location)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 text-sm font-bold transition-colors">
                  فتح في خرائط Google <i className="fas fa-external-link-alt text-xs" />
                </a>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                <i className="fas fa-star text-amber-400" /> التقييمات
              </h2>
              <FieldReviews fieldId={field.id} fieldName={field.name} />
            </div>
          </div>

          {/* Left: booking card */}
          <div className="lg:col-span-2">
            <BookingCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldDetailPage;
