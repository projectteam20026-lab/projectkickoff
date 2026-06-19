import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { Team } from '../types';

// ── Shield colour palette ─────────────────────────────────────────────────
const PALETTE = [
  '#eab308','#f97316','#8b5cf6','#10b981',
  '#3b82f6','#ef4444','#14b8a6','#a16207',
  '#1e293b','#1e40af','#ec4899','#06b6d4',
];

// ── SVG shield templates ──────────────────────────────────────────────────
interface Template { id: string; label: string }

const TEMPLATES: Template[] = [
  { id: 'shield-classic', label: 'درع بنجمة'        },
  { id: 'shield-peak',    label: 'درع بقمة'          },
  { id: 'circle',         label: 'دائرة بنجمة'       },
  { id: 'shield-curved',  label: 'درع منحنية'        },
  { id: 'diamond',        label: 'معيّن بنجمة'       },
  { id: 'hexagon',        label: 'سداسي بنجمة'       },
];

function ShieldSVG({ id, color, size = 80 }: { id: string; color: string; size?: number }) {
  const star = (cx: number, cy: number, r1: number, r2: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? r1 : r2;
      pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
    }
    return <polygon points={pts.join(' ')} fill="white" opacity={0.95} />;
  };

  const ball = (cx: number, cy: number, r: number) => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth={1.8} opacity={0.65} />
      <circle cx={cx} cy={cy} r={r * 0.35} fill="white" opacity={0.45} />
    </g>
  );

  if (id === 'shield-classic') return (
    <svg width={size} height={size} viewBox="0 0 100 108" fill="none">
      <path d="M50 6 L92 22 L92 57 Q92 84 50 104 Q8 84 8 57 L8 22 Z" fill={color} />
      <path d="M50 6 L92 22 L92 57 Q92 84 50 104 Q8 84 8 57 L8 22 Z" fill="none" stroke="white" strokeWidth={2} opacity={0.25} />
      {star(50, 36, 13, 6)}
      {ball(50, 74, 13)}
    </svg>
  );

  if (id === 'shield-peak') return (
    <svg width={size} height={size} viewBox="0 0 100 108" fill="none">
      <path d="M50 5 L88 20 L88 55 Q88 82 50 106 Q12 82 12 55 L12 20 Z" fill={color} />
      <path d="M50 5 L88 20 L88 55 Q88 82 50 106 Q12 82 12 55 L12 20 Z" fill="none" stroke="white" strokeWidth={2} opacity={0.25} />
      <path d="M34 20 L50 7 L66 20" fill="none" stroke="white" strokeWidth={2.5} opacity={0.55} strokeLinejoin="round" />
      {star(50, 38, 12, 5.5)}
      {ball(50, 73, 12)}
    </svg>
  );

  if (id === 'circle') return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx={50} cy={50} r={44} fill={color} />
      <circle cx={50} cy={50} r={44} stroke="white" strokeWidth={2} opacity={0.25} />
      <circle cx={50} cy={50} r={37} fill="none" stroke="white" strokeWidth={1} opacity={0.15} />
      {star(50, 36, 13, 6)}
      {ball(50, 67, 11)}
    </svg>
  );

  if (id === 'shield-curved') return (
    <svg width={size} height={size} viewBox="0 0 100 108" fill="none">
      <path d="M50 6 Q80 8 91 28 Q97 48 91 66 Q76 90 50 105 Q24 90 9 66 Q3 48 9 28 Q20 8 50 6 Z" fill={color} />
      <path d="M50 6 Q80 8 91 28 Q97 48 91 66 Q76 90 50 105 Q24 90 9 66 Q3 48 9 28 Q20 8 50 6 Z" fill="none" stroke="white" strokeWidth={2} opacity={0.25} />
      {star(50, 36, 13, 6)}
      {ball(50, 74, 13)}
    </svg>
  );

  if (id === 'diamond') return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M50 4 L96 50 L50 96 L4 50 Z" fill={color} />
      <path d="M50 4 L96 50 L50 96 L4 50 Z" fill="none" stroke="white" strokeWidth={2} opacity={0.25} />
      {star(50, 34, 12, 5.5)}
      {ball(50, 64, 11)}
    </svg>
  );

  // hexagon (default)
  return (
    <svg width={size} height={size} viewBox="0 0 100 108" fill="none">
      <path d="M50 5 L93 28.5 L93 79.5 L50 103 L7 79.5 L7 28.5 Z" fill={color} />
      <path d="M50 5 L93 28.5 L93 79.5 L50 103 L7 79.5 L7 28.5 Z" fill="none" stroke="white" strokeWidth={2} opacity={0.25} />
      {star(50, 37, 13, 6)}
      {ball(50, 74, 13)}
    </svg>
  );
}

