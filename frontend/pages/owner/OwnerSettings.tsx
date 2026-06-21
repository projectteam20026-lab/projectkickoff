import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { backend } from '../../services/backend';
import { type OwnerReview } from '../../services/api';

type Tab = 'profile' | 'reports' | 'complaints' | 'prefs';

/* ── small helpers ────────────────────────────────────────────────── */
const Msg = ({ msg }: { msg: { type: 'ok' | 'err'; text: string } | null }) =>
  msg ? (
    <div className={`flex gap-2 items-center text-sm p-3.5 rounded-xl ${
      msg.type === 'ok'
        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        : 'bg-red-50 border border-red-100 text-red-600'
    }`}>
      <i className={`fas ${msg.type === 'ok' ? 'fa-check-circle text-emerald-500' : 'fa-exclamation-circle text-red-400'} flex-shrink-0`} />
      {msg.text}
    </div>
  ) : null;

function InputField({
  label, value, onChange, type = 'text', placeholder = '', icon,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; icon?: string }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        {icon && <i className={`fas ${icon} absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none`} />}
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? 'ps-11' : 'ps-4'} pe-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm`}
        />
      </div>
    </div>
  );
}

/* ── Stars ─────────────────────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <i key={s} className={`fas fa-star text-xs ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`} />
      ))}
    </span>
  );
}

/* ── Main component ─────────────────────────────────────────────────── */
const OwnerSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');

  /* ── PROFILE ─────────────────────────────────────────── */
  const [avatar,        setAvatar]       = useState<string>(user?.avatar || '');
  const [profileForm,   setProfileForm]  = useState({
    name:     user?.name      || '',
    email:    user?.email     || '',
    phone:    user?.phone     || '',
    whatsapp: user?.whatsapp  || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg,    setProfileMsg]    = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [pwForm,   setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg,    setPwMsg]    = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showPw,   setShowPw]   = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);

  const setP  = (k: keyof typeof profileForm, v: string) => setProfileForm(p => ({ ...p, [k]: v }));
  const setPw = (k: keyof typeof pwForm, v: string)      => setPwForm(p => ({ ...p, [k]: v }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setProfileMsg({ type: 'err', text: 'حجم الصورة يجب أن يكون أقل من 2 ميغابايت' }); return; }
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim())  { setProfileMsg({ type: 'err', text: 'الاسم مطلوب' }); return; }
    if (!profileForm.email.trim()) { setProfileMsg({ type: 'err', text: 'البريد الإلكتروني مطلوب' }); return; }
    setProfileSaving(true); setProfileMsg(null);
    const res = await backend.updateMeResult({ ...profileForm, avatar } as any);
    if (res.success) {
      updateUser({ ...profileForm, avatar } as any);
      setProfileMsg({ type: 'ok', text: 'تم حفظ الملف الشخصي بنجاح ✅' });
    } else {
      setProfileMsg({ type: 'err', text: res.error || 'حدث خطأ، حاول مجدداً' });
    }
    setProfileSaving(false);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.currentPassword)        { setPwMsg({ type: 'err', text: 'أدخل كلمة المرور الحالية' }); return; }
    if (pwForm.newPassword.length < 6)  { setPwMsg({ type: 'err', text: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg({ type: 'err', text: 'كلمتا المرور غير متطابقتين' }); return; }
    setPwSaving(true); setPwMsg(null);
    const res = await backend.updateMeResult({ password: pwForm.newPassword, currentPassword: pwForm.currentPassword } as any);
    if (res.success) {
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwMsg({ type: 'ok', text: 'تم تغيير كلمة المرور بنجاح ✅' });
    } else {
      setPwMsg({ type: 'err', text: res.error || 'كلمة المرور الحالية غير صحيحة' });
    }
    setPwSaving(false);
  };

  /* ── REPORTS ─────────────────────────────────────────── */
  const [repLoading, setRepLoading] = useState(false);
  const [repData,    setRepData]    = useState<{
    totalBookings: number; confirmed: number; cancelled: number;
    revenue: number; avgRating: number; totalReviews: number;
  } | null>(null);

  useEffect(() => {
    if (tab !== 'reports') return;
    setRepLoading(true);
    Promise.all([backend.getOwnerStats(), backend.getOwnerRevenue()]).then(([stats, rev]) => {
      if (stats) {
        setRepData({
          totalBookings: stats.totalBookings,
          confirmed:     stats.totalBookings,
          cancelled:     0,
          revenue:       rev?.total.revenue ?? stats.monthlyRevenue,
          avgRating:     stats.avgRating,
          totalReviews:  stats.totalReviews,
        });
      }
      setRepLoading(false);
    });
  }, [tab]);

  const downloadCSV = () => {
    if (!repData) return;
    const rows = [
      ['البند', 'القيمة'],
      ['إجمالي الحجوزات',   repData.totalBookings],
      ['إجمالي الإيرادات',  `${repData.revenue} د.أ`],
      ['متوسط التقييم',      repData.avgRating.toFixed(1)],
      ['عدد التقييمات',     repData.totalReviews],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'تقرير_الملعب.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── COMPLAINTS ──────────────────────────────────────── */
  const [complaints,      setComplaints]     = useState<OwnerReview[]>([]);
  const [compLoading,     setCompLoading]    = useState(false);
  const [resolvedIds,     setResolvedIds]    = useState<Set<string>>(new Set());
  const [compReply,       setCompReply]      = useState<Record<string, string>>({});
  const [compReplySent,   setCompReplySent]  = useState<Set<string>>(new Set());

  useEffect(() => {
    if (tab !== 'complaints') return;
    setCompLoading(true);
    backend.getOwnerReviews().then(({ data }) => {
      setComplaints(data.filter(r => r.rating <= 2));
      setCompLoading(false);
    });
  }, [tab]);

  const toggleResolved = (id: string) =>
    setResolvedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const sendReply = (id: string) => {
    if (!compReply[id]?.trim()) return;
    setCompReplySent(prev => new Set(prev).add(id));
  };

  /* ── PREFERENCES ─────────────────────────────────────── */
  const PREF_KEY = 'owner_prefs';
  const defaultPrefs = { emailNotif: true, smsNotif: false, soundNotif: true, autoConfirm: false, showRevenue: true, compactView: false };
  const [prefs, setPrefs] = useState<typeof defaultPrefs>(() => {
    try { return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') }; }
    catch { return defaultPrefs; }
  });
  const [prefsSaved, setPrefsSaved] = useState(false);

  const togglePref = (k: keyof typeof prefs) => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const savePrefs = () => {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  };

  /* ── tab definitions ─────────────────────────────────── */
  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: 'profile',    icon: 'fa-user-circle',  label: 'الملف الشخصي' },
    { id: 'reports',    icon: 'fa-chart-pie',    label: 'التقارير'      },
    { id: 'complaints', icon: 'fa-exclamation-circle', label: 'الشكاوي'  },
    { id: 'prefs',      icon: 'fa-sliders-h',    label: 'التفضيلات'    },
  ];

  /* ── render ───────────────────────────────────────────── */
  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">

      {/* Header */}
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">إعدادات الحساب</p>
        <h1 className="text-2xl font-black text-slate-900">الإعدادات</h1>
      </div>

      {/* Tab bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
              tab === t.id
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
            }`}>
            <i className={`fas ${t.icon} text-xs`} /> {t.label}
          </button>
        ))}
      </div>

      {/* ─────────────── TAB: PROFILE ─────────────────────── */}
      {tab === 'profile' && (
        <div className="space-y-5">

          {/* Avatar card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-black text-slate-800 mb-5 flex items-center gap-2">
              <i className="fas fa-camera text-emerald-500" /> صورة الملف الشخصي
            </h2>
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-gray-200 shadow-sm">
                  {avatar
                    ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-emerald-400 bg-emerald-50">
                        {user?.name?.charAt(0) || '?'}
                      </div>}
                </div>
                <button onClick={() => avatarRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                  <i className="fas fa-camera text-white text-lg" />
                </button>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 mb-1">{user?.name}</p>
                <p className="text-sm text-slate-400 mb-3">{user?.email}</p>
                <div className="flex gap-2">
                  <button onClick={() => avatarRef.current?.click()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5">
                    <i className="fas fa-upload text-[10px]" /> رفع صورة
                  </button>
                  {avatar && (
                    <button onClick={() => setAvatar('')}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-xl transition-colors border border-red-100">
                      حذف
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">JPG أو PNG · أقل من 2 ميغابايت</p>
              </div>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Profile info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white">
              <p className="text-slate-400 text-xs font-bold mb-0.5">تعديل الملف الشخصي</p>
              <h2 className="font-black text-lg">المعلومات الشخصية</h2>
            </div>
            <form onSubmit={handleProfileSave} className="p-6 space-y-4">
              <Msg msg={profileMsg} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="الاسم الكامل"       value={profileForm.name}     onChange={v => setP('name', v)}     placeholder="اسمك"               icon="fa-user" />
                <InputField label="البريد الإلكتروني"  value={profileForm.email}    onChange={v => setP('email', v)}    type="email" placeholder="name@example.com" icon="fa-envelope" />
                <InputField label="رقم الهاتف"         value={profileForm.phone}    onChange={v => setP('phone', v)}    placeholder="07XXXXXXXX"          icon="fa-phone" />
                <InputField label="واتساب"             value={profileForm.whatsapp} onChange={v => setP('whatsapp', v)} placeholder="07XXXXXXXX"          icon="fa-whatsapp" />
              </div>
              <button type="submit" disabled={profileSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-60">
                {profileSaving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</>
                  : <><i className="fas fa-save" /> حفظ التغييرات</>}
              </button>
            </form>
          </div>

          {/* Password */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white">
              <p className="text-slate-400 text-xs font-bold mb-0.5">الأمان</p>
              <h2 className="font-black text-lg">تغيير كلمة المرور</h2>
            </div>
            <form onSubmit={handlePasswordSave} className="p-6 space-y-4">
              <Msg msg={pwMsg} />
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">كلمة المرور الحالية</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={pwForm.currentPassword}
                    onChange={e => setPw('currentPassword', e.target.value)} placeholder="••••••••"
                    className="w-full ps-4 pe-11 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm" />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-600 text-sm">
                    <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">كلمة المرور الجديدة</label>
                  <input type={showPw ? 'text' : 'password'} value={pwForm.newPassword}
                    onChange={e => setPw('newPassword', e.target.value)} placeholder="6 أحرف على الأقل"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">تأكيد كلمة المرور</label>
                  <input type={showPw ? 'text' : 'password'} value={pwForm.confirmPassword}
                    onChange={e => setPw('confirmPassword', e.target.value)} placeholder="••••••••"
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 outline-none text-sm ${
                      pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword
                        ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-emerald-100 focus:border-emerald-400'
                    }`} />
                </div>
              </div>
              {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p className="text-xs text-red-500 font-bold flex items-center gap-1.5">
                  <i className="fas fa-times-circle" /> كلمتا المرور غير متطابقتين
                </p>
              )}
              {pwForm.newPassword && pwForm.newPassword === pwForm.confirmPassword && (
                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                  <i className="fas fa-check-circle" /> كلمتا المرور متطابقتان
                </p>
              )}
              <button type="submit" disabled={pwSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60">
                {pwSaving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري التحديث...</>
                  : <><i className="fas fa-lock" /> تحديث كلمة المرور</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────── TAB: REPORTS ─────────────────────── */}
      {tab === 'reports' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold mb-0.5">ملخص الأداء</p>
                <h2 className="font-black text-lg">التقارير والإحصاءات</h2>
              </div>
              <button onClick={downloadCSV} disabled={!repData}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40">
                <i className="fas fa-download" /> تحميل CSV
              </button>
            </div>

            {repLoading ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : repData ? (
              <div className="p-6 space-y-5">
                {/* KPI grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { icon: 'fa-calendar-check', color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'إجمالي الحجوزات',   val: repData.totalBookings.toString() },
                    { icon: 'fa-coins',          color: 'text-amber-500',   bg: 'bg-amber-50',   label: 'إجمالي الإيرادات',  val: `${repData.revenue} د.أ` },
                    { icon: 'fa-star',           color: 'text-yellow-500',  bg: 'bg-yellow-50',  label: 'متوسط التقييم',     val: repData.avgRating.toFixed(1) },
                    { icon: 'fa-comments',       color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'التقييمات',         val: repData.totalReviews.toString() },
                  ].map(k => (
                    <div key={k.label} className={`${k.bg} rounded-2xl p-4 text-center border border-white`}>
                      <i className={`fas ${k.icon} ${k.color} text-xl mb-2`} />
                      <p className="font-black text-slate-800 text-lg">{k.val}</p>
                      <p className="text-xs text-slate-500 font-bold">{k.label}</p>
                    </div>
                  ))}
                </div>

                {/* Export buttons */}
                <div className="border-t border-gray-100 pt-5">
                  <p className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                    <i className="fas fa-file-export text-emerald-500" /> تصدير التقارير
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: 'fa-file-csv',  label: 'تقرير الحجوزات',   sub: 'CSV', color: 'border-emerald-200 hover:bg-emerald-50' },
                      { icon: 'fa-file-pdf',  label: 'تقرير الإيرادات',  sub: 'PDF', color: 'border-blue-200 hover:bg-blue-50'     },
                      { icon: 'fa-file-alt',  label: 'تقرير التقييمات', sub: 'CSV', color: 'border-amber-200 hover:bg-amber-50'    },
                      { icon: 'fa-table',     label: 'جميع البيانات',    sub: 'XLSX', color: 'border-purple-200 hover:bg-purple-50' },
                    ].map(btn => (
                      <button key={btn.label} onClick={downloadCSV}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 ${btn.color} transition-colors text-start`}>
                        <i className={`fas ${btn.icon} text-slate-400 text-lg`} />
                        <div>
                          <p className="text-sm font-bold text-slate-700">{btn.label}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{btn.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <i className="fas fa-chart-pie text-4xl text-gray-200 mb-3" />
                <p className="text-slate-400 font-bold">لا توجد بيانات بعد</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────── TAB: COMPLAINTS ──────────────────── */}
      {tab === 'complaints' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold mb-0.5">التقييمات السلبية</p>
                <h2 className="font-black text-lg">الشكاوي</h2>
              </div>
              {complaints.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
                  {complaints.length}
                </span>
              )}
            </div>

            {compLoading ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : complaints.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check-circle text-emerald-400 text-3xl" />
                </div>
                <h3 className="font-black text-slate-800 mb-1">لا توجد شكاوي</h3>
                <p className="text-sm text-slate-400">جميع التقييمات إيجابية، استمر على هذا المستوى!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {complaints.map(c => (
                  <div key={c.id} className={`p-5 transition-colors ${resolvedIds.has(c.id) ? 'bg-emerald-50/40' : 'bg-white'}`}>
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-500 font-black flex-shrink-0">
                        {c.userName?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                          <div>
                            <span className="font-black text-slate-800 text-sm">{c.userName}</span>
                            <span className="text-slate-400 text-xs ms-2">· {c.fieldName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Stars rating={c.rating} />
                            {resolvedIds.has(c.id) && (
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <i className="fas fa-check" /> تم الحل
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-3 leading-relaxed">{c.comment || 'لا يوجد تعليق'}</p>
                        <p className="text-[11px] text-slate-400 mb-3">
                          {new Date(c.createdAt).toLocaleDateString('ar-JO', { year:'numeric', month:'long', day:'numeric' })}
                        </p>

                        {/* Reply */}
                        {!compReplySent.has(c.id) ? (
                          <div className="flex gap-2">
                            <input
                              value={compReply[c.id] || ''}
                              onChange={e => setCompReply(p => ({ ...p, [c.id]: e.target.value }))}
                              placeholder="اكتب ردك على الشكوى..."
                              className="flex-1 border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 text-xs focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                            />
                            <button onClick={() => sendReply(c.id)}
                              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors flex-shrink-0">
                              <i className="fas fa-paper-plane" />
                            </button>
                            <button onClick={() => toggleResolved(c.id)}
                              className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors flex-shrink-0 ${
                                resolvedIds.has(c.id)
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-700'
                              }`}>
                              <i className="fas fa-check" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                            <i className="fas fa-check-circle" /> تم إرسال ردك
                            <span className="text-slate-500 truncate">— {compReply[c.id]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────── TAB: PREFERENCES ─────────────────── */}
      {tab === 'prefs' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white">
              <p className="text-slate-400 text-xs font-bold mb-0.5">تخصيص التجربة</p>
              <h2 className="font-black text-lg">التفضيلات</h2>
            </div>
            <div className="p-6 space-y-6">

              {/* Notifications */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fas fa-bell text-emerald-500" /> الإشعارات
                </p>
                <div className="space-y-3">
                  {[
                    { key: 'emailNotif',  label: 'إشعارات البريد الإلكتروني', sub: 'استقبل تنبيهات الحجوزات والتقييمات عبر البريد',  icon: 'fa-envelope' },
                    { key: 'smsNotif',    label: 'إشعارات الرسائل النصية',    sub: 'تنبيهات فورية للحجوزات الجديدة عبر SMS',          icon: 'fa-sms'      },
                    { key: 'soundNotif',  label: 'الأصوات',                   sub: 'تشغيل صوت عند وصول حجز جديد',                      icon: 'fa-volume-up' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-start gap-3">
                        <i className={`fas ${item.icon} text-emerald-500 mt-0.5 text-sm w-4 text-center flex-shrink-0`} />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.label}</p>
                          <p className="text-xs text-slate-400">{item.sub}</p>
                        </div>
                      </div>
                      <button onClick={() => togglePref(item.key as keyof typeof prefs)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${
                          prefs[item.key as keyof typeof prefs] ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}>
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 mt-0.5 ${
                          prefs[item.key as keyof typeof prefs] ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0.5 rtl:-translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking settings */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fas fa-cog text-emerald-500" /> إعدادات الحجوزات
                </p>
                <div className="space-y-3">
                  {[
                    { key: 'autoConfirm', label: 'تأكيد الحجوزات تلقائياً', sub: 'يتم تأكيد الحجوزات الجديدة بدون مراجعة يدوية', icon: 'fa-check-circle' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-start gap-3">
                        <i className={`fas ${item.icon} text-emerald-500 mt-0.5 text-sm w-4 text-center flex-shrink-0`} />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.label}</p>
                          <p className="text-xs text-slate-400">{item.sub}</p>
                        </div>
                      </div>
                      <button onClick={() => togglePref(item.key as keyof typeof prefs)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${
                          prefs[item.key as keyof typeof prefs] ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}>
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 mt-0.5 ${
                          prefs[item.key as keyof typeof prefs] ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0.5 rtl:-translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Display */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fas fa-desktop text-emerald-500" /> العرض
                </p>
                <div className="space-y-3">
                  {[
                    { key: 'showRevenue',  label: 'إظهار الإيرادات في لوحة التحكم', sub: 'عرض أرقام الإيرادات على الصفحة الرئيسية', icon: 'fa-chart-line' },
                    { key: 'compactView',  label: 'العرض المضغوط',                  sub: 'تقليص المسافات لعرض أكثر محتوى في الصفحة', icon: 'fa-compress-alt' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-start gap-3">
                        <i className={`fas ${item.icon} text-emerald-500 mt-0.5 text-sm w-4 text-center flex-shrink-0`} />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.label}</p>
                          <p className="text-xs text-slate-400">{item.sub}</p>
                        </div>
                      </div>
                      <button onClick={() => togglePref(item.key as keyof typeof prefs)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${
                          prefs[item.key as keyof typeof prefs] ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}>
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 mt-0.5 ${
                          prefs[item.key as keyof typeof prefs] ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0.5 rtl:-translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={savePrefs}
                className={`w-full py-3 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                  prefsSaved
                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200'
                }`}>
                {prefsSaved
                  ? <><i className="fas fa-check-circle" /> تم الحفظ</>
                  : <><i className="fas fa-save" /> حفظ التفضيلات</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerSettings;
