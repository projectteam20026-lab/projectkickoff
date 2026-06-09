import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { Field, Booking } from '../types';
import FieldModal from '../components/FieldModal';

type Tab = 'overview' | 'bookings' | 'tournaments' | 'calendar' | 'settings';
type BookingFilter = 'pending' | 'confirmed';
type SettingsSub = 'profile' | 'reports' | 'complaints' | 'config';
type TourneyStatus = 'pending' | 'accepted' | 'declined';
type TourneyItem = {
  id: string; name: string; organizer: string; phone: string;
  teams: number; format: string; startDate: string;
  days: string[]; time: string; notes: string; status: TourneyStatus;
};

const MOCK_TOURNAMENTS: TourneyItem[] = [
  { id:'t1', name:'بطولة الصيف الذهبي 2025', organizer:'أحمد الخالدي', phone:'0791234567',
    teams:8,  format:'دوري', startDate:'2025-07-15', days:['الجمعة','السبت'],               time:'مسائي', notes:'نحتاج 3 ساعات يومياً', status:'pending' },
  { id:'t2', name:'كأس الأبطال الشبابي',     organizer:'سامر العمري',  phone:'0799876543',
    teams:16, format:'كأس',  startDate:'2025-08-01', days:['الأحد','الثلاثاء','الخميس'],    time:'مسائي', notes:'',                   status:'pending' },
];
const MOCK_COMPLAINTS = [
  { id:'c1', from:'محمد أبو سعيد', date:'2025-05-10', text:'الأرضية كانت مبللة وخطرة',        resolved:false },
  { id:'c2', from:'خالد الزيتوني', date:'2025-05-08', text:'الإضاءة كانت تومض باستمرار',       resolved:false },
  { id:'c3', from:'يوسف البشير',   date:'2025-05-02', text:'مواقف السيارات ممتلئة دائماً',     resolved:true  },
];
const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];
const BOOKED: Record<string, string[]> = {
  '2025-05-20': ['10:00','11:00','16:00','17:00','18:00'],
  '2025-05-22': ['09:00','14:00','15:00','20:00'],
  '2025-05-25': ['08:00','09:00','10:00','19:00','20:00','21:00'],
};

const NAV_ITEMS: { id: Tab; icon: string; label: string }[] = [
  { id:'overview',    icon:'fa-th-large',     label:'نظرة عامة' },
  { id:'bookings',    icon:'fa-calendar-alt', label:'الحجوزات'  },
  { id:'tournaments', icon:'fa-trophy',       label:'البطولات'  },
  { id:'calendar',    icon:'fa-calendar-week',label:'الكلندر'   },
  { id:'settings',    icon:'fa-cog',          label:'الإعدادات' },
];

const OwnerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [tab, setTab]           = useState<Tab>('overview');
  const [bFilter, setBFilter]   = useState<BookingFilter>('pending');
  const [sSub, setSSub]         = useState<SettingsSub>('profile');
  const [sideOpen, setSideOpen] = useState(false);
  const [field, setField]       = useState<Field | null>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tournaments, setTournaments] = useState<TourneyItem[]>(MOCK_TOURNAMENTS);
  const [complaints, setComplaints]   = useState(MOCK_COMPLAINTS);
  const [calMonth, setCalMonth] = useState(new Date(2025, 4, 1));
  const [calDay, setCalDay]     = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', phone: user?.phone || '', email: user?.email || '', price: '40',
  });

  useEffect(() => {
    if (!user) return;
    Promise.all([backend.getFields(), backend.getBookings()]).then(([fs, bs]) => {
      const mine = fs.find(f => !f.ownerId || f.ownerId === user.id) || null;
      setField(mine);
      setBookings(bs.filter(b => mine ? b.fieldId === mine.id : false));
      if (mine) setProfileForm(p => ({ ...p, price: String(mine.pricePerHour || 40) }));
      setLoading(false);
    });
  }, [user?.id]);

  if (!user) return null;

  const pending        = bookings.filter(b => b.status === 'قيد الانتظار');
  const confirmed      = bookings.filter(b => b.status === 'مؤكد');
  const revenue        = confirmed.reduce((s, b) => s + (b.price || 0), 0);
  const cashRev        = Math.round(revenue * 0.6);
  const visaRev        = revenue - cashRev;
  const pendingTourney = tournaments.filter(t => t.status === 'pending').length;

  const handleSaveField = async (newField: Field) => {
    const saved = await backend.saveField(newField);
    setField(saved);
    setShowAddField(false);
  };

  const handleTourney  = (id: string, action: 'accept' | 'decline') =>
    setTournaments(p => p.map(t => t.id===id ? { ...t, status: action==='accept' ? 'accepted' : 'declined' } : t));
  const handleResolve  = (id: string) =>
    setComplaints(p => p.map(c => c.id===id ? { ...c, resolved:true } : c));
  const handleBooking  = (id: string, action: 'accept' | 'cancel') =>
    setBookings(p => p.map(b => b.id===id ? { ...b, status: action==='accept' ? 'مؤكد' : 'ملغي' } : b));

  // Calendar helpers
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth()+1, 0).getDate();
  const firstDay    = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
  const monthKey    = (d: number) =>
    `${calMonth.getFullYear()}-${String(calMonth.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const navTo = (id: Tab) => { setTab(id); setSideOpen(false); };

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-900/50">
            <i className="fas fa-futbol text-white text-sm" />
          </div>
          <span className="font-black text-lg tracking-tight">كيك أوف</span>
        </div>
        <div className="bg-white/10 border border-white/10 rounded-xl px-3 py-2">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">لوحة التحكم</p>
          <p className="text-white text-sm font-black truncate">{field?.name || 'ملعبي'}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const badge = item.id==='bookings' ? pending.length : item.id==='tournaments' ? pendingTourney : 0;
          return (
            <button key={item.id} onClick={() => navTo(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                tab===item.id
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}>
              <i className={`fas ${item.icon} w-4 text-center`} />
              <span className="flex-1 text-start">{item.label}</span>
              {badge > 0 && (
                <span className="bg-amber-400 text-slate-900 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0">{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="p-4 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0">
            {user.avatar
              ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-emerald-400 font-black">{user.name.charAt(0)}</div>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{user.name}</p>
            <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold rounded-lg transition-all">
            <i className="fas fa-home text-[10px]" /> الرئيسية
          </Link>
          <button onClick={logout}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all">
            <i className="fas fa-sign-out-alt text-[10px]" /> خروج
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans" dir="rtl">

      {/* ══ DESKTOP SIDEBAR (fixed) ════════════════════════════════════ */}
      <div className="hidden lg:block fixed right-0 top-0 bottom-0 w-64 z-40 shadow-2xl">
        <Sidebar />
      </div>

      {/* ══ MOBILE SIDEBAR DRAWER ════════════════════════════════════ */}
      {sideOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSideOpen(false)} />
          <div className="relative w-64 h-full shadow-2xl">
            <Sidebar />
          </div>
        </div>
      )}

      {/* ══ MAIN CONTENT (offset by sidebar on desktop) ══════════════ */}
      <div className="lg:me-64 min-h-screen flex flex-col">

        {/* Mobile top bar */}
        <header className="lg:hidden bg-slate-900 text-white px-4 h-14 flex items-center justify-between sticky top-0 z-30 shadow-lg flex-shrink-0">
          <button onClick={() => setSideOpen(true)}
            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all">
            <i className="fas fa-bars text-sm" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-futbol text-white text-xs" />
            </div>
            <span className="font-black text-base">كيك أوف</span>
          </div>
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-700">
            {user.avatar
              ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-emerald-400 font-black text-sm">{user.name.charAt(0)}</div>}
          </div>
        </header>

        {/* Page header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">
                {NAV_ITEMS.find(n => n.id===tab)?.label}
              </p>
              <h1 className="text-xl font-black text-slate-900">
                {tab==='overview' && `مرحباً، ${user.name.split(' ')[0]} 👋`}
                {tab==='bookings' && 'إدارة الحجوزات'}
                {tab==='tournaments' && 'طلبات البطولات'}
                {tab==='calendar' && 'كلندر الملعب'}
                {tab==='settings' && 'الإعدادات'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {pending.length > 0 && (
                <button onClick={() => navTo('bookings')}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl transition-all hover:bg-amber-100">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  {pending.length} حجز معلّق
                </button>
              )}
              <button onClick={() => setShowAddField(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-emerald-200">
                <i className="fas fa-plus text-[10px]" />
                <span className="hidden sm:inline">إضافة ملعب</span>
              </button>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-400 font-medium">{field?.name || 'لا يوجد ملعب'}</p>
                <p className="text-xs font-bold text-slate-600">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ══ TAB CONTENT ════════════════════════════════════════════ */}
        <div className="flex-1 p-4 sm:p-6 pb-20 lg:pb-6">

          {/* ── OVERVIEW ────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* No field CTA */}
              {!field && !loading && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-emerald-200 p-10 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-futbol text-emerald-400 text-2xl" />
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mb-1">لا يوجد ملعب بعد</h3>
                  <p className="text-slate-400 text-sm mb-5">أضف ملعبك الأول وابدأ باستقبال الحجوزات</p>
                  <button onClick={() => setShowAddField(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200">
                    <i className="fas fa-plus" /> إضافة ملعب جديد
                  </button>
                </div>
              )}
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon:'fa-money-bill-wave', color:'bg-emerald-500', label:'الإيرادات',       val:`${revenue} د.أ`      },
                  { icon:'fa-check-circle',    color:'bg-blue-500',    label:'حجوزات مؤكدة',    val:confirmed.length       },
                  { icon:'fa-clock',           color:'bg-amber-500',   label:'بانتظار القبول',  val:pending.length         },
                  { icon:'fa-star',            color:'bg-violet-500',  label:'تقييم الملعب',    val:field?.rating || '—'   },
                ].map((c, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
                    <div className={`w-10 h-10 ${c.color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                      <i className={`fas ${c.icon} text-white text-sm`} />
                    </div>
                    <p className="text-slate-400 text-xs font-bold mb-1">{c.label}</p>
                    <p className="text-2xl font-black text-slate-900">{c.val}</p>
                  </div>
                ))}
              </div>

              {/* Content grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent bookings */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-500 text-[11px] font-bold block mb-0.5">آخر النشاط</span>
                      <h3 className="font-black text-slate-900">آخر الحجوزات</h3>
                    </div>
                    <button onClick={() => navTo('bookings')}
                      className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <i className="fas fa-arrow-right text-xs" /> عرض الكل
                    </button>
                  </div>
                  {loading ? (
                    <div className="p-10 text-center">
                      <div className="w-7 h-7 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="text-4xl mb-3">📅</div>
                      <p className="text-slate-400 font-bold text-sm">لا توجد حجوزات بعد</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {bookings.slice(0, 6).map(b => (
                        <div key={b.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-sm flex-shrink-0">📅</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-sm truncate">{b.fieldName}</p>
                            <p className="text-xs text-slate-400">{b.date} · {b.timeSlot}</p>
                          </div>
                          <div className="text-end flex-shrink-0">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              b.status==='مؤكد' ? 'bg-emerald-100 text-emerald-700' :
                              b.status==='ملغي' ? 'bg-red-100    text-red-600'     :
                                                   'bg-amber-100  text-amber-700'
                            }`}>{b.status}</span>
                            <p className="text-xs font-black text-emerald-600 mt-1">{b.price} <span className="font-bold">د.أ</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Revenue + alerts */}
                <div className="space-y-4">
                  <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg">
                    <div className="absolute -top-6 -end-6 w-24 h-24 bg-emerald-500/15 rounded-full" />
                    <div className="relative z-10">
                      <p className="text-slate-400 text-xs font-bold mb-1">إجمالي الإيرادات</p>
                      <p className="text-3xl font-black mb-5">{revenue} <span className="text-sm text-slate-400 font-medium">د.أ</span></p>
                      {[
                        { label:'كاش',           val:cashRev, color:'bg-emerald-500', pct: revenue ? Math.round((cashRev/revenue)*100) : 0 },
                        { label:'فيزا / بطاقة',  val:visaRev, color:'bg-blue-500',   pct: revenue ? Math.round((visaRev/revenue)*100) : 0 },
                      ].map(p => (
                        <div key={p.label} className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">{p.label}</span>
                            <span className="font-black text-white">{p.val} د.أ <span className="text-slate-500">({p.pct}%)</span></span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${p.color} rounded-full`} style={{ width:`${p.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {pending.length > 0 && (
                    <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                        <p className="font-black text-amber-800 text-sm">{pending.length} حجز يحتاج قبولاً</p>
                      </div>
                      <button onClick={() => navTo('bookings')}
                        className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors">
                        مراجعة الحجوزات ←
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── BOOKINGS ─────────────────────────────────────────── */}
          {tab === 'bookings' && (
            <div className="space-y-5">
              <div className="flex gap-2">
                {(['pending','confirmed'] as BookingFilter[]).map(bt => (
                  <button key={bt} onClick={() => setBFilter(bt)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      bFilter===bt ? 'bg-slate-900 border-slate-900 text-white' : 'border-gray-200 text-slate-600 bg-white hover:border-slate-400'
                    }`}>
                    {bt==='pending'?`معلّقة (${pending.length})`:`مؤكدة (${confirmed.length})`}
                  </button>
                ))}
              </div>

              {bFilter === 'pending' && (
                pending.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                    <i className="fas fa-check-circle text-4xl text-emerald-200 mb-3 block" />
                    <p className="text-slate-400 font-bold">لا توجد حجوزات معلّقة 🎉</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pending.map(b => (
                      <div key={b.id}
                        className="bg-white rounded-2xl border border-gray-100 hover:border-amber-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all">
                        <div className="flex-1">
                          <p className="font-black text-slate-900 text-base">{b.fieldName}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{b.date} · <span dir="ltr">{b.timeSlot}</span></p>
                          <p className="text-lg font-black text-emerald-600 mt-1">{b.price} <span className="text-sm">د.أ</span></p>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => handleBooking(b.id,'accept')}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 justify-center">
                            <i className="fas fa-check" /> قبول
                          </button>
                          <button onClick={() => handleBooking(b.id,'cancel')}
                            className="flex-1 sm:flex-none px-5 py-2.5 border-2 border-red-100 text-red-500 hover:bg-red-50 font-bold rounded-xl text-sm transition-all flex items-center gap-2 justify-center">
                            <i className="fas fa-times" /> رفض
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {bFilter === 'confirmed' && (
                confirmed.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                    <i className="fas fa-calendar text-4xl text-gray-200 mb-3 block" />
                    <p className="text-slate-400 font-bold">لا توجد حجوزات مؤكدة</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-slate-500 text-xs font-bold border-b border-gray-100">
                            <th className="px-5 py-3.5 text-start">الملعب</th>
                            <th className="px-5 py-3.5 text-start">التاريخ</th>
                            <th className="px-5 py-3.5 text-start">الوقت</th>
                            <th className="px-5 py-3.5 text-start">السعر</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {confirmed.map(b => (
                            <tr key={b.id} className="hover:bg-gray-50/50">
                              <td className="px-5 py-4 font-bold text-slate-800">{b.fieldName}</td>
                              <td className="px-5 py-4 text-slate-600">{b.date}</td>
                              <td className="px-5 py-4"><span className="bg-gray-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg" dir="ltr">{b.timeSlot}</span></td>
                              <td className="px-5 py-4 font-black text-emerald-600">{b.price} د.أ</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* ── TOURNAMENTS ──────────────────────────────────────── */}
          {tab === 'tournaments' && (
            <div className="space-y-4">
              {tournaments.length === 0 ? (
                <div className="bg-white rounded-2xl p-14 text-center border border-gray-100 shadow-sm">
                  <i className="fas fa-inbox text-5xl text-gray-200 mb-4 block" />
                  <p className="text-slate-400 font-bold">لا توجد طلبات حالياً</p>
                </div>
              ) : (
                tournaments.map(r => (
                  <div key={r.id} className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
                    r.status==='pending'  ? 'border-gray-100' :
                    r.status==='accepted' ? 'border-emerald-200' : 'border-red-100 opacity-70'
                  }`}>
                    <div className={`px-5 py-3.5 flex items-center justify-between border-b ${
                      r.status==='accepted' ? 'border-emerald-100 bg-emerald-50' :
                      r.status==='declined' ? 'border-red-100    bg-red-50'      : 'border-gray-100 bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                          r.status==='accepted' ? 'bg-emerald-100 text-emerald-600' :
                          r.status==='declined' ? 'bg-red-100    text-red-500'     : 'bg-violet-100 text-violet-600'
                        }`}>
                          <i className={`fas ${r.status==='accepted'?'fa-check':r.status==='declined'?'fa-times':'fa-clock'}`} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{r.name}</p>
                          <p className="text-xs text-slate-400">من: {r.organizer} · {r.phone}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        r.status==='accepted' ? 'bg-emerald-100 text-emerald-700' :
                        r.status==='declined' ? 'bg-red-100    text-red-600'     : 'bg-amber-100  text-amber-700'
                      }`}>
                        {r.status==='accepted'?'مقبول ✓':r.status==='declined'?'مرفوض':'في الانتظار'}
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {[
                          { icon:'fa-sitemap', label:'النظام',  val:r.format         },
                          { icon:'fa-users',   label:'الفرق',   val:`${r.teams} فرق` },
                          { icon:'fa-calendar',label:'البداية', val:r.startDate      },
                          { icon:'fa-clock',   label:'الوقت',   val:r.time           },
                        ].map((d, i) => (
                          <div key={i} className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-1 mb-1">
                              <i className={`fas ${d.icon} text-gray-400 text-[10px]`} />
                              <span className="text-[10px] text-gray-400 font-bold">{d.label}</span>
                            </div>
                            <p className="text-sm font-black text-slate-700">{d.val}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {r.days.map(d => <span key={d} className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">{d}</span>)}
                      </div>
                      {r.notes && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                          <p className="text-xs text-blue-700"><i className="fas fa-quote-right me-1 text-blue-300" />{r.notes}</p>
                        </div>
                      )}
                      {r.status === 'pending' && (
                        <div className="flex gap-3">
                          <button onClick={() => handleTourney(r.id,'accept')}
                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                            <i className="fas fa-check" /> قبول الطلب
                          </button>
                          <button onClick={() => handleTourney(r.id,'decline')}
                            className="flex-1 py-3 border-2 border-red-100 text-red-500 hover:bg-red-50 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                            <i className="fas fa-times" /> رفض
                          </button>
                        </div>
                      )}
                      {r.status === 'accepted' && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                          <i className="fas fa-check-circle text-emerald-500" />
                          <p className="text-sm font-bold text-emerald-700">تم القبول — سيتواصل معك المنظم قريباً</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── CALENDAR ─────────────────────────────────────────── */}
          {tab === 'calendar' && (
            <div className="space-y-5 max-w-2xl">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                  <button onClick={() => { setCalMonth(m => new Date(m.getFullYear(), m.getMonth()-1,1)); setCalDay(null); }}
                    className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                    <i className="fas fa-chevron-right text-sm" />
                  </button>
                  <h3 className="font-black text-slate-900 text-base">
                    {calMonth.toLocaleString('ar-EG',{month:'long',year:'numeric'})}
                  </h3>
                  <button onClick={() => { setCalMonth(m => new Date(m.getFullYear(), m.getMonth()+1,1)); setCalDay(null); }}
                    className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                    <i className="fas fa-chevron-left text-sm" />
                  </button>
                </div>
                <div className="grid grid-cols-7 mb-2">
                  {['أحد','اثن','ثلاث','أربع','خمس','جمعة','سبت'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({length:firstDay}).map((_,i) => <div key={`e${i}`} />)}
                  {Array.from({length:daysInMonth}).map((_,i) => {
                    const d = i+1;
                    const key = monthKey(d);
                    const bookedCount = (BOOKED[key]||[]).length;
                    const isSel = calDay === key;
                    return (
                      <button key={d} onClick={() => setCalDay(isSel?null:key)}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all ${
                          isSel        ? 'bg-slate-900 text-white' :
                          bookedCount  ? 'bg-amber-50 border-2 border-amber-200 text-amber-800 hover:bg-amber-100' :
                                         'hover:bg-gray-50 text-slate-600'
                        }`}>
                        <span>{d}</span>
                        {bookedCount > 0 && (
                          <span className={`text-[8px] mt-0.5 ${isSel?'text-amber-300':'text-amber-500'}`}>{bookedCount}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200 inline-block" />محجوز</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 inline-block" />متاح</span>
                </div>
              </div>

              {calDay && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-black text-slate-900 mb-4">
                    <i className="fas fa-clock text-slate-400 me-2" />
                    {new Date(calDay).toLocaleDateString('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {HOURS.map(h => {
                      const booked = (BOOKED[calDay]||[]).includes(h);
                      return (
                        <div key={h} className={`rounded-xl p-3 text-center border-2 ${booked ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                          <p className="text-sm font-black" dir="ltr">{h}</p>
                          <p className={`text-[10px] font-bold mt-0.5 ${booked?'text-red-500':'text-emerald-600'}`}>{booked?'محجوز':'متاح'}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS ─────────────────────────────────────────── */}
          {tab === 'settings' && (
            <div className="space-y-5 max-w-2xl">
              {/* Sub tabs */}
              <div className="flex gap-2 flex-wrap">
                {([
                  { id:'profile'    as SettingsSub, label:'الملف الشخصي', icon:'fa-user'              },
                  { id:'reports'    as SettingsSub, label:'التقارير',      icon:'fa-chart-bar'         },
                  { id:'complaints' as SettingsSub, label:'الشكاوي',       icon:'fa-exclamation-circle',
                    badge: complaints.filter(c => !c.resolved).length },
                  { id:'config'     as SettingsSub, label:'الإعدادات',     icon:'fa-sliders-h'         },
                ]).map(st => (
                  <button key={st.id} onClick={() => setSSub(st.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      sSub===st.id ? 'bg-slate-900 border-slate-900 text-white' : 'border-gray-200 bg-white text-slate-600 hover:border-slate-400'
                    }`}>
                    <i className={`fas ${st.icon} text-xs`} />{st.label}
                    {!!(st as any).badge && (st as any).badge > 0 && (
                      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{(st as any).badge}</span>
                    )}
                  </button>
                ))}
              </div>

              {sSub === 'profile' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                  {[
                    { label:'الاسم الكامل',     key:'name',  type:'text'   },
                    { label:'رقم الهاتف',        key:'phone', type:'tel'    },
                    { label:'البريد الإلكتروني', key:'email', type:'email'  },
                    { label:'سعر الساعة (د.أ)',  key:'price', type:'number' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">{f.label}</label>
                      <input type={f.type} value={(profileForm as any)[f.key]}
                        onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-slate-800 outline-none transition-colors text-sm bg-gray-50" />
                    </div>
                  ))}
                  <button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors mt-2">
                    <i className="fas fa-save me-2" /> حفظ التغييرات
                  </button>
                </div>
              )}

              {sSub === 'reports' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { emoji:'💰', label:'الإيرادات الشهرية', val:`${revenue} د.أ` },
                      { emoji:'📅', label:'إجمالي الحجوزات',   val:bookings.length   },
                      { emoji:'✅', label:'حجوزات مؤكدة',      val:confirmed.length  },
                    ].map((r, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
                        <span className="text-3xl mb-2 block">{r.emoji}</span>
                        <span className="text-2xl font-black text-slate-900">{r.val}</span>
                        <p className="text-sm text-slate-500 mt-1">{r.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-black text-slate-900 mb-4">توزيع الإيرادات</h3>
                    {[
                      { label:'كاش',          val:cashRev, color:'bg-emerald-500' },
                      { label:'فيزا / بطاقة', val:visaRev, color:'bg-blue-500'   },
                    ].map(p => (
                      <div key={p.label} className="mb-4">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-bold text-slate-700">{p.label}</span>
                          <span className="font-black text-slate-900">{p.val} د.أ</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${p.color} rounded-full`} style={{ width: revenue ? `${(p.val/revenue)*100}%` : '0%' }} />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{revenue ? Math.round((p.val/revenue)*100) : 0}% من الإجمالي</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sSub === 'complaints' && (
                <div className="space-y-3">
                  {complaints.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
                      <div className="text-5xl mb-3">😊</div>
                      <p className="text-slate-400 font-bold">لا توجد شكاوي 🎉</p>
                    </div>
                  ) : complaints.map(c => (
                    <div key={c.id}
                      className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${c.resolved ? 'border-gray-100 opacity-60' : 'border-red-200 hover:border-gray-200'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <i className={`fas ${c.resolved?'fa-check-circle text-emerald-400':'fa-exclamation-circle text-red-400'} text-sm`} />
                            <p className="font-black text-slate-900 text-sm">{c.from}</p>
                            <span className="text-xs text-slate-400">{c.date}</span>
                          </div>
                          <p className="text-sm text-slate-600">{c.text}</p>
                        </div>
                        {!c.resolved && (
                          <button onClick={() => handleResolve(c.id)}
                            className="flex-shrink-0 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl transition-colors">
                            <i className="fas fa-check me-1" /> تم الحل
                          </button>
                        )}
                      </div>
                      {c.resolved && (
                        <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-600">
                          <i className="fas fa-check-circle" /> تم حل هذه الشكوى
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {sSub === 'config' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {[
                    { emoji:'🔔', label:'الإشعارات',         desc:'تلقي إشعارات الحجوزات والبطولات', active:true  },
                    { emoji:'📧', label:'البريد الإلكتروني', desc:'إرسال ملخص أسبوعي بالإيرادات',    active:true  },
                    { emoji:'🌙', label:'الوضع الليلي',      desc:'تفعيل الثيم الداكن',               active:false },
                    { emoji:'🌐', label:'اللغة',              desc:'العربية (الافتراضي)',               active:true  },
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
      </div>

      {/* ══ ADD FIELD MODAL ══════════════════════════════════════════════ */}
      {showAddField && (
        <FieldModal
          onClose={() => setShowAddField(false)}
          onSave={handleSaveField}
        />
      )}

      {/* ══ MOBILE BOTTOM NAV ════════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-900 border-t border-white/10 z-40 shadow-2xl">
        <div className="grid grid-cols-5 h-16">
          {NAV_ITEMS.map(item => {
            const badge = item.id==='bookings' ? pending.length : item.id==='tournaments' ? pendingTourney : 0;
            return (
              <button key={item.id} onClick={() => navTo(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors ${tab===item.id?'text-emerald-400':'text-slate-500'}`}>
                {badge > 0 && (
                  <span className="absolute top-2 right-1/4 bg-amber-400 text-slate-900 text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full">{badge}</span>
                )}
                <i className={`fas ${item.icon} text-base`} />
                <span className="text-[9px] font-bold">{item.label}</span>
                {tab===item.id && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default OwnerDashboard;
