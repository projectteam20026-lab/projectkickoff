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

type Mode = 'view' | 'create' | 'edit';

const MyTeams: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('view');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(() => {
    backend.getMyTeams().then(data => {
      setMyTeams(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => {
    setForm({ ...DEFAULT_FORM });
    setFormError('');
    setEditingTeam(null);
    setMode('create');
    setTimeout(() => document.getElementById('team-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const openEdit = (team: Team) => {
    setForm({
      name:         team.name         || '',
      logo:         team.logo         || '⚽',
      primaryColor: team.primaryColor || '#10b981',
      formation:    team.formation    || '4-3-3',
      fieldType:    team.fieldType    || '7v7',
      city:         team.city         || 'عمان',
      ageGroup:     team.ageGroup     || 'بالغون (23+)',
      captain:      team.captain      || '',
      description:  team.description  || '',
    });
    setFormError('');
    setEditingTeam(team);
    setMode('edit');
    setTimeout(() => document.getElementById('team-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const cancelForm = () => {
    setMode('view');
    setFormError('');
    setEditingTeam(null);
  };

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
            onClick={cancelForm}
            className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors flex-shrink-0"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      </div>

      {formError && (
        <div className="mx-5 mt-4 flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl">
          <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0" /> {formError}
        </div>
      )}

      <form onSubmit={handleSave} className="p-5 space-y-7">

        {/* Section 1: الهوية البصرية */}
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

        {/* Section 2: التكتيك والتشكيلة */}
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

        {/* Section 3: معلومات الفريق */}
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
            onClick={cancelForm}
            className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold rounded-xl text-sm transition-colors"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );

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
            {mode === 'view' && (
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

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* Success toast */}
        {success && (
          <div className="flex gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-2xl items-center animate-fade-in-up">
            <i className="fas fa-check-circle text-emerald-500 text-lg" /> {success}
          </div>
        )}

        {/* Inline create/edit form */}
        {(mode === 'create' || mode === 'edit') && renderForm()}

        {/* Delete confirmation modal */}
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
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleting
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحذف...</>
                    : <><i className="fas fa-trash" /> نعم، احذف</>
                  }
                </button>
                <button
                  onClick={() => { setDeleteConfirmId(null); setDeleteError(''); }}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : myTeams.length === 0 && mode === 'view' ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-emerald-200 p-12 text-center">
            <div className="text-5xl mb-3">⚽</div>
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
              return (
                <div key={team.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                  <div className="h-1" style={{ background: accent }} />
                  <div className="p-5">
                    <div className="flex items-center gap-4">
                      {/* Logo */}
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 border"
                        style={{ background: `${accent}20`, borderColor: `${accent}40` }}
                      >
                        {team.logo}
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
                            <i className="fas fa-users text-[9px]" /> الأعضاء: {(team.membersCount ?? 0) + 1}
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
                          title="تعديل الفريق"
                          className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-500 flex items-center justify-center transition-colors border border-blue-100"
                        >
                          <i className="fas fa-edit text-sm" />
                        </button>
                        <button
                          onClick={() => { setDeleteConfirmId(team.id); setDeleteError(''); }}
                          title="حذف الفريق"
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
        {mode === 'view' && (
          <div className="text-center">
            <button
              onClick={() => navigate('/teams')}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-2 mx-auto transition-colors"
            >
              <i className="fas fa-users text-xs" /> عرض جميع الفرق
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeams;
