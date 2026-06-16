import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { League, Match, Team } from '../types';
import TournamentModal from '../components/TournamentModal';

type Tab = 'overview' | 'tournaments' | 'matches' | 'requests';

// ── طلبات الملاعب المُرسلة (وهمية للعرض) ─────────────────────────────────────
const MOCK_SENT_REQUESTS = [
  {
    id: 'sr1',
    tournament:  'بطولة النخبة الصيفية 2025',
    field:       'ملعب الأمير',
    owner:       'خالد الأحمد',
    phone:       '0791234567',
    startDate:   '2025-07-15',
    status:      'accepted' as const,
    reply:       'مرحباً، تم قبول طلبكم. يرجى التواصل لتحديد الجدول.',
  },
  {
    id: 'sr2',
    tournament:  'كأس الشباب 2025',
    field:       'ملعب النجمة',
    owner:       'سامي العلي',
    phone:       '0799876543',
    startDate:   '2025-08-01',
    status:      'pending' as const,
    reply:       '',
  },
  {
    id: 'sr3',
    tournament:  'دوري الأحياء',
    field:       'ملعب الوطني',
    owner:       'فيصل المصري',
    phone:       '0795551234',
    startDate:   '2025-09-01',
    status:      'declined' as const,
    reply:       'عذراً، الملعب محجوز في تلك الفترة.',
  },
];

