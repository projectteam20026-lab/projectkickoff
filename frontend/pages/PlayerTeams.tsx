import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { Team } from '../types';

const LOGOS = ['⚽','⚡','🔥','🌙','🏆','💎','🚀','🥅','👟','🎯','🏅','🎽'];

const COLORS = [
  { name: 'الأخضر',    value: '#10b981' },
  { name: 'الأزرق',    value: '#3b82f6' },
  { name: 'الأحمر',    value: '#ef4444' },
  { name: 'الأصفر',    value: '#eab308' },
  { name: 'البرتقالي', value: '#f97316' },
  { name: 'البنفسجي',  value: '#8b5cf6' },
  { name: 'الأسود',    value: '#0f172a' },
  { name: 'الوردي',    value: '#ec4899' },
];

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
  name: '', logo: '⚽', primaryColor: '#10b981',
  formation: '4-3-3', fieldType: '7v7',
  city: 'عمان', ageGroup: 'بالغون (23+)',
  captain: '', description: '',
};

type Mode = 'view' | 'create' | 'edit' | 'deleteConfirm';

const PlayerTeams: React.FC = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [myTeam, setMyTeam]     = useState<Team | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading]   = useState(true);
  const [mode, setMode]         = useState<Mode>('view');
  const [form, setForm]         = useState({ ...DEFAULT_FORM });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const reloadAll  = useCallback(() => backend.getAllTeams().then(d => setAllTeams(d)), []);
  const reloadMine = useCallback(() => backend.getMyTeams().then(d => setMyTeam(d[0] ?? null)), []);

  useEffect(() => {
    Promise.all([reloadMine(), reloadAll()]).finally(() => setLoading(false));
  }, [reloadMine, reloadAll]);

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => {
    setForm({ ...DEFAULT_FORM });
    setError('');
    setMode('create');
    setTimeout(() => document.getElementById('team-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const openEdit = () => {
    if (!myTeam) return;
    setForm({
      name:         myTeam.name          || '',
      logo:         myTeam.logo          || '⚽',
      primaryColor: myTeam.primaryColor  || '#10b981',
      formation:    myTeam.formation     || '4-3-3',
      fieldType:    myTeam.fieldType     || '7v7',
      city:         myTeam.city          || 'عمان',
      ageGroup:     myTeam.ageGroup      || 'بالغون (23+)',
      captain:      myTeam.captain       || '',
      description:  myTeam.description   || '',
    });
    setError('');
    setMode('edit');
    setTimeout(() => document.getElementById('team-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('أدخل اسم الفريق'); return; }
    setSaving(true);
    setError('');

    const payload: Partial<Team> = {
      id:           mode === 'edit' ? myTeam?.id : '',
      name:         form.name.trim(),
      logo:         form.logo,
      primaryColor: form.primaryColor,
      formation:    form.formation,
      fieldType:    form.fieldType,
      city:         form.city,
      ageGroup:     form.ageGroup,
      captain:      form.captain,
      description:  form.description,
      wins:    mode === 'edit' ? (myTeam?.wins   || 0) : 0,
      losses:  mode === 'edit' ? (myTeam?.losses || 0) : 0,
      draws:   mode === 'edit' ? (myTeam?.draws  || 0) : 0,
      points:  mode === 'edit' ? (myTeam?.points || 0) : 0,
      players: mode === 'edit' ? (myTeam?.players || [user?.name || '']) : [user?.name || ''],
    };

    const res = await backend.saveTeam(payload as Team);
    if (res.success) {
      setMyTeam(res.team);
      reloadAll();
      setSuccess(mode === 'create' ? 'تم إنشاء الفريق بنجاح! 🎉' : 'تم تحديث الفريق بنجاح! ✅');
      setMode('view');
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError('حدث خطأ، حاول مجدداً');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!myTeam?.id) return;
    setDeleting(true);
    const ok = await backend.deleteTeam(String(myTeam.id));
    if (ok) {
      setMyTeam(null);
      reloadAll();
      setSuccess('تم حذف الفريق.');
      setMode('view');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('فشل الحذف، حاول مجدداً.');
    }
    setDeleting(false);
  };

  const handleJoin = async (teamId: string) => {
    setJoiningId(teamId);
    const res = await backend.joinTeam(teamId);
    if (res.success && res.team) {
      setAllTeams(prev => prev.map(t => t.id === teamId ? res.team! : t));
      setSuccess('تم الانضمام للفريق بنجاح! ✅');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res.error || 'فشل الانضمام، حاول مجدداً.');
      setTimeout(() => setError(''), 3000);
    }
    setJoiningId(null);
  };

  const handleLeave = async (teamId: string) => {
    setJoiningId(teamId);
    const res = await backend.leaveTeam(teamId);
    if (res.success && res.team) {
      setAllTeams(prev => prev.map(t => t.id === teamId ? res.team! : t));
      setSuccess('تم مغادرة الفريق.');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res.error || 'فشل الخروج، حاول مجدداً.');
      setTimeout(() => setError(''), 3000);
    }
    setJoiningId(null);
  };

  /* ── Form ──────────────────────────────────────────────────────────────── */
  const renderForm = () => (
    <div id="team-form" className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden animate-fade-in-up">

      {/* Live preview header */}
      <div className="p-5 text-white transition-all duration-300" style={{ background: form.primaryColor }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner flex-shrink-0">
            {form.logo}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-xs font-bold mb-0.5">
              {mode === 'create' ? 'إنشاء فريق جديد' : 'تعديل الفريق'}
            </p>
            <p className="text-white font-black text-xl truncate">
              {form.name || 'اسم فريقك'}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-white/70 text-xs bg-white/15 px-2.5 py-0.5 rounded-full font-bold">
                {form.formation}
              </span>
              <span className="text-white/70 text-xs bg-white/15 px-2.5 py-0.5 rounded-full font-bold">
                {form.fieldType}
              </span>
              {form.city && (
                <span className="text-white/70 text-xs bg-white/15 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <i className="fas fa-map-marker-alt text-[9px]" />{form.city}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setMode('view'); setError(''); }}
            className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors flex-shrink-0"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-4 flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl">
          <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSave} className="p-5 space-y-7">

        {/* ─── Section 1: الهوية البصرية ─────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: form.primaryColor }} />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">الهوية البصرية</h3>
          </div>
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                اسم الفريق <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="مثال: نسور الأردن"
                  className="w-full ps-11 pe-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-bold"
                />
                <i className="fas fa-shield-alt absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">شعار الفريق</label>
              <div className="grid grid-cols-6 gap-2">
                {LOGOS.map(logo => (
                  <button
                    key={logo}
                    type="button"
                    onClick={() => set('logo', logo)}
                    className={`h-12 rounded-xl text-2xl flex items-center justify-center transition-all border-2 ${
                      form.logo === logo
                        ? 'border-emerald-400 scale-110 shadow-md bg-emerald-50'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:scale-105'
                    }`}
                  >
                    {logo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">لون قميص الفريق</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set('primaryColor', c.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                      form.primaryColor === c.value
                        ? 'border-slate-700 shadow-md scale-105'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: c.value }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Section 2: التكتيك والتشكيلة ──────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-blue-500 rounded-full" />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">التكتيك والتشكيلة</h3>
          </div>
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">التشكيلة المفضلة</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FORMATIONS.map(f => (
                  <button
                    key={f.v}
                    type="button"
                    onClick={() => set('formation', f.v)}
                    className={`p-3.5 rounded-xl border-2 text-start transition-all ${
                      form.formation === f.v
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 bg-gray-50'
                    }`}
                  >
                    <div className={`text-lg font-black mb-0.5 ${form.formation === f.v ? 'text-blue-700' : 'text-slate-800'}`}>
                      {f.v}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium leading-tight">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">حجم الفريق (نوع الملعب)</label>
              <div className="flex flex-wrap gap-2">
                {FIELD_TYPES.map(ft => (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => set('fieldType', ft)}
                    className={`px-5 py-2.5 rounded-xl font-black text-sm border-2 transition-all ${
                      form.fieldType === ft
                        ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-100'
                        : 'border-gray-200 text-slate-600 hover:border-blue-300 bg-gray-50'
                    }`}
                  >
                    {ft}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Section 3: معلومات الفريق ──────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-amber-500 rounded-full" />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">معلومات الفريق</h3>
          </div>
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">المدينة</label>
              <div className="relative">
                <select
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  className="w-full ps-11 pe-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm appearance-none font-bold"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <i className="fas fa-map-marker-alt absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <i className="fas fa-chevron-down absolute end-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الفئة العمرية</label>
              <div className="grid grid-cols-2 gap-2">
                {AGE_GROUPS.map(ag => (
                  <button
                    key={ag}
                    type="button"
                    onClick={() => set('ageGroup', ag)}
                    className={`py-2.5 px-3 rounded-xl font-bold text-sm border-2 transition-all text-start ${
                      form.ageGroup === ag
                        ? 'bg-amber-50 border-amber-400 text-amber-800'
                        : 'border-gray-200 text-slate-600 hover:border-amber-200 bg-gray-50'
                    }`}
                  >
                    {ag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                اسم القائد <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.captain}
                  onChange={e => set('captain', e.target.value)}
                  placeholder="اسم قائد الفريق"
                  className="w-full ps-11 pe-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                />
                <i className="fas fa-star absolute start-4 top-1/2 -translate-y-1/2 text-amber-400 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                شعار أو وصف الفريق <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={2}
                placeholder='مثال: "نحن نلعب للفوز، وليس لتجنّب الخسارة"'
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3.5 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg"
            style={{ background: form.primaryColor }}
          >
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</>
              : <><i className={`fas ${mode === 'create' ? 'fa-futbol' : 'fa-save'}`} /> {mode === 'create' ? 'إنشاء الفريق' : 'حفظ التعديلات'}</>
            }
          </button>
          <button
            type="button"
            onClick={() => { setMode('view'); setError(''); }}
            className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold rounded-xl text-sm transition-colors"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );

  /* ── Main ──────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <i className="fas fa-users text-emerald-500" /> الفرق
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">أنشئ فريقك أو انضم للبطولات</p>
            </div>
            <div className="flex items-center gap-2">
              {!myTeam && mode !== 'create' && (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-emerald-200 transition-all hover:-translate-y-0.5"
                >
                  <i className="fas fa-plus text-xs" /> إنشاء فريق
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Success toast */}
        {success && (
          <div className="flex gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-2xl items-center animate-fade-in-up">
            <i className="fas fa-check-circle text-emerald-500 text-lg" /> {success}
          </div>
        )}

        {/* Error toast */}
        {error && mode === 'view' && (
          <div className="flex gap-2 bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-2xl items-center animate-fade-in-up">
            <i className="fas fa-exclamation-circle text-red-400 text-lg" /> {error}
          </div>
        )}

        {/* Form (create / edit) */}
        {(mode === 'create' || mode === 'edit') && renderForm()}

        {/* Delete confirmation */}
        {mode === 'deleteConfirm' && myTeam && (
          <div className="bg-white rounded-2xl border-2 border-red-200 p-6 shadow-md animate-fade-in-up">
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: myTeam.primaryColor ? `${myTeam.primaryColor}25` : '#fef2f2' }}
              >
                {myTeam.logo}
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">حذف الفريق؟</h3>
                <p className="text-sm text-slate-500">سيتم حذف <span className="font-bold text-red-600">"{myTeam.name}"</span> نهائياً ولا يمكن التراجع</p>
              </div>
            </div>
            {error && (
              <div className="flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-4">
                <i className="fas fa-exclamation-circle" /> {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحذف...</>
                  : <><i className="fas fa-trash" /> نعم، احذف الفريق</>
                }
              </button>
              <button
                onClick={() => { setMode('view'); setError(''); }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <>
            {/* My team card */}
            {myTeam && mode === 'view' && (
              <div>
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <i className="fas fa-star text-yellow-400 text-xs" /> فريقي
                </h2>
                <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">

                  {/* Colored header */}
                  <div className="p-5 text-white" style={{ background: myTeam.primaryColor || '#10b981' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner flex-shrink-0">
                        {myTeam.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-black truncate">{myTeam.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {myTeam.city && (
                            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                              <i className="fas fa-map-marker-alt text-[9px]" /> {myTeam.city}
                            </span>
                          )}
                          {myTeam.ageGroup && (
                            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
                              {myTeam.ageGroup}
                            </span>
                          )}
                          <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                            <i className="fas fa-users text-[9px]" /> الأعضاء: {(myTeam.membersCount ?? 0) + 1}
                          </span>
                        </div>
                        {myTeam.description && (
                          <p className="text-white/70 text-xs mt-1.5 italic line-clamp-1">
                            "{myTeam.description}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      {myTeam.formation && (
                        <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full font-bold">
                          <i className="fas fa-chess text-white/70 text-[9px]" /> {myTeam.formation}
                        </span>
                      )}
                      {myTeam.fieldType && (
                        <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full font-bold">
                          <i className="fas fa-futbol text-white/70 text-[9px]" /> {myTeam.fieldType}
                        </span>
                      )}
                      {myTeam.captain && (
                        <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full font-bold">
                          <i className="fas fa-star text-yellow-300 text-[9px]" /> القائد: {myTeam.captain}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 bg-black/15 rounded-xl p-3">
                      {[
                        { label: 'فوز',   val: myTeam.wins,   color: 'text-emerald-300' },
                        { label: 'تعادل', val: myTeam.draws,  color: 'text-yellow-300'  },
                        { label: 'خسارة', val: myTeam.losses, color: 'text-red-300'     },
                      ].map(s => (
                        <div key={s.label} className="text-center">
                          <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                          <p className="text-white/60 text-[10px] font-bold">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons — only owner sees edit/delete */}
                  <div className="bg-white p-4 flex gap-3">
                    <button
                      onClick={() => navigate('/leagues')}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-trophy text-yellow-300 text-xs" /> انضم لبطولة
                    </button>
                    <button
                      onClick={openEdit}
                      className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-sm rounded-xl transition-colors flex items-center gap-2 border border-blue-100"
                    >
                      <i className="fas fa-edit text-xs" /> تعديل
                    </button>
                    <button
                      onClick={() => setMode('deleteConfirm')}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 font-bold text-sm rounded-xl transition-colors flex items-center gap-2 border border-red-100"
                    >
                      <i className="fas fa-trash text-xs" /> حذف
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!myTeam && mode === 'view' && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-emerald-200 p-10 text-center">
                <div className="text-5xl mb-3">⚽</div>
                <h3 className="text-lg font-black text-slate-900 mb-1">ليس لديك فريق بعد</h3>
                <p className="text-slate-400 text-sm mb-5">أنشئ فريقك الآن وحدد تشكيلتك وألوانك وابدأ المنافسة</p>
                <button
                  onClick={openCreate}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm shadow-emerald-200"
                >
                  <i className="fas fa-plus me-2" /> إنشاء فريق
                </button>
              </div>
            )}

            {/* All teams list */}
            <div>
              <h2 className="text-sm font-black text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <i className="fas fa-users text-slate-400 text-xs" /> جميع الفرق
                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {allTeams.length}
                </span>
              </h2>

              {allTeams.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-slate-400 shadow-sm">
                  <i className="fas fa-users text-4xl mb-3 block text-gray-200" />
                  لا توجد فرق مسجّلة بعد
                </div>
              ) : (
                <div className="space-y-2">
                  {allTeams.map((t: Team, rank: number) => {
                    const isOwner = !!user && t.createdBy === user.id;
                    const isMember = !!user && (t.members || []).includes(user.id);
                    const accent = t.primaryColor || '#e2e8f0';
                    const loadingThis = joiningId === t.id;
                    return (
                      <div
                        key={t.id}
                        className={`bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md overflow-hidden ${
                          isOwner ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-100'
                        }`}
                      >
                        {/* Color strip */}
                        <div className="h-1" style={{ background: accent }} />

                        <div className="flex items-center gap-4 p-4">
                          {/* Rank badge */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${
                            rank === 0 ? 'bg-yellow-100 text-yellow-700' :
                            rank === 1 ? 'bg-gray-100 text-gray-600' :
                            rank === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}
                          </div>

                          {/* Logo */}
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl border flex-shrink-0"
                            style={{ background: `${accent}20`, borderColor: `${accent}40` }}
                          >
                            {t.logo}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-black text-slate-900 truncate">{t.name}</p>
                              {isOwner && (
                                <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0">
                                  فريقي
                                </span>
                              )}
                              {isMember && !isOwner && (
                                <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0">
                                  عضو
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                              {t.city && (
                                <span className="flex items-center gap-1">
                                  <i className="fas fa-map-marker-alt text-[9px]" />{t.city}
                                </span>
                              )}
                              {t.formation && (
                                <span className="font-bold" style={{ color: accent }}>
                                  {t.formation}
                                </span>
                              )}
                              {t.fieldType && <span>{t.fieldType}</span>}
                              <span>{t.wins}ف · {t.draws}ت · {t.losses}خ</span>
                              <span className="flex items-center gap-1">
                                <i className="fas fa-users text-[9px]" />
                                الأعضاء: {(t.membersCount ?? 0) + 1}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isOwner ? (
                              /* Owner: edit + delete */
                              <>
                                <button
                                  onClick={openEdit}
                                  title="تعديل"
                                  className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 flex items-center justify-center transition-colors border border-blue-100"
                                >
                                  <i className="fas fa-edit text-xs" />
                                </button>
                                <button
                                  onClick={() => setMode('deleteConfirm')}
                                  title="حذف"
                                  className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors border border-red-100"
                                >
                                  <i className="fas fa-trash text-xs" />
                                </button>
                              </>
                            ) : (
                              /* Non-owner: join / leave + points */
                              <div className="flex items-center gap-2">
                                {isMember ? (
                                  <button
                                    onClick={() => handleLeave(t.id)}
                                    disabled={loadingThis}
                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-lg border border-red-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {loadingThis
                                      ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                      : <i className="fas fa-sign-out-alt text-[10px]" />
                                    }
                                    مغادرة
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleJoin(t.id)}
                                    disabled={loadingThis}
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {loadingThis
                                      ? <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                      : <i className="fas fa-user-plus text-[10px]" />
                                    }
                                    انضمام
                                  </button>
                                )}
                                <div className="text-end">
                                  <p className="text-xl font-black text-slate-900">{t.points}</p>
                                  <p className="text-[10px] text-slate-400 font-bold">نقطة</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CTA banner */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-yellow-400/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                  🏆
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-lg">انضم لبطولة الآن!</h3>
                  <p className="text-slate-400 text-sm mt-0.5">سجّل فريقك في أحدث بطولات المنصة وتنافس على الجوائز</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/leagues')}
                className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-trophy text-yellow-300" /> عرض البطولات المتاحة
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlayerTeams;
