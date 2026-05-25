import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { Field, Booking, League, Notification } from '../types';

type Tab = 'home' | 'bookings' | 'tournaments' | 'profile';
type ProfileSub = 'info' | 'notifications' | 'settings';

const PlayerDashboard: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]       = useState<Tab>('home');
  const [pSub, setPSub]     = useState<ProfileSub>('info');
  const [fields, setFields] = useState<Field[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leagues, setLeagues]   = useState<League[]>([]);
  const [notifs, setNotifs]     = useState<Notification[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });

  useEffect(() => {
    Promise.all([
      backend.getFields(), backend.getBookings(),
      backend.getLeagues(), backend.getNotifications(),
    ]).then(([f, b, l, n]) => {
      setFields(f);
      setBookings(b.filter(bk => bk.userId === user?.id));
      setLeagues(l);
      setNotifs(n.filter(nt => !nt.userId || nt.userId === user?.id));
      setLoading(false);
    });
  }, [user?.id]);

  if (!user) return null;

  const unread    = notifs.filter(n => !n.read).length;
  const confirmed = bookings.filter(b => b.status === 'مؤكد').length;
  const upcoming  = leagues.filter(l => l.status !== 'مكتملة').length;
  const filtered  = fields.filter(f =>
    !search || f.name.includes(search) || f.location.includes(search));

  const handleCancel = async (id: string) => {
    if (!window.confirm('إلغاء هذا الحجز؟')) return;
    await backend.cancelBooking(id);
    setBookings((await backend.getBookings()).filter(bk => bk.userId === user.id));
  };
  const handleMarkRead = async () => {
    const u = await backend.markNotificationsRead();
    setNotifs(u.filter(n => !n.userId || n.userId === user.id));
  };

  const TABS: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: 'home',        icon: 'fa-home',          label: 'الرئيسية' },
    { id: 'bookings',    icon: 'fa-calendar-check', label: 'حجوزاتي',
      badge: bookings.filter(b => b.status === 'قيد الانتظار').length || undefined },
    { id: 'tournaments', icon: 'fa-trophy',         label: 'البطولات',
      badge: upcoming || undefined },
    { id: 'profile',     icon: 'fa-user',           label: 'حسابي',
      badge: unread || undefined },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans" dir="rtl">

      {/* ══ TOP NAV BAR ══════════════════════════════════════════════════ */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
              <i className="fas fa-futbol text-white text-sm" />
            </div>
            <span className="font-black text-slate-900 text-lg tracking-tight">كيك أوف</span>
          </div>
          <Link to="/"
            className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors">
            <i className="fas fa-home text-xs" /> الصفحة الرئيسية
          </Link>
        </div>
      </header>

      {/* ══ EMERALD HERO ═════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=40')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/70 to-teal-800/80" />
        {/* Decorative circles */}
        <div className="absolute -top-10 -start-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute top-4 end-8 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-7">
          {/* User row */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl border-2 border-white/30 shadow-lg overflow-hidden bg-white/20 flex-shrink-0">
              {user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white text-xl font-black">{user.name.charAt(0)}</div>}
            </div>
            <div className="flex-1">
              <p className="text-emerald-100 text-sm font-bold mb-0.5">أهلاً بك 👋</p>
              <h1 className="text-2xl font-black text-white leading-tight">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-white/20 border border-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <i className="fas fa-running text-[9px]" /> لاعب
                </span>
                {user.playerId && (
                  <span className="inline-flex items-center gap-1 bg-white/10 border border-white/15 text-emerald-100 text-[11px] font-mono px-2.5 py-0.5 rounded-full" dir="ltr">
                    <i className="fas fa-id-badge text-[8px]" /> {user.playerId}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => { setTab('profile'); setPSub('notifications'); }}
              className="relative w-10 h-10 bg-white/20 hover:bg-white/30 border border-white/25 rounded-xl flex items-center justify-center text-white transition-all flex-shrink-0">
              <i className="far fa-bell" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{unread}</span>
              )}
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { val: bookings.length, label: 'الحجوزات', icon: '📅' },
              { val: confirmed,       label: 'مؤكدة',    icon: '✅' },
              { val: upcoming,        label: 'بطولات',   icon: '🏆' },
              { val: unread,          label: 'إشعارات',  icon: '🔔' },
            ].map((s, i) => (
              <div key={i} className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center">
                <div className="text-base mb-1">{s.icon}</div>
                <div className="text-xl font-black text-white">{s.val}</div>
                <div className="text-[10px] text-emerald-100 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ TABS ═════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                tab === t.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}>
              <i className={`fas ${t.icon} text-xs`} />
              {t.label}
              {!!t.badge && (
                <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ── HOME ──────────────────────────────────────────────────────── */}
        {tab === 'home' && (
          <div className="space-y-8">
            {/* Quick actions */}
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-4">ماذا تريد أن تفعل؟</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { emoji:'🔍', label:'ابحث عن ملعب', sub:'احجز الآن',      action:()=>navigate('/explore'),  bg:'from-emerald-50 to-teal-50   border-emerald-200' },
                  { emoji:'🏆', label:'البطولات',      sub:'سجّل فريقك',     action:()=>setTab('tournaments'), bg:'from-amber-50  to-orange-50   border-amber-200'  },
                  { emoji:'📅', label:'حجوزاتي',      sub:'تابع حجوزاتك',   action:()=>setTab('bookings'),    bg:'from-blue-50   to-indigo-50   border-blue-200'   },
                  { emoji:'👤', label:'حسابي',         sub:'إعدادات الملف',  action:()=>setTab('profile'),     bg:'from-slate-50  to-gray-100    border-slate-200'  },
                ].map((a, i) => (
                  <button key={i} onClick={a.action}
                    className={`bg-gradient-to-br ${a.bg} border rounded-2xl p-4 text-start hover:shadow-md transition-all hover:-translate-y-0.5 group`}>
                    <span className="text-2xl group-hover:scale-110 transition-transform inline-block mb-2">{a.emoji}</span>
                    <p className="font-black text-slate-800 text-sm">{a.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Fields */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-emerald-500 text-xs font-bold block mb-0.5">متاحة الآن</span>
                  <h2 className="text-lg font-black text-slate-900">الملاعب القريبة</h2>
                </div>
                <button onClick={() => navigate('/explore')}
                  className="text-emerald-600 font-bold text-sm hover:text-emerald-700 flex items-center gap-1.5">
                  <i className="fas fa-arrow-right text-xs" /> عرض الكل
                </button>
              </div>
              <div className="relative mb-4">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث باسم الملعب أو الموقع..." dir="rtl"
                  className="w-full py-3 ps-4 pe-10 bg-white border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm shadow-sm" />
                <i className="fas fa-search absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              </div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-64" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.slice(0, 6).map(f => (
                    <div key={f.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5">
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={f.images?.[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=70'}
                          alt={f.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute top-2.5 start-2.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-[11px] font-bold text-white flex items-center gap-1">
                          <i className="fas fa-star text-yellow-400 text-[9px]" />{f.rating}
                        </div>
                        <div className="absolute top-2.5 end-2.5 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[11px] font-bold">{f.type}</div>
                        <div className="absolute bottom-3 start-3 end-3">
                          <h3 className="font-black text-white text-sm truncate">{f.name}</h3>
                          <p className="text-white/70 text-[11px] flex items-center gap-1 mt-0.5 truncate">
                            <i className="fas fa-map-marker-alt text-emerald-400" />{f.location}
                          </p>
                        </div>
                      </div>
                      <div className="p-3.5 flex items-center justify-between">
                        <span className="text-slate-900 font-black">
                          {f.pricePerHour}
                          <span className="text-emerald-600 text-sm font-bold"> د.أ</span>
                          <span className="text-xs text-slate-400 font-medium">/ساعة</span>
                        </span>
                        <button onClick={() => navigate('/explore')}
                          className="px-4 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors">
                          احجز الآن
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BOOKINGS ──────────────────────────────────────────────────── */}
        {tab === 'bookings' && (
          <div className="space-y-5">
            <div>
              <span className="text-emerald-500 text-xs font-bold block mb-0.5">سجل حجوزاتك</span>
              <h2 className="text-xl font-black text-slate-900">حجوزاتي</h2>
            </div>
            {bookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
                <div className="text-5xl mb-3">📅</div>
                <p className="font-black text-slate-700 mb-1 text-lg">لا توجد حجوزات بعد</p>
                <p className="text-slate-400 text-sm mb-6">ابحث عن ملعب وابدأ رحلتك الرياضية!</p>
                <button onClick={() => navigate('/explore')}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-sm hover:-translate-y-0.5">
                  استكشف الملاعب
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b.id}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-emerald-100 shadow-sm p-4 flex items-center gap-4 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl flex-shrink-0">📅</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-900 truncate text-sm">{b.fieldName}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{b.date} · {b.timeSlot}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        b.status==='مؤكد'      ? 'bg-emerald-100 text-emerald-700' :
                        b.status==='ملغي'      ? 'bg-red-100    text-red-600'     :
                                                  'bg-amber-100  text-amber-700'
                      }`}>{b.status}</span>
                      <span className="font-black text-slate-900 text-sm">
                        {b.price}<span className="text-emerald-600 text-xs font-bold"> د.أ</span>
                      </span>
                      {b.status !== 'ملغي' && (
                        <button onClick={() => handleCancel(b.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <i className="fas fa-times text-xs" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TOURNAMENTS ───────────────────────────────────────────────── */}
        {tab === 'tournaments' && (
          <div className="space-y-5">
            <div>
              <span className="text-emerald-500 text-xs font-bold block mb-0.5">المشاركة مفتوحة</span>
              <h2 className="text-xl font-black text-slate-900">البطولات النشطة</h2>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-48" />)}
              </div>
            ) : leagues.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
                <div className="text-5xl mb-3">🏆</div>
                <p className="text-slate-400 font-bold">لا توجد بطولات نشطة حالياً</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leagues.map(l => (
                  <div key={l.id}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 relative overflow-hidden">
                      <div className="absolute -top-8 -end-8 w-28 h-28 bg-emerald-500/10 rounded-full" />
                      <div className="flex justify-between items-start relative">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          l.status==='جارية'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/20   text-blue-400   border border-blue-500/30'
                        }`}>{l.status==='جارية'?'🟢 فعالة':'🔵 قادمة'}</span>
                        <i className="fas fa-trophy text-emerald-400/40 text-2xl" />
                      </div>
                      <h3 className="text-white font-black text-lg mt-3">{l.name}</h3>
                      <p className="text-slate-400 text-xs mt-1">
                        {new Date(l.startDate).toLocaleDateString('ar-JO',{year:'numeric',month:'long',day:'numeric'})}
                      </p>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-around pb-3 mb-3 border-b border-gray-50">
                        <div className="text-center"><span className="text-xl font-black text-slate-900">{l.teamsCount}/{l.maxTeams}</span><p className="text-[11px] text-slate-400 mt-0.5">الفرق</p></div>
                        <div className="text-center"><span className="text-xl font-black text-emerald-600">{l.prizePool}</span><p className="text-[11px] text-slate-400 mt-0.5">الجائزة</p></div>
                        <div className="text-center"><span className="text-xl font-black text-slate-900">{l.sport}</span><p className="text-[11px] text-slate-400 mt-0.5">الرياضة</p></div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-full transition-all"
                          style={{ width:`${Math.min((l.teamsCount/l.maxTeams)*100,100)}%` }} />
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{l.maxTeams - l.teamsCount} مقعد متبقٍ</p>
                      <button onClick={() => navigate('/leagues')}
                        className="w-full py-2.5 bg-slate-900 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors">
                        سجّل فريقك
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE ───────────────────────────────────────────────────── */}
        {tab === 'profile' && (
          <div className="space-y-5">
            {/* Profile hero */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl border-2 border-white/30 overflow-hidden bg-white/20 flex-shrink-0">
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white text-2xl font-black">{user.name.charAt(0)}</div>}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-black text-white">{user.name}</h2>
                <p className="text-emerald-100 text-sm">{user.email}</p>
                <span className="inline-flex items-center gap-1 mt-1.5 bg-white/20 border border-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <i className="fas fa-running text-[9px]" /> لاعب
                </span>
              </div>
              <button onClick={logout}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 border border-white/20 text-white text-xs font-bold rounded-xl transition-all">
                <i className="fas fa-sign-out-alt text-xs" /> خروج
              </button>
            </div>

            {/* Sub tabs */}
            <div className="flex gap-1 border-b border-gray-100">
              {([
                { id:'info'          as ProfileSub, label:'المعلومات', icon:'fa-user'            },
                { id:'notifications' as ProfileSub, label:'الإشعارات', icon:'fa-bell', badge:unread },
                { id:'settings'      as ProfileSub, label:'الإعدادات', icon:'fa-cog'             },
              ]).map(pt => (
                <button key={pt.id} onClick={() => setPSub(pt.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${
                    pSub===pt.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  <i className={`fas ${pt.icon} text-xs`} />
                  {pt.label}
                  {!!(pt as any).badge && (
                    <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{(pt as any).badge}</span>
                  )}
                </button>
              ))}
            </div>

            {pSub === 'info' && (
              <div className="space-y-4">
                {/* Player ID badge */}
                {user.playerId && (
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-id-badge text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-emerald-100 text-xs font-bold">رقم اللاعب</p>
                      <p className="text-white text-xl font-black tracking-widest" dir="ltr">{user.playerId}</p>
                    </div>
                    <button
                      onClick={() => navigator.clipboard?.writeText(user.playerId!)}
                      title="نسخ"
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-all">
                      <i className="far fa-copy text-sm" />
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                  {/* Username (read-only display) */}
                  {user.username && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم المستخدم</label>
                      <div className="relative">
                        <input value={`@${user.username}`} readOnly dir="ltr"
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-500 cursor-not-allowed font-mono" />
                        <i className="fas fa-at absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      </div>
                    </div>
                  )}
                  {[
                    { label:'الاسم الكامل', key:'name',  type:'text', icon:'fa-user'  },
                    { label:'رقم الهاتف',   key:'phone', type:'tel',  icon:'fa-phone' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">{f.label}</label>
                      <div className="relative">
                        <input type={f.type} value={(form as any)[f.key]}
                          onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full ps-11 pe-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm" />
                        <i className={`fas ${f.icon} absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm`} />
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
                    <input value={user.email} readOnly
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-400 cursor-not-allowed" />
                  </div>
                  <button onClick={() => updateUser({ name: form.name, phone: form.phone })}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5">
                    <i className="fas fa-save me-2" /> حفظ التغييرات
                  </button>
                </div>
              </div>
            )}

            {pSub === 'notifications' && (
              <div className="space-y-3">
                {unread > 0 && (
                  <div className="flex justify-end">
                    <button onClick={handleMarkRead}
                      className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 hover:text-emerald-700">
                      <i className="fas fa-check-double text-xs" /> تحديد الكل كمقروء
                    </button>
                  </div>
                )}
                {notifs.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                    <div className="text-5xl mb-3">🔔</div>
                    <p className="text-slate-400 font-bold">لا توجد إشعارات</p>
                  </div>
                ) : notifs.map(n => (
                  <div key={n.id}
                    className={`bg-white rounded-2xl border p-4 flex gap-3 transition-all ${n.read ? 'border-gray-100' : 'border-emerald-200 bg-emerald-50/40'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${
                      n.type==='booking' ? 'bg-blue-100 text-blue-600' : n.type==='league' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <i className={`fas ${n.type==='booking'?'fa-calendar':n.type==='league'?'fa-trophy':'fa-bell'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{n.date}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            )}

            {pSub === 'settings' && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {[
                  { emoji:'🔔', label:'الإشعارات',   desc:'تلقي إشعارات الحجوزات', active:true  },
                  { emoji:'🌙', label:'الوضع الليلي', desc:'تفعيل الثيم الداكن',    active:false },
                  { emoji:'🌐', label:'اللغة',        desc:'العربية (الافتراضي)',    active:true  },
                ].map((item, i, arr) => (
                  <div key={i} className={`flex items-center justify-between px-5 py-4 ${i < arr.length-1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.emoji}</span>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <div className={`w-11 h-6 rounded-full relative transition-colors ${item.active ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all ${item.active ? 'end-1' : 'start-1'}`} />
                    </div>
                  </div>
                ))}
                <div className="px-5 py-4 border-t border-gray-100">
                  <button onClick={logout}
                    className="w-full py-3 border-2 border-red-100 text-red-500 hover:bg-red-50 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                    <i className="fas fa-sign-out-alt" /> تسجيل الخروج
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ MOBILE BOTTOM NAV ════════════════════════════════════════════ */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-50 sm:hidden shadow-lg">
        <div className="grid grid-cols-4 h-16">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
                tab === t.id ? 'text-emerald-600' : 'text-gray-400'
              }`}>
              {!!t.badge && (
                <span className="absolute top-2 right-1/4 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full">{t.badge}</span>
              )}
              <i className={`fas ${t.icon} text-base`} />
              <span className="text-[9px] font-bold">{t.label}</span>
              {tab === t.id && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-500" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