const STATUS_MAP: Record<League['status'], { label: string; cls: string; dot: string }> = {
  'التسجيل متاح': { label: 'التسجيل مفتوح', cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  'جارية':         { label: 'جارية الآن',     cls: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500 animate-pulse' },
  'مكتملة':        { label: 'مكتملة',          cls: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400' },
};

const OrganizerDashboard: React.FC = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [tab, setTab]                     = useState<Tab>('overview');
  const [leagues, setLeagues]             = useState<League[]>([]);
  const [teams, setTeams]                 = useState<Team[]>([]);
  const [matches, setMatches]             = useState<Match[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [scoreEdit, setScoreEdit]         = useState<Record<string, { h: string; a: string }>>({});
  const [savingMatch, setSavingMatch]     = useState<string | null>(null);
  const [sentRequests]                    = useState(MOCK_SENT_REQUESTS);

  const refresh = async () => {
    setLoading(true);
    const [l, t] = await Promise.all([
      backend.getLeagues(),
      backend.getUserTeams('all'),
    ]);
    setLeagues(l);
    setTeams(t);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user?.id]);

  useEffect(() => {
    if (selectedLeague) {
      backend.getMatches(selectedLeague.id).then(m => {
        setMatches(m);
        const init: Record<string, { h: string; a: string }> = {};
        m.forEach(x => { init[x.id] = { h: String(x.homeScore ?? ''), a: String(x.awayScore ?? '') }; });
        setScoreEdit(init);
      });
    }
  }, [selectedLeague]);

  if (!user) return null;

  // ── Computed ───────────────────────────────────────────────────────────────
  const active      = leagues.filter(l => l.status === 'جارية');
  const open        = leagues.filter(l => l.status === 'التسجيل متاح');
  const done        = leagues.filter(l => l.status === 'مكتملة');
  const totalTeams  = leagues.reduce((s, l) => s + l.teamsCount, 0);

  const handleCreate = async (l: League) => {
    await backend.saveLeague(l);
    setShowModal(false);
    refresh();
  };

  const handleSaveScore = async (m: Match) => {
    const s = scoreEdit[m.id];
    if (!s) return;
    setSavingMatch(m.id);
    await backend.updateMatchResult(m.id, Number(s.h), Number(s.a));
    if (selectedLeague) {
      const updated = await backend.getMatches(selectedLeague.id);
      setMatches(updated);
    }
    setSavingMatch(null);
  };

  const matchStatusCls = (s: string) =>
    s === 'انتهت'   ? 'bg-slate-100 text-slate-600' :
    s === 'مباشر'   ? 'bg-red-100 text-red-600'     :
                      'bg-amber-50 text-amber-700';

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-bl from-slate-900 via-teal-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 right-24 w-64 h-64 rounded-full bg-teal-400 blur-3xl" />
          <div className="absolute bottom-0 left-8 w-48 h-48 rounded-full bg-emerald-400 blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1400&q=20')] bg-cover bg-center opacity-5" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-10 pb-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8">

            {/* أفاتار */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-teal-600 flex items-center justify-center text-white text-4xl shadow-2xl border-4 border-white/20 overflow-hidden">
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  : <i className="fas fa-trophy" />}
              </div>
              <div className="absolute -bottom-2 -end-2 bg-teal-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                منظم
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-3xl font-black text-white">{user.name}</h1>
                <span className="px-3 py-1 bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold rounded-full">
                  🏆 منظم بطولات
                </span>
              </div>
              <p className="text-slate-400 text-sm">{user.email}</p>
            </div>

            <button
              onClick={() => navigate('/settings')}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold rounded-xl transition-all"
            >
              <i className="fas fa-pen text-xs" /> تعديل الملف
            </button>
          </div>

          {/* إحصائيات */}
          <div className="grid grid-cols-4 border-t border-white/10">
            {[
              { icon: 'fa-trophy',     val: leagues.length, label: 'البطولات'    },
              { icon: 'fa-play-circle',val: active.length,  label: 'جارية'       },
              { icon: 'fa-users',      val: totalTeams,     label: 'إجمالي الفرق'},
              { icon: 'fa-futbol',     val: teams.length,   label: 'الفرق المسجّلة'},
            ].map((s, i) => (
              <div key={i} className="py-5 text-center border-e border-white/10 last:border-0">
                <i className={`fas ${s.icon} text-teal-400 text-sm mb-1.5 block`} />
                <div className="text-2xl font-black text-white">{s.val}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ TABS ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex overflow-x-auto no-scrollbar">
            {([
              { id: 'overview',    icon: 'fa-home',      label: 'الرئيسية'   },
              { id: 'tournaments', icon: 'fa-trophy',    label: 'بطولاتي',   badge: open.length },
              { id: 'matches',     icon: 'fa-futbol',    label: 'المباريات'  },
              { id: 'requests',    icon: 'fa-paper-plane',label: 'طلباتي',   badge: sentRequests.filter(r=>r.status==='pending').length },
            ] as { id: Tab; icon: string; label: string; badge?: number }[]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                  tab === t.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                <i className={`fas ${t.icon} text-xs`} />
                {t.label}
                {!!t.badge && (
                  <span className="bg-teal-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{t.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">

        {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-6">

            {/* أزرار إجراء سريع */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: 'fa-plus',        label: 'بطولة جديدة',  color: 'teal',    action: () => navigate('/create-tournament') },
                { icon: 'fa-list-ol',     label: 'إدارة البطولات',color: 'slate',   action: () => setTab('tournaments')          },
                { icon: 'fa-futbol',      label: 'نتائج المباريات',color: 'emerald', action: () => setTab('matches')              },
                { icon: 'fa-paper-plane', label: 'حالة الطلبات',  color: 'violet',  action: () => setTab('requests')             },
              ].map((a, i) => (
                <button key={i} onClick={a.action}
                  className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition-all
                    ${a.color === 'teal'    ? 'bg-teal-100 text-teal-600 group-hover:bg-teal-600 group-hover:text-white' :
                      a.color === 'slate'   ? 'bg-slate-100 text-slate-600 group-hover:bg-slate-800 group-hover:text-white' :
                      a.color === 'violet'  ? 'bg-violet-100 text-violet-600 group-hover:bg-violet-500 group-hover:text-white' :
                                              'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                    <i className={`fas ${a.icon}`} />
                  </div>
                  <span className="text-xs font-black text-slate-700">{a.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── البطولات الجارية ─────────────────────────────── */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-slate-900">البطولات النشطة</h3>
                  <button onClick={() => setTab('tournaments')} className="text-xs font-bold text-teal-600 hover:underline">عرض الكل</button>
                </div>

                {loading ? (
                  <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                    <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : leagues.filter(l => l.status !== 'مكتملة').length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                    <i className="fas fa-trophy text-5xl text-slate-200 mb-4 block" />
                    <p className="text-slate-400 font-bold mb-4">لا توجد بطولات نشطة</p>
                    <button onClick={() => navigate('/create-tournament')}
                      className="px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition-colors">
                      أنشئ بطولتك الأولى
                    </button>
                  </div>
                ) : (
                  leagues.filter(l => l.status !== 'مكتملة').map(l => {
                    const st = STATUS_MAP[l.status];
                    const pct = Math.round((l.teamsCount / Math.max(l.maxTeams, 1)) * 100);
                    return (
                      <div key={l.id}
                        onClick={() => { setSelectedLeague(l); setTab('matches'); }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-teal-200 transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-2xl flex-shrink-0">🏆</div>
                            <div>
                              <h4 className="font-black text-slate-900 group-hover:text-teal-700 transition-colors">{l.name}</h4>
                              <p className="text-xs text-slate-400">{l.sport} · تبدأ {l.startDate}</p>
                            </div>
                          </div>
                          <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {[
                            { label: 'الفرق',    val: `${l.teamsCount}/${l.maxTeams}` },
                            { label: 'الجائزة',  val: l.prizePool                     },
                            { label: 'المباريات',val: l.matchesGenerated ? 'مجدولة' : 'لم تُجدوَل' },
                          ].map((s,i) => (
                            <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                              <p className="text-xs font-black text-slate-700 truncate">{s.val}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{s.label}</p>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-bold">
                            <span>الامتلاء</span><span>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-teal-500'}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── الجانب ──────────────────────────────────────── */}
              <div className="space-y-4">

                {/* ملخص البطولات */}
                <div className="bg-gradient-to-br from-teal-800 to-slate-900 rounded-2xl p-5 text-white">
                  <p className="text-teal-300 text-xs font-bold mb-3">ملخص البطولات</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: open.length,    label: 'مفتوحة',  cls: 'text-emerald-400' },
                      { val: active.length,  label: 'جارية',   cls: 'text-blue-400'    },
                      { val: done.length,    label: 'مكتملة',  cls: 'text-slate-400'   },
                      { val: totalTeams,     label: 'فريق',    cls: 'text-teal-300'    },
                    ].map((s, i) => (
                      <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                        <div className={`text-2xl font-black ${s.cls}`}>{s.val}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/create-tournament')}
                    className="w-full mt-4 py-3 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    <i className="fas fa-plus me-2" />أنشئ بطولة جديدة
                  </button>
                </div>

                {/* حالة الطلبات */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-black text-slate-900 text-sm">طلبات الملاعب</h3>
                    <button onClick={() => setTab('requests')} className="text-xs font-bold text-teal-600">الكل</button>
                  </div>
                  <div className="space-y-2.5">
                    {sentRequests.map(r => (
                      <div key={r.id} className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          r.status === 'accepted' ? 'bg-emerald-500' :
                          r.status === 'pending'  ? 'bg-amber-400 animate-pulse' :
                                                    'bg-red-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{r.tournament}</p>
                          <p className="text-[10px] text-slate-400 truncate">{r.field}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          r.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                          r.status === 'pending'  ? 'bg-amber-100 text-amber-700'    :
                                                    'bg-red-100 text-red-600'
                        }`}>
                          {r.status === 'accepted' ? 'مقبول' : r.status === 'pending' ? 'انتظار' : 'مرفوض'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TOURNAMENTS TAB ═══════════════════════════════════════════════════ */}
        {tab === 'tournaments' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">بطولاتي</h2>
                <p className="text-sm text-slate-500">{leagues.length} بطولة إجمالية</p>
              </div>
              <button
                onClick={() => navigate('/create-tournament')}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-100 transition-all hover:-translate-y-0.5 text-sm"
              >
                <i className="fas fa-plus" /> بطولة جديدة
              </button>
            </div>

            {leagues.length === 0 ? (
              <div className="bg-white rounded-2xl p-14 text-center border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">🏆</div>
                <h3 className="text-lg font-black text-slate-800 mb-2">لم تنشئ أي بطولة بعد</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">ابدأ بإنشاء بطولتك الأولى وادعُ الفرق للمشاركة</p>
                <button onClick={() => navigate('/create-tournament')}
                  className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg">
                  أنشئ بطولتك الأولى
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {leagues.map(l => {
                  const st  = STATUS_MAP[l.status];
                  const pct = Math.round((l.teamsCount / Math.max(l.maxTeams, 1)) * 100);
                  return (
                    <div key={l.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                      {/* شريط الحالة */}
                      <div className={`h-1 ${l.status === 'التسجيل متاح' ? 'bg-emerald-500' : l.status === 'جارية' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center text-3xl flex-shrink-0">🏆</div>
                            <div>
                              <h3 className="font-black text-slate-900 text-lg">{l.name}</h3>
                              <p className="text-sm text-slate-400">{l.sport} · بداية {l.startDate}</p>
                            </div>
                          </div>
                          <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${st.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          {[
                            { icon: 'fa-users',   label: 'الفرق',      val: `${l.teamsCount} / ${l.maxTeams}` },
                            { icon: 'fa-coins',   label: 'الجائزة',    val: l.prizePool                       },
                            { icon: 'fa-futbol',  label: 'المباريات',  val: l.matchesGenerated ? 'مجدولة ✓' : 'لم تُجدوَل' },
                            { icon: 'fa-percent', label: 'الامتلاء',   val: `${pct}%`                         },
                          ].map((s, i) => (
                            <div key={i} className="bg-slate-50 rounded-xl p-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <i className={`fas ${s.icon} text-teal-500 text-[10px]`} />
                                <span className="text-[9px] text-slate-400 font-bold">{s.label}</span>
                              </div>
                              <p className="text-sm font-black text-slate-700 truncate">{s.val}</p>
                            </div>
                          ))}
                        </div>

                        {/* شريط امتلاء */}
                        <div className="mb-4">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-400' : 'bg-teal-500'}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedLeague(l); setTab('matches'); }}
                            className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                          >
                            <i className="fas fa-futbol" /> إدارة المباريات
                          </button>
                          <button
                            onClick={() => navigate('/leagues')}
                            className="px-4 py-2.5 border-2 border-slate-200 hover:border-slate-400 text-slate-600 text-xs font-bold rounded-xl transition-colors"
                          >
                            <i className="fas fa-eye" />
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

        {/* ══ MATCHES TAB ═══════════════════════════════════════════════════════ */}
        {tab === 'matches' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">إدارة المباريات</h2>
                <p className="text-sm text-slate-500">تحديث نتائج المباريات</p>
              </div>
            </div>

            {/* اختيار بطولة */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block">اختر البطولة</label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {leagues.map(l => (
                  <button key={l.id} onClick={() => setSelectedLeague(l)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap border-2 transition-all ${
                      selectedLeague?.id === l.id
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-teal-300 bg-white'
                    }`}>
                    🏆 {l.name}
                  </button>
                ))}
              </div>
            </div>

            {!selectedLeague ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <i className="fas fa-hand-pointer text-4xl text-slate-200 mb-3 block" />
                <p className="text-slate-400 font-bold">اختر بطولة لعرض مبارياتها</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <i className="fas fa-futbol text-4xl text-slate-200 mb-3 block" />
                <p className="text-slate-400 font-bold mb-1">لا توجد مباريات مجدولة</p>
                <p className="text-xs text-slate-400">يتم جدولة المباريات تلقائياً عند اكتمال الفرق</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-3 bg-teal-50 border-b border-teal-100 flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <p className="font-black text-teal-800 text-sm">{selectedLeague.name}</p>
                      <p className="text-xs text-teal-600">{matches.length} مباراة</p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-50">
                    {matches.map(m => {
                      const sc = scoreEdit[m.id] || { h: '', a: '' };
                      const finished = m.status === 'انتهت';
                      return (
                        <div key={m.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {/* الفريق المضيف */}
                            <div className="flex-1 text-end">
                              <p className="font-black text-slate-800 text-sm">{m.homeTeam}</p>
                            </div>

                            {/* النتيجة */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {m.status === 'انتهت' ? (
                                <div className="flex items-center gap-1 bg-slate-900 text-white px-4 py-2 rounded-xl">
                                  <span className="font-black text-lg w-5 text-center">{m.homeScore}</span>
                                  <span className="text-slate-400 font-bold mx-1">-</span>
                                  <span className="font-black text-lg w-5 text-center">{m.awayScore}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <input type="number" min="0" max="99"
                                    value={sc.h}
                                    onChange={e => setScoreEdit(p => ({ ...p, [m.id]: { ...p[m.id], h: e.target.value } }))}
                                    className="w-11 h-10 text-center font-black text-base border-2 border-slate-200 focus:border-teal-500 rounded-xl outline-none bg-slate-50 focus:bg-white transition-all"
                                  />
                                  <span className="text-slate-400 font-bold text-sm">-</span>
                                  <input type="number" min="0" max="99"
                                    value={sc.a}
                                    onChange={e => setScoreEdit(p => ({ ...p, [m.id]: { ...p[m.id], a: e.target.value } }))}
                                    className="w-11 h-10 text-center font-black text-base border-2 border-slate-200 focus:border-teal-500 rounded-xl outline-none bg-slate-50 focus:bg-white transition-all"
                                  />
                                </div>
                              )}
                            </div>

                            {/* الفريق الضيف */}
                            <div className="flex-1 text-start">
                              <p className="font-black text-slate-800 text-sm">{m.awayTeam}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${matchStatusCls(m.status)}`}>{m.status}</span>
                              <span className="text-[10px] text-slate-400">{m.date}</span>
                            </div>
                            {!finished && (
                              <button
                                onClick={() => handleSaveScore(m)}
                                disabled={savingMatch === m.id || (!sc.h && !sc.a)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-40 text-white text-[11px] font-bold rounded-lg transition-all"
                              >
                                {savingMatch === m.id
                                  ? <i className="fas fa-spinner animate-spin text-[10px]" />
                                  : <i className="fas fa-save text-[10px]" />}
                                حفظ
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ REQUESTS TAB ══════════════════════════════════════════════════════ */}
        {tab === 'requests' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black text-slate-900">طلبات الملاعب المُرسَلة</h2>
              <p className="text-sm text-slate-500">تتبّع حالة طلباتك لأصحاب الملاعب</p>
            </div>

            <div className="space-y-4">
              {sentRequests.map(r => (
                <div key={r.id} className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${
                  r.status === 'accepted' ? 'border-emerald-200' :
                  r.status === 'pending'  ? 'border-amber-200'   :
                                            'border-red-100 opacity-80'
                }`}>
                  {/* هيدر */}
                  <div className={`px-5 py-3 flex items-center justify-between border-b ${
                    r.status === 'accepted' ? 'bg-emerald-50 border-emerald-100' :
                    r.status === 'pending'  ? 'bg-amber-50 border-amber-100'     :
                                              'bg-red-50 border-red-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                        r.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' :
                        r.status === 'pending'  ? 'bg-amber-100 text-amber-600'     :
                                                  'bg-red-100 text-red-500'
                      }`}>
                        <i className={`fas ${r.status === 'accepted' ? 'fa-check' : r.status === 'pending' ? 'fa-clock' : 'fa-times'}`} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm">{r.tournament}</p>
                        <p className="text-xs text-slate-400">ملعب: {r.field} · {r.owner}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      r.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                      r.status === 'pending'  ? 'bg-amber-100 text-amber-700'     :
                                                'bg-red-100 text-red-600'
                    }`}>
                      {r.status === 'accepted' ? '✓ مقبول' : r.status === 'pending' ? '⏳ انتظار' : '✗ مرفوض'}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {[
                        { icon: 'fa-calendar',        label: 'تاريخ البداية', val: r.startDate },
                        { icon: 'fa-map-marker-alt',  label: 'الملعب',        val: r.field     },
                        { icon: 'fa-phone',           label: 'هاتف المالك',   val: r.owner     },
                      ].map((d, i) => (
                        <div key={i} className="bg-slate-50 rounded-xl p-3">
                          <div className="flex items-center gap-1 mb-1">
                            <i className={`fas ${d.icon} text-slate-400 text-[10px]`} />
                            <span className="text-[10px] text-slate-400 font-bold">{d.label}</span>
                          </div>
                          <p className="text-xs font-black text-slate-700 truncate">{d.val}</p>
                        </div>
                      ))}
                    </div>

                    {/* رد صاحب الملعب */}
                    {r.status === 'accepted' && r.reply && (
                      <div className="flex gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                        <i className="fas fa-comment-dots text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-emerald-700 mb-1">رد صاحب الملعب:</p>
                          <p className="text-sm text-emerald-800">{r.reply}</p>
                        </div>
                      </div>
                    )}

                    {r.status === 'declined' && r.reply && (
                      <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                        <i className="fas fa-comment-slash text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-red-600 mb-1">سبب الرفض:</p>
                          <p className="text-sm text-red-700">{r.reply}</p>
                        </div>
                      </div>
                    )}

                    {r.status === 'pending' && (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse flex-shrink-0" />
                        <p className="text-xs font-bold text-amber-700">في انتظار رد صاحب الملعب — عادةً خلال 24 ساعة</p>
                      </div>
                    )}

                    {r.status === 'accepted' && (
                      <div className="flex gap-2">
                        <a href={`tel:${r.phone}`}
                          className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                          <i className="fas fa-phone" /> اتصل بصاحب الملعب
                        </a>
                        <button
                          onClick={() => navigate('/create-tournament')}
                          className="px-4 py-2.5 border-2 border-teal-200 text-teal-700 hover:bg-teal-50 text-xs font-bold rounded-xl transition-colors">
                          طلب آخر
                        </button>
                      </div>
                    )}

                    {r.status === 'declined' && (
                      <button
                        onClick={() => navigate('/create-tournament')}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                        <i className="fas fa-redo" /> أرسل طلباً لملعب آخر
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Modal */}
      {showModal && (
        <TournamentModal onClose={() => setShowModal(false)} onSave={handleCreate} />
      )}
    </div>
  );
};

export default OrganizerDashboard;
