import React, { useState, useEffect } from 'react';
import {
  createPublicTournamentAPI,
  PublicTournamentPayload,
  getFieldsAPI,
} from '../services/api';

const FORMATS = [
  { id: 'league', label: 'دوري',               icon: 'fa-list-ol',   desc: 'كل فريق يلعب ضد الكل' },
  { id: 'cup',    label: 'كأس (خروج المغلوب)', icon: 'fa-trophy',    desc: 'الخاسر يودّع فوراً' },
];
const FIELD_TYPES = ['5v5', '6v6', '7v7', '8v8', '11v11'];
const TEAM_COUNTS = [4, 8, 12, 16, 24, 32];
const DAYS        = ['الجمعة', 'السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

type Step = 1 | 2 | 3 | 4;

interface FieldItem { id: string; name: string; city: string; type: string; pricePerHour: number; images: string[]; }

const PublicCreateTournament: React.FC = () => {
  const [step, setStep]     = useState<Step>(1);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState('');
  const [result, setResult] = useState<{ name: string; token: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [fields, setFields]       = useState<FieldItem[]>([]);
  const [fieldSearch, setFieldSearch] = useState('');
  const [fieldsLoading, setFieldsLoading] = useState(true);

  const [form, setForm] = useState<PublicTournamentPayload & { agreeTerms: boolean }>({
    name: '', format: 'league', fieldType: '7v7', maxTeams: 8,
    startDate: '', endDate: '', entryFee: '',
    prize1: '', prize2: '', prize3: '', prizeDesc: '',
    preferredDays: [], preferredTime: 'مسائي', notes: '',
    organizerName: '', organizerPhone: '', organizerEmail: '',
    fieldId: '',
    agreeTerms: false,
  });

  useEffect(() => {
    getFieldsAPI().then(data => {
      setFields((data || []).map((f: any) => ({
        id: f.id || f._id,
        name: f.name,
        city: f.city || '',
        type: f.type || '',
        pricePerHour: f.pricePerHour || 0,
        images: f.images || [],
      })));
      setFieldsLoading(false);
    }).catch(() => setFieldsLoading(false));
  }, []);

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const toggleDay = (d: string) =>
    set('preferredDays', form.preferredDays?.includes(d)
      ? form.preferredDays.filter(x => x !== d)
      : [...(form.preferredDays || []), d]);

  const filteredFields = fields.filter(f =>
    f.name.toLowerCase().includes(fieldSearch.toLowerCase()) ||
    f.city.toLowerCase().includes(fieldSearch.toLowerCase())
  );

  const selectedField = fields.find(f => f.id === form.fieldId);

  const canNext1 = form.name.trim() && form.startDate;
  const canSubmit = form.organizerName.trim() && form.organizerPhone.trim() && form.agreeTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { agreeTerms, ...payload } = form;
    const res = await createPublicTournamentAPI(payload);
    setBusy(false);
    if (res.success && res.data) {
      setResult({ name: res.data.name, token: res.data.managementToken, id: res.data.id });
    } else {
      setError(res.error || 'حدث خطأ، حاول مجدداً');
    }
  };

  const manageLink = result ? `${window.location.origin}/manage-tournament/${result.token}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(manageLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const STEPS = ['معلومات البطولة', 'الملعب', 'الجوائز والأيام', 'بيانات المنظِّم'];

  // ── Success screen ──────────────────────────────────────────────────────────
  if (result) {
    const hasField = !!form.fieldId && !!selectedField;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">

          {/* ── Header ── */}
          <div className={`p-8 text-center ${hasField ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-emerald-600 to-teal-600'}`}>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className={`fas ${hasField ? 'fa-paper-plane' : 'fa-trophy'} text-white text-3xl`} />
            </div>
            <h1 className="font-black text-white text-2xl mb-1">
              {hasField ? 'تم إرسال الطلب! 📨' : 'تم إنشاء البطولة! 🎉'}
            </h1>
            <p className="text-white/80 text-sm">{result.name}</p>
          </div>

          <div className="p-6 space-y-4">

            {/* ── Field owner flow ── */}
            {hasField && (
              <>
                {/* Status card */}
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-clock text-amber-500 text-xl" />
                  </div>
                  <p className="font-black text-amber-900 text-sm mb-1">في انتظار موافقة صاحب الملعب</p>
                  <p className="text-amber-700 text-xs leading-relaxed">
                    تم إرسال طلبك إلى ملعب <strong>{selectedField!.name}</strong>.
                    سيتواصل معك صاحب الملعب على رقمك للتأكيد والموافقة.
                  </p>
                </div>

                {/* Steps */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                  <p className="font-black text-slate-700 text-xs mb-2 flex items-center gap-1.5">
                    <i className="fas fa-list-check text-slate-500" /> ماذا يحدث بعد ذلك؟
                  </p>
                  {[
                    { icon: 'fa-bell', color: 'text-amber-500', text: 'يصل إشعار للملعب بطلبك' },
                    { icon: 'fa-phone', color: 'text-blue-500',  text: 'يتواصل معك صاحب الملعب عبر الهاتف أو البريد' },
                    { icon: 'fa-check-circle', color: 'text-emerald-500', text: 'عند الموافقة تُفتح إدارة البطولة كاملاً' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <i className={`fas ${s.icon} ${s.color} text-sm`} />
                      </div>
                      <p className="text-xs text-slate-600 font-bold">{s.text}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Management link (always shown) ── */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-key text-white text-sm" />
                </div>
                <div>
                  <p className="font-black text-amber-900 text-sm">رابط إدارة البطولة</p>
                  <p className="text-amber-700 text-xs">احفظ هذا الرابط — لن يظهر مجدداً!</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input readOnly value={manageLink} dir="ltr"
                  className="flex-1 px-3 py-2.5 bg-white border-2 border-amber-200 rounded-xl text-xs font-bold text-slate-600 outline-none" />
                <button onClick={copyLink}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 ${copied ? 'bg-emerald-500 text-white' : 'bg-amber-400 hover:bg-amber-500 text-white'}`}>
                  <i className={`fas fa-${copied ? 'check' : 'copy'}`} />
                  {copied ? 'تم!' : 'نسخ'}
                </button>
              </div>
            </div>

            {/* ── Registration link (only without field, since field owner approves first) ── */}
            {!hasField && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="font-black text-blue-900 text-sm mb-2 flex items-center gap-1.5">
                  <i className="fas fa-link text-blue-500" /> رابط التسجيل للفرق
                </p>
                <div className="flex gap-2">
                  <input readOnly value={`${window.location.origin}/register-tournament/${result.id}`} dir="ltr"
                    className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-600 outline-none" />
                  <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register-tournament/${result.id}`)}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black rounded-xl transition-colors flex-shrink-0">
                    <i className="fas fa-copy" />
                  </button>
                </div>
              </div>
            )}

            <a href={manageLink}
              className={`block w-full py-3.5 text-white font-black text-sm rounded-xl text-center transition-colors ${hasField ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-slate-800'}`}>
              <i className={`fas ${hasField ? 'fa-eye' : 'fa-cog'} me-2`} />
              {hasField ? 'متابعة حالة الطلب' : 'فتح لوحة إدارة البطولة'}
            </a>

          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-16" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900 px-4 py-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <i className="fas fa-trophy text-white text-2xl" />
          </div>
          <h1 className="font-black text-white text-2xl">إنشاء بطولة جديدة</h1>
          <p className="text-slate-400 text-sm mt-1">بدون حساب — مجاناً تماماً</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1">
            {STEPS.map((label, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-1.5 text-xs font-black ${step === i + 1 ? 'text-slate-900' : step > i + 1 ? 'text-emerald-600' : 'text-slate-300'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${step === i + 1 ? 'bg-slate-900 text-white' : step > i + 1 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-slate-400'}`}>
                    {step > i + 1 ? <i className="fas fa-check text-[8px]" /> : i + 1}
                  </div>
                  <span className="hidden sm:block">{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-1 ${step > i + 1 ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm font-bold flex items-center gap-2 mb-4">
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── Step 1: Tournament info ────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="font-black text-slate-900 flex items-center gap-2">
                  <i className="fas fa-info-circle text-emerald-500" /> معلومات البطولة
                </h2>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">اسم البطولة *</label>
                  <input required value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="مثال: بطولة الحي الشتوية 2025"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">نوع البطولة</label>
                  <div className="grid grid-cols-2 gap-3">
                    {FORMATS.map(f => (
                      <button key={f.id} type="button" onClick={() => set('format', f.id)}
                        className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all ${form.format === f.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <i className={`fas ${f.icon} text-2xl ${form.format === f.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className={`text-xs font-black ${form.format === f.id ? 'text-emerald-700' : 'text-slate-600'}`}>{f.label}</span>
                        <span className="text-[10px] text-slate-400 text-center">{f.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">نوع الملعب</label>
                    <div className="flex flex-wrap gap-1.5">
                      {FIELD_TYPES.map(ft => (
                        <button key={ft} type="button" onClick={() => set('fieldType', ft)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${form.fieldType === ft ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200 hover:border-slate-400'}`}>
                          {ft}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">عدد الفرق</label>
                    <div className="flex flex-wrap gap-1.5">
                      {TEAM_COUNTS.map(n => (
                        <button key={n} type="button" onClick={() => set('maxTeams', n)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${form.maxTeams === n ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200 hover:border-slate-400'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">تاريخ البدء *</label>
                    <input type="date" required value={form.startDate} onChange={e => set('startDate', e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">تاريخ الانتهاء</label>
                    <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400" />
                  </div>
                </div>
              </div>
              <button type="button" disabled={!canNext1} onClick={() => setStep(2)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-gray-300 text-white font-black rounded-xl text-sm transition-all">
                التالي <i className="fas fa-arrow-left ms-2" />
              </button>
            </div>
          )}

          {/* ── Step 2: Field selection ────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-slate-900 flex items-center gap-2">
                    <i className="fas fa-map-marker-alt text-emerald-500" /> اختر الملعب
                  </h2>
                  <span className="text-xs text-slate-400 font-bold bg-gray-100 px-2 py-1 rounded-lg">اختياري</span>
                </div>

                {/* Selected field preview */}
                {selectedField && (
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      {selectedField.images[0]
                        ? <img src={selectedField.images[0]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-emerald-200 flex items-center justify-center"><i className="fas fa-futbol text-emerald-600" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-emerald-900 text-sm truncate">{selectedField.name}</p>
                      <p className="text-emerald-700 text-xs font-bold">{selectedField.city} · {selectedField.type}</p>
                    </div>
                    <button type="button" onClick={() => set('fieldId', '')}
                      className="w-7 h-7 rounded-lg bg-emerald-200 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors">
                      <i className="fas fa-times text-emerald-700 text-xs" />
                    </button>
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input value={fieldSearch} onChange={e => setFieldSearch(e.target.value)}
                    placeholder="ابحث باسم الملعب أو المدينة..."
                    className="w-full pr-9 pl-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors" />
                </div>

                {/* Fields list */}
                {fieldsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                ) : filteredFields.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <i className="fas fa-search text-2xl mb-2" />
                    <p className="text-sm font-bold">لا توجد ملاعب مطابقة</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {filteredFields.map(f => (
                      <button key={f.id} type="button" onClick={() => set('fieldId', form.fieldId === f.id ? '' : f.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-right transition-all ${form.fieldId === f.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          {f.images[0]
                            ? <img src={f.images[0]} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><i className="fas fa-futbol text-slate-400 text-lg" /></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <p className={`font-black text-sm truncate ${form.fieldId === f.id ? 'text-emerald-800' : 'text-slate-900'}`}>{f.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-slate-500 font-bold">
                              <i className="fas fa-map-marker-alt text-slate-400 me-1" />{f.city}
                            </span>
                            {f.type && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">{f.type}</span>}
                            {f.pricePerHour > 0 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black">{f.pricePerHour} JD/ساعة</span>}
                          </div>
                        </div>
                        {form.fieldId === f.id && (
                          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-check text-white text-[10px]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {!selectedField && (
                  <p className="text-xs text-slate-400 font-bold text-center">
                    يمكنك تخطي هذه الخطوة إذا لم يكن لديك ملعب محدد
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3.5 bg-white border-2 border-gray-200 hover:border-gray-300 text-slate-700 font-black rounded-xl text-sm transition-all">
                  <i className="fas fa-arrow-right me-2" /> السابق
                </button>
                <button type="button" onClick={() => setStep(3)}
                  className="flex-[2] py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-sm transition-all">
                  {selectedField ? `تم — ${selectedField.name}` : 'تخطي'} <i className="fas fa-arrow-left ms-2" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Prizes & days ──────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="font-black text-slate-900 flex items-center gap-2">
                  <i className="fas fa-medal text-amber-500" /> الجوائز والرسوم (اختياري)
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {[{ key: 'prize1', label: '🥇 الأول' }, { key: 'prize2', label: '🥈 الثاني' }, { key: 'prize3', label: '🥉 الثالث' }].map(p => (
                    <div key={p.key}>
                      <label className="block text-[10px] font-black text-slate-600 mb-1">{p.label}</label>
                      <input value={(form as any)[p.key]} onChange={e => set(p.key, e.target.value)}
                        placeholder="مثال: 200 JD"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-400" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">رسوم المشاركة</label>
                    <input value={form.entryFee} onChange={e => set('entryFee', e.target.value)}
                      placeholder="0 = مجاني"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">وقت المباريات المفضّل</label>
                    <select value={form.preferredTime} onChange={e => set('preferredTime', e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 bg-white">
                      {['صباحي', 'مسائي', 'مختلط'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">أيام اللعب المفضّلة</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(d => (
                      <button key={d} type="button" onClick={() => toggleDay(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.preferredDays?.includes(d) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-gray-200 hover:border-emerald-300'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">ملاحظات إضافية</label>
                  <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
                    placeholder="شروط، معلومات إضافية..."
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 resize-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 py-3.5 bg-white border-2 border-gray-200 hover:border-gray-300 text-slate-700 font-black rounded-xl text-sm transition-all">
                  <i className="fas fa-arrow-right me-2" /> السابق
                </button>
                <button type="button" onClick={() => setStep(4)}
                  className="flex-[2] py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-sm transition-all">
                  التالي <i className="fas fa-arrow-left ms-2" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Organizer info ─────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="font-black text-slate-900 flex items-center gap-2">
                  <i className="fas fa-user-tie text-blue-500" /> بيانات المنظِّم
                </h2>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">الاسم الكامل *</label>
                  <input required value={form.organizerName} onChange={e => set('organizerName', e.target.value)}
                    placeholder="اسمك الكامل"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">رقم الهاتف *</label>
                    <input required type="tel" value={form.organizerPhone} onChange={e => set('organizerPhone', e.target.value)}
                      placeholder="07XXXXXXXX" dir="ltr"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">البريد الإلكتروني</label>
                    <input type="email" value={form.organizerEmail} onChange={e => set('organizerEmail', e.target.value)}
                      placeholder="example@email.com" dir="ltr"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400" />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-black text-slate-600 mb-3 flex items-center gap-1.5">
                    <i className="fas fa-clipboard-check text-emerald-500" /> ملخص البطولة
                  </p>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    {[
                      ['الاسم',    form.name || '—'],
                      ['النوع',    form.format === 'cup' ? 'كأس' : 'دوري'],
                      ['الملعب',   form.fieldType],
                      ['الفرق',    `${form.maxTeams} فريق`],
                      ['البداية',  form.startDate || '—'],
                      ['الملعب المختار', selectedField?.name || 'لم يُحدد'],
                    ].map(([k, v]) => (
                      <React.Fragment key={k}>
                        <span className="text-slate-500 font-bold">{k}:</span>
                        <span className="font-black text-slate-800 truncate">{v}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all ${form.agreeTerms ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}
                    onClick={() => set('agreeTerms', !form.agreeTerms)}>
                    {form.agreeTerms && <i className="fas fa-check text-white text-[10px]" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={form.agreeTerms} onChange={e => set('agreeTerms', e.target.checked)} />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    أوافق على إدارة البطولة بمسؤولية كاملة والتواصل مع الفرق المسجّلة
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(3)}
                  className="flex-1 py-3.5 bg-white border-2 border-gray-200 hover:border-gray-300 text-slate-700 font-black rounded-xl text-sm transition-all">
                  <i className="fas fa-arrow-right me-2" /> السابق
                </button>
                <button type="submit" disabled={!canSubmit || busy}
                  className="flex-[2] py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                  {busy
                    ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الإنشاء...</>
                    : <><i className="fas fa-trophy" /> إنشاء البطولة</>}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PublicCreateTournament;