// ── Other constants ───────────────────────────────────────────────────────
const FORMATIONS = [
  { v: '4-3-3',   desc: 'هجومي، ضغط عالٍ'   },
  { v: '4-4-2',   desc: 'متوازن، كلاسيكي'    },
  { v: '4-2-3-1', desc: 'دفاعي متحرك'         },
  { v: '3-5-2',   desc: 'جنحات مزدوجة'       },
  { v: '5-3-2',   desc: 'مرتد سريع'           },
  { v: '3-4-3',   desc: 'هجومي جريء'          },
];

const FIELD_TYPES = ['5v5', '6v6', '7v7', '8v8', '11v11'];
const AGE_GROUPS  = ['ناشئون (تحت 18)', 'شباب (18-23)', 'بالغون (23+)', 'مختلط'];
const CITIES      = ['عمان','الزرقاء','إربد','العقبة','السلط','مادبا','جرش','عجلون','المفرق','الكرك','الطفيلة','معان'];

const DEFAULT_FORM = {
  name: '', logo: 'shield-classic', primaryColor: '#10b981',
  formation: '4-3-3', fieldType: '7v7',
  city: 'عمان', ageGroup: 'بالغون (23+)',
  captain: '', description: '', rules: '',
};

type Mode = 'view' | 'create' | 'edit';

