import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { Field, Booking } from '../types';

type Tab           = 'overview' | 'bookings' | 'calendar' | 'field' | 'tournaments' | 'manage-tournaments' | 'reviews' | 'settings';
type BookingFilter = 'all' | 'pending' | 'confirmed' | 'cancelled';
type SettingsSub   = 'profile' | 'reports' | 'complaints' | 'config';
type TourneyStatus = 'pending' | 'accepted' | 'declined';

type TourneyItem = {
  id: string; name: string; organizer: string; phone: string; email: string;
  teams: number; format: string; startDate: string;
  days: string[]; time: string; notes: string; status: TourneyStatus;
};

const MOCK_TOURNAMENTS: TourneyItem[] = [
  { id:'t1', name:'بطولة الصيف الذهبي 2026', organizer:'أحمد الخالدي', phone:'0791234567', email:'ahmad.khalidi@gmail.com',
    teams:8,  format:'دوري', startDate:'2026-07-15', days:['الجمعة','السبت'],            time:'مسائي', notes:'نحتاج 3 ساعات يومياً', status:'pending'  },
  { id:'t2', name:'كأس الأبطال الشبابي',      organizer:'سامر العمري',  phone:'0799876543', email:'samer.omari@gmail.com',
    teams:16, format:'كاس',  startDate:'2026-08-01', days:['الأحد','الثلاثاء','الخميس'], time:'مسائي', notes:'',                   status:'accepted' },
  { id:'t3', name:'دوري المحترفين الشتوي',    organizer:'باسل الحمدان', phone:'0795551234', email:'basel.hamdan@gmail.com',
    teams:10, format:'دوري', startDate:'2026-09-10', days:['الجمعة'],                    time:'صباحي', notes:'',                   status:'accepted' },
];

const MOCK_COMPLAINTS = [
  { id:'c1', from:'محمد أبو سعيد', date:'2026-05-10', text:'الأرضية كانت مبللة وخطرة',    resolved:false },
  { id:'c2', from:'خالد الزيتوني', date:'2026-05-08', text:'الإضاءة كانت تومض باستمرار',   resolved:false },
  { id:'c3', from:'يوسف البشير',   date:'2026-05-02', text:'مواقف السيارات ممتلئة دائماً', resolved:true  },
];

const MOCK_REVIEWS = [
  { id:'r1', name:'محمد العمري',   avatar:'https://ui-avatars.com/api/?name=محمد&background=3b82f6&color=fff', rating:5, comment:'ملعب ممتاز وإضاءة رائعة! الأرضية نظيفة جداً.', date:'2026-05-01' },
  { id:'r2', name:'سارة خالد',    avatar:'https://ui-avatars.com/api/?name=سارة&background=f59e0b&color=fff',  rating:4, comment:'جيد جداً، ننصح به. الخدمة كانت ممتازة.',       date:'2026-05-05' },
  { id:'r3', name:'أحمد الخالدي', avatar:'https://ui-avatars.com/api/?name=أحمد&background=8b5cf6&color=fff', rating:5, comment:'من أفضل الملاعب في المنطقة، سنعود قريباً.',     date:'2026-05-12' },
  { id:'r4', name:'خالد السالم',  avatar:'https://ui-avatars.com/api/?name=خالد&background=10b981&color=fff', rating:3, comment:'الملعب جيد لكن المواقف كانت ممتلئة.',           date:'2026-05-18' },
  { id:'r5', name:'عمر الزيادي',  avatar:'https://ui-avatars.com/api/?name=عمر&background=64748b&color=fff',  rating:5, comment:'تجربة رائعة! الإضاءة ممتازة للمباريات الليلية.', date:'2026-05-25' },
];

const NAV_ITEMS: { id: Tab; icon: string; label: string }[] = [
  { id:'overview',    icon:'fa-th-large',       label:'نظرة عامة'  },
  { id:'bookings',    icon:'fa-calendar-alt',   label:'الحجوزات'   },
  { id:'calendar',    icon:'fa-calendar-week',  label:'التقويم'    },
  { id:'field',       icon:'fa-map-marker-alt', label:'ملعبي'      },
  { id:'tournaments', icon:'fa-trophy',         label:'البطولات'   },
  { id:'reviews',     icon:'fa-star',           label:'التقييمات'  },
  { id:'settings',    icon:'fa-cog',            label:'الإعدادات'  },
];

const AMENITY_LIST = [
  { key:'lighting',   icon:'fa-lightbulb', label:'إضاءة ليلية'     },
  { key:'parking',    icon:'fa-parking',   label:'موقف سيارات'     },
  { key:'changing',   icon:'fa-tshirt',    label:'غرف تبديل'       },
  { key:'covered',    icon:'fa-umbrella',  label:'مسقوف'           },
  { key:'bathroom',   icon:'fa-bath',      label:'دورة مياه'       },
  { key:'cafe',       icon:'fa-coffee',    label:'كافيه / كانتين'  },
  { key:'firstAid',   icon:'fa-medkit',    label:'إسعافات أولية'   },
  { key:'spectators', icon:'fa-users',     label:'مدرجات للمشجعين' },
];

const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];

function pad(n: number) { return String(n).padStart(2,'0'); }
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

const OwnerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab]                 = useState<Tab>(() => (location.state as any)?.tab || 'overview');
  const [bFilter, setBFilter]         = useState<BookingFilter>('pending');
  const [sSub, setSSub]               = useState<SettingsSub>(() => (location.state as any)?.sub || 'profile');
  const [sideOpen, setSideOpen]       = useState(false);
  const [sideExpanded, setSideExpanded] = useState(true);
  const [field, setField]             = useState<Field | null>(null);
  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tournaments, setTournaments] = useState<TourneyItem[]>(MOCK_TOURNAMENTS);
  const [complaints, setComplaints]   = useState(MOCK_COMPLAINTS);
  const [reviews]                     = useState(MOCK_REVIEWS);
  const [blockedSlots, setBlockedSlots] = useState<Record<string,string[]>>({});
  const [calMonth, setCalMonth]       = useState(() => new Date());
  const [calDay, setCalDay]           = useState<string | null>(null);
  const [toast, setToast]             = useState<{msg:string;ok:boolean}|null>(null);
  const [replyText, setReplyText]     = useState<Record<string,string>>({});
  const [replySent, setReplySent]     = useState<Record<string,boolean>>({});
  const [savedField, setSavedField]   = useState(false);
  const [reviewFilter, setReviewFilter] = useState<number|0>(0); // 0 = all
  const [configToggles, setConfigToggles] = useState({ notifications:true, email:true, darkMode:false });
  const toggleConfig = (key: keyof typeof configToggles) =>
    setConfigToggles(p => ({ ...p, [key]: !p[key] }));
  const [pwForm, setPwForm] = useState({ current:'', next:'', confirm:'' });

  const [fieldForm, setFieldForm] = useState({
    name:'', address:'', city:'عمّان', size:'5v5', surface:'عشب صناعي',
    priceWeekday:'40', priceWeekend:'50', openHour:'08:00', closeHour:'22:00', description:'',
    amenities:{ lighting:true, parking:true, changing:false, covered:false, bathroom:true, cafe:false, firstAid:false, spectators:false },
  });

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', phone: user?.phone || '', email: user?.email || '',
  });

  const showToast = (msg: string, ok: boolean) => {
    setToast({msg, ok});
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (!user) return;
    Promise.all([backend.getFields(), backend.getBookings()]).then(([fs, bs]) => {
      const mine = fs.find(f => !f.ownerId || f.ownerId === user.id) || null;
      setField(mine);
      setBookings(bs.filter(b => mine ? b.fieldId === mine.id : false));
      if (mine) {
        setFieldForm(p => ({
          ...p,
          name: mine.name || '',
          address: (mine as any).address || '',
          priceWeekday: String(mine.pricePerHour || 40),
          description: (mine as any).description || '',
        }));
      }
      setLoading(false);
    });
  }, [user?.id]);

  if (!user) return null;

  const today          = todayStr();
  const pending        = bookings.filter(b => b.status === 'قيد الانتظار');
  const confirmed      = bookings.filter(b => b.status === 'مؤكد');
  const cancelled      = bookings.filter(b => b.status === 'ملغي');
  const revenue        = confirmed.reduce((s, b) => s + (b.price || 0), 0);
  const cashRev        = Math.round(revenue * 0.6);
  const visaRev        = revenue - cashRev;
  const todayBooks     = bookings.filter(b => b.date === today).sort((a,b) => (a.timeSlot||'').localeCompare(b.timeSlot||''));
  const pendingTourney = tournaments.filter(t => t.status === 'pending').length;
  const totalAlerts    = pending.length + pendingTourney;
  const unresolved     = complaints.filter(c=>!c.resolved).length;
  const avgRating      = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1) : '—';

  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth()+1, 0).getDate();
  const firstDay    = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
  const monthKey    = (d: number) => `${calMonth.getFullYear()}-${pad(calMonth.getMonth()+1)}-${pad(d)}`;

  const bookingsByDate: Record<string, Booking[]> = {};
  bookings.forEach(b => {
    if (!bookingsByDate[b.date]) bookingsByDate[b.date] = [];
    bookingsByDate[b.date].push(b);
  });

  const filteredBookings = bFilter==='all' ? bookings : bFilter==='pending' ? pending : bFilter==='confirmed' ? confirmed : cancelled;

  const cancellationRate = bookings.length ? Math.round((cancelled.length / bookings.length) * 100) : 0;
  const occupancyPct = Math.min(100, Math.round((confirmed.length / Math.max(1, HOURS.length * new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate())) * 100));
  const currentMonthStr = `${new Date().getFullYear()}-${pad(new Date().getMonth()+1)}`;
  const weekAgoDate = new Date(); weekAgoDate.setDate(weekAgoDate.getDate() - 7);
  const weekAgoStr = `${weekAgoDate.getFullYear()}-${pad(weekAgoDate.getMonth()+1)}-${pad(weekAgoDate.getDate())}`;
  const thisMonthRevenue = confirmed.filter(b => b.date?.startsWith(currentMonthStr)).reduce((s,b) => s+(b.price||0), 0);
  const thisWeekRevenue  = confirmed.filter(b => (b.date||'') >= weekAgoStr).reduce((s,b) => s+(b.price||0), 0);
  const todayRevenue     = todayBooks.filter(b => b.status==='مؤكد').reduce((s,b)=>s+(b.price||0), 0);

  const dayFreq: Record<string,number> = {};
  bookings.filter(b => b.status!=='ملغي').forEach(b => {
    if (b.date) { const d = new Date(b.date+'T12:00:00').toLocaleDateString('ar-EG',{weekday:'long'}); dayFreq[d]=(dayFreq[d]||0)+1; }
  });
  const hourFreq: Record<string,number> = {};
  bookings.filter(b => b.status!=='ملغي').forEach(b => {
    if (b.timeSlot) { const h = b.timeSlot.substring(0,5); hourFreq[h]=(hourFreq[h]||0)+1; }
  });
  const topHours = Object.entries(hourFreq).sort((a,b) => b[1]-a[1]);

  const handleTourney = (id: string, action: 'accept'|'decline') => {
    setTournaments(p => p.map(t => t.id===id ? { ...t, status: action==='accept'?'accepted':'declined' } : t));
    showToast(action==='accept' ? '✅ تم قبول البطولة' : '❌ تم رفض البطولة', action==='accept');
  };
  const handleResolve = (id: string) => {
    setComplaints(p => p.map(c => c.id===id ? { ...c, resolved:true } : c));
    showToast('✅ تم حل الشكوى', true);
  };
  const handleBooking = (id: string, action: 'accept'|'cancel') => {
    setBookings(p => p.map(b => b.id===id ? { ...b, status: action==='accept'?'مؤكد':'ملغي' } : b));
    showToast(action==='accept' ? '✅ تم قبول الحجز' : '❌ تم رفض الحجز', action==='accept');
  };
  const toggleBlock = (dateKey: string, hour: string) => {
    setBlockedSlots(p => {
      const slots = p[dateKey]||[];
      return { ...p, [dateKey]: slots.includes(hour) ? slots.filter(s=>s!==hour) : [...slots, hour] };
    });
  };
  const handleSaveField = () => {
    setSavedField(true);
    showToast('✅ تم حفظ إعدادات الملعب', true);
    setTimeout(() => setSavedField(false), 3000);
  };
  const handleSendReply = (rid: string) => {
    if (!replyText[rid]?.trim()) return;
    setReplySent(p => ({ ...p, [rid]: true }));
    showToast('✅ تم إرسال ردك', true);
  };

  const navTo = (id: Tab) => { setTab(id); setSideOpen(false); };

  const Sidebar = ({ forceExpand = false }: { forceExpand?: boolean }) => {
    const exp = forceExpand || sideExpanded;
    return (
      <div className={`flex flex-col h-full bg-slate-900 text-white transition-all duration-300 ${exp ? 'w-64' : 'w-16'}`}>

        {/* ── Logo / toggle ── */}
        <div className={`border-b border-white/10 flex-shrink-0 ${exp ? 'px-5 py-5' : 'px-2 py-4'}`}>
          <button
            onClick={() => setSideExpanded(p => !p)}
            className={`flex items-center gap-3 w-full group ${exp ? '' : 'justify-center'}`}
            title={exp ? 'طيّ القائمة' : 'توسيع القائمة'}
          >
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-900/50 group-hover:bg-emerald-400 transition-colors">
              <i className={`fas ${exp ? 'fa-futbol' : 'fa-bars'} text-white text-sm`} />
            </div>
            {exp && <span className="font-black text-lg tracking-tight">كيك أوف</span>}
          </button>

          {exp && (
            <div className="bg-white/10 border border-white/10 rounded-xl px-3 py-2 mt-3">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">لوحة تحكم المالك</p>
              <p className="text-white text-sm font-black truncate">{field?.name || 'ملعبي'}</p>
              {reviews.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <i className="fas fa-star text-amber-400 text-[10px]" />
                  <span className="text-amber-300 text-[11px] font-bold">{avgRating}</span>
                  <span className="text-slate-500 text-[10px]">({reviews.length} تقييم)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Nav items ── */}
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${exp ? 'px-3' : 'px-2'}`}>
          {NAV_ITEMS.map(item => {
            const badge = item.id==='bookings' ? pending.length : item.id==='tournaments' ? pendingTourney : item.id==='settings' ? unresolved : 0;
            return (
              <React.Fragment key={item.id}>
                <button onClick={() => navTo(item.id)}
                  title={!exp ? item.label : undefined}
                  className={`w-full flex items-center gap-3 py-3 rounded-xl text-sm font-bold transition-all relative ${
                    exp ? 'px-4' : 'px-0 justify-center'
                  } ${tab===item.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>
                  <i className={`fas ${item.icon} w-4 text-center flex-shrink-0`} />
                  {exp && <span className="flex-1 text-start">{item.label}</span>}
                  {exp && badge > 0 && <span className="bg-amber-400 text-slate-900 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0">{badge}</span>}
                  {!exp && badge > 0 && <span className="absolute top-1 end-1 w-4 h-4 bg-amber-400 text-slate-900 text-[8px] font-black flex items-center justify-center rounded-full">{badge}</span>}
                </button>

                {/* إدارة البطولات — sub-item تحت البطولات */}
                {item.id === 'tournaments' && (
                  <button
                    onClick={() => navTo('manage-tournaments')}
                    title={!exp ? 'إدارة البطولات' : undefined}
                    className={`w-full flex items-center gap-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      tab === 'manage-tournaments'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                    } ${exp ? 'px-4' : 'px-0 justify-center'}`}
                  >
                    <i className="fas fa-tools w-4 text-center flex-shrink-0 text-xs" />
                    {exp && <span className="flex-1 text-start">إدارة البطولات</span>}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* ── User / logout ── */}
        <div className={`border-t border-white/10 flex-shrink-0 ${exp ? 'p-4' : 'p-2'}`}>
          {exp ? (
            <>
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
              <button onClick={logout}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all">
                <i className="fas fa-sign-out-alt text-[10px]" /> خروج
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-700">
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-emerald-400 font-black text-sm">{user.name.charAt(0)}</div>}
              </div>
              <button onClick={logout} title="خروج"
                className="w-9 h-9 flex items-center justify-center bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 rounded-lg transition-all">
                <i className="fas fa-sign-out-alt text-[10px]" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans" dir="rtl">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 inset-x-0 mx-auto w-fit z-[200] px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white transition-all ${toast.ok?'bg-emerald-500':'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:block fixed right-0 top-0 bottom-0 z-40 shadow-2xl transition-all duration-300 ${sideExpanded ? 'w-64' : 'w-16'}`}>
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {sideOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSideOpen(false)} />
          <div className="relative w-64 h-full shadow-2xl"><Sidebar forceExpand /></div>
        </div>
      )}

      <div className={`min-h-screen flex flex-col transition-all duration-300 ${sideExpanded ? 'lg:ms-64' : 'lg:ms-16'}`}>

        {/* Mobile top bar */}
        <header className="lg:hidden bg-slate-900 text-white px-4 h-14 flex items-center justify-between sticky top-0 z-30 shadow-lg flex-shrink-0">
          <button onClick={() => setSideOpen(true)}
            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all relative">
            <i className="fas fa-bars text-sm" />
            {totalAlerts > 0 && <span className="absolute -top-1 -end-1 w-4 h-4 bg-amber-400 text-slate-900 text-[8px] font-black flex items-center justify-center rounded-full">{totalAlerts}</span>}
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

        <div className="flex-1 pb-20 lg:pb-6">

          {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div>
              {/* Hero Banner */}
              <div className="relative overflow-hidden bg-slate-900" style={{ minHeight:220 }}>
                <img
                  src={field?.images?.[0] || 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1600&q=80'}
                  className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105" alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-900/95" />
                <div className="relative z-10 px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">لوحة تحكم المالك</p>
                    <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">مرحباً، {user.name.split(' ')[0]} 👋</h1>
                    <p className="text-slate-400 text-sm">{field?.name || 'لم يتم ربط ملعب بعد'}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {pending.length > 0 && (
                      <button onClick={() => navTo('bookings')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold rounded-xl hover:bg-amber-400/30 transition-all">
                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                        {pending.length} حجز معلّق
                      </button>
                    )}
                    {pendingTourney > 0 && (
                      <button onClick={() => navTo('tournaments')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-violet-400/20 border border-violet-400/40 text-violet-300 text-xs font-bold rounded-xl hover:bg-violet-400/30 transition-all">
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
                        {pendingTourney} طلب بطولة
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative z-10 grid grid-cols-4 border-t border-white/10">
                  {[
                    { icon:'fa-coins',        color:'text-emerald-400', label:'إجمالي الإيرادات', val:`${revenue} د.أ` },
                    { icon:'fa-check-circle', color:'text-blue-400',    label:'حجوزات مؤكدة',     val:confirmed.length },
                    { icon:'fa-clock',        color:'text-amber-400',   label:'معلّقة',            val:pending.length   },
                    { icon:'fa-star',         color:'text-violet-400',  label:'متوسط التقييم',     val:avgRating        },
                  ].map((s,i) => (
                    <div key={i} className="px-4 py-4 text-center border-e border-white/10 last:border-none">
                      <i className={`fas ${s.icon} ${s.color} text-sm mb-1 block`} />
                      <p className="text-xl font-black text-white">{s.val}</p>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">

                {/* ── 8-card KPI grid ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon:'fa-calendar-check',    bg:'bg-emerald-50',  border:'border-emerald-200', ic:'text-emerald-600', label:'إجمالي الحجوزات',     val:bookings.length,           sub:'حجز مسجّل' },
                    { icon:'fa-fire-alt',           bg:'bg-orange-50',   border:'border-orange-200',  ic:'text-orange-500',  label:'إيرادات هذا الشهر',    val:`${thisMonthRevenue} د.أ`, sub:'الشهر الحالي' },
                    { icon:'fa-bolt',               bg:'bg-blue-50',     border:'border-blue-200',    ic:'text-blue-600',    label:'إيرادات هذا الأسبوع',  val:`${thisWeekRevenue} د.أ`,  sub:'آخر 7 أيام' },
                    { icon:'fa-sun',                bg:'bg-yellow-50',   border:'border-yellow-200',  ic:'text-yellow-600',  label:'إيرادات اليوم',         val:`${todayRevenue} د.أ`,     sub:'اليوم فقط' },
                    { icon:'fa-chart-pie',          bg:'bg-teal-50',     border:'border-teal-200',    ic:'text-teal-600',    label:'نسبة الإشغال',          val:`${occupancyPct}%`,        sub:'هذا الشهر' },
                    { icon:'fa-times-circle',       bg:'bg-red-50',      border:'border-red-200',     ic:'text-red-500',     label:'حجوزات ملغاة',          val:cancelled.length,          sub:`${cancellationRate}% نسبة الإلغاء` },
                    { icon:'fa-credit-card',        bg:'bg-indigo-50',   border:'border-indigo-200',  ic:'text-indigo-600',  label:'مدفوعات فيزا',          val:`${visaRev} د.أ`,          sub:`${revenue?Math.round((visaRev/revenue)*100):0}% من الكل` },
                    { icon:'fa-money-bill-wave',    bg:'bg-amber-50',    border:'border-amber-200',   ic:'text-amber-600',   label:'مدفوعات كاش',           val:`${cashRev} د.أ`,          sub:`${revenue?Math.round((cashRev/revenue)*100):0}% من الكل` },
                  ].map((c,i) => (
                    <div key={i} className={`bg-white rounded-2xl border-2 ${c.border} p-4 shadow-sm hover:shadow-md transition-shadow`}>
                      <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
                        <i className={`fas ${c.icon} ${c.ic} text-sm`} />
                      </div>
                      <p className="text-xl font-black text-slate-900">{c.val}</p>
                      <p className="text-xs font-black text-slate-600 mt-0.5">{c.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
                    </div>
                  ))}
                </div>

                {/* ── Revenue dark card + Day-of-week chart ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute -top-8 -end-8 w-32 h-32 bg-emerald-500/10 rounded-full" />
                    <div className="absolute -bottom-10 -start-10 w-40 h-40 bg-blue-500/10 rounded-full" />
                    <div className="relative z-10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">توزيع الإيرادات</p>
                      <p className="text-4xl font-black mb-0.5">{revenue} <span className="text-base text-slate-400 font-medium">د.أ</span></p>
                      <p className="text-slate-500 text-xs mb-5">إجمالي من الحجوزات المؤكدة</p>
                      <div className="space-y-3">
                        {[
                          { label:'كاش',          val:cashRev, color:'bg-emerald-500', icon:'fa-money-bill',  pct:revenue?Math.round((cashRev/revenue)*100):0 },
                          { label:'فيزا / بطاقة', val:visaRev, color:'bg-blue-500',   icon:'fa-credit-card', pct:revenue?Math.round((visaRev/revenue)*100):0 },
                        ].map(p => (
                          <div key={p.label}>
                            <div className="flex justify-between items-center text-xs mb-1.5">
                              <div className="flex items-center gap-1.5"><i className={`fas ${p.icon} text-slate-400`} /><span className="text-slate-300 font-bold">{p.label}</span></div>
                              <span className="font-black text-white">{p.val} د.أ <span className="text-slate-500 font-normal">({p.pct}%)</span></span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full ${p.color} rounded-full transition-all duration-700`} style={{ width:`${p.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                        {[
                          { label:'مؤكدة',       val:confirmed.length, color:'text-emerald-400' },
                          { label:'معلّقة',       val:pending.length,   color:'text-amber-400'  },
                          { label:'نسبة الإلغاء', val:`${cancellationRate}%`, color:'text-red-400' },
                        ].map((s,i) => (
                          <div key={i} className="bg-white/5 rounded-xl py-2">
                            <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">تحليل</p>
                    <h3 className="font-black text-slate-900 mb-5">الحجوزات حسب اليوم</h3>
                    {(() => {
                      const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
                      const counts = days.map(d => dayFreq[d]||0);
                      const maxC = Math.max(...counts, 1);
                      return (
                        <div className="space-y-2.5">
                          {days.map((d,i) => (
                            <div key={d} className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400 w-16 text-start shrink-0">{d}</span>
                              <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                                <div className={`h-full rounded-lg flex items-center justify-end pe-2 transition-all duration-700 ${counts[i]>0?'bg-gradient-to-r from-emerald-400 to-emerald-500':''}`}
                                  style={{ width:`${counts[i]>0?Math.max(Math.round((counts[i]/maxC)*100),10):0}%` }}>
                                  {counts[i]>0 && <span className="text-[10px] font-black text-white">{counts[i]}</span>}
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-slate-400 w-6 text-start">{counts[i]}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* ── Top hours + Today's schedule ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">تحليل</p>
                    <h3 className="font-black text-slate-900 mb-5">الأوقات الأكثر طلباً</h3>
                    {topHours.length === 0 ? (
                      <div className="text-center py-8">
                        <i className="fas fa-clock text-3xl text-gray-200 mb-3 block" />
                        <p className="text-slate-400 text-sm font-bold">لا توجد بيانات بعد</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {topHours.slice(0,7).map(([h, cnt], i) => {
                          const maxHr = topHours[0]?.[1] || 1;
                          const pct = Math.round((cnt / maxHr) * 100);
                          const colors = ['bg-emerald-500','bg-blue-500','bg-violet-500','bg-amber-500','bg-teal-500','bg-pink-500','bg-orange-500'];
                          return (
                            <div key={h} className="flex items-center gap-3">
                              <span className="text-[11px] font-black text-slate-400 w-4 text-center">{i+1}</span>
                              <span className="text-sm font-black text-slate-700 w-12 shrink-0" dir="ltr">{h}</span>
                              <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                                <div className={`h-full ${colors[i]} rounded-lg flex items-center justify-end pe-2 transition-all duration-700`}
                                  style={{ width:`${Math.max(pct,12)}%` }}>
                                  <span className="text-[10px] font-black text-white">{cnt}</span>
                                </div>
                              </div>
                              <span className="text-[11px] text-slate-400 font-bold w-8 text-start">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-0.5">جدول اليوم</p>
                        <h3 className="font-black text-white">حجوزات اليوم</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-white/20 rounded-xl px-3 py-1.5">
                          <span className="text-white text-sm font-black">{todayBooks.length} حجز</span>
                        </div>
                        {todayRevenue > 0 && (
                          <div className="bg-white/20 rounded-xl px-3 py-1.5">
                            <span className="text-white text-sm font-black">{todayRevenue} د.أ</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {todayBooks.length === 0 ? (
                      <div className="p-10 text-center">
                        <div className="text-4xl mb-3">📅</div>
                        <p className="text-slate-400 font-bold text-sm">لا توجد حجوزات اليوم</p>
                        <p className="text-slate-300 text-xs mt-1">الملعب متاح بالكامل</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                        {todayBooks.map(b => (
                          <div key={b.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                            <div className={`w-2 h-8 rounded-full shrink-0 ${b.status==='مؤكد'?'bg-emerald-400':b.status==='قيد الانتظار'?'bg-amber-400':'bg-red-300'}`} />
                            <div className="flex-1">
                              <p className="text-sm font-black text-slate-800" dir="ltr">{b.timeSlot}</p>
                              <span className={`text-[10px] font-bold ${b.status==='مؤكد'?'text-emerald-600':b.status==='ملغي'?'text-red-400':'text-amber-600'}`}>{b.status}</span>
                            </div>
                            <span className="text-sm font-black text-emerald-600">{b.price} <span className="text-xs text-slate-400">د.أ</span></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Rating overview ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">تقييمات العملاء</p>
                      <h3 className="font-black text-slate-900">نظرة عامة على التقييمات</h3>
                    </div>
                    <button onClick={() => navTo('reviews')} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                      عرض الكل <i className="fas fa-arrow-left text-xs" />
                    </button>
                  </div>
                  <div className="flex gap-8 items-center flex-wrap">
                    <div className="text-center shrink-0">
                      <p className="text-5xl font-black text-slate-900">{avgRating}</p>
                      <div className="flex items-center justify-center gap-1 my-2">
                        {[1,2,3,4,5].map(s => (
                          <i key={s} className={`fas fa-star text-sm ${parseFloat(avgRating)>=s?'text-amber-400':'text-gray-200'}`} />
                        ))}
                      </div>
                      <p className="text-slate-400 text-xs font-bold">{reviews.length} تقييم</p>
                    </div>
                    <div className="flex-1 min-w-[160px] space-y-2">
                      {[5,4,3,2,1].map(s => {
                        const count = reviews.filter(r=>r.rating===s).length;
                        const pct   = reviews.length ? Math.round((count/reviews.length)*100) : 0;
                        return (
                          <div key={s} className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-bold w-3">{s}</span>
                            <i className="fas fa-star text-amber-400 text-[10px]" />
                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width:`${pct}%` }} />
                            </div>
                            <span className="text-[11px] text-slate-400 font-bold w-6 text-start">{count}</span>
                            <span className="text-[10px] text-slate-300 w-6">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-2 gap-3 shrink-0">
                      {[
                        { icon:'fa-thumbs-up',  bg:'bg-emerald-50', ic:'text-emerald-500', label:'5 نجوم',    val:reviews.filter(r=>r.rating===5).length },
                        { icon:'fa-star-half-alt', bg:'bg-amber-50',   ic:'text-amber-500',   label:'4 نجوم',    val:reviews.filter(r=>r.rating===4).length },
                        { icon:'fa-meh',        bg:'bg-blue-50',    ic:'text-blue-500',    label:'3 نجوم',    val:reviews.filter(r=>r.rating===3).length },
                        { icon:'fa-thumbs-down',bg:'bg-red-50',     ic:'text-red-400',     label:'1-2 نجوم',  val:reviews.filter(r=>r.rating<=2).length   },
                      ].map((r,i) => (
                        <div key={i} className={`${r.bg} rounded-xl p-3 text-center`}>
                          <i className={`fas ${r.icon} ${r.ic} text-sm mb-1 block`} />
                          <p className="font-black text-slate-800 text-base">{r.val}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{r.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Recent bookings + quick actions ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                      <div>
                        <span className="text-emerald-500 text-[11px] font-bold block mb-0.5">آخر النشاط</span>
                        <h3 className="font-black text-slate-900">آخر الحجوزات</h3>
                      </div>
                      <button onClick={() => navTo('bookings')} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                        عرض الكل <i className="fas fa-arrow-left text-xs" />
                      </button>
                    </div>
                    {loading ? (
                      <div className="p-10 text-center"><div className="w-7 h-7 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                    ) : bookings.length === 0 ? (
                      <div className="p-12 text-center"><div className="text-4xl mb-3">📅</div><p className="text-slate-400 font-bold text-sm">لا توجد حجوزات بعد</p></div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {bookings.slice(0,5).map(b => (
                          <div key={b.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${b.status==='مؤكد'?'bg-emerald-50':b.status==='ملغي'?'bg-red-50':'bg-amber-50'}`}>
                              <i className={`fas ${b.status==='مؤكد'?'fa-check text-emerald-500':b.status==='ملغي'?'fa-times text-red-400':'fa-clock text-amber-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-sm truncate">{b.fieldName}</p>
                              <p className="text-xs text-slate-400">{b.date} · <span dir="ltr">{b.timeSlot}</span></p>
                            </div>
                            <div className="text-end shrink-0">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${b.status==='مؤكد'?'bg-emerald-100 text-emerald-700':b.status==='ملغي'?'bg-red-100 text-red-600':'bg-amber-100 text-amber-700'}`}>{b.status}</span>
                              <p className="text-xs font-black text-emerald-600 mt-1">{b.price} <span className="font-bold">د.أ</span></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider">إجراءات سريعة</p>
                    {[
                      { icon:'fa-calendar-alt',      color:'emerald', label:'الحجوزات المعلّقة', count:pending.length,   to:'bookings'    as Tab, sub:undefined },
                      { icon:'fa-trophy',             color:'violet',  label:'طلبات البطولات',   count:pendingTourney,   to:'tournaments' as Tab, sub:undefined },
                      { icon:'fa-star',               color:'amber',   label:'التقييمات',         count:reviews.length,   to:'reviews'     as Tab, sub:undefined },
                      { icon:'fa-exclamation-circle', color:'red',     label:'الشكاوي',           count:unresolved,       to:'settings'    as Tab, sub:undefined },
                      { icon:'fa-map-marker-alt',     color:'teal',    label:'إعدادات الملعب',   count:0,               to:'field'       as Tab, sub:undefined },
                    ].map(a => (
                      <button key={a.to} onClick={() => { navTo(a.to); if(a.to==='settings') setSSub('complaints'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-start group">
                        <div className={`w-9 h-9 rounded-xl bg-${a.color}-50 flex items-center justify-center shrink-0`}>
                          <i className={`fas ${a.icon} text-${a.color}-500 text-sm`} />
                        </div>
                        <span className="flex-1 text-sm font-bold text-slate-700 group-hover:text-slate-900">{a.label}</span>
                        {a.count > 0 && <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">{a.count}</span>}
                        <i className="fas fa-arrow-left text-slate-300 text-xs" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Calendar section ── */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-emerald-500 rounded-full" />
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">جدول الملعب</p>
                      <h2 className="text-lg font-black text-slate-900">تقويم الحجوزات</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-5">
                        <button onClick={() => { setCalMonth(m => new Date(m.getFullYear(), m.getMonth()-1,1)); setCalDay(null); }}
                          className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                          <i className="fas fa-chevron-right text-sm" />
                        </button>
                        <h3 className="font-black text-slate-900">{calMonth.toLocaleString('ar-EG',{month:'long',year:'numeric'})}</h3>
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
                          const d = i+1, key = monthKey(d);
                          const dayBooks  = (bookingsByDate[key]||[]).filter(b=>b.status!=='ملغي').length;
                          const isBlocked = (blockedSlots[key]||[]).length > 0;
                          const isSel     = calDay === key;
                          const isToday   = key === today;
                          return (
                            <button key={d} onClick={() => setCalDay(isSel?null:key)}
                              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all ${
                                isSel     ? 'bg-slate-900 text-white shadow-lg' :
                                isToday   ? 'ring-2 ring-emerald-400 text-emerald-700 bg-emerald-50' :
                                dayBooks  ? 'bg-amber-50 border-2 border-amber-200 text-amber-800 hover:bg-amber-100' :
                                isBlocked ? 'bg-red-50 border-2 border-red-200 text-red-600' :
                                            'hover:bg-gray-50 text-slate-600'
                              }`}>
                              <span>{d}</span>
                              {dayBooks > 0 && <span className={`text-[8px] mt-0.5 ${isSel?'text-amber-300':'text-amber-500'}`}>{dayBooks}</span>}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200 inline-block" />محجوز</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 inline-block" />متاح</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-200 inline-block" />محجوب</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded ring-2 ring-emerald-400 inline-block" />اليوم</span>
                      </div>
                    </div>

                    <div>
                      {calDay ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full">
                          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                              <i className="fas fa-calendar-day text-emerald-500" />
                              {new Date(calDay+'T12:00:00').toLocaleDateString('ar-EG',{weekday:'long',month:'long',day:'numeric'})}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                                {(bookingsByDate[calDay]||[]).filter(b=>b.status!=='ملغي').length} حجز
                              </span>
                              <button onClick={() => setCalDay(null)} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
                                <i className="fas fa-times text-xs text-slate-400" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {HOURS.map(h => {
                              const bookedSlot = (bookingsByDate[calDay]||[]).find(b => b.timeSlot?.startsWith(h) && b.status!=='ملغي');
                              const isBlocked  = (blockedSlots[calDay]||[]).includes(h);
                              return (
                                <div key={h} onClick={() => !bookedSlot && toggleBlock(calDay, h)}
                                  className={`rounded-xl p-2.5 text-center border-2 relative transition-all ${
                                    bookedSlot ? 'bg-amber-50 border-amber-200' :
                                    isBlocked  ? 'bg-red-50 border-red-200 cursor-pointer hover:bg-red-100' :
                                                 'bg-emerald-50 border-emerald-200 cursor-pointer hover:bg-emerald-100'
                                  }`}>
                                  <p className="text-xs font-black" dir="ltr">{h}</p>
                                  <p className={`text-[9px] font-bold mt-0.5 ${bookedSlot?'text-amber-600':isBlocked?'text-red-500':'text-emerald-600'}`}>
                                    {bookedSlot?'محجوز':isBlocked?'محجوب':'متاح'}
                                  </p>
                                  {isBlocked && !bookedSlot && (
                                    <div className="absolute top-1 end-1 w-3 h-3 bg-red-400 rounded-full flex items-center justify-center">
                                      <i className="fas fa-lock text-white text-[6px]" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-xs text-slate-400 mt-3 text-center">اضغط على الخانة المتاحة لحجبها · اضغط على المحجوبة لإلغاء الحجب</p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 h-full flex flex-col items-center justify-center text-center min-h-[280px]">
                          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <i className="fas fa-calendar-day text-slate-300 text-2xl" />
                          </div>
                          <p className="font-black text-slate-600 mb-1">اختر يوماً من التقويم</p>
                          <p className="text-sm text-slate-400">لعرض الحجوزات وإدارة الأوقات المتاحة</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ── BOOKINGS ─────────────────────────────────────────────────────── */}
          {tab === 'bookings' && (
            <div className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">إدارة</p>
                  <h2 className="text-xl font-black text-slate-900">الحجوزات</h2>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { id:'all'       as BookingFilter, label:`الكل (${bookings.length})`    },
                    { id:'pending'   as BookingFilter, label:`معلّقة (${pending.length})`   },
                    { id:'confirmed' as BookingFilter, label:`مؤكدة (${confirmed.length})`  },
                    { id:'cancelled' as BookingFilter, label:`ملغاة (${cancelled.length})`  },
                  ]).map(bt => (
                    <button key={bt.id} onClick={() => setBFilter(bt.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                        bFilter===bt.id ? 'bg-slate-900 border-slate-900 text-white' : 'border-gray-200 text-slate-600 bg-white hover:border-slate-400'
                      }`}>{bt.label}</button>
                  ))}
                </div>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="bg-white rounded-2xl p-14 text-center border border-gray-100 shadow-sm">
                  <i className="fas fa-calendar text-5xl text-gray-200 mb-4 block" />
                  <p className="text-slate-400 font-bold">لا توجد حجوزات في هذا التصنيف</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map(b => (
                    <div key={b.id} onClick={() => navigate(`/owner/booking/${b.id}`, { state: { booking: b } })}
                      className={`bg-white rounded-2xl border-2 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all cursor-pointer ${
                        b.status==='قيد الانتظار'?'border-amber-200 hover:border-amber-300 hover:shadow-md':b.status==='مؤكد'?'border-emerald-200 hover:border-emerald-300 hover:shadow-md':'border-red-100 opacity-80'
                      }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        b.status==='قيد الانتظار'?'bg-amber-50':b.status==='مؤكد'?'bg-emerald-50':'bg-red-50'
                      }`}>
                        <i className={`fas ${b.status==='قيد الانتظار'?'fa-clock text-amber-500':b.status==='مؤكد'?'fa-check-circle text-emerald-500':'fa-times-circle text-red-400'} text-lg`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-black text-slate-900">{b.fieldName}</p>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            b.status==='مؤكد'?'bg-emerald-100 text-emerald-700':b.status==='ملغي'?'bg-red-100 text-red-600':'bg-amber-100 text-amber-700'
                          }`}>{b.status}</span>
                          {(b as any).paymentMethod && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(b as any).paymentMethod==='visa'?'bg-blue-50 text-blue-600':'bg-gray-100 text-gray-600'}`}>
                              <i className={`fas ${(b as any).paymentMethod==='visa'?'fa-credit-card':'fa-money-bill'} me-1`} />
                              {(b as any).paymentMethod==='visa'?'فيزا':'كاش'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{b.date} · <span dir="ltr">{b.timeSlot}</span></p>
                        <p className="text-lg font-black text-emerald-600 mt-1">{b.price} <span className="text-sm font-medium">د.أ</span></p>
                      </div>
                      {b.status === 'قيد الانتظار' && (
                        <div className="flex gap-3" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleBooking(b.id,'accept')}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 justify-center shadow-sm shadow-emerald-200">
                            <i className="fas fa-check" /> قبول
                          </button>
                          <button onClick={() => handleBooking(b.id,'cancel')}
                            className="flex-1 sm:flex-none px-5 py-2.5 border-2 border-red-100 text-red-500 hover:bg-red-50 font-bold rounded-xl text-sm transition-all flex items-center gap-2 justify-center">
                            <i className="fas fa-times" /> رفض
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CALENDAR ─────────────────────────────────────────────────────── */}
          {tab === 'calendar' && (
            <div className="p-4 sm:p-6 space-y-5">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">جدول</p>
                <h2 className="text-xl font-black text-slate-900">التقويم</h2>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon:'fa-calendar-check', label:'حجوزات الشهر',  val: bookings.filter(b=>b.date?.startsWith(currentMonthStr)&&b.status!=='ملغي').length, bg:'bg-blue-50 border-blue-200',    ic:'text-blue-500'    },
                  { icon:'fa-money-bill-wave', label:'إيرادات الشهر', val: `${thisMonthRevenue} د.أ`,                                                          bg:'bg-emerald-50 border-emerald-200',ic:'text-emerald-500' },
                  { icon:'fa-lock',            label:'أوقات محجوبة',  val: Object.values(blockedSlots).flat().length,                                           bg:'bg-red-50 border-red-200',       ic:'text-red-400'     },
                  { icon:'fa-clock',           label:'ساعات العمل',   val:`${fieldForm.openHour}–${fieldForm.closeHour}`,                                        bg:'bg-amber-50 border-amber-200',   ic:'text-amber-500'   },
                ].map((s,i) => (
                  <div key={i} className={`rounded-2xl border p-4 ${s.bg}`}>
                    <i className={`fas ${s.icon} ${s.ic} text-lg mb-2 block`} />
                    <p className="font-black text-slate-900 text-lg leading-tight">{s.val}</p>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Two-column: calendar | day detail */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

                {/* Calendar card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-5">
                    <button onClick={() => { setCalMonth(m => new Date(m.getFullYear(), m.getMonth()-1,1)); setCalDay(null); }}
                      className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                      <i className="fas fa-chevron-right text-sm" />
                    </button>
                    <h3 className="font-black text-slate-900">{calMonth.toLocaleString('ar-EG',{month:'long',year:'numeric'})}</h3>
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
                      const d = i+1, key = monthKey(d);
                      const dayBooks   = (bookingsByDate[key]||[]).filter(b=>b.status!=='ملغي').length;
                      const isBlocked  = (blockedSlots[key]||[]).length > 0;
                      const isSel      = calDay === key;
                      const isToday    = key === today;
                      return (
                        <button key={d} onClick={() => setCalDay(isSel?null:key)}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all ${
                            isSel     ? 'bg-slate-900 text-white shadow-lg' :
                            isToday   ? 'ring-2 ring-emerald-400 text-emerald-700 bg-emerald-50' :
                            dayBooks  ? 'bg-amber-50 border-2 border-amber-200 text-amber-800 hover:bg-amber-100' :
                            isBlocked ? 'bg-red-50 border-2 border-red-200 text-red-600' :
                                        'hover:bg-gray-50 text-slate-600'
                          }`}>
                          <span>{d}</span>
                          {dayBooks > 0 && <span className={`text-[8px] mt-0.5 ${isSel?'text-amber-300':'text-amber-500'}`}>{dayBooks}</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200 inline-block"/>محجوز</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 inline-block"/>متاح</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-200 inline-block"/>محجوب</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded ring-2 ring-emerald-400 inline-block"/>اليوم</span>
                  </div>
                </div>

                {/* Day detail panel */}
                {calDay ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">تفاصيل اليوم</p>
                        <h3 className="font-black text-slate-900 text-sm">
                          {new Date(calDay+'T12:00:00').toLocaleDateString('ar-EG',{weekday:'long',month:'long',day:'numeric'})}
                        </h3>
                      </div>
                      <span className={`text-xs font-black px-3 py-1.5 rounded-xl ${
                        (bookingsByDate[calDay]||[]).filter(b=>b.status!=='ملغي').length > 0
                          ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {(bookingsByDate[calDay]||[]).filter(b=>b.status!=='ملغي').length} حجز
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {HOURS.map(h => {
                        const bookedSlot = (bookingsByDate[calDay]||[]).find(b => b.timeSlot?.startsWith(h) && b.status!=='ملغي');
                        const isBlocked  = (blockedSlots[calDay]||[]).includes(h);
                        return (
                          <div key={h} onClick={() => !bookedSlot && toggleBlock(calDay, h)}
                            className={`rounded-xl p-3 text-center border-2 relative transition-all ${
                              bookedSlot ? 'bg-amber-50 border-amber-200' :
                              isBlocked  ? 'bg-red-50 border-red-200 cursor-pointer hover:bg-red-100' :
                                           'bg-emerald-50 border-emerald-200 cursor-pointer hover:bg-emerald-100'
                            }`}>
                            <p className="text-sm font-black" dir="ltr">{h}</p>
                            <p className={`text-[9px] font-bold mt-0.5 ${bookedSlot?'text-amber-600':isBlocked?'text-red-500':'text-emerald-600'}`}>
                              {bookedSlot?'محجوز':isBlocked?'محجوب':'متاح'}
                            </p>
                            {isBlocked && !bookedSlot && (
                              <div className="absolute top-1 end-1 w-3 h-3 bg-red-400 rounded-full flex items-center justify-center">
                                <i className="fas fa-lock text-white text-[6px]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-400 mt-3 text-center font-bold">اضغط على الخانة المتاحة لحجبها</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
                    <i className="fas fa-calendar-day text-4xl text-gray-200 mb-3 block"/>
                    <p className="font-black text-slate-400 text-sm mb-1">اختر يوماً من التقويم</p>
                    <p className="text-slate-300 text-xs">لعرض الحجوزات وإدارة الأوقات المتاحة</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MY FIELD ─────────────────────────────────────────────────────── */}
          {tab === 'field' && (
            <div className="p-4 sm:p-6 space-y-5">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">إدارة</p>
                <h2 className="text-xl font-black text-slate-900">إعدادات الملعب</h2>
              </div>

              {/* Field status card */}
              <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
                <div className="absolute -top-6 -end-6 w-24 h-24 bg-emerald-500/10 rounded-full" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                    <i className="fas fa-map-marker-alt text-emerald-400 text-2xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-lg truncate">{field?.name || fieldForm.name || 'ملعبي'}</p>
                    <p className="text-slate-400 text-sm">{fieldForm.city} · {fieldForm.size} · {fieldForm.surface}</p>
                  </div>
                  <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black px-3 py-1.5 rounded-xl shrink-0">
                    <i className="fas fa-circle text-[8px] me-1 animate-pulse" />نشط
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10 text-center">
                  {[
                    { label:'السعر العادي',  val:`${fieldForm.priceWeekday} د.أ` },
                    { label:'سعر العطلة',   val:`${fieldForm.priceWeekend} د.أ` },
                    { label:'ساعات العمل',  val:`${fieldForm.openHour}–${fieldForm.closeHour}` },
                  ].map((s,i) => (
                    <div key={i}>
                      <p className="font-black text-white text-sm">{s.val}</p>
                      <p className="text-slate-500 text-[11px] font-bold">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon:'fa-calendar-check', label:'الحجوزات المؤكدة', val:confirmed.length,  bg:'bg-emerald-50 border-emerald-200 text-emerald-700' },
                  { icon:'fa-star',            label:'متوسط التقييم',    val:avgRating,         bg:'bg-amber-50   border-amber-200   text-amber-700'   },
                  { icon:'fa-money-bill-wave', label:'إجمالي الإيرادات', val:`${revenue} د.أ`,  bg:'bg-blue-50    border-blue-200    text-blue-700'    },
                ].map((s,i) => (
                  <div key={i} className={`rounded-2xl border p-4 text-center ${s.bg}`}>
                    <i className={`fas ${s.icon} text-xl mb-1.5 block`} />
                    <p className="font-black text-lg">{s.val}</p>
                    <p className="text-[11px] font-bold opacity-70 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Two-column: form | image + amenities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

                {/* LEFT: form */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <h3 className="font-black text-slate-900 flex items-center gap-2"><i className="fas fa-info-circle text-emerald-500"/>المعلومات الأساسية</h3>
                    <div className="space-y-3">
                      {[
                        { label:'اسم الملعب', key:'name'    },
                        { label:'العنوان',    key:'address' },
                        { label:'المدينة',    key:'city'    },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wide">{f.label}</label>
                          <input value={(fieldForm as any)[f.key]} onChange={e => setFieldForm(p => ({ ...p, [f.key]: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none transition-colors text-sm bg-gray-50"/>
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wide">حجم الملعب</label>
                          <select value={fieldForm.size} onChange={e => setFieldForm(p => ({ ...p, size: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none text-sm bg-gray-50">
                            {['5v5','7v7','8v8','11v11'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wide">الأرضية</label>
                          <select value={fieldForm.surface} onChange={e => setFieldForm(p => ({ ...p, surface: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none text-sm bg-gray-50">
                            {['عشب صناعي','عشب طبيعي','إسمنت','باركيه'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wide">وصف الملعب</label>
                        <textarea value={fieldForm.description} rows={3} onChange={e => setFieldForm(p => ({ ...p, description: e.target.value }))}
                          placeholder="اكتب وصفاً مختصراً للملعب..."
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none text-sm bg-gray-50 resize-none"/>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                    <h3 className="font-black text-slate-900 flex items-center gap-2"><i className="fas fa-money-bill-wave text-emerald-500"/>التسعيرة وأوقات العمل</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label:'سعر يوم عادي (د.أ)', key:'priceWeekday', type:'number' },
                        { label:'سعر العطلة (د.أ)',   key:'priceWeekend', type:'number' },
                        { label:'فتح الملعب',          key:'openHour',    type:'time'   },
                        { label:'إغلاق الملعب',         key:'closeHour',   type:'time'   },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wide">{f.label}</label>
                          <input type={f.type} value={(fieldForm as any)[f.key]} onChange={e => setFieldForm(p => ({ ...p, [f.key]: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none text-sm bg-gray-50"/>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT: image + amenities */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="relative h-52 bg-slate-800">
                      {field?.images?.[0]
                        ? <img src={field.images[0]} className="w-full h-full object-cover" alt="الملعب"/>
                        : <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                            <i className="fas fa-image text-slate-600 text-4xl"/>
                            <p className="text-slate-400 text-sm font-bold">لا توجد صورة</p>
                            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-all">
                              <i className="fas fa-upload"/>رفع صورة
                            </button>
                          </div>
                      }
                      {field?.images?.[0] && (
                        <button className="absolute bottom-3 end-3 flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-700 text-xs font-bold rounded-xl backdrop-blur-sm shadow-sm transition-all">
                          <i className="fas fa-camera"/>تغيير الصورة
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2"><i className="fas fa-concierge-bell text-emerald-500"/>المرافق والخدمات</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {AMENITY_LIST.map(am => {
                        const active = (fieldForm.amenities as any)[am.key];
                        return (
                          <button key={am.key} onClick={() => setFieldForm(p => ({ ...p, amenities: { ...p.amenities, [am.key]: !active } }))}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all ${
                              active ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-gray-50 border-gray-200 text-slate-400 hover:border-gray-300'
                            }`}>
                            <i className={`fas ${am.icon} text-base`}/>
                            <span className="text-[11px] font-bold leading-tight">{am.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button onClick={handleSaveField}
                    className={`w-full py-4 font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm ${
                      savedField ? 'bg-emerald-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}>
                    <i className={`fas ${savedField?'fa-check':'fa-save'}`}/>
                    {savedField ? 'تم الحفظ!' : 'حفظ إعدادات الملعب'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TOURNAMENTS ──────────────────────────────────────────────────── */}
          {tab === 'tournaments' && (
            <div className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">الاستضافة</p>
                  <h2 className="text-xl font-black text-slate-900">طلبات البطولات</h2>
                </div>
                {pendingTourney > 0 && (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold rounded-xl">
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
                    {pendingTourney} طلب جديد
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label:'في الانتظار', val:tournaments.filter(t=>t.status==='pending').length,  color:'bg-amber-50  border-amber-200  text-amber-700',  icon:'fa-clock'       },
                  { label:'مقبولة',      val:tournaments.filter(t=>t.status==='accepted').length, color:'bg-emerald-50 border-emerald-200 text-emerald-700', icon:'fa-check-circle' },
                  { label:'مرفوضة',      val:tournaments.filter(t=>t.status==='declined').length, color:'bg-red-50    border-red-200    text-red-600',    icon:'fa-times-circle' },
                ].map((s,i) => (
                  <div key={i} className={`rounded-2xl border p-4 text-center ${s.color}`}>
                    <i className={`fas ${s.icon} text-lg mb-1 block`} />
                    <p className="text-2xl font-black">{s.val}</p>
                    <p className="text-xs font-bold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {tournaments.map(r => (
                  <div key={r.id} onClick={() => navigate(`/owner/tournament/${r.id}`, { state: { tournament: r } })}
                    className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all cursor-pointer ${
                      r.status==='pending'?'border-gray-100 hover:border-violet-200 hover:shadow-md':r.status==='accepted'?'border-emerald-200 hover:shadow-md':'border-red-100 opacity-70'
                    }`}>
                    <div className={`px-5 py-4 flex items-center justify-between border-b ${
                      r.status==='accepted'?'border-emerald-100 bg-emerald-50/60':r.status==='declined'?'border-red-100 bg-red-50/60':'border-gray-100 bg-gray-50/60'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          r.status==='accepted'?'bg-emerald-100 text-emerald-600':r.status==='declined'?'bg-red-100 text-red-500':'bg-violet-100 text-violet-600'
                        }`}>
                          <i className={`fas ${r.status==='accepted'?'fa-check':r.status==='declined'?'fa-times':'fa-trophy'} text-sm`} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{r.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            <i className="fas fa-user-tie me-1" />{r.organizer} · <i className="fas fa-phone me-1" />{r.phone}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        r.status==='accepted'?'bg-emerald-100 text-emerald-700':r.status==='declined'?'bg-red-100 text-red-600':'bg-amber-100 text-amber-700'
                      }`}>{r.status==='accepted'?'✓ مقبول':r.status==='declined'?'✕ مرفوض':'⏳ انتظار'}</span>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {[
                          { icon:'fa-sitemap',  label:'النظام',  val:r.format         },
                          { icon:'fa-users',    label:'الفرق',   val:`${r.teams} فرق` },
                          { icon:'fa-calendar', label:'البداية', val:r.startDate      },
                          { icon:'fa-clock',    label:'الوقت',   val:r.time           },
                        ].map((d,i) => (
                          <div key={i} className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-1 mb-1">
                              <i className={`fas ${d.icon} text-gray-400 text-[10px]`} />
                              <span className="text-[10px] text-gray-400 font-bold">{d.label}</span>
                            </div>
                            <p className="text-sm font-black text-slate-700">{d.val}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {r.days.map(d => (
                          <span key={d} className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                            <i className="fas fa-calendar-day me-1 text-slate-400" />{d}
                          </span>
                        ))}
                      </div>
                      {r.notes && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                          <p className="text-xs text-blue-700"><i className="fas fa-quote-right me-1.5 text-blue-300" />{r.notes}</p>
                        </div>
                      )}
                      {r.status === 'pending' && (
                        <div className="flex gap-3" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleTourney(r.id,'accept')}
                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-200">
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
                ))}
              </div>
            </div>
          )}

          {/* ── MANAGE TOURNAMENTS ───────────────────────────────────────────── */}
          {tab === 'manage-tournaments' && (
            <div className="p-4 sm:p-6 space-y-5">
              {/* Header */}
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">لوحة التحكم</p>
                <h2 className="text-xl font-black text-slate-900">إدارة البطولات</h2>
                <p className="text-slate-500 text-sm mt-1">البطولات المضافة في ملعبك — اختر بطولة لإدارة مبارياتها ونتائجها</p>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'إجمالي البطولات', val: tournaments.length, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
                  { label: 'جارية / مقبولة',  val: tournaments.filter(t => t.status === 'accepted').length, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                  { label: 'في الانتظار',     val: tournaments.filter(t => t.status === 'pending').length,  color: 'text-amber-700',   bg: 'bg-amber-50  border-amber-200'  },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.bg}`}>
                    <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Tournament cards */}
              {tournaments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <i className="fas fa-trophy text-5xl text-gray-200 mb-3 block" />
                  <p className="font-bold text-slate-400">لا توجد بطولات مضافة لملعبك بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tournaments.map(t => {
                    const statusCfg =
                      t.status === 'accepted' ? { label: 'مقبولة ✓', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' } :
                      t.status === 'declined' ? { label: 'مرفوضة ✕', bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200'     } :
                                                { label: '⏳ انتظار', bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200'   };
                    return (
                      <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Card header */}
                        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                              <i className="fas fa-trophy text-violet-300 text-sm" />
                            </div>
                            <div>
                              <p className="text-white font-black text-sm">{t.name}</p>
                              <p className="text-slate-400 text-[11px] mt-0.5">
                                <i className="fas fa-user-tie me-1" />{t.organizer}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                            {statusCfg.label}
                          </span>
                        </div>

                        {/* Card body */}
                        <div className="px-5 py-4">
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            {[
                              { icon: 'fa-sitemap',       label: 'النظام',      val: t.format    },
                              { icon: 'fa-users',         label: 'الفرق',       val: `${t.teams} فريق` },
                              { icon: 'fa-calendar-check',label: 'تاريخ البدء', val: t.startDate },
                            ].map(f => (
                              <div key={f.label} className="bg-gray-50 rounded-xl p-3 text-center">
                                <i className={`fas ${f.icon} text-slate-400 text-xs mb-1 block`} />
                                <p className="font-black text-slate-800 text-sm">{f.val}</p>
                                <p className="text-[10px] text-slate-400">{f.label}</p>
                              </div>
                            ))}
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-3">
                            {t.status === 'accepted' ? (
                              <button
                                onClick={() => navigate(`/manage-tournament/${t.id}`, { state: { ownerTournament: t } })}
                                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-200"
                              >
                                <i className="fas fa-tools" /> إدارة البطولة
                              </button>
                            ) : t.status === 'pending' ? (
                              <div className="flex-1 py-3 bg-amber-50 border border-amber-200 text-amber-600 font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                                <i className="fas fa-clock" /> في انتظار الموافقة
                              </div>
                            ) : (
                              <div className="flex-1 py-3 bg-gray-50 border border-gray-200 text-gray-400 font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                                <i className="fas fa-times-circle" /> تم رفض الطلب
                              </div>
                            )}
                            <button
                              onClick={() => navigate(`/owner/tournament/${t.id}`, { state: { tournament: t } })}
                              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                            >
                              <i className="fas fa-eye" /> التفاصيل
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── REVIEWS ──────────────────────────────────────────────────────── */}
          {tab === 'reviews' && (
            <div className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">آراء العملاء</p>
                  <h2 className="text-xl font-black text-slate-900">التقييمات</h2>
                </div>
                <span className="text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-xl">
                  <i className="fas fa-star text-amber-400 me-1" />{reviews.length} تقييم مجموع
                </span>
              </div>

              {/* Two-column: overview panel | reviews list */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                {/* LEFT: rating overview + filters */}
                <div className="space-y-4">
                  <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg">
                    <div className="absolute -top-6 -end-6 w-24 h-24 bg-amber-400/10 rounded-full"/>
                    <div className="relative z-10 text-center mb-4">
                      <p className="text-6xl font-black text-amber-400">{avgRating}</p>
                      <div className="flex gap-1 justify-center mt-2">
                        {[1,2,3,4,5].map(s=>(
                          <i key={s} className={`fas fa-star text-base ${parseFloat(avgRating as string)>=s?'text-amber-400':'text-slate-600'}`}/>
                        ))}
                      </div>
                      <p className="text-slate-400 text-xs mt-1 font-bold">{reviews.length} تقييم</p>
                    </div>
                    <div className="space-y-2">
                      {[5,4,3,2,1].map(s=>{
                        const count=reviews.filter(r=>r.rating===s).length;
                        const pct=reviews.length?Math.round((count/reviews.length)*100):0;
                        return(
                          <button key={s} onClick={()=>setReviewFilter(reviewFilter===s?0:s)}
                            className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity">
                            <span className="text-[11px] text-slate-400 font-bold w-3">{s}</span>
                            <i className="fas fa-star text-amber-400 text-[9px]"/>
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-700 ${reviewFilter===s?'bg-amber-300':'bg-amber-400'}`} style={{width:`${pct}%`}}/>
                            </div>
                            <span className="text-[11px] text-slate-400 font-bold w-4">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10">
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="font-black text-base text-emerald-400">{Math.round((Object.values(replySent).filter(Boolean).length/Math.max(reviews.length,1))*100)}%</p>
                        <p className="text-slate-400 text-[10px] font-bold mt-0.5">معدل الرد</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="font-black text-base text-amber-400">{reviews.filter(r=>r.rating>=4).length}</p>
                        <p className="text-slate-400 text-[10px] font-bold mt-0.5">إيجابي</p>
                      </div>
                    </div>
                  </div>

                  {/* Filter chips */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">تصفية حسب النجوم</p>
                    <button onClick={()=>setReviewFilter(0)}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${reviewFilter===0?'bg-slate-900 border-slate-900 text-white':'bg-white border-gray-200 text-slate-500 hover:border-slate-400'}`}>
                      الكل ({reviews.length})
                    </button>
                    {[5,4,3,2,1].map(s=>(
                      <button key={s} onClick={()=>setReviewFilter(reviewFilter===s?0:s)}
                        className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${reviewFilter===s?'bg-amber-500 border-amber-500 text-white':'bg-white border-gray-200 text-slate-500 hover:border-amber-300'}`}>
                        <i className="fas fa-star text-[10px]"/>{s} نجوم ({reviews.filter(r=>r.rating===s).length})
                      </button>
                    ))}
                  </div>
                </div>

                {/* RIGHT: review cards list */}
                <div className="lg:col-span-2 space-y-4">
                  {reviews.filter(r=>reviewFilter===0||r.rating===reviewFilter).map(r=>(
                    <div key={r.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md ${
                      r.rating>=4?'border-amber-100 hover:border-amber-200':r.rating===3?'border-blue-100 hover:border-blue-200':'border-red-100 hover:border-red-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <img src={r.avatar} alt={r.name} className="w-11 h-11 rounded-2xl object-cover flex-shrink-0 border-2 border-gray-100"/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-black text-slate-900">{r.name}</p>
                              <p className="text-[11px] text-slate-400 font-bold">{r.date}</p>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              {[1,2,3,4,5].map(s=><i key={s} className={`fas fa-star text-sm ${r.rating>=s?'text-amber-400':'text-gray-100'}`}/>)}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{r.comment}</p>
                        </div>
                      </div>
                      <div className="mt-3 border-t border-gray-50 pt-3">
                        {replySent[r.id]?(
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                            <i className="fas fa-reply text-emerald-500 text-sm"/>
                            <p className="text-xs font-bold text-emerald-700">ردّك: {replyText[r.id]}</p>
                          </div>
                        ):(
                          <div className="flex gap-2">
                            <div className="w-7 h-7 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 text-white text-xs font-black">
                              {(user?.name||'م').charAt(0)}
                            </div>
                            <input type="text" value={replyText[r.id]||''} onChange={e=>setReplyText(p=>({...p,[r.id]:e.target.value}))}
                              placeholder="ردّ على هذا التقييم..."
                              className="flex-1 px-3 py-2 text-xs rounded-xl border-2 border-gray-200 focus:border-slate-800 outline-none bg-gray-50 transition-colors"/>
                            <button onClick={()=>handleSendReply(r.id)} disabled={!replyText[r.id]?.trim()}
                              className="px-4 py-2 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-30 flex items-center gap-1.5">
                              <i className="fas fa-paper-plane text-[10px]"/>إرسال
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {reviews.filter(r=>reviewFilter===0||r.rating===reviewFilter).length===0&&(
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                      <i className="fas fa-star text-4xl text-gray-200 mb-3 block"/>
                      <p className="font-bold text-slate-400">لا توجد تقييمات بهذه التصفية</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ─────────────────────────────────────────────────────── */}
          {tab === 'settings' && (
            <div className="p-4 sm:p-6 space-y-5">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">الحساب</p>
                <h2 className="text-xl font-black text-slate-900">الإعدادات</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
              {/* Sidebar nav tabs */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-1">
                {([
                  { id:'profile'    as SettingsSub, label:'الملف الشخصي', icon:'fa-user',               badge:0          },
                  { id:'reports'    as SettingsSub, label:'التقارير',      icon:'fa-chart-bar',          badge:0          },
                  { id:'complaints' as SettingsSub, label:'الشكاوي',       icon:'fa-exclamation-circle', badge:unresolved  },
                  { id:'config'     as SettingsSub, label:'التفضيلات',     icon:'fa-sliders-h',          badge:0          },
                ]).map(st=>(
                  <button key={st.id} onClick={()=>setSSub(st.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      sSub===st.id?'bg-slate-900 text-white':'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
                    }`}>
                    <i className={`fas ${st.icon} w-4 text-center shrink-0`}/>
                    <span className="flex-1 text-start">{st.label}</span>
                    {st.badge>0&&<span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{st.badge}</span>}
                  </button>
                ))}
              </div>
              {/* Content area */}
              <div className="lg:col-span-3">
              <div className="flex gap-2 flex-wrap lg:hidden mb-4">
                {([
                  { id:'profile'    as SettingsSub, label:'الملف الشخصي', icon:'fa-user',               badge:0         },
                  { id:'reports'    as SettingsSub, label:'التقارير',      icon:'fa-chart-bar',          badge:0         },
                  { id:'complaints' as SettingsSub, label:'الشكاوي',       icon:'fa-exclamation-circle', badge:unresolved },
                  { id:'config'     as SettingsSub, label:'التفضيلات',     icon:'fa-sliders-h',          badge:0         },
                ]).map(st => (
                  <button key={st.id} onClick={() => setSSub(st.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      sSub===st.id ? 'bg-slate-900 border-slate-900 text-white' : 'border-gray-200 bg-white text-slate-600 hover:border-slate-400'
                    }`}>
                    <i className={`fas ${st.icon} text-xs`} />{st.label}
                    {st.badge > 0 && <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{st.badge}</span>}
                  </button>
                ))}
              </div>
              {/* end mobile tabs */}

              {sSub === 'profile' && (
                <div className="space-y-5">

                  {/* Profile header */}
                  <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
                    <div className="absolute -top-8 -end-8 w-32 h-32 bg-emerald-500/10 rounded-full"/>
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden text-3xl font-black text-white">
                        {user.avatar
                          ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover"/>
                          : user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-xl truncate">{user.name}</p>
                        <p className="text-slate-400 text-sm truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black px-3 py-1 rounded-xl">مالك ملعب</span>
                          <span className="bg-white/10 text-slate-300 text-xs font-bold px-3 py-1 rounded-xl">
                            <i className="fas fa-map-marker-alt me-1"/>{fieldForm.city||'عمّان'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10 text-center">
                      {[
                        { label:'الحجوزات', val:bookings.length },
                        { label:'الإيرادات', val:`${revenue} د.أ` },
                        { label:'التقييم',   val:avgRating },
                      ].map((s,i)=>(
                        <div key={i}>
                          <p className="font-black text-white">{s.val}</p>
                          <p className="text-slate-500 text-[11px] font-bold">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Two columns: personal info | field info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                      <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                        <i className="fas fa-user text-emerald-500"/>المعلومات الشخصية
                      </h3>
                      {[
                        { label:'الاسم الكامل',     key:'name',  type:'text'  },
                        { label:'رقم الهاتف',        key:'phone', type:'tel'   },
                        { label:'البريد الإلكتروني', key:'email', type:'email' },
                      ].map(f=>(
                        <div key={f.key}>
                          <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wide">{f.label}</label>
                          <input type={f.type} value={(profileForm as any)[f.key]}
                            onChange={e=>setProfileForm(p=>({...p,[f.key]:e.target.value}))}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-slate-800 outline-none text-sm bg-gray-50 transition-colors"/>
                        </div>
                      ))}
                      <button onClick={()=>showToast('✅ تم حفظ المعلومات الشخصية',true)}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                        <i className="fas fa-save"/>حفظ المعلومات
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                      <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                        <i className="fas fa-map-marker-alt text-emerald-500"/>معلومات الملعب
                      </h3>
                      {[
                        { label:'اسم الملعب', key:'name'    },
                        { label:'العنوان',    key:'address' },
                        { label:'المدينة',    key:'city'    },
                      ].map(f=>(
                        <div key={f.key}>
                          <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wide">{f.label}</label>
                          <input value={(fieldForm as any)[f.key]}
                            onChange={e=>setFieldForm(p=>({...p,[f.key]:e.target.value}))}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-slate-800 outline-none text-sm bg-gray-50 transition-colors"/>
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wide">وصف الملعب</label>
                        <textarea value={fieldForm.description} rows={3}
                          onChange={e=>setFieldForm(p=>({...p,description:e.target.value}))}
                          placeholder="اكتب وصفاً مختصراً..."
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-slate-800 outline-none text-sm bg-gray-50 resize-none transition-colors"/>
                      </div>
                      <button onClick={()=>showToast('✅ تم حفظ معلومات الملعب',true)}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                        <i className="fas fa-save"/>حفظ معلومات الملعب
                      </button>
                    </div>
                  </div>

                  {/* Change password */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-black text-slate-900 mb-5 flex items-center gap-2 text-sm">
                      <i className="fas fa-lock text-slate-400"/>تغيير كلمة المرور
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label:'كلمة المرور الحالية', key:'current' },
                        { label:'الجديدة',              key:'next'    },
                        { label:'تأكيد الجديدة',        key:'confirm' },
                      ].map(f=>(
                        <div key={f.key}>
                          <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wide">{f.label}</label>
                          <input type="password" placeholder="••••••••"
                            value={(pwForm as any)[f.key]}
                            onChange={e=>setPwForm(p=>({...p,[f.key]:e.target.value}))}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-slate-800 outline-none text-sm bg-gray-50 transition-colors"/>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>{
                      if(pwForm.next!==pwForm.confirm){showToast('❌ كلمة المرور غير متطابقة',false);return;}
                      if(pwForm.next.length<6){showToast('❌ كلمة المرور قصيرة جداً',false);return;}
                      showToast('✅ تم تغيير كلمة المرور بنجاح',true);
                      setPwForm({current:'',next:'',confirm:''});
                    }}
                      className="mt-4 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                      <i className="fas fa-key"/>تغيير كلمة المرور
                    </button>
                  </div>
                </div>
              )}

              {sSub === 'reports' && (
                <div className="space-y-5">

                  {/* Revenue timeline cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon:'fa-clock',        label:'اليوم',        val:`${todayRevenue} د.أ`,       bg:'bg-blue-50   border-blue-200   text-blue-700',   ic:'text-blue-500'   },
                      { icon:'fa-calendar-week',label:'هذا الأسبوع',  val:`${thisWeekRevenue} د.أ`,    bg:'bg-violet-50 border-violet-200 text-violet-700', ic:'text-violet-500' },
                      { icon:'fa-calendar-alt', label:'هذا الشهر',    val:`${thisMonthRevenue} د.أ`,   bg:'bg-emerald-50 border-emerald-200 text-emerald-700',ic:'text-emerald-500'},
                      { icon:'fa-coins',        label:'الإجمالي',     val:`${revenue} د.أ`,            bg:'bg-amber-50  border-amber-200  text-amber-700',  ic:'text-amber-500'  },
                    ].map((s,i)=>(
                      <div key={i} className={`rounded-2xl border p-4 ${s.bg}`}>
                        <i className={`fas ${s.icon} ${s.ic} text-lg mb-2 block`}/>
                        <p className="font-black text-xl leading-none">{s.val}</p>
                        <p className="text-xs font-bold mt-1 opacity-70">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Booking stats + Revenue split */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2">
                        <i className="fas fa-calendar-check text-blue-500"/>إحصاءات الحجوزات
                      </h3>
                      <div className="space-y-3">
                        {[
                          { label:'الإجمالي',  val:bookings.length,  w:100,                                                                    tx:'text-slate-700',   bar:'bg-slate-200'   },
                          { label:'مؤكدة',     val:confirmed.length, w:bookings.length?Math.round(confirmed.length/bookings.length*100):0,      tx:'text-emerald-600', bar:'bg-emerald-400' },
                          { label:'معلّقة',    val:pending.length,   w:bookings.length?Math.round(pending.length/bookings.length*100):0,        tx:'text-amber-600',   bar:'bg-amber-400'   },
                          { label:'ملغية',     val:cancelled.length, w:bookings.length?Math.round(cancelled.length/bookings.length*100):0,      tx:'text-red-500',     bar:'bg-red-400'     },
                        ].map(s=>(
                          <div key={s.label} className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 w-14 shrink-0">{s.label}</span>
                            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${s.bar} rounded-full transition-all duration-700 flex items-center justify-end pe-1.5`}
                                style={{width:`${Math.max(s.w,s.val>0?6:0)}%`}}>
                                {s.w>12&&<span className="text-[9px] font-black text-white">{s.val}</span>}
                              </div>
                            </div>
                            <span className={`text-sm font-black w-7 text-end shrink-0 ${s.tx}`}>{s.val}</span>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                        <div className="bg-red-50 rounded-xl p-3 text-center">
                          <p className="font-black text-red-500 text-xl">{cancellationRate}%</p>
                          <p className="text-xs text-slate-500 font-bold mt-0.5">نسبة الإلغاء</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-3 text-center">
                          <p className="font-black text-emerald-600 text-xl">{occupancyPct}%</p>
                          <p className="text-xs text-slate-500 font-bold mt-0.5">نسبة الإشغال</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-5 text-white">
                      <h3 className="font-black mb-4 text-sm flex items-center gap-2">
                        <i className="fas fa-chart-pie text-emerald-400"/>توزيع الإيرادات
                      </h3>
                      <div className="text-center mb-5">
                        <p className="text-4xl font-black">{revenue}</p>
                        <p className="text-slate-400 text-xs font-bold mt-1">إجمالي الإيرادات (د.أ)</p>
                      </div>
                      <div className="space-y-4">
                        {[
                          { label:'كاش',          val:cashRev, color:'bg-emerald-500' },
                          { label:'فيزا / بطاقة', val:visaRev, color:'bg-blue-500'   },
                        ].map(p=>(
                          <div key={p.label}>
                            <div className="flex justify-between items-center mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${p.color}`}/>
                                <span className="text-sm font-bold text-slate-300">{p.label}</span>
                              </div>
                              <span className="font-black text-white text-sm">
                                {p.val} د.أ <span className="text-slate-500 font-normal text-xs">({revenue?Math.round((p.val/revenue)*100):0}%)</span>
                              </span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full ${p.color} rounded-full transition-all duration-700`}
                                style={{width:revenue?`${(p.val/revenue)*100}%`:'0%'}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
                        {[
                          { label:'متوسط التقييم', val:avgRating,                                                                        c:'text-amber-400'   },
                          { label:'أكثر يوم',       val:Object.entries(dayFreq).sort((a,b)=>b[1]-a[1])[0]?.[0]?.substring(0,4)||'—',     c:'text-blue-400'    },
                          { label:'أفضل وقت',       val:topHours[0]?.[0]||'—',                                                            c:'text-emerald-400' },
                        ].map((s,i)=>(
                          <div key={i} className="bg-white/5 rounded-xl py-2.5">
                            <p className={`font-black text-sm ${s.c}`} dir="ltr">{s.val}</p>
                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Booking by day chart */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2">
                      <i className="fas fa-chart-bar text-violet-500"/>الحجوزات حسب اليوم
                    </h3>
                    {(()=>{
                      const days=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
                      const counts=days.map(d=>dayFreq[d]||0);
                      const maxC=Math.max(...counts,1);
                      return(
                        <div className="space-y-2">
                          {days.map((d,i)=>(
                            <div key={d} className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400 w-16 shrink-0">{d}</span>
                              <div className="flex-1 h-7 bg-gray-100 rounded-xl overflow-hidden">
                                <div className={`h-full rounded-xl flex items-center justify-end pe-2 transition-all duration-700 ${counts[i]>0?'bg-gradient-to-r from-violet-400 to-violet-500':''}`}
                                  style={{width:`${counts[i]>0?Math.max(Math.round((counts[i]/maxC)*100),8):0}%`}}>
                                  {counts[i]>0&&<span className="text-[10px] font-black text-white">{counts[i]}</span>}
                                </div>
                              </div>
                              <span className="text-xs font-black text-slate-500 w-5 text-end shrink-0">{counts[i]}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Top booking hours */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2">
                      <i className="fas fa-clock text-amber-500"/>أكثر الأوقات حجزاً
                    </h3>
                    {topHours.length===0?(
                      <p className="text-center text-slate-400 text-sm py-6 font-bold">لا توجد بيانات بعد</p>
                    ):(
                      <div className="flex flex-wrap gap-2">
                        {topHours.slice(0,9).map(([hour,count],i)=>(
                          <div key={hour} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm ${
                            i===0?'bg-amber-50 border-amber-300 text-amber-700':
                            i<3 ?'bg-slate-50 border-slate-200 text-slate-700':'bg-gray-50 border-gray-200 text-slate-400'
                          }`}>
                            {i===0&&<i className="fas fa-crown text-amber-400 text-xs"/>}
                            <span dir="ltr">{hour}</span>
                            <span className="text-xs opacity-60">({count})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sSub === 'complaints' && (
                <div className="space-y-3">
                  {unresolved === 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                      <i className="fas fa-check-circle text-emerald-500 text-xl" />
                      <p className="font-bold text-emerald-700 text-sm">لا توجد شكاوي مفتوحة 🎉</p>
                    </div>
                  )}
                  {complaints.map(c => (
                    <div key={c.id} onClick={() => navigate(`/owner/complaint/${c.id}`, { state: { complaint: c } })}
                      className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all ${c.resolved?'border-gray-100 opacity-60':'border-red-200 hover:border-red-300'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <i className={`fas ${c.resolved?'fa-check-circle text-emerald-400':'fa-exclamation-circle text-red-400'} text-sm`} />
                            <p className="font-black text-slate-900 text-sm">{c.from}</p>
                            <span className="text-xs text-slate-400 bg-gray-100 px-2 py-0.5 rounded-full">{c.date}</span>
                          </div>
                          <p className="text-sm text-slate-600">{c.text}</p>
                        </div>
                        {!c.resolved && (
                          <button onClick={e => { e.stopPropagation(); handleResolve(c.id); }}
                            className="flex-shrink-0 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl transition-colors">
                            <i className="fas fa-check me-1" /> تم الحل
                          </button>
                        )}
                      </div>
                      {c.resolved && <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-600"><i className="fas fa-check-circle" /> تم حل هذه الشكوى</span>}
                    </div>
                  ))}
                </div>
              )}

              {sSub === 'config' && (
                <div className="space-y-4">

                  {/* Notification channels */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 bg-amber-50 border-b border-amber-100">
                      <p className="font-black text-slate-800 text-sm flex items-center gap-2">
                        <i className="fas fa-bell text-amber-400"/>قنوات الإشعارات
                      </p>
                    </div>
                    {([
                      { key:'notifications' as const, icon:'fa-mobile-alt',  label:'إشعارات التطبيق', desc:'تنبيه فوري عند كل حجز أو رسالة جديدة'   },
                      { key:'email'         as const, icon:'fa-envelope',     label:'البريد الإلكتروني', desc:'ملخص أسبوعي بالإيرادات والحجوزات'     },
                    ]).map((item,i,arr)=>(
                      <div key={item.key} className={`flex items-center justify-between px-5 py-4 ${i<arr.length-1?'border-b border-gray-50':''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${configToggles[item.key]?'bg-emerald-50 text-emerald-500':'bg-gray-100 text-slate-400'}`}>
                            <i className={`fas ${item.icon} text-sm`}/>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{item.label}</p>
                            <p className="text-xs text-slate-400">{item.desc}</p>
                          </div>
                        </div>
                        <button onClick={()=>toggleConfig(item.key)}
                          className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${configToggles[item.key]?'bg-emerald-500':'bg-gray-200'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-200 ${configToggles[item.key]?'end-0.5':'start-0.5'}`}/>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Appearance */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 bg-violet-50 border-b border-violet-100">
                      <p className="font-black text-slate-800 text-sm flex items-center gap-2">
                        <i className="fas fa-palette text-violet-400"/>المظهر
                      </p>
                    </div>
                    {([
                      { key:'darkMode' as const, icon:'fa-moon', label:'الوضع الليلي', desc:'واجهة داكنة لراحة العين ليلاً' },
                    ]).map((item,i,arr)=>(
                      <div key={item.key} className={`flex items-center justify-between px-5 py-4 ${i<arr.length-1?'border-b border-gray-50':''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${configToggles[item.key]?'bg-slate-800 text-slate-200':'bg-gray-100 text-slate-400'}`}>
                            <i className={`fas ${item.icon} text-sm`}/>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{item.label}</p>
                            <p className="text-xs text-slate-400">{item.desc}</p>
                          </div>
                        </div>
                        <button onClick={()=>toggleConfig(item.key)}
                          className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${configToggles[item.key]?'bg-slate-800':'bg-gray-200'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-200 ${configToggles[item.key]?'end-0.5':'start-0.5'}`}/>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Language */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="font-black text-slate-800 text-sm flex items-center gap-2 mb-4">
                      <i className="fas fa-globe text-blue-400"/>اللغة والمنطقة
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label:'العربية', flag:'🇸🇦', active:true  },
                        { label:'English', flag:'🇬🇧', active:false },
                      ].map(lang=>(
                        <button key={lang.label}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                            lang.active?'bg-blue-50 border-blue-300 text-blue-700':'bg-gray-50 border-gray-200 text-slate-400 hover:border-gray-300'
                          }`}>
                          <span className="text-xl">{lang.flag}</span>
                          {lang.label}
                          {lang.active&&<i className="fas fa-check-circle text-blue-400 ms-auto text-xs"/>}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-wide">المنطقة الزمنية</label>
                        <select className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold bg-gray-50 outline-none focus:border-blue-400 transition-colors">
                          <option>توقيت عمّان (GMT+3)</option>
                          <option>توقيت الرياض (GMT+3)</option>
                          <option>توقيت القاهرة (GMT+2)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-1.5 uppercase tracking-wide">العملة</label>
                        <select className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold bg-gray-50 outline-none focus:border-blue-400 transition-colors">
                          <option>دينار أردني (JD)</option>
                          <option>ريال سعودي (SAR)</option>
                          <option>درهم إماراتي (AED)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
                    <p className="font-black text-red-700 text-sm flex items-center gap-2">
                      <i className="fas fa-exclamation-triangle"/>منطقة الخطر
                    </p>
                    <p className="text-red-500 text-xs font-bold">ستحتاج لإعادة تسجيل الدخول بعد الخروج</p>
                    <button onClick={logout}
                      className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                      <i className="fas fa-sign-out-alt"/>تسجيل الخروج من الحساب
                    </button>
                  </div>
                </div>
              )}
              </div>{/* end content area */}
              </div>{/* end grid */}
            </div>
          )}

        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-900 border-t border-white/10 z-40 shadow-2xl">
        <div className="grid grid-cols-6 h-16">
          {NAV_ITEMS.slice(0,6).map(item => {
            const badge = item.id==='bookings'?pending.length:item.id==='tournaments'?pendingTourney:0;
            return (
              <button key={item.id} onClick={() => navTo(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors ${tab===item.id?'text-emerald-400':'text-slate-500'}`}>
                {badge > 0 && <span className="absolute top-1.5 right-1/4 bg-amber-400 text-slate-900 text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full">{badge}</span>}
                <i className={`fas ${item.icon} text-base`} />
                <span className="text-[8px] font-bold">{item.label}</span>
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
