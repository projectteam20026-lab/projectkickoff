/**
 * PlayerProfilePage — /profile
 * ─────────────────────────────────────────────────────────────────────────
 * تبويب "تعديل المعلومات":
 *   • اسم أول + ثاني + هاتف  → تغيير حر
 *   • اسم المستخدم + البريد  → مرة واحدة كل 7 أيام، مع التحقق من التكرار
 *
 * تبويب "الإحصائيات":
 *   • إحصائيات الحجوزات (مؤكد / انتظار / ملغي)
 *   • بطاقة الفريق (شعار، انتصارات، نقاط)
 *   • إحصائيات المباريات (لُعبت / فاز / تعادل / خسر / أهداف)
 *   • آخر 5 حجوزات
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { Booking, League, Team, Match } from '../types';
import { daysLeft, setLock, LOCK_DAYS } from '../utils/fieldLocks';

type Tab = 'info' | 'stats';

// ── Match stats helpers ────────────────────────────────────────────────────

function calcMatchStats(teamId: string, matches: Match[]) {
  const played = matches.filter(
    m => m.status === 'انتهت' &&
         (m.homeTeamId === teamId || m.awayTeamId === teamId)
  );
  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
  for (const m of played) {
    const hs = m.homeScore ?? 0, as_ = m.awayScore ?? 0;
    const isHome = m.homeTeamId === teamId;
    goalsFor     += isHome ? hs  : as_;
    goalsAgainst += isHome ? as_ : hs;
    if (hs === as_)                               draws++;
    else if ((isHome && hs > as_) || (!isHome && as_ > hs)) wins++;
    else                                          losses++;
  }
  const cleanSheets = played.filter(m => {
    const isHome = m.homeTeamId === teamId;
    return (isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0)) === 0;
  }).length;
  return { played: played.length, wins, draws, losses, goalsFor, goalsAgainst, cleanSheets };
}

/** آخر N نتائج: 'W' | 'D' | 'L' (الأحدث أولاً) */
function lastResults(teamId: string, matches: Match[], n = 5): Array<'W'|'D'|'L'> {
  return matches
    .filter(m => m.status === 'انتهت' && (m.homeTeamId === teamId || m.awayTeamId === teamId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, n)
    .map(m => {
      const hs = m.homeScore ?? 0, as_ = m.awayScore ?? 0;
      const isHome = m.homeTeamId === teamId;
      if (hs === as_) return 'D';
      return ((isHome && hs > as_) || (!isHome && as_ > hs)) ? 'W' : 'L';
    });
}

/** سلسلة انتصارات متتالية حالية */
function winStreak(teamId: string, matches: Match[]): number {
  const sorted = matches
    .filter(m => m.status === 'انتهت' && (m.homeTeamId === teamId || m.awayTeamId === teamId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  for (const m of sorted) {
    const hs = m.homeScore ?? 0, as_ = m.awayScore ?? 0;
    const isHome = m.homeTeamId === teamId;
    const won = (isHome && hs > as_) || (!isHome && as_ > hs);
    if (won) streak++; else break;
  }
  return streak;
}

/** الملعب الأكثر حجزاً */
function favoriteField(bookings: Booking[]): string {
  const cnt: Record<string, number> = {};
  bookings.forEach(b => { cnt[b.fieldName] = (cnt[b.fieldName] || 0) + 1; });
  return Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
}

/** الوقت المفضل (ساعة البداية) */
function favoriteSlot(bookings: Booking[]): string {
  const cnt: Record<string, number> = {};
  bookings.forEach(b => {
    const hour = b.timeSlot?.split('-')[0]?.trim() ?? '';
    if (hour) cnt[hour] = (cnt[hour] || 0) + 1;
  });
  return Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
}

// ── Subcomponents ─────────────────────────────────────────────────────────
const LockBadge: React.FC<{ days: number }> = ({ days }) =>
  days > 0 ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100">
      <i className="fas fa-lock text-[8px]" /> بعد {days} يوم
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
      <i className="fas fa-unlock text-[8px]" /> متاح التغيير
    </span>
  );

// ─────────────────────────────────────────────────────────────────────────

const PlayerProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('info');

  // Data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leagues,  setLeagues]  = useState<League[]>([]);
  const [teams,    setTeams]    = useState<Team[]>([]);
  const [matches,  setMatches]  = useState<Match[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Edit form
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    phone:     user?.phone     || '',
    username:  user?.username  || '',
    email:     user?.email     || '',
  });

  // Save state
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Copy player-ID
  const [copied, setCopied] = useState(false);

  // Avatar file input
  const fileRef = useRef<HTMLInputElement>(null);

  // Lock days (derived)
  const uid = user?.id || '';
  const usernameLock = daysLeft(uid, 'username');
  const emailLock    = daysLeft(uid, 'email');

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    Promise.all([
      backend.getBookings(),
      backend.getLeagues(),
      backend.getAllTeams(),
      backend.getAllMatches(),
    ]).then(([b, l, t, m]) => {
      setBookings(b.filter(bk => bk.userId === user.id || !bk.userId));
      setLeagues(l);
      setTeams(t);
      setMatches(m);
      setLoading(false);
    });
  }, [user?.id]);

  // keep form in sync when user obj changes (e.g. after save)
  useEffect(() => {
    if (!user) return;
    setForm(f => ({
      ...f,
      firstName: user.firstName || f.firstName,
      lastName:  user.lastName  || f.lastName,
      phone:     user.phone     || f.phone,
      username:  user.username  || f.username,
      email:     user.email     || f.email,
    }));
  }, [user?.id]);

  if (!user) return null;

  // ── Derived stats ────────────────────────────────────────────────────────
  const confirmed = bookings.filter(b => b.status === 'مؤكد').length;
  const pending   = bookings.filter(b => b.status === 'قيد الانتظار').length;
  const cancelled = bookings.filter(b => b.status === 'ملغي').length;
  const activeLeagues = leagues.filter(l => l.status !== 'مكتملة').length;

  const myTeam = teams.find(t => t.createdBy === user.id) ?? null;
  const matchStats = myTeam ? calcMatchStats(myTeam.id, matches) : null;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const copyId = () => {
    navigator.clipboard?.writeText(user.playerId!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMsg(null);

    const updates: Record<string, string> = {
      name:      `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
      phone:     form.phone.trim(),
    };

    // إضافة username إذا تغيّر وغير مقفل
    const usernameChanged = form.username.trim() !== user.username;
    if (usernameChanged) {
      if (usernameLock > 0) {
        setSaveMsg({ type: 'err', text: `لا يمكن تغيير اسم المستخدم، تبقى ${usernameLock} يوم` });
        setSaving(false); return;
      }
      if (!form.username.trim()) {
        setSaveMsg({ type: 'err', text: 'اسم المستخدم لا يمكن أن يكون فارغاً' });
        setSaving(false); return;
      }
      updates.username = form.username.trim();
    }

    // إضافة email إذا تغيّر وغير مقفل
    const emailChanged = form.email.trim() !== user.email;
    if (emailChanged) {
      if (emailLock > 0) {
        setSaveMsg({ type: 'err', text: `لا يمكن تغيير البريد، تبقى ${emailLock} يوم` });
        setSaving(false); return;
      }
      if (!form.email.includes('@')) {
        setSaveMsg({ type: 'err', text: 'البريد الإلكتروني غير صحيح' });
        setSaving(false); return;
      }
      updates.email = form.email.trim();
    }

    const result = await backend.updateMeResult(updates);
    setSaving(false);

    if (!result.success) {
      setSaveMsg({ type: 'err', text: result.error || 'حدث خطأ' });
      return;
    }

    // قفل الحقول التي تغيّرت
    if (usernameChanged) setLock(uid, 'username');
    if (emailChanged)    setLock(uid, 'email');

    if (result.user) updateUser(result.user);
    setSaveMsg({ type: 'ok', text: 'تم حفظ التغييرات بنجاح ✓' });
    setTimeout(() => setSaveMsg(null), 3000);
  }, [form, user, uid, usernameLock, emailLock, updateUser]);

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-10" dir="rtl">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#064e3b 0%,#065f46 40%,#0f766e 100%)' }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage:"url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=20')", backgroundSize:'cover' }} />
        <div className="absolute inset-0" style={{ background:'linear-gradient(135deg,rgba(6,78,59,.85),rgba(15,118,110,.7))' }} />
        <div className="absolute -top-16 -end-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute top-8 end-24 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 pt-10 pb-8">
          {/* Avatar + info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 mb-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-3xl border-4 border-white/30 shadow-2xl overflow-hidden bg-white/20">
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white text-4xl font-black">
                      {(user.firstName || user.name || '?').charAt(0)}
                    </div>}
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1.5 -end-1.5 w-7 h-7 bg-emerald-400 hover:bg-emerald-300 border-2 border-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
                title="تغيير الصورة">
                <i className="fas fa-camera text-white text-[10px]" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { updateUser({ avatar: URL.createObjectURL(f) }); }
                }} />
            </div>

            <div className="flex-1 text-center sm:text-start">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="bg-emerald-400/30 border border-emerald-300/40 text-emerald-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <i className="fas fa-running text-[9px]" /> لاعب
                </span>
                {user.playerId && (
                  <button onClick={copyId}
                    className="bg-white/10 border border-white/20 text-emerald-100 text-[11px] font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1.5 hover:bg-white/20 transition-colors"
                    dir="ltr">
                    <i className={`${copied ? 'fas fa-check' : 'fas fa-id-badge'} text-[9px]`} />
                    {copied ? 'تم النسخ!' : user.playerId}
                  </button>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}
              </h1>
              {user.username
                ? <p className="text-emerald-200 text-sm font-bold mt-0.5" dir="ltr">@{user.username}</p>
                : <p className="text-emerald-300 text-xs mt-0.5 opacity-70">{user.email}</p>
              }
            </div>

            <button onClick={() => navigate('/settings')}
              className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold rounded-xl transition-all">
              <i className="fas fa-cog text-sm" /> الإعدادات
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon:'📅', val: loading ? '–' : bookings.length,            label:'الحجوزات'  },
              { icon:'⚽', val: loading ? '–' : (matchStats?.played ?? 0),   label:'مباريات'   },
              { icon:'🏅', val: loading ? '–' : (matchStats?.wins ?? 0),     label:'انتصارات'  },
              { icon:'🏆', val: loading ? '–' : activeLeagues,               label:'بطولات'    },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3 text-center">
                <div className="text-base mb-0.5">{s.icon}</div>
                <div className="text-xl font-black text-white">{s.val}</div>
                <div className="text-[10px] text-emerald-200 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ TABS ══════════════════════════════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex bg-white border-b border-gray-200">
          {([
            { id:'info'  as Tab, label:'تعديل المعلومات', icon:'fa-user-edit' },
            { id:'stats' as Tab, label:'الإحصائيات',       icon:'fa-chart-bar' },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all -mb-px ${
                tab === t.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              <i className={`fas ${t.icon} text-xs`} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-5">

        {/* ══ تعديل المعلومات ══════════════════════════════════════════════════ */}
        {tab === 'info' && (
          <div className="space-y-5">

            {/* Player ID */}
            {user.playerId && (
              <div className="rounded-2xl overflow-hidden shadow-sm"
                style={{ background:'linear-gradient(135deg,#059669,#0d9488)' }}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-id-card text-white text-xl" />
                  </div>
                  <div className="flex-1">
                    <p className="text-emerald-100 text-xs font-bold">رقم اللاعب</p>
                    <p className="text-white text-2xl font-black tracking-widest mt-0.5" dir="ltr">{user.playerId}</p>
                    <p className="text-emerald-200 text-[11px]">استخدمه للانضمام للفرق والبطولات</p>
                  </div>
                  <button onClick={copyId}
                    className="flex flex-col items-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all text-white">
                    <i className={`${copied ? 'fas fa-check-circle text-emerald-300' : 'far fa-copy'} text-base`} />
                    <span className="text-[10px] font-bold">{copied ? 'تم!' : 'نسخ'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Edit form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-gray-50">
                <h2 className="font-black text-slate-900 flex items-center gap-2">
                  <i className="fas fa-user-edit text-emerald-500 text-sm" /> المعلومات الشخصية
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  اسم المستخدم والبريد يمكن تغييرهما مرة واحدة كل {LOCK_DAYS} أيام
                </p>
              </div>

              <div className="p-5 space-y-4">

                {/* First + Last name */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label:'الاسم الأول', key:'firstName', placeholder:'محمد' },
                    { label:'اسم العائلة', key:'lastName',  placeholder:'الخالدي' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{f.label}</label>
                      <input type="text"
                        value={(form as any)[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all" />
                    </div>
                  ))}
                </div>

                {/* Username — قابل للتغيير مع قفل */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-600">اسم المستخدم</label>
                    <LockBadge days={usernameLock} />
                  </div>
                  <div className="relative">
                    <input type="text"
                      value={form.username}
                      onChange={e => setForm(p => ({ ...p, username: e.target.value.replace(/\s/g,'') }))}
                      readOnly={usernameLock > 0}
                      dir="ltr"
                      placeholder="my_username"
                      className={`w-full ps-10 pe-4 py-2.5 border rounded-xl outline-none text-sm transition-all ${
                        usernameLock > 0
                          ? 'bg-gray-50 border-gray-100 text-slate-400 cursor-not-allowed'
                          : 'bg-gray-50 border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
                      }`} />
                    <i className="fas fa-at absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  </div>
                  {usernameLock > 0 && (
                    <p className="text-[11px] text-amber-500 mt-1 flex items-center gap-1">
                      <i className="fas fa-info-circle text-[10px]" />
                      تم تغييره مؤخراً، متاح التغيير بعد {usernameLock} {usernameLock === 1 ? 'يوم' : 'أيام'}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">رقم الهاتف</label>
                  <div className="relative">
                    <input type="tel" value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="07XXXXXXXX" dir="ltr"
                      className="w-full ps-10 pe-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all" />
                    <i className="fas fa-phone absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  </div>
                </div>

                {/* Email — قابل للتغيير مع قفل */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-600">البريد الإلكتروني</label>
                    <LockBadge days={emailLock} />
                  </div>
                  <div className="relative">
                    <input type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      readOnly={emailLock > 0}
                      dir="ltr"
                      placeholder="example@email.com"
                      className={`w-full ps-10 pe-4 py-2.5 border rounded-xl outline-none text-sm transition-all ${
                        emailLock > 0
                          ? 'bg-gray-50 border-gray-100 text-slate-400 cursor-not-allowed'
                          : 'bg-gray-50 border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
                      }`} />
                    <i className="fas fa-envelope absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  </div>
                  {emailLock > 0 && (
                    <p className="text-[11px] text-amber-500 mt-1 flex items-center gap-1">
                      <i className="fas fa-info-circle text-[10px]" />
                      تم تغييره مؤخراً، متاح التغيير بعد {emailLock} {emailLock === 1 ? 'يوم' : 'أيام'}
                    </p>
                  )}
                </div>

                {/* Feedback */}
                {saveMsg && (
                  <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold border ${
                    saveMsg.type === 'ok'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    <i className={`fas ${saveMsg.type === 'ok' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
                    {saveMsg.text}
                  </div>
                )}

                {/* Save */}
                <button onClick={handleSave} disabled={saving}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 shadow-emerald-200 disabled:opacity-70 disabled:translate-y-0">
                  {saving
                    ? <><i className="fas fa-circle-notch fa-spin" /> جاري الحفظ...</>
                    : <><i className="fas fa-save" /> حفظ التغييرات</>}
                </button>
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon:'fa-calendar-check', label:'حجوزاتي الحالية', sub:'الحجوزات النشطة',      path:'/bookings/current', bg:'bg-blue-50   text-blue-600'   },
                { icon:'fa-tasks',          label:'تأكيد / إلغاء',   sub:'أدر حجوزاتك المعلّقة', path:'/bookings/manage',  bg:'bg-amber-50  text-amber-600'  },
                { icon:'fa-users',          label:'فريقي',            sub:'الفريق والبطولات',      path:'/teams',           bg:'bg-emerald-50 text-emerald-600'},
                { icon:'fa-trophy',         label:'البطولات',         sub:'استعرض البطولات',        path:'/leagues',         bg:'bg-purple-50 text-purple-600' },
              ].map(item => (
                <Link key={item.path} to={item.path}
                  className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                    <i className={`fas ${item.icon} text-sm`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.label}</p>
                    <p className="text-[11px] text-slate-400">{item.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ══ الإحصائيات ════════════════════════════════════════════════════════ */}
        {tab === 'stats' && (() => {
          // ── احسب كل شيء هنا ─────────────────────────────────────────────
          const totalSpent    = bookings.reduce((s, b) => s + (b.price || 0), 0);
          const avgPrice      = bookings.length ? Math.round(totalSpent / bookings.length) : 0;
          const favField      = favoriteField(bookings);
          const favSlot       = favoriteSlot(bookings);
          const participatedLeagues = leagues.filter(l => myTeam && l.registeredTeams?.includes(myTeam.id));
          const completedLeagues    = participatedLeagues.filter(l => l.status === 'مكتملة');
          const streak        = myTeam ? winStreak(myTeam.id, matches) : 0;
          const last5         = myTeam ? lastResults(myTeam.id, matches, 5) : [];
          const goalDiff      = matchStats ? matchStats.goalsFor - matchStats.goalsAgainst : 0;

          // ── الإنجازات ──────────────────────────────────────────────────
          const BADGES = [
            { icon:'🎯', label:'أول خطوة',       desc:'أجريت أول حجز',         ok: bookings.length >= 1            },
            { icon:'📅', label:'لاعب منتظم',     desc:'5 حجوزات أو أكثر',      ok: bookings.length >= 5            },
            { icon:'💰', label:'مستثمر الرياضة', desc:'أنفقت 100 د.أ أو أكثر', ok: totalSpent >= 100               },
            { icon:'⚽', label:'لاعب ميدان',     desc:'لعبت 3 مباريات',         ok: (matchStats?.played ?? 0) >= 3  },
            { icon:'🏆', label:'بطل الملعب',     desc:'3 انتصارات أو أكثر',     ok: (matchStats?.wins ?? 0) >= 3    },
            { icon:'🔥', label:'سلسلة نارية',    desc:'3 انتصارات متتالية',     ok: streak >= 3                     },
            { icon:'🧤', label:'قلعة الدفاع',    desc:'حارست مرمى نظيف مرتين', ok: (matchStats?.cleanSheets ?? 0) >= 2 },
            { icon:'👥', label:'لاعب فريق',      desc:'لديك فريق مسجّل',        ok: !!myTeam                        },
            { icon:'🎖️', label:'مشارك بطولة',   desc:'شاركت في بطولة',         ok: participatedLeagues.length >= 1 },
            { icon:'🥅', label:'القناص',         desc:'سجّلت 5 أهداف أو أكثر', ok: (matchStats?.goalsFor ?? 0) >= 5 },
          ];
          const earned   = BADGES.filter(b => b.ok);
          const unearned = BADGES.filter(b => !b.ok).slice(0, 4);

          return (
            <div className="space-y-5">

              {/* ── 1. ملخص سريع (6 كروت) ──────────────────────────────── */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon:'📅', val:bookings.length,             label:'إجمالي الحجوزات', c:'from-blue-50 to-indigo-50 border-blue-100 text-blue-700'      },
                  { icon:'✅', val:confirmed,                    label:'حجوزات مؤكدة',    c:'from-emerald-50 to-teal-50 border-emerald-100 text-emerald-700'},
                  { icon:'💰', val:`${totalSpent} د.أ`,         label:'إجمالي المدفوع',   c:'from-violet-50 to-purple-50 border-violet-100 text-violet-700' },
                  { icon:'⚽', val:matchStats?.played ?? 0,      label:'مباريات لُعبت',   c:'from-orange-50 to-amber-50 border-orange-100 text-orange-700'  },
                  { icon:'🏆', val:participatedLeagues.length,   label:'بطولات شاركت',   c:'from-amber-50 to-yellow-50 border-amber-100 text-amber-700'    },
                  { icon:'🎖️', val:earned.length,               label:'إنجازات محققة',   c:'from-rose-50 to-pink-50 border-rose-100 text-rose-700'         },
                ].map((s, i) => (
                  <div key={i} className={`bg-gradient-to-br ${s.c} border rounded-2xl p-3.5 shadow-sm`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xl">{s.icon}</span>
                      <span className="text-xl font-black">{loading ? '–' : s.val}</span>
                    </div>
                    <p className="text-xs font-bold leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* ── 2. نشاط الحجوزات ────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50">
                  <h2 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                    <i className="fas fa-calendar-alt text-blue-500" /> نشاط الحجوزات
                  </h2>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  {[
                    { icon:'fa-trophy',    label:'الملعب المفضل',   val:favField, color:'text-amber-600 bg-amber-50'    },
                    { icon:'fa-clock',     label:'الوقت المفضل',    val:favSlot,  color:'text-blue-600 bg-blue-50'      },
                    { icon:'fa-coins',     label:'متوسط السعر',     val:`${avgPrice} د.أ`, color:'text-violet-600 bg-violet-50'},
                    { icon:'fa-times-circle', label:'ملغاة',         val:cancelled, color:'text-red-500 bg-red-50'       },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                        <i className={`fas ${item.icon} text-sm`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-bold">{item.label}</p>
                        <p className="text-sm font-black text-slate-800 truncate">{loading ? '–' : item.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Progress bars */}
                <div className="px-5 pb-5 space-y-2.5">
                  {[
                    { label:'مؤكدة',        val:confirmed, bar:'bg-emerald-500', txt:'text-emerald-700' },
                    { label:'قيد الانتظار', val:pending,   bar:'bg-amber-400',   txt:'text-amber-700'   },
                    { label:'ملغاة',         val:cancelled, bar:'bg-red-400',     txt:'text-red-600'     },
                  ].map((row, i) => {
                    const pct = bookings.length > 0 ? Math.round(row.val / bookings.length * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-600">{row.label}</span>
                          <span className={`text-xs font-black ${row.txt}`}>{row.val} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${row.bar} rounded-full transition-all duration-700`} style={{ width:`${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 3. بطاقة الفريق ──────────────────────────────────────── */}
              {myTeam ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                      <i className="fas fa-shield-alt text-emerald-500" /> فريقي — {myTeam.name}
                    </h2>
                    <Link to="/teams" className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      التفاصيل <i className="fas fa-arrow-left text-[10px]" />
                    </Link>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-emerald-200 rounded-2xl flex items-center justify-center text-4xl shadow-sm">
                        {myTeam.logo || '⚽'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-slate-900">{myTeam.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                            ⭐ {myTeam.points} نقطة
                          </span>
                          {(myTeam.players?.length ?? 0) > 0 && (
                            <span className="text-xs font-bold text-slate-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                              👥 {myTeam.players!.length} لاعب
                            </span>
                          )}
                          {streak >= 2 && (
                            <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                              🔥 {streak} انتصارات متتالية
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* W/D/L + goals */}
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {[
                        { val:myTeam.wins,   label:'فاز',   bg:'bg-emerald-50 border-emerald-200', txt:'text-emerald-700' },
                        { val:myTeam.draws,  label:'تعادل', bg:'bg-amber-50 border-amber-200',     txt:'text-amber-700'   },
                        { val:myTeam.losses, label:'خسر',   bg:'bg-red-50 border-red-200',         txt:'text-red-600'     },
                        { val:matchStats?.goalsFor ?? 0,     label:'أهداف',   bg:'bg-blue-50 border-blue-200',   txt:'text-blue-700'  },
                        { val:goalDiff >= 0 ? `+${goalDiff}` : goalDiff, label:'فارق',  bg:'bg-slate-50 border-slate-200', txt: goalDiff >= 0 ? 'text-emerald-700' : 'text-red-600' },
                      ].map((s, i) => (
                        <div key={i} className={`${s.bg} border rounded-xl py-2.5`}>
                          <p className={`text-lg font-black ${s.txt}`}>{s.val}</p>
                          <p className={`text-[10px] font-bold ${s.txt} opacity-70`}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Last 5 matches */}
                    {last5.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 mb-2">آخر {last5.length} مباريات</p>
                        <div className="flex gap-2">
                          {last5.map((r, i) => (
                            <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white ${
                              r === 'W' ? 'bg-emerald-500' : r === 'D' ? 'bg-amber-400' : 'bg-red-400'
                            }`}>
                              {r === 'W' ? 'ف' : r === 'D' ? 'ت' : 'خ'}
                            </div>
                          ))}
                          {[...Array(5 - last5.length)].map((_, i) => (
                            <div key={i} className="w-8 h-8 rounded-lg bg-gray-100" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Win rate bar */}
                    {(myTeam.wins + myTeam.draws + myTeam.losses) > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-500">توزيع النتائج</span>
                          <span className="text-xs font-black text-emerald-600">
                            {Math.round(myTeam.wins / (myTeam.wins + myTeam.draws + myTeam.losses) * 100)}% فوز
                          </span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden flex">
                          {myTeam.wins > 0   && <div className="bg-emerald-500 transition-all" style={{ width:`${myTeam.wins  /(myTeam.wins+myTeam.draws+myTeam.losses)*100}%` }} />}
                          {myTeam.draws > 0  && <div className="bg-amber-400  transition-all" style={{ width:`${myTeam.draws /(myTeam.wins+myTeam.draws+myTeam.losses)*100}%` }} />}
                          {myTeam.losses > 0 && <div className="bg-red-400    transition-all" style={{ width:`${myTeam.losses/(myTeam.wins+myTeam.draws+myTeam.losses)*100}%` }} />}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                  <div className="text-5xl mb-3">👥</div>
                  <p className="font-black text-slate-700 mb-1">لم تنضم لفريق بعد</p>
                  <Link to="/teams" className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors">
                    <i className="fas fa-users text-xs" /> استعرض الفرق
                  </Link>
                </div>
              )}

              {/* ── 4. إحصائيات المباريات (تفصيلية) ────────────────────── */}
              {matchStats && matchStats.played > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-50">
                    <h2 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                      <i className="fas fa-futbol text-orange-500" /> إحصائيات المباريات
                    </h2>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Goals grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon:'fa-arrow-circle-up',    label:'أهداف سجّل',  val:matchStats.goalsFor,      c:'bg-emerald-50 border-emerald-100 text-emerald-700' },
                        { icon:'fa-arrow-circle-down',  label:'أهداف استقبل',val:matchStats.goalsAgainst,  c:'bg-red-50 border-red-100 text-red-600'             },
                        { icon:'fa-shield-alt',         label:'مرمى نظيف',   val:matchStats.cleanSheets,   c:'bg-blue-50 border-blue-100 text-blue-700'          },
                      ].map((g, i) => (
                        <div key={i} className={`border rounded-2xl p-3 text-center ${g.c}`}>
                          <i className={`fas ${g.icon} text-lg mb-1.5 block`} />
                          <p className="text-2xl font-black">{g.val}</p>
                          <p className="text-[10px] font-bold opacity-70 mt-0.5">{g.label}</p>
                        </div>
                      ))}
                    </div>
                    {/* Result bar */}
                    <div>
                      <p className="text-xs font-bold text-slate-500 mb-2">توزيع نتائج المباريات</p>
                      <div className="h-3 rounded-full overflow-hidden flex">
                        {matchStats.wins   > 0 && <div className="bg-emerald-500 rounded-s-full" style={{ width:`${matchStats.wins  /matchStats.played*100}%` }} />}
                        {matchStats.draws  > 0 && <div className="bg-amber-400"                   style={{ width:`${matchStats.draws /matchStats.played*100}%` }} />}
                        {matchStats.losses > 0 && <div className="bg-red-400 rounded-e-full"      style={{ width:`${matchStats.losses/matchStats.played*100}%` }} />}
                      </div>
                      <div className="flex justify-between mt-1.5 text-[10px] font-bold">
                        <span className="text-emerald-600">فوز {Math.round(matchStats.wins/matchStats.played*100)}%</span>
                        <span className="text-amber-500">تعادل {Math.round(matchStats.draws/matchStats.played*100)}%</span>
                        <span className="text-red-400">خسارة {Math.round(matchStats.losses/matchStats.played*100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 5. البطولات ──────────────────────────────────────────── */}
              {participatedLeagues.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-50">
                    <h2 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                      <i className="fas fa-trophy text-amber-500" /> البطولات
                    </h2>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { val:participatedLeagues.length, label:'شاركت',  c:'bg-amber-50 text-amber-700 border-amber-100'   },
                        { val:activeLeagues,              label:'نشطة',    c:'bg-emerald-50 text-emerald-700 border-emerald-100'},
                        { val:completedLeagues.length,    label:'منتهية',  c:'bg-slate-50 text-slate-700 border-slate-100'   },
                      ].map((s, i) => (
                        <div key={i} className={`${s.c} border rounded-2xl py-3`}>
                          <p className="text-2xl font-black">{s.val}</p>
                          <p className="text-xs font-bold opacity-70 mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {participatedLeagues.slice(0,3).map(l => (
                        <div key={l.id} className="flex items-center gap-3 py-2">
                          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-trophy text-amber-500 text-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{l.name}</p>
                            <p className="text-[11px] text-slate-400">{l.sport} · {l.prizePool}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            l.status === 'جارية'       ? 'bg-emerald-100 text-emerald-700' :
                            l.status === 'التسجيل متاح'? 'bg-blue-100 text-blue-700'       :
                                                         'bg-gray-100 text-gray-500'
                          }`}>{l.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── 6. الإنجازات ─────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                    <i className="fas fa-medal text-rose-500" /> الإنجازات
                  </h2>
                  <span className="text-xs font-bold text-slate-400">{earned.length}/{BADGES.length} محققة</span>
                </div>
                <div className="p-5 space-y-4">
                  {/* Earned badges */}
                  {earned.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1.5">
                        <i className="fas fa-check-circle text-[11px]" /> محقق ({earned.length})
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {earned.map((b, i) => (
                          <div key={i} className="flex items-center gap-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-3">
                            <span className="text-2xl flex-shrink-0">{b.icon}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-emerald-800 truncate">{b.label}</p>
                              <p className="text-[10px] text-emerald-600 truncate">{b.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Upcoming badges */}
                  {unearned.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                        <i className="fas fa-lock text-[11px]" /> قادمة ({BADGES.filter(b => !b.ok).length})
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {unearned.map((b, i) => (
                          <div key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3 opacity-60">
                            <span className="text-2xl flex-shrink-0 grayscale">{b.icon}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-600 truncate">{b.label}</p>
                              <p className="text-[10px] text-slate-400 truncate">{b.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 7. آخر الحجوزات ─────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                    <i className="fas fa-history text-slate-500" /> آخر الحجوزات
                  </h2>
                  <Link to="/bookings/history" className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    الكل <i className="fas fa-arrow-left text-[10px]" />
                  </Link>
                </div>
                {bookings.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-slate-400 font-bold text-sm">لا توجد حجوزات بعد</p>
                    <Link to="/explore" className="inline-flex items-center gap-1.5 mt-3 text-emerald-600 text-sm font-bold">
                      <i className="fas fa-search text-xs" /> ابحث عن ملعب
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {bookings.slice(0,5).map(b => (
                      <div key={b.id} className="flex items-center gap-3 px-5 py-3.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          b.status==='مؤكد' ? 'bg-emerald-500' : b.status==='قيد الانتظار' ? 'bg-amber-400' : 'bg-red-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{b.fieldName}</p>
                          <p className="text-[11px] text-slate-400">{b.date} · {b.timeSlot}</p>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                          b.status==='مؤكد'         ? 'bg-emerald-100 text-emerald-700' :
                          b.status==='قيد الانتظار' ? 'bg-amber-100   text-amber-700'   :
                                                      'bg-red-100     text-red-600'
                        }`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default PlayerProfilePage;
