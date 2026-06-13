import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Field } from '../types';
import { backend } from '../services/backend';

type Step = 1 | 2 | 3 | 4;

const FORMATS = [
  { id: 'league',     label: 'دوري',              desc: 'كل فريق يلعب ضد جميع الفرق الأخرى',  icon: 'fa-list-ol'    },
  { id: 'cup',        label: 'كأس (خروج المغلوب)', desc: 'الخاسر يودّع البطولة فوراً',           icon: 'fa-trophy'     },
  { id: 'groups+cup', label: 'مجموعات + كأس',      desc: 'دور مجموعات ثم خروج المغلوب',         icon: 'fa-layer-group' },
];

const TEAM_COUNTS = [4, 8, 12, 16, 24, 32];
const FIELD_TYPES: ('4v4' | '5v5' | '6v6' | '7v7')[] = ['4v4', '5v5', '6v6', '7v7'];
const DAYS = ['الجمعة', 'السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const STEPS_LABELS = ['معلومات البطولة', 'الجوائز والرسوم', 'اختيار الملعب', 'المراجعة والتأكيد'];

interface FormState {
  name: string;
  fieldType: '4v4' | '5v5' | '6v6' | '7v7';
  format: string;
  maxTeams: number;
  startDate: string;
  endDate: string;
  regDeadline: string;
  entryFee: string;
  prize1: string;
  prize2: string;
  prize3: string;
  prizeDesc: string;
  fieldId: string;
  preferredDays: string[];
  preferredTime: string;
  notes: string;
  organizerName: string;
  organizerEmail: string;
  phone: string;
  agreeTerms: boolean;
}

const CreateTournament: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]           = useState<Step>(1);
  const [fields, setFields]       = useState<Field[]>([]);
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState('');
  const [animating, setAnimating] = useState(false);

  const [form, setForm] = useState<FormState>({
    name:           '',
    fieldType:      '7v7',
    format:         'league',
    maxTeams:       8,
    startDate:      '',
    endDate:        '',
    regDeadline:    '',
    entryFee:       '',
    prize1:         '',
    prize2:         '',
    prize3:         '',
    prizeDesc:      '',
    fieldId:        '',
    preferredDays:  [],
    preferredTime:  'مسائي',
    notes:          '',
    organizerName:  '',
    organizerEmail: '',
    phone:          '',
    agreeTerms:     false,
  });

  useEffect(() => {
    backend.getFields().then(setFields).catch(() => {});
  }, []);

  // إذا كان المستخدم مسجّلاً نعبّي بياناته تلقائياً
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        organizerName:  user.name  || prev.organizerName,
        organizerEmail: user.email || prev.organizerEmail,
        phone:          user.phone || prev.phone,
      }));
    }
  }, [user?.id]);

  const update = (key: keyof FormState, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleDay = (day: string) =>
    setForm(prev => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter(d => d !== day)
        : [...prev.preferredDays, day],
    }));

  const canNext = (): boolean => {
    if (step === 1) return !!form.name.trim() && !!form.startDate;
    if (step === 2) return true;
    if (step === 3) return !!form.fieldId;
    return !!form.organizerName.trim() && !!form.phone.trim() && form.agreeTerms;
  };

  const goStep = (next: Step) => {
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 150);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Simulate API call — in production: await backend.createTournamentRequest(form)
      await new Promise(r => setTimeout(r, 1500));
      setSubmitted(true);
    } catch {
      setError('حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const selectedField = fields.find(f => f.id === form.fieldId);

  /* ── Success ─────────────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-10 text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <i className="fas fa-check text-white text-4xl" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">تم إرسال الطلب!</h2>
            <p className="text-emerald-100">سيتواصل معك صاحب الملعب قريباً</p>
          </div>
          <div className="p-8">
            <div className="bg-slate-50 rounded-2xl p-5 mb-6 space-y-3">
              {[
                { icon: 'fa-trophy',          label: 'اسم البطولة',       value: form.name },
                { icon: 'fa-sitemap',         label: 'النظام',            value: FORMATS.find(f => f.id === form.format)?.label ?? '' },
                { icon: 'fa-users',           label: 'عدد الفرق',         value: `${form.maxTeams} فريق` },
                { icon: 'fa-calendar',        label: 'تاريخ البداية',     value: form.startDate },
                { icon: 'fa-map-marker-alt',  label: 'الملعب',            value: selectedField?.name ?? '' },
                { icon: 'fa-user',            label: 'المنظّم',           value: form.organizerName },
                { icon: 'fa-phone',           label: 'رقم التواصل',       value: form.phone },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <i className={`fas ${r.icon} w-4 text-center text-emerald-500`} />
                    <span>{r.label}</span>
                  </div>
                  <span className="font-bold text-slate-800">{r.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/leagues')}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-colors"
              >
                عرض البطولات
              </button>
              <button
                onClick={() => { setSubmitted(false); setStep(1); }}
                className="flex-1 py-3.5 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors"
              >
                بطولة أخرى
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main Form ───────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* ─── Header / Progress ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => step > 1 ? goStep((step - 1) as Step) : navigate(-1)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
            >
              <i className="fas fa-arrow-right text-xs" /> رجوع
            </button>
            <div className="text-center">
              <h1 className="font-black text-slate-900">إنشاء بطولة جديدة</h1>
            </div>
            <span className="text-sm font-bold text-slate-400">{step} / 4</span>
          </div>
          {/* Steps progress */}
          <div className="flex gap-1.5 mb-2">
            {[1,2,3,4].map(s => (
              <div key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  s < step ? 'bg-emerald-500' : s === step ? 'bg-emerald-400' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between">
            {STEPS_LABELS.map((l, i) => (
              <span key={i} className={`text-[9px] font-bold transition-colors ${i + 1 <= step ? 'text-emerald-600' : 'text-slate-400'}`}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={`max-w-2xl mx-auto px-4 pt-8 transition-opacity duration-150 ${animating ? 'opacity-0' : 'opacity-100'}`}>

        {/* Error */}
        {error && (
          <div className="flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl mb-6">
            <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0" /><span>{error}</span>
          </div>
        )}

        {/* ══ STEP 1: معلومات البطولة ══════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900 mb-1">معلومات البطولة</h2>
              <p className="text-slate-500 text-sm">أدخل المعلومات الأساسية لبطولتك</p>
            </div>

            {/* اسم البطولة */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <label className="block text-sm font-black text-slate-700 mb-2">
                اسم البطولة <span className="text-red-500">*</span>
              </label>
              <input
                type="text" value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder='مثال: بطولة النخبة الصيفية 2025'
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
              />
            </div>

            {/* نوع الملعب */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <label className="block text-sm font-black text-slate-700 mb-3">نوع الملعب</label>
              <div className="grid grid-cols-3 gap-3">
                {FIELD_TYPES.map(t => (
                  <button key={t} onClick={() => update('fieldType', t)}
                    className={`py-3 rounded-xl font-black text-base border-2 transition-all ${
                      form.fieldType === t
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100'
                        : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* نظام البطولة */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <label className="block text-sm font-black text-slate-700 mb-3">نظام البطولة</label>
              <div className="space-y-2.5">
                {FORMATS.map(f => (
                  <button key={f.id} onClick={() => update('format', f.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-start ${
                      form.format === f.id
                        ? 'bg-emerald-50 border-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      form.format === f.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <i className={`fas ${f.icon}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-slate-800 text-sm">{f.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
                    </div>
                    {form.format === f.id && <i className="fas fa-check-circle text-emerald-500 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* عدد الفرق */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <label className="block text-sm font-black text-slate-700 mb-3">عدد الفرق المشاركة</label>
              <div className="grid grid-cols-3 gap-3">
                {TEAM_COUNTS.map(n => (
                  <button key={n} onClick={() => update('maxTeams', n)}
                    className={`py-3 rounded-xl font-black border-2 transition-all ${
                      form.maxTeams === n
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100'
                        : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}>
                    {n} فرق
                  </button>
                ))}
              </div>
            </div>

            {/* التواريخ */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <label className="block text-sm font-black text-slate-700 mb-3">التواريخ</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: 'startDate',   label: 'تاريخ البداية',        required: true  },
                  { key: 'endDate',     label: 'تاريخ النهاية',        required: false },
                  { key: 'regDeadline', label: 'آخر موعد للتسجيل',    required: false },
                ].map(d => (
                  <div key={d.key}>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                      {d.label} {d.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="date"
                      value={(form as any)[d.key]}
                      onChange={e => update(d.key as keyof FormState, e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 2: الجوائز والرسوم ═══════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900 mb-1">الجوائز والرسوم</h2>
              <p className="text-slate-500 text-sm">جميع الحقول اختيارية — يمكن تركها فارغة</p>
            </div>

            {/* رسوم التسجيل */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <label className="block text-sm font-black text-slate-700 mb-2">رسوم تسجيل الفريق (دينار أردني)</label>
              <div className="relative">
                <input
                  type="number" min="0" value={form.entryFee}
                  onChange={e => update('entryFee', e.target.value)}
                  placeholder="0  (مجاني)"
                  className="w-full ps-4 pe-16 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold"
                />
                <span className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">د.أ</span>
              </div>
            </div>

            {/* الجوائز */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <label className="block text-sm font-black text-slate-700 mb-3">الجوائز</label>
              <div className="space-y-3">
                {[
                  { key: 'prize1', label: 'المركز الأول', emoji: '🥇', placeholder: 'مثال: 500 دينار + كأس' },
                  { key: 'prize2', label: 'المركز الثاني', emoji: '🥈', placeholder: 'مثال: 300 دينار' },
                  { key: 'prize3', label: 'المركز الثالث', emoji: '🥉', placeholder: 'مثال: 150 دينار' },
                ].map(p => (
                  <div key={p.key} className="flex items-center gap-3">
                    <span className="text-2xl w-8 text-center flex-shrink-0">{p.emoji}</span>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 mb-1 block">{p.label}</label>
                      <input
                        type="text"
                        value={(form as any)[p.key]}
                        onChange={e => update(p.key as keyof FormState, e.target.value)}
                        placeholder={p.placeholder}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* وصف إضافي للجوائز */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <label className="block text-sm font-black text-slate-700 mb-2">جوائز وميزات إضافية</label>
              <textarea
                value={form.prizeDesc}
                onChange={e => update('prizeDesc', e.target.value)}
                rows={3}
                placeholder="مثال: ميداليات لجميع المشاركين، كؤوس للمراكز الثلاثة، شهادات تقدير..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none text-sm"
              />
            </div>
          </div>
        )}

        {/* ══ STEP 3: اختيار الملعب ═════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900 mb-1">اختر الملعب</h2>
              <p className="text-slate-500 text-sm">
                سيُرسل طلبك لصاحب الملعب المختار — يتواصل معك لتأكيد الحجز
              </p>
            </div>

            {/* قائمة الملاعب */}
            <div className="space-y-3">
              {fields.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                  <i className="fas fa-map-marker-alt text-5xl text-slate-300 mb-4 block" />
                  <p className="text-slate-400 font-bold">لا توجد ملاعب متاحة حالياً</p>
                </div>
              ) : fields.map(f => (
                <button
                  key={f.id}
                  onClick={() => update('fieldId', f.id)}
                  className={`w-full flex items-center gap-4 p-4 bg-white rounded-2xl border-2 transition-all text-start group ${
                    form.fieldId === f.id
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-md shadow-emerald-100'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* صورة الملعب */}
                  <div className="w-18 h-16 rounded-xl overflow-hidden flex-shrink-0 w-20">
                    <img
                      src={f.images?.[0] || 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=200&q=60'}
                      alt={f.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {/* معلومات الملعب */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-slate-800">{f.name}</span>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{f.type}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-1 truncate">
                      <i className="fas fa-map-marker-alt me-1 text-xs text-red-400" />{f.location}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-emerald-600">{f.pricePerHour} د.أ/ساعة</span>
                      <span className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                        <i className="fas fa-star text-[10px]" />{f.rating}
                      </span>
                    </div>
                  </div>
                  {form.fieldId === f.id
                    ? <i className="fas fa-check-circle text-emerald-500 text-xl flex-shrink-0" />
                    : <i className="fas fa-circle text-slate-200 text-xl flex-shrink-0" />
                  }
                </button>
              ))}
            </div>

            {/* الأيام والأوقات المفضلة */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-5">
              {/* الأيام */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-3">الأيام المفضلة للمباريات</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(d => (
                    <button
                      key={d}
                      onClick={() => toggleDay(d)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${
                        form.preferredDays.includes(d)
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* الوقت */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-3">الوقت المفضل للمباريات</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { v: 'صباحي', icon: 'fa-sun',  sub: '8ص – 12ظ'  },
                    { v: 'ظهري',  icon: 'fa-cloud-sun', sub: '12ظ – 5م' },
                    { v: 'مسائي', icon: 'fa-moon', sub: '5م – 11م'  },
                  ].map(t => (
                    <button
                      key={t.v}
                      onClick={() => update('preferredTime', t.v)}
                      className={`py-3 rounded-xl font-bold text-sm border-2 transition-all flex flex-col items-center gap-1 ${
                        form.preferredTime === t.v
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-emerald-300'
                      }`}
                    >
                      <i className={`fas ${t.icon}`} />
                      <span>{t.v}</span>
                      <span className={`text-[10px] ${form.preferredTime === t.v ? 'text-emerald-100' : 'text-slate-400'}`}>{t.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  ملاحظات لصاحب الملعب <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => update('notes', e.target.value)}
                  rows={3}
                  placeholder="أي طلبات خاصة أو معلومات إضافية لصاحب الملعب..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 4: المراجعة والتأكيد ════════════════════════════════════ */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900 mb-1">مراجعة وتأكيد</h2>
              <p className="text-slate-500 text-sm">راجع تفاصيل بطولتك قبل إرسال الطلب لصاحب الملعب</p>
            </div>

            {/* بطاقة الملخص */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
              <div className="bg-gradient-to-l from-emerald-600 to-teal-600 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-trophy text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-xl leading-tight">{form.name || '—'}</h3>
                    <p className="text-emerald-100 text-sm mt-0.5">
                      {FORMATS.find(f => f.id === form.format)?.label} · {form.maxTeams} فريق · ملعب {form.fieldType}
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-50">
                {[
                  { icon: 'fa-calendar',       label: 'تاريخ البداية',       value: form.startDate     || '—' },
                  { icon: 'fa-calendar-check', label: 'آخر موعد التسجيل',    value: form.regDeadline   || 'مفتوح' },
                  { icon: 'fa-coins',          label: 'رسوم التسجيل',        value: form.entryFee ? `${form.entryFee} د.أ` : 'مجاني' },
                  { icon: 'fa-medal',          label: 'جائزة المركز الأول',  value: form.prize1        || '—' },
                  { icon: 'fa-map-marker-alt', label: 'الملعب المختار',      value: selectedField?.name || '—' },
                  { icon: 'fa-map-pin',        label: 'الموقع',              value: selectedField?.location || '—' },
                  { icon: 'fa-clock',          label: 'الوقت المفضل',        value: form.preferredTime },
                  { icon: 'fa-calendar-week',  label: 'أيام المباريات',      value: form.preferredDays.length > 0 ? form.preferredDays.join('، ') : '—' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3.5">
                    <div className="flex items-center gap-3 text-slate-500 text-sm">
                      <i className={`fas ${r.icon} w-4 text-center text-emerald-500`} />
                      <span>{r.label}</span>
                    </div>
                    <span className="font-bold text-slate-800 text-sm text-end max-w-[55%]">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* معلومات التواصل */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
              <div>
                <label className="block text-sm font-black text-slate-700 mb-1">معلومات التواصل</label>
                <p className="text-xs text-slate-400 mb-4">سيستخدمها صاحب الملعب للتواصل معك وتأكيد الطلب</p>
              </div>

              {/* الاسم */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text" value={form.organizerName}
                    onChange={e => update('organizerName', e.target.value)}
                    placeholder="اسمك الكامل"
                    className="w-full ps-11 pe-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  />
                  <i className="fas fa-user absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                </div>
              </div>

              {/* الهاتف */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel" value={form.phone}
                    onChange={e => update('phone', e.target.value)}
                    placeholder="07X-XXX-XXXX" dir="ltr"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                  />
                  <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                </div>
              </div>

              {/* البريد الإلكتروني */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  البريد الإلكتروني <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <div className="relative">
                  <input
                    type="text" value={form.organizerEmail}
                    onChange={e => update('organizerEmail', e.target.value)}
                    placeholder="example@gmail.com" dir="ltr"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  />
                  <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                </div>
              </div>
            </div>

            {/* الموافقة على الشروط */}
            <button
              onClick={() => update('agreeTerms', !form.agreeTerms)}
              className={`w-full flex items-start gap-3 p-4 bg-white rounded-2xl border-2 transition-all text-start ${
                form.agreeTerms ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                form.agreeTerms ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
              }`}>
                {form.agreeTerms && <i className="fas fa-check text-white text-[10px]" />}
              </div>
              <span className="text-sm text-slate-600 leading-relaxed">
                أوافق على شروط الاستخدام وسياسة الخصوصية، وأتعهد بأن جميع المعلومات المدخلة صحيحة ودقيقة
              </span>
            </button>
          </div>
        )}

        {/* ─── أزرار التنقل ─────────────────────────────────────────────── */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => goStep((step - 1) as Step)}
              className="flex-1 py-4 border-2 border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all"
            >
              <i className="fas fa-arrow-right me-2 text-sm" />السابق
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => goStep((step + 1) as Step)}
              disabled={!canNext()}
              className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-100 transform hover:-translate-y-0.5 disabled:transform-none"
            >
              التالي <i className="fas fa-arrow-left ms-2 text-sm" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canNext() || loading}
              className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>جاري الإرسال...</span></>
              ) : (
                <><i className="fas fa-paper-plane" /><span>إرسال الطلب لصاحب الملعب</span></>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CreateTournament;