// ── Component ─────────────────────────────────────────────────────────────
const MyTeams: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myTeams,        setMyTeams]        = useState<Team[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [mode,           setMode]           = useState<Mode>('view');
  const [editingTeam,    setEditingTeam]    = useState<Team | null>(null);
  const [form,           setForm]           = useState({ ...DEFAULT_FORM });
  const [formStep,       setFormStep]       = useState<1 | 2>(1);
  const [saving,         setSaving]         = useState(false);
  const [formError,      setFormError]      = useState('');
  const [deleteConfirmId,setDeleteConfirmId]= useState<string | null>(null);
  const [deleting,       setDeleting]       = useState(false);
  const [deleteError,    setDeleteError]    = useState('');
  const [success,        setSuccess]        = useState('');

  const load = useCallback(() => {
    backend.getMyTeams().then(data => { setMyTeams(data); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => {
    setForm({ ...DEFAULT_FORM });
    setFormError('');
    setEditingTeam(null);
    setFormStep(1);
    setMode('create');
  };

  const openEdit = (team: Team) => {
    setForm({
      name:         team.name         || '',
      logo:         team.logo         || 'shield-classic',
      primaryColor: team.primaryColor || '#10b981',
      formation:    team.formation    || '4-3-3',
      fieldType:    team.fieldType    || '7v7',
      city:         team.city         || 'عمان',
      ageGroup:     team.ageGroup     || 'بالغون (23+)',
      captain:      team.captain      || '',
      description:  team.description  || '',
      rules:        '',
    });
    setFormError('');
    setEditingTeam(team);
    setFormStep(1);
    setMode('edit');
  };

  const cancelForm = () => { setMode('view'); setFormError(''); setEditingTeam(null); };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('أدخل اسم الفريق'); return; }
    setSaving(true);
    setFormError('');

    const payload: Partial<Team> = {
      id:           mode === 'edit' ? editingTeam?.id : '',
      name:         form.name.trim(),
      logo:         form.logo,
      primaryColor: form.primaryColor,
      formation:    form.formation,
      fieldType:    form.fieldType,
      city:         form.city,
      ageGroup:     form.ageGroup,
      captain:      form.captain,
      description:  form.description,
      wins:    mode === 'edit' ? (editingTeam?.wins   || 0) : 0,
      losses:  mode === 'edit' ? (editingTeam?.losses || 0) : 0,
      draws:   mode === 'edit' ? (editingTeam?.draws  || 0) : 0,
      points:  mode === 'edit' ? (editingTeam?.points || 0) : 0,
      players: mode === 'edit' ? (editingTeam?.players || [user?.name || '']) : [user?.name || ''],
    };

    const res = await backend.saveTeam(payload as Team);
    if (res.success) {
      load();
      setSuccess(mode === 'create' ? 'تم إنشاء الفريق بنجاح! 🎉' : 'تم تحديث الفريق بنجاح! ✅');
      setMode('view');
      setEditingTeam(null);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setFormError('حدث خطأ، حاول مجدداً');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setDeleteError('');
    const ok = await backend.deleteTeam(id);
    if (ok) {
      setMyTeams(prev => prev.filter(t => t.id !== id));
      setDeleteConfirmId(null);
      setSuccess('تم حذف الفريق بنجاح.');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setDeleteError('فشل الحذف، حاول مجدداً.');
    }
    setDeleting(false);
  };

  // ── Full-page creation / edit view ───────────────────────────────────────
  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-4">
            <button
              onClick={cancelForm}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <i className="fas fa-arrow-right text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {mode === 'create' ? 'إنشاء فريق جديد' : 'تعديل الفريق'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">أنت ستكون قائد الفريق</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex border-b border-gray-100">
              {[
                { step: 1 as const, label: 'الشعار' },
                { step: 2 as const, label: 'التفاصيل' },
              ].map(t => (
                <button
                  key={t.step}
                  onClick={() => { if (t.step === 2 && !form.name.trim()) return; setFormStep(t.step); }}
                  className={`flex-1 py-3.5 text-sm font-black transition-all border-b-2 ${
                    formStep === t.step
                      ? 'text-slate-900 border-slate-900'
                      : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          {formError && (
            <div className="flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3.5 rounded-xl mb-5">
              <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0" /> {formError}
            </div>
          )}

          {/* ── STEP 1: Badge designer ───────────────────────────────── */}
          {formStep === 1 && (
            <div className="space-y-7">
              {/* Large preview */}
              <div className="flex flex-col items-center gap-3 py-6">
                <div
                  className="w-32 h-32 rounded-3xl flex items-center justify-center shadow-xl border-4 border-white"
                  style={{ background: `${form.primaryColor}22` }}
                >
                  <ShieldSVG id={form.logo} color={form.primaryColor} size={96} />
                </div>
                <p className="text-sm font-bold text-slate-500">
                  {TEMPLATES.find(t => t.id === form.logo)?.label || ''}
                </p>
              </div>

              {/* Template grid */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">النموذج</p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set('logo', t.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                        form.logo === t.id
                          ? 'border-slate-800 bg-slate-50 shadow-md scale-105'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:scale-102'
                      }`}
                    >
                      <ShieldSVG id={t.id} color={form.logo === t.id ? form.primaryColor : '#94a3b8'} size={44} />
                      <span className="text-[10px] font-bold text-slate-500 text-center leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color grid */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">اللون</p>
                <div className="grid grid-cols-6 gap-2.5">
                  {PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('primaryColor', c)}
                      className={`h-11 rounded-xl transition-all ${
                        form.primaryColor === c
                          ? 'ring-4 ring-offset-2 ring-slate-600 scale-105 shadow-md'
                          : 'hover:scale-105 hover:shadow-sm'
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFormStep(2)}
                className="w-full py-4 rounded-2xl text-white font-black text-base shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{ background: form.primaryColor }}
              >
                التالي — إضافة التفاصيل
                <i className="fas fa-arrow-left me-2 text-sm" />
              </button>
            </div>
          )}

          {/* ── STEP 2: Team details ─────────────────────────────────── */}
          {formStep === 2 && (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Preview card */}
              <div
                className="rounded-2xl p-5 flex items-center gap-4 shadow-lg"
                style={{ background: form.primaryColor }}
              >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
                  <ShieldSVG id={form.logo} color="white" size={52} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 text-xs font-bold">اسم الفريق</p>
                  <p className="text-white font-black text-xl truncate mt-0.5">
                    {form.name || 'اكتب اسم فريقك'}
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-white/70 text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full font-bold">{form.formation}</span>
                    <span className="text-white/70 text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full font-bold">{form.fieldType}</span>
                    {form.city && (
                      <span className="text-white/70 text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full font-bold">
                        <i className="fas fa-map-marker-alt text-[9px] me-1" />{form.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">
                    اسم الفريق <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="مثال: نسور الأردن"
                    autoFocus
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">
                    وصف الفريق <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={3}
                    placeholder='مثال: "نحن نلعب للفوز، وليس لتجنّب الخسارة"'
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">
                    قواعد الفريق <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
                  </label>
                  <textarea
                    value={form.rules}
                    onChange={e => set('rules', e.target.value)}
                    rows={3}
                    placeholder="مثال: الحضور إلزامي، الاحترام واجب..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm resize-none"
                  />
                </div>
              </div>

              {/* Extra details */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">التفاصيل</p>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">التشكيلة</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {FORMATIONS.map(f => (
                      <button key={f.v} type="button" onClick={() => set('formation', f.v)}
                        className={`p-3 rounded-xl border-2 text-start transition-all ${
                          form.formation === f.v
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200 bg-gray-50'
                        }`}>
                        <div className={`text-base font-black mb-0.5 ${form.formation === f.v ? 'text-blue-700' : 'text-slate-700'}`}>{f.v}</div>
                        <div className="text-[10px] text-slate-400 leading-tight">{f.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">نوع الملعب</label>
                  <div className="flex flex-wrap gap-2">
                    {FIELD_TYPES.map(ft => (
                      <button key={ft} type="button" onClick={() => set('fieldType', ft)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${
                          form.fieldType === ft
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-gray-200 text-slate-600 hover:border-blue-300 bg-gray-50'
                        }`}>{ft}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">الفئة العمرية</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AGE_GROUPS.map(ag => (
                      <button key={ag} type="button" onClick={() => set('ageGroup', ag)}
                        className={`py-2.5 px-3 rounded-xl font-bold text-sm border-2 transition-all text-start ${
                          form.ageGroup === ag
                            ? 'bg-amber-50 border-amber-400 text-amber-800'
                            : 'border-gray-200 text-slate-600 hover:border-amber-200 bg-gray-50'
                        }`}>{ag}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">المدينة</label>
                  <select
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-bold appearance-none"
                  >
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormStep(1)}
                  className="px-5 py-4 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-2xl text-sm transition-colors"
                >
                  <i className="fas fa-arrow-right me-2 text-xs" />رجوع
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-4 text-white font-black rounded-2xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ background: form.primaryColor }}
                >
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</>
                    : mode === 'create' ? '! إنشاء الفريق' : 'حفظ التعديلات'
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── View: list of my teams ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <i className="fas fa-shield-alt text-emerald-500" /> فرقي
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">الفرق التي أنشأتها</p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-emerald-200 transition-all hover:-translate-y-0.5"
            >
              <i className="fas fa-plus text-xs" /> إنشاء فريق
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Toast */}
        {success && (
          <div className="flex gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-2xl items-center">
            <i className="fas fa-check-circle text-emerald-500 text-lg" /> {success}
          </div>
        )}

        {/* Delete modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-500 flex-shrink-0">
                  <i className="fas fa-trash text-xl" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">حذف الفريق؟</h3>
                  <p className="text-sm text-slate-500 mt-0.5">سيتم حذف الفريق نهائياً ولا يمكن التراجع</p>
                </div>
              </div>
              {deleteError && (
                <div className="flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-4">
                  <i className="fas fa-exclamation-circle" /> {deleteError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleting
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري...</>
                    : <><i className="fas fa-trash" /> نعم، احذف</>
                  }
                </button>
                <button
                  onClick={() => { setDeleteConfirmId(null); setDeleteError(''); }}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-sm"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : myTeams.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-emerald-200 p-12 text-center">
            <div className="flex justify-center mb-4">
              <ShieldSVG id="shield-classic" color="#d1d5db" size={64} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">ليس لديك فريق بعد</h3>
            <p className="text-slate-400 text-sm mb-5">أنشئ فريقك الآن وابدأ المنافسة</p>
            <button
              onClick={openCreate}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
            >
              <i className="fas fa-plus me-2" /> إنشاء فريق
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myTeams.map(team => {
              const accent = team.primaryColor || '#10b981';
              const logoId = team.logo && TEMPLATES.some(t => t.id === team.logo)
                ? team.logo
                : 'shield-classic';
              return (
                <div key={team.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                  <div className="h-1" style={{ background: accent }} />
                  <div className="p-5">
                    <div className="flex items-center gap-4">
                      {/* Shield logo */}
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border"
                        style={{ background: `${accent}18`, borderColor: `${accent}35` }}
                      >
                        <ShieldSVG id={logoId} color={accent} size={44} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900 text-lg truncate">{team.name}</h3>
                          <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full">مالك</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                          {team.city && (
                            <span className="flex items-center gap-1">
                              <i className="fas fa-map-marker-alt text-[9px]" /> {team.city}
                            </span>
                          )}
                          {team.formation && (
                            <span className="font-bold" style={{ color: accent }}>{team.formation}</span>
                          )}
                          {team.fieldType && <span>{team.fieldType}</span>}
                          <span className="flex items-center gap-1">
                            <i className="fas fa-users text-[9px]" /> {(team.membersCount ?? 0) + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-emerald-600 font-bold">{team.wins} فوز</span>
                          <span className="text-yellow-600 font-bold">{team.draws} تعادل</span>
                          <span className="text-red-500 font-bold">{team.losses} خسارة</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-700 font-black">{team.points} نقطة</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEdit(team)}
                          className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-500 flex items-center justify-center transition-colors border border-blue-100"
                        >
                          <i className="fas fa-edit text-sm" />
                        </button>
                        <button
                          onClick={() => { setDeleteConfirmId(team.id); setDeleteError(''); }}
                          className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors border border-red-100"
                        >
                          <i className="fas fa-trash text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Link to all teams */}
        <div className="text-center">
          <button
            onClick={() => navigate('/teams')}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-2 mx-auto transition-colors"
          >
            <i className="fas fa-users text-xs" /> عرض جميع الفرق
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyTeams;
