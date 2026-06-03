/**
 * FieldDetailPage — /field/:id
 * ─────────────────────────────────────────────────────────────────────────
 * صفحة تفاصيل الملعب الكاملة:
 *   • معرض الصور
 *   • معلومات الملعب (النوع، العشب، الأسعار، الخدمات)
 *   • تقييمات اللاعبين
 *   • لوحة الحجز (4 خطوات: موعد ← تأكيد ← دفع ← نجاح)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { getAvailableSlotsAPI } from '../services/api';
import FieldReviews from '../components/FieldReviews';
import LoginPromptModal from '../components/LoginPromptModal';
import { Field } from '../types';
import { isFavorite, toggleFavorite } from '../utils/favorites';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** كل أوقات البداية المتاحة (كل ساعة) */
const ALL_START_TIMES = [
  '08:00', '09:00', '10:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

const CLOSING_MINS = 22 * 60; // 22:00 آخر توقيت

const toMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const toTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** يولّد نص الشريحة الكاملة "HH:MM - HH:MM" */
const makeSlotStr = (startTime: string, durHours: number) =>
  `${startTime} - ${toTime(toMins(startTime) + durHours * 60)}`;

/** هل وقت البداية متاح بالكامل مع المدة المطلوبة؟ */
const isStartFree = (startTime: string, durHours: number, bookedSlots: string[]) => {
  const s = toMins(startTime);
  const e = s + durHours * 60;
  for (let t = s; t < e; t += 60) {
    if (bookedSlots.includes(`${toTime(t)} - ${toTime(t + 60)}`)) return false;
  }
  return true;
};

const DURATIONS: { label: string; value: number; desc: string }[] = [
  { label: '1 ساعة',      value: 1,   desc: 'ساعة كاملة'     },
  { label: '1.5 ساعة',    value: 1.5, desc: 'ساعة ونصف'      },
  { label: '2 ساعة',      value: 2,   desc: 'ساعتان كاملتان' },
];

const todayStr = () => new Date().toISOString().split('T')[0];

type BookStep = 'select' | 'confirm' | 'pay' | 'done';

interface PayForm {
  name: string;
  card: string;
  expiry: string;
  cvv: string;
}

const formatCard = (v: string) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

// ─── amenity icon map ─────────────────────────────────────────────────────────
const AMENITY_ICON: Record<string, string> = {
  'إضاءة ليلية':       'fa-lightbulb',
  'إضاءة':             'fa-lightbulb',
  'مواقف سيارات':      'fa-parking',
  'مواقف':             'fa-parking',
  'غرف تبديل ملابس':  'fa-door-open',
  'غرف تغيير':         'fa-door-open',
  'دورات مياه':        'fa-restroom',
  'مياه':              'fa-tint',
  'كافتيريا':          'fa-coffee',
  'كافيتيريا':         'fa-coffee',
  'كاميرات مراقبة':   'fa-video',
  'حارس أمن':          'fa-shield-alt',
  'WiFi':              'fa-wifi',
  'كرات مجانية':       'fa-futbol',
  'استئجار أحذية':     'fa-shoe-prints',
};
const amenityIcon = (a: string) =>
  AMENITY_ICON[a] ?? 'fa-check-circle';

// ─── component ───────────────────────────────────────────────────────────────

const FieldDetailPage: React.FC = () => {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [field,       setField]       = useState<Field | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [fav,         setFav]         = useState(false);

  // booking state
  const [step,        setStep]        = useState<BookStep>('select');
  const [date,        setDate]        = useState(todayStr());
  const [duration,    setDuration]    = useState<number>(1);      // 1 | 1.5 | 2
  const [slot,        setSlot]        = useState<string | null>(null);   // start time
  const [slotsLoading,setSlotsLoading]= useState(false);
  const [booked,      setBooked]      = useState<string[]>([]);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError,   setBookError]   = useState('');
  const [payForm,     setPayForm]     = useState<PayForm>({ name:'', card:'', expiry:'', cvv:'' });
  const [payError,    setPayError]    = useState('');
  const [payLoading,  setPayLoading]  = useState(false);
  const [payMethod,   setPayMethod]   = useState<'visa' | 'cash'>('visa');
  const [showReviews, setShowReviews] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // ── fetch field ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    backend.getField(id).then(f => {
      setField(f);
      setLoading(false);
      if (f && user) setFav(isFavorite(user.id, f.id));
    });
  }, [id, user?.id]);

  // ── fetch slots ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!field?.id || !date) return;
    setSlotsLoading(true);
    setSlot(null);
    getAvailableSlotsAPI(field.id, date).then(d => {
      setBooked(d.booked);
      setSlotsLoading(false);
    });
  }, [field?.id, date]);

  // reset selected slot when duration changes
  useEffect(() => { setSlot(null); }, [duration]);

  // ── favorite toggle ──────────────────────────────────────────────────────────
  const handleFav = useCallback(() => {
    if (!user || !field) return;
    const nowFav = toggleFavorite(user.id, field.id);
    setFav(nowFav);
  }, [user, field]);

  // ── booking handlers ─────────────────────────────────────────────────────────
  const handleConfirmStep = () => {
    if (!user) { setShowLoginPrompt(true); return; }
    if (!slot) return;
    setBookError('');
    setStep('confirm');
  };

  const handlePay = async () => {
    if (!field || !slot || !user) return;

    // validate card only if visa
    if (payMethod === 'visa') {
      const raw = payForm.card.replace(/\s/g, '');
      if (!payForm.name.trim())       { setPayError('أدخل اسم حامل البطاقة'); return; }
      if (raw.length < 16)            { setPayError('رقم البطاقة غير مكتمل'); return; }
      if (payForm.expiry.length < 5)  { setPayError('تاريخ الانتهاء غير صحيح'); return; }
      if (payForm.cvv.length < 3)     { setPayError('رمز الأمان غير صحيح'); return; }
    }

    setPayError('');
    setPayLoading(true);
    await new Promise(r => setTimeout(r, payMethod === 'visa' ? 1400 : 600));

    const totalPrice   = Math.round(field.pricePerHour * duration);
    const bookingStatus = payMethod === 'visa' ? 'مؤكد' : 'قيد الانتظار';

    const res = await backend.createBooking({
      fieldId:       field.id,
      fieldName:     field.name,
      date,
      timeSlot:      makeSlotStr(slot, duration),
      price:         totalPrice,
      status:        bookingStatus,
      paymentMethod: payMethod,
      userId:        user.id,
    } as any);
    setPayLoading(false);
    if (res.success) {
      setStep('done');
    } else {
      setPayError(res.error || 'فشل الحجز، حاول مرة أخرى');
    }
  };

  const resetBooking = () => {
    setStep('select'); setSlot(null); setDate(todayStr()); setDuration(1);
    setPayMethod('visa');
    setPayForm({ name:'', card:'', expiry:'', cvv:'' });
    setPayError(''); setBookError('');
  };

  // ── loading skeleton ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="h-72 bg-white rounded-3xl animate-pulse border border-gray-100" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 bg-white rounded-2xl animate-pulse border border-gray-100" />
            <div className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />
          </div>
          <div className="h-80 bg-white rounded-2xl animate-pulse border border-gray-100" />
        </div>
      </div>
    </div>
  );

  if (!field) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="text-6xl mb-4">🏟️</div>
        <h2 className="text-xl font-black text-slate-900 mb-2">الملعب غير موجود</h2>
        <button onClick={() => navigate('/explore')}
          className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600">
          تصفح الملاعب
        </button>
      </div>
    </div>
  );

  const turfColor: Record<string, string> = {
    'عشب صناعي': 'bg-emerald-100 text-emerald-700',
    'عشب طبيعي': 'bg-green-100 text-green-700',
    'هجين':       'bg-teal-100 text-teal-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-10" dir="rtl">

      {/* ══ HERO IMAGE ════════════════════════════════════════════════════════ */}
      <div className="relative h-64 sm:h-80 bg-slate-800 overflow-hidden">
        <img
          src={field.images[0]}
          alt={field.name}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 end-4 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/20 text-white rounded-xl flex items-center justify-center transition-all">
          <i className="fas fa-arrow-right text-sm" />
        </button>

        {/* favorite button */}
        {user && (
          <button
            onClick={handleFav}
            className={`absolute top-4 start-4 w-9 h-9 backdrop-blur-sm border rounded-xl flex items-center justify-center transition-all ${
              fav
                ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/40'
                : 'bg-black/40 border-white/20 text-white hover:bg-red-500/80'
            }`}>
            <i className={`fas fa-heart text-sm ${fav ? '' : 'opacity-80'}`} />
          </button>
        )}

        {/* hero info overlay */}
        <div className="absolute bottom-0 inset-x-0 px-5 pb-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-black/50 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                  {field.type}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${turfColor[field.turfType] ?? 'bg-white/80 text-slate-700'}`}>
                  {field.turfType}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                {field.name}
              </h1>
              <p className="text-white/80 text-sm mt-0.5 flex items-center gap-1.5">
                <i className="fas fa-map-marker-alt text-emerald-300 text-xs" />
                {field.location}
              </p>
            </div>
            <div className="text-center flex-shrink-0">
              <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl px-4 py-2 text-center">
                <p className="text-white font-black text-2xl">{field.pricePerHour}</p>
                <p className="text-white/70 text-xs font-medium">د.أ / ساعة</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ BODY ══════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT: field info ──────────────────────────────────────────── */}
          <div className="flex-1 space-y-5 min-w-0">

            {/* Quick stats bar */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon:'fa-star',         val: field.rating?.toFixed(1) ?? '–', label:'التقييم',  c:'text-amber-500'  },
                { icon:'fa-users',        val: field.type,                       label:'النوع',    c:'text-blue-500'   },
                { icon:'fa-leaf',         val: field.turfType.split(' ')[1]||field.turfType, label:'العشب', c:'text-emerald-500'},
                { icon:'fa-tag',          val: `${field.pricePerHour}`,          label:'السعر',   c:'text-violet-500' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
                  <i className={`fas ${s.icon} ${s.c} mb-1 text-base`} />
                  <p className="font-black text-slate-900 text-sm leading-tight">{s.val}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {field.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-black text-slate-900 mb-2 flex items-center gap-2 text-sm">
                  <i className="fas fa-info-circle text-emerald-500" /> عن الملعب
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">{field.description}</p>
              </div>
            )}

            {/* Amenities */}
            {field.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-sm">
                  <i className="fas fa-concierge-bell text-emerald-500" /> الخدمات المتوفرة
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {field.amenities.map(a => (
                    <div key={a} className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                      <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className={`fas ${amenityIcon(a)} text-emerald-600 text-xs`} />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location placeholder */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-50">
                <h2 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                  <i className="fas fa-map-marked-alt text-emerald-500" /> الموقع
                </h2>
              </div>
              <div className="h-36 bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col items-center justify-center gap-2 text-slate-500">
                <i className="fas fa-map-marker-alt text-3xl text-emerald-300" />
                <p className="text-sm font-bold text-slate-700">{field.location}</p>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(field.location)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:underline">
                  <i className="fas fa-external-link-alt text-[10px]" /> فتح في خرائط Google
                </a>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowReviews(v => !v)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <h2 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                  <i className="fas fa-star text-amber-400" /> التقييمات
                </h2>
                <i className={`fas fa-chevron-${showReviews ? 'up' : 'down'} text-slate-400 text-xs`} />
              </button>
              {showReviews && (
                <div className="px-5 pb-5">
                  <FieldReviews fieldId={field.id} fieldName={field.name} />
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: booking panel ──────────────────────────────────────── */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden lg:sticky lg:top-24">

              {/* panel header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4">
                <h2 className="text-white font-black text-base flex items-center gap-2">
                  <i className="fas fa-calendar-check text-emerald-100" />
                  {step === 'done' ? 'تم الحجز بنجاح! 🎉' : 'احجز الآن'}
                </h2>
                {step !== 'done' && (
                  <div className="flex items-center gap-1.5 mt-3">
                    {(['select','confirm','pay'] as BookStep[]).map((s, i) => (
                      <React.Fragment key={s}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                          step === s
                            ? 'bg-white text-emerald-600 shadow-sm'
                            : ['confirm','pay'].indexOf(step) > ['confirm','pay'].indexOf(s as any)
                              ? 'bg-emerald-300 text-white'
                              : 'bg-white/25 text-white/70'
                        }`}>{i + 1}</div>
                        {i < 2 && <div className="flex-1 h-0.5 bg-white/25 rounded-full" />}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5">

                {/* ── STEP: select ── */}
                {step === 'select' && (
                  <div className="space-y-4">

                    {/* Date */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        <i className="fas fa-calendar text-emerald-500 me-1" /> اختر التاريخ
                      </label>
                      <input
                        type="date"
                        value={date}
                        min={todayStr()}
                        onChange={e => setDate(e.target.value)}
                        className="w-full border border-gray-200 bg-gray-50 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                      />
                    </div>

                    {/* Duration picker */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        <i className="fas fa-hourglass-half text-emerald-500 me-1" /> مدة الحجز
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {DURATIONS.map(d => (
                          <button key={d.value}
                            onClick={() => setDuration(d.value)}
                            className={`py-2 px-1 rounded-xl text-center border transition-all ${
                              duration === d.value
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200'
                                : 'border-gray-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                            }`}>
                            <p className="text-[11px] font-black leading-tight">{d.label}</p>
                            <p className={`text-[9px] mt-0.5 ${duration === d.value ? 'text-emerald-100' : 'text-slate-400'}`}>{d.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Start time grid */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <i className="fas fa-clock text-emerald-500" /> وقت البداية
                        {slotsLoading && <i className="fas fa-spinner fa-spin text-emerald-400" />}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {ALL_START_TIMES.filter(t =>
                          toMins(t) + duration * 60 <= CLOSING_MINS
                        ).map(startT => {
                          const unavailable = !isStartFree(startT, duration, booked);
                          const isSelected  = slot === startT;
                          const endT        = toTime(toMins(startT) + duration * 60);
                          return (
                            <button key={startT}
                              onClick={() => !unavailable && !slotsLoading && setSlot(startT)}
                              disabled={unavailable || slotsLoading}
                              className={`py-2 px-1 rounded-xl text-center border transition-all ${
                                unavailable
                                  ? 'border-red-100 bg-red-50 text-red-300 cursor-not-allowed'
                                  : isSelected
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200 scale-105'
                                    : 'border-gray-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50'
                              }`} dir="ltr">
                              <p className="text-[11px] font-black">{startT}</p>
                              <p className={`text-[9px] mt-0.5 ${isSelected ? 'text-emerald-100' : unavailable ? 'text-red-300' : 'text-slate-400'}`}>
                                {unavailable ? 'محجوز' : `← ${endT}`}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price summary */}
                    <div className="bg-emerald-50 rounded-xl border border-emerald-100 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-800">المجموع</span>
                        <span className="text-xl font-black text-emerald-700">
                          {Math.round(field.pricePerHour * duration)}
                          <span className="text-xs font-bold"> د.أ</span>
                        </span>
                      </div>
                      {slot && (
                        <p className="text-[11px] text-emerald-600 mt-1 font-medium" dir="ltr">
                          {makeSlotStr(slot, duration)}
                        </p>
                      )}
                    </div>

                    {bookError && (
                      <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                        <i className="fas fa-exclamation-circle" /> {bookError}
                      </p>
                    )}

                    <button
                      disabled={!slot || slotsLoading}
                      onClick={handleConfirmStep}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-emerald-200">
                      <i className="fas fa-arrow-left text-xs" />
                      متابعة
                    </button>
                  </div>
                )}

                {/* ── STEP: confirm ── */}
                {step === 'confirm' && (
                  <div className="space-y-4">
                    <h3 className="font-black text-slate-900 text-sm">تأكيد تفاصيل الحجز</h3>

                    <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100 text-sm">
                      {[
                        { label: 'الملعب',   val: field.name },
                        { label: 'التاريخ',  val: date,                              dir: 'ltr' as const },
                        { label: 'الوقت',    val: makeSlotStr(slot!, duration),      dir: 'ltr' as const },
                        { label: 'المدة',    val: DURATIONS.find(d => d.value === duration)?.label ?? '' },
                        { label: 'المبلغ',   val: `${Math.round(field.pricePerHour * duration)} د.أ`, bold: true },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between items-center px-4 py-2.5">
                          <span className="text-slate-500 text-xs">{r.label}</span>
                          <span className={`font-bold text-slate-900 text-xs ${r.dir === 'ltr' ? 'font-mono' : ''} ${r.bold ? 'text-emerald-600 text-sm' : ''}`}
                            dir={r.dir}>{r.val}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setStep('select')}
                        className="flex-1 py-2.5 border-2 border-gray-200 text-slate-500 font-bold rounded-xl text-sm hover:border-gray-300 transition-colors">
                        <i className="fas fa-edit me-1 text-xs" /> تعديل
                      </button>
                      <button
                        onClick={() => { setBookError(''); setStep('pay'); }}
                        disabled={bookLoading}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm">
                        <i className="fas fa-credit-card me-1 text-xs" /> الدفع
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP: pay ── */}
                {step === 'pay' && (
                  <div className="space-y-3">
                    <h3 className="font-black text-slate-900 text-sm">طريقة الدفع</h3>

                    {/* ── Payment method toggle ── */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { setPayMethod('visa'); setPayError(''); }}
                        className={`py-3 rounded-xl border-2 text-center transition-all ${
                          payMethod === 'visa'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-blue-200'
                        }`}>
                        <i className={`fab fa-cc-visa text-2xl mb-0.5 block ${payMethod === 'visa' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <p className={`text-[11px] font-black ${payMethod === 'visa' ? 'text-blue-700' : 'text-slate-500'}`}>بطاقة فيزا</p>
                        {payMethod === 'visa' && (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                            حجز مؤكد فوراً
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => { setPayMethod('cash'); setPayError(''); }}
                        className={`py-3 rounded-xl border-2 text-center transition-all ${
                          payMethod === 'cash'
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 bg-white hover:border-emerald-200'
                        }`}>
                        <i className={`fas fa-money-bill-wave text-2xl mb-0.5 block ${payMethod === 'cash' ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <p className={`text-[11px] font-black ${payMethod === 'cash' ? 'text-emerald-700' : 'text-slate-500'}`}>كاش</p>
                        {payMethod === 'cash' && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                            دفع عند الحضور
                          </span>
                        )}
                      </button>
                    </div>

                    {/* ── Visa: card form ── */}
                    {payMethod === 'visa' && (
                      <div className="space-y-2.5">
                        {/* card preview */}
                        <div className="rounded-2xl p-4 text-white text-xs font-bold"
                          style={{ background: 'linear-gradient(135deg,#1e3a5f,#1a56db)' }}>
                          <div className="flex justify-between items-start mb-5">
                            <i className="fas fa-futbol text-blue-300 text-lg" />
                            <i className="fab fa-cc-visa text-white text-2xl opacity-80" />
                          </div>
                          <p className="font-mono text-sm tracking-widest mb-3">
                            {payForm.card || '•••• •••• •••• ••••'}
                          </p>
                          <div className="flex justify-between text-[10px] opacity-80">
                            <span>{payForm.name || 'اسم حامل البطاقة'}</span>
                            <span>{payForm.expiry || 'MM/YY'}</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-600 mb-1">اسم حامل البطاقة</label>
                          <input placeholder="كما يظهر على البطاقة"
                            value={payForm.name}
                            onChange={e => setPayForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-600 mb-1">رقم البطاقة</label>
                          <input placeholder="0000 0000 0000 0000"
                            value={payForm.card} dir="ltr"
                            onChange={e => setPayForm(p => ({ ...p, card: formatCard(e.target.value) }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono tracking-wider focus:ring-2 focus:ring-blue-400 outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-black text-slate-600 mb-1">تاريخ الانتهاء</label>
                            <input placeholder="MM/YY"
                              value={payForm.expiry} dir="ltr"
                              onChange={e => setPayForm(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-400 outline-none" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-slate-600 mb-1">CVV</label>
                            <input placeholder="•••" type="password" maxLength={4}
                              value={payForm.cvv}
                              onChange={e => setPayForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g,'').slice(0,4) }))}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-400 outline-none" />
                          </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-center gap-2">
                          <i className="fas fa-lock text-amber-500 text-xs flex-shrink-0" />
                          <p className="text-[10px] text-amber-700 font-medium">بيانات تجريبية — لا تدخل بطاقة حقيقية</p>
                        </div>
                      </div>
                    )}

                    {/* ── Cash: info panel ── */}
                    {payMethod === 'cash' && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-money-bill-wave text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-emerald-900">الدفع عند الحضور</p>
                            <p className="text-[11px] text-emerald-700">سيتم الدفع مباشرةً في الملعب</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-[11px] text-emerald-700 pt-1 border-t border-emerald-100">
                          <p className="flex items-center gap-1.5"><i className="fas fa-clock text-emerald-500 w-3" /> حجزك سيكون <strong>قيد الانتظار</strong> حتى تأكيد الدفع</p>
                          <p className="flex items-center gap-1.5"><i className="fas fa-check-circle text-emerald-500 w-3" /> احضر قبل موعدك بـ 15 دقيقة</p>
                          <p className="flex items-center gap-1.5"><i className="fas fa-info-circle text-emerald-500 w-3" /> المبلغ المطلوب: <strong>{Math.round(field.pricePerHour * duration)} د.أ</strong></p>
                        </div>
                      </div>
                    )}

                    {payError && (
                      <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                        <i className="fas fa-exclamation-circle" /> {payError}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => setStep('confirm')}
                        className="px-4 py-2.5 border-2 border-gray-200 text-slate-500 font-bold rounded-xl text-sm">
                        <i className="fas fa-arrow-right text-xs" />
                      </button>
                      <button
                        onClick={handlePay}
                        disabled={payLoading}
                        className={`flex-1 py-2.5 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm text-white ${
                          payMethod === 'visa'
                            ? 'bg-blue-600 hover:bg-blue-700 disabled:opacity-40'
                            : 'bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40'
                        }`}>
                        {payLoading
                          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري التسجيل...</>
                          : payMethod === 'visa'
                            ? <><i className="fab fa-cc-visa text-base" /> دفع {Math.round(field.pricePerHour * duration)} د.أ</>
                            : <><i className="fas fa-check-circle text-xs" /> تأكيد الحجز</>
                        }
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP: done ── */}
                {step === 'done' && (
                  <div className="text-center py-4 space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${payMethod === 'visa' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                      <i className={`text-3xl fas ${payMethod === 'visa' ? 'fa-check-circle text-blue-500' : 'fa-clock text-amber-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base mb-1">
                        {payMethod === 'visa' ? 'تم الحجز بنجاح! 🎉' : 'تم تسجيل الحجز ⏳'}
                      </h3>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        حجزك في <strong>{field.name}</strong><br />
                        <span dir="ltr">{date} — {slot ? makeSlotStr(slot, duration) : ''}</span>
                      </p>
                    </div>
                    <div className={`rounded-xl px-4 py-3 border ${payMethod === 'visa' ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
                      {payMethod === 'visa' ? (
                        <p className="text-blue-800 font-black text-sm">
                          {Math.round(field.pricePerHour * duration)} د.أ{' '}
                          <span className="font-medium text-xs text-blue-600">✓ تم الدفع</span>
                        </p>
                      ) : (
                        <p className="text-amber-800 font-black text-sm">
                          {Math.round(field.pricePerHour * duration)} د.أ{' '}
                          <span className="font-medium text-xs text-amber-600">• مطلوب عند الحضور</span>
                        </p>
                      )}
                      <p className={`text-[11px] mt-1 font-bold ${payMethod === 'visa' ? 'text-blue-600' : 'text-amber-600'}`}>
                        الحالة: {payMethod === 'visa' ? '✅ مؤكد' : '⏳ قيد الانتظار'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={resetBooking}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors">
                        <i className="fas fa-plus me-1 text-xs" /> حجز جديد
                      </button>
                      <button onClick={() => navigate('/bookings')}
                        className="w-full py-2.5 border-2 border-gray-200 text-slate-600 font-bold rounded-xl text-sm hover:border-emerald-300 transition-colors">
                        <i className="fas fa-calendar-check me-1 text-xs" /> حجوزاتي
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLoginPrompt && (
        <LoginPromptModal
          message="سجّل دخولك لإتمام حجز الملعب والاستمتاع بتجربة حجز سهلة وسريعة."
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
    </div>
  );
};

export default FieldDetailPage;
