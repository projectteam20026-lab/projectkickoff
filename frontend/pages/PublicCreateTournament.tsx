import React, { useState } from 'react';
import {
  createPublicTournamentAPI,
  PublicTournamentPayload,
} from '../services/api';

const FORMATS = [
  { id: 'league', label: 'دوري',               icon: 'fa-list-ol',   desc: 'كل فريق يلعب ضد الكل' },
  { id: 'cup',    label: 'كأس (خروج المغلوب)', icon: 'fa-trophy',    desc: 'الخاسر يودّع فوراً' },
];
const FIELD_TYPES = ['5v5', '6v6', '7v7', '8v8', '11v11'];
const TEAM_COUNTS = [4, 8, 12, 16, 24, 32];
const DAYS        = ['الجمعة', 'السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

type Step = 1 | 2 | 3;

const PublicCreateTournament: React.FC = () => {
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ name: string; token: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<PublicTournamentPayload & { agreeTerms: boolean }>({
    name: '', format: 'league', fieldType: '7v7', maxTeams: 8,
    startDate: '', endDate: '', entryFee: '',
    prize1: '', prize2: '', prize3: '', prizeDesc: '',
    preferredDays: [], preferredTime: 'مسائي', notes: '',
    organizerName: '', organizerPhone: '', organizerEmail: '',
    agreeTerms: false,
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const toggleDay = (d: string) =>
    set('preferredDays', form.preferredDays?.includes(d)
      ? form.preferredDays.filter(x => x !== d)
      : [...(form.preferredDays || []), d]);

  const canNext1 = form.name.trim() && form.startDate;
  const canNext2 = true;
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

  const manageLink = result
    ? `${window.location.origin}/manage-tournament/${result.token}`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(manageLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (result) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-trophy text-white text-3xl" />
          </div>
          <h1 className="font-black text-white text-2xl mb-1">تم إنشاء البطولة! 🎉</h1>
          <p className="text-emerald-100 text-sm">{result.name}</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Management link */}
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
              <input
                readOnly value={manageLink} dir="ltr"
                className="flex-1 px-3 py-2.5 bg-white border-2 border-amber-200 rounded-xl text-xs font-bold text-slate-600 outline-none select-all"
              />
              <button
                onClick={copyLink}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 ${copied ? 'bg-emerald-500 text-white' : 'bg-amber-400 hover:bg-amber-500 text-white'}`}
              >
                <i className={`fas fa-${copied ? 'check' : 'copy'}`} />
                {copied ? 'تم!' : 'نسخ'}
              </button>
            </div>
          </div>

          {/* Registration link */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-link text-blue-500 text-sm" />
              <p className="font-black text-blue-900 text-sm">رابط التسجيل للفرق</p>
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                value={`${window.location.origin}/register-tournament/${result.id}`}
                dir="ltr"
                className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-600 outline-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register-tournament/${result.id}`)}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black rounded-xl transition-colors flex-shrink-0"
              >
                <i className="fas fa-copy" />
              </button>
            </div>
            <p className="text-blue-500 text-[10px] mt-2 font-bold">شارك هذا الرابط مع الفرق للتسجيل</p>
          </div>

          <a
            href={manageLink}
            className="block w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl text-center transition-colors"
          >
            <i className="fas fa-cog me-2" /> فتح لوحة إدارة البطولة
          </a>

          <p className="text-center text-xs text-slate-400">
            يمكنك إدارة التسجيلات وقبول/رفض الفرق من لوحة الإدارة
          </p>
        </div>
      </div>
    </div>
  );

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
            {(['معلومات البطولة', 'الجوائز والأيام', 'بيانات المنظِّم'] as const).map((label, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-1.5 text-xs font-black ${step === i + 1 ? 'text-slate-900' : step > i + 1 ? 'text-emerald-600' : 'text-slate-300'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${step === i + 1 ? 'bg-slate-900 text-white' : step > i + 1 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-slate-400'}`}>
                    {step > i + 1 ? <i className="fas fa-check text-[8px]" /> : i + 1}
                  </div>
                  <span className="hidden sm:block">{label}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-px mx-1 ${step > i + 1 ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
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
          {/* ── Step 1: Tournament info ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="font-black text-slate-900 flex items-center gap-2">
                  <i className="fas fa-info-circle text-emerald-500" /> معلومات البطولة
                </h2>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">اسم البطولة *</label>
                  <input
                    required value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="مثال: بطولة الحي الشتوية 2025"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-colors"
                  />
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
                    <input type="date" required value={form.startDate}
                      onChange={e => set('startDate', e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">تاريخ الانتهاء</label>
                    <input type="date" value={form.endDate}
                      onChange={e => set('endDate', e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors" />
                  </div>
                </div>
              </div>

              <button type="button" disabled={!canNext1} onClick={() => setStep(2)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-gray-300 text-white font-black rounded-xl text-sm transition-all">
                التالي <i className="fas fa-arrow-left ms-2" />
              </button>
            </div>
          )}

          {/* ── Step 2: Prizes & days ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="font-black text-slate-900 flex items-center gap-2">
                  <i className="fas fa-medal text-amber-500" /> الجوائز والرسوم (اختياري)
                </h2>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'prize1', label: '🥇 المركز الأول' },
                    { key: 'prize2', label: '🥈 المركز الثاني' },
                    { key: 'prize3', label: '🥉 المركز الثالث' },
                  ].map(p => (
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
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3.5 bg-white border-2 border-gray-200 hover:border-gray-300 text-slate-700 font-black rounded-xl text-sm transition-all">
                  <i className="fas fa-arrow-right me-2" /> السابق
                </button>
                <button type="button" onClick={() => setStep(3)}
                  className="flex-[2] py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-sm transition-all">
                  التالي <i className="fas fa-arrow-left ms-2" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Organizer info + submit ───────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="font-black text-slate-900 flex items-center gap-2">
                  <i className="fas fa-user-tie text-blue-500" /> بيانات المنظِّم
                </h2>
                <p className="text-xs text-slate-500">هذه البيانات تظهر للفرق عند التسجيل وتُستخدم للتواصل معك</p>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">الاسم الكامل *</label>
                  <input required value={form.organizerName} onChange={e => set('organizerName', e.target.value)}
                    placeholder="اسمك الكامل"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">رقم الهاتف *</label>
                    <input required type="tel" value={form.organizerPhone}
                      onChange={e => set('organizerPhone', e.target.value)}
                      placeholder="07XXXXXXXX" dir="ltr"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">البريد الإلكتروني</label>
                    <input type="email" value={form.organizerEmail}
                      onChange={e => set('organizerEmail', e.target.value)}
                      placeholder="example@email.com" dir="ltr"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-colors" />
                  </div>
                </div>

                {/* Summary card */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-black text-slate-600 mb-3 flex items-center gap-1.5">
                    <i className="fas fa-clipboard-check text-emerald-500" /> ملخص البطولة
                  </p>
                  <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                    {[
                      ['الاسم',     form.name || '—'],
                      ['النوع',     form.format === 'cup' ? 'كأس' : 'دوري'],
                      ['الملعب',    form.fieldType],
                      ['الفرق',     `${form.maxTeams} فريق`],
                      ['البداية',   form.startDate || '—'],
                      ['الرسوم',    form.entryFee ? `${form.entryFee} JD` : 'مجاني'],
                    ].map(([k, v]) => (
                      <React.Fragment key={k}>
                        <span className="text-slate-500 font-bold">{k}:</span>
                        <span className="font-black text-slate-800">{v}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all ${form.agreeTerms ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'}`}
                    onClick={() => set('agreeTerms', !form.agreeTerms)}>
                    {form.agreeTerms && <i className="fas fa-check text-white text-[10px]" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={form.agreeTerms} onChange={e => set('agreeTerms', e.target.checked)} />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    أوافق على إدارة البطولة بمسؤولية كاملة، والتواصل مع الفرق المسجّلة
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 py-3.5 bg-white border-2 border-gray-200 hover:border-gray-300 text-slate-700 font-black rounded-xl text-sm transition-all">
                  <i className="fas fa-arrow-right me-2" /> السابق
                </button>
                <button type="submit" disabled={!canSubmit || busy}
                  className="flex-[2] py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                  {busy
                    ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الإنشاء...</>
                    : <><i className="fas fa-trophy" /> إنشاء البطولة</>
                  }
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
