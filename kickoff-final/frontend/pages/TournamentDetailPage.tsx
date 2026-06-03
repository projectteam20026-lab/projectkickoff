import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { League, Team, Match, UserRole } from '../types';

/* ─── Standing row ──────────────────────────────────────────────────────── */
interface StandingRow {
  teamId: string;
  name: string;
  logo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

function calcStandings(
  teamIds: string[],
  teams: Team[],
  matches: Match[],
  phase?: string,
): StandingRow[] {
  const rows: Record<string, StandingRow> = {};
  teamIds.forEach(tid => {
    const t = teams.find(x => x.id === tid);
    if (!t) return;
    rows[tid] = { teamId: tid, name: t.name, logo: t.logo, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
  });

  matches
    .filter(m =>
      m.status === 'انتهت' &&
      m.homeScore !== null &&
      m.awayScore !== null &&
      (phase === undefined || !m.round || m.round === phase),
    )
    .forEach(m => {
      const hr = rows[m.homeTeamId ?? ''];
      const ar = rows[m.awayTeamId ?? ''];
      if (!hr || !ar) return;
      const hs = m.homeScore as number;
      const as_ = m.awayScore as number;
      hr.played++; ar.played++;
      hr.gf += hs; hr.ga += as_;
      ar.gf += as_; ar.ga += hs;
      hr.gd = hr.gf - hr.ga;
      ar.gd = ar.gf - ar.ga;
      if (hs > as_)      { hr.won++; hr.pts += 3; ar.lost++; }
      else if (hs < as_) { ar.won++; ar.pts += 3; hr.lost++; }
      else               { hr.drawn++; hr.pts++;   ar.drawn++; ar.pts++; }
    });

  return Object.values(rows).sort((a, b) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf,
  );
}

/* ─── Configs ───────────────────────────────────────────────────────────── */
const TYPE_CFG: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  'دوري':       { label: 'دوري',       color: 'bg-blue-100 text-blue-700 border-blue-200',         icon: 'fa-table-list', desc: 'نظام الدوري — كل فريق يلعب ضد الآخرين ذهاباً وإياباً، الفائز بأكثر النقاط يحصل على اللقب.' },
  'كاس':        { label: 'كأس',        color: 'bg-amber-100 text-amber-700 border-amber-200',       icon: 'fa-trophy',     desc: 'نظام الكأس (خروج المغلوب) — من يخسر يودّع البطولة، حتى تبقى فريق واحد بطلاً في النهائي.' },
  'دوري وكاس': { label: 'دوري + كأس', color: 'bg-purple-100 text-purple-700 border-purple-200',   icon: 'fa-layer-group', desc: 'مرحلة المجموعات بنظام الدوري ثم مرحلة الإقصاء (كأس) حتى النهائي.' },
};

const STATUS_CFG: Record<string, { label: string; badge: string; pulse?: boolean }> = {
  'قادمة':  { label: 'قادمة',    badge: 'bg-emerald-100 text-emerald-700' },
  'جارية':  { label: '● جارية',  badge: 'bg-green-500 text-white', pulse: true },
  'منتهية': { label: 'منتهية',   badge: 'bg-slate-200 text-slate-600' },
};

const ROUND_LABELS: Record<string, string> = {
  group: 'دور المجموعات',
  r16:   'دور الـ 16',
  qf:    'ربع النهائي',
  sf:    'نصف النهائي',
  final: 'النهائي',
};

/* ─── StandingsTable ────────────────────────────────────────────────────── */
const StandingsTable: React.FC<{ rows: StandingRow[]; highlightId?: string }> = ({ rows, highlightId }) => (
  <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
    <table className="w-full text-sm" dir="rtl">
      <thead className="bg-gray-50 text-gray-400 text-xs font-bold">
        <tr>
          <th className="px-4 py-3 text-start">#</th>
          <th className="px-4 py-3 text-start">الفريق</th>
          <th className="px-3 py-3 text-center">ل.م</th>
          <th className="px-3 py-3 text-center text-emerald-600">ف</th>
          <th className="px-3 py-3 text-center">ت</th>
          <th className="px-3 py-3 text-center text-red-500">خ</th>
          <th className="px-3 py-3 text-center">هـ+</th>
          <th className="px-3 py-3 text-center">هـ-</th>
          <th className="px-3 py-3 text-center">فارق</th>
          <th className="px-3 py-3 text-center font-black text-slate-700">نقاط</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50 bg-white">
        {rows.map((row, i) => (
          <tr
            key={row.teamId}
            className={`hover:bg-slate-50 transition-colors ${
              highlightId === row.teamId ? 'bg-emerald-50/60' : ''
            }`}
          >
            <td className="px-4 py-3 font-bold text-gray-400">
              <div className="flex items-center gap-1">
                {i + 1}
                {i === 0 && <i className="fas fa-crown text-amber-400 text-[10px]" />}
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{row.logo}</span>
                <span className="font-bold text-slate-900">{row.name}</span>
                {highlightId === row.teamId && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">فريقك</span>
                )}
              </div>
            </td>
            <td className="px-3 py-3 text-center text-slate-600">{row.played}</td>
            <td className="px-3 py-3 text-center text-emerald-600 font-bold">{row.won}</td>
            <td className="px-3 py-3 text-center text-slate-400">{row.drawn}</td>
            <td className="px-3 py-3 text-center text-red-500">{row.lost}</td>
            <td className="px-3 py-3 text-center text-slate-600">{row.gf}</td>
            <td className="px-3 py-3 text-center text-slate-600">{row.ga}</td>
            <td className={`px-3 py-3 text-center font-bold ${row.gd > 0 ? 'text-emerald-600' : row.gd < 0 ? 'text-red-500' : 'text-slate-400'}`}>
              {row.gd > 0 ? `+${row.gd}` : row.gd}
            </td>
            <td className="px-3 py-3 text-center font-black text-slate-900 text-base">{row.pts}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
              <i className="fas fa-table-list text-3xl text-gray-200 mb-2 block" />
              لا يوجد جدول ترتيب بعد
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

/* ─── MatchCard ─────────────────────────────────────────────────────────── */
const MatchCard: React.FC<{ match: Match }> = ({ match: m }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-slate-800 flex-1 text-end truncate">{m.homeTeam}</span>
      <div
        className={`px-3 py-1.5 rounded-lg font-black text-sm min-w-[64px] text-center flex-shrink-0 ${
          m.status === 'انتهت' ? 'bg-slate-800 text-white' :
          m.status === 'مباشر' ? 'bg-green-500 text-white animate-pulse' :
          'bg-gray-100 text-gray-400'
        }`}
        dir="ltr"
      >
        {m.status === 'مجدولة' ? 'VS' : `${m.homeScore} - ${m.awayScore}`}
      </div>
      <span className="text-xs font-bold text-slate-800 flex-1 text-start truncate">{m.awayTeam}</span>
    </div>
    <p className="text-center text-[10px] text-slate-400 mt-1.5">
      <i className="fas fa-calendar text-emerald-400 me-1" />{m.date}
    </p>
  </div>
);

/* ─── BracketView (mirrored — Final in center) ──────────────────────────── */
const BracketView: React.FC<{ matches: Match[]; cupRounds: number }> = ({ matches, cupRounds }) => {
  // All rounds except 'final' — these fan out left and right
  const rounds = cupRounds >= 16 ? ['r16', 'qf', 'sf'] : ['qf', 'sf'];

  // Expected match count per side for round at index ri
  // 8-team QF (ri=0): 8/4=2  |  SF (ri=1): 8/8=1
  // 16-team R16(ri=0): 16/4=4 | QF(ri=1): 16/8=2 | SF(ri=2): 16/16=1
  const expectedPerSide = (ri: number) => Math.round(cupRounds / Math.pow(2, ri + 2));

  // Map round name → its index (for expectedPerSide lookup on reversed side)
  const roundIdx: Record<string, number> = {};
  rounds.forEach((r, i) => { roundIdx[r] = i; });

  const maxPerSide   = expectedPerSide(0);
  const columnHeight = Math.max(260, maxPerSide * 140);

  // Split a round's matches into left half and right half
  const getHalf = (round: string, side: 'left' | 'right') => {
    const all = matches.filter(m => m.round === round);
    if (all.length === 0) return [];
    const mid = Math.ceil(all.length / 2);
    return side === 'left' ? all.slice(0, mid) : all.slice(mid);
  };

  const emptyCard = (key: string | number, amber = false) => (
    <div
      key={key}
      className={`border border-dashed rounded-xl p-3 text-center ${
        amber ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200 bg-gray-50'
      }`}
    >
      <p className={`text-xs font-bold ${amber ? 'text-amber-300' : 'text-gray-300'}`}>TBD</p>
      <p className={`text-[10px] my-0.5 ${amber ? 'text-amber-300' : 'text-gray-300'}`}>vs</p>
      <p className={`text-xs font-bold ${amber ? 'text-amber-300' : 'text-gray-300'}`}>TBD</p>
    </div>
  );

  const renderColumn = (round: string, side: 'left' | 'right') => {
    const ri          = roundIdx[round];
    const halfMs      = getHalf(round, side);
    const expected    = expectedPerSide(ri);
    const placeholders = Math.max(0, expected - halfMs.length);

    return (
      <div key={`${round}-${side}`} style={{ minWidth: '185px' }}>
        <div className="text-center mb-3">
          <span className="text-xs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {ROUND_LABELS[round] ?? round}
          </span>
        </div>
        <div className="flex flex-col justify-around" style={{ height: `${columnHeight}px` }}>
          {halfMs.map(m => <MatchCard key={m.id} match={m} />)}
          {[...Array(placeholders)].map((_, i) => emptyCard(`${round}-${side}-${i}`))}
        </div>
      </div>
    );
  };

  const finalMs = matches.filter(m => m.round === 'final');

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-5 min-w-max py-2 items-start" dir="ltr">

        {/* ── Left side: earliest → latest round ── */}
        {rounds.map(r => renderColumn(r, 'left'))}

        {/* ── Center: النهائي ── */}
        <div style={{ minWidth: '195px' }}>
          <div className="text-center mb-3">
            <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              🏆 {ROUND_LABELS['final']}
            </span>
          </div>
          <div className="flex flex-col justify-center" style={{ height: `${columnHeight}px` }}>
            {finalMs.length > 0
              ? finalMs.map(m => <MatchCard key={m.id} match={m} />)
              : emptyCard('final-center', true)
            }
          </div>
        </div>

        {/* ── Right side: latest → earliest round (mirror) ── */}
        {[...rounds].reverse().map(r => renderColumn(r, 'right'))}

      </div>
    </div>
  );
};

/* ─── Main ──────────────────────────────────────────────────────────────── */
const TournamentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tournament, setTournament] = useState<League | null>(null);
  const [teams, setTeams]           = useState<Team[]>([]);
  const [matches, setMatches]       = useState<Match[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('');
  const [registering, setRegistering] = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([
      backend.getTournament(id),
      backend.getUserTeams('all'),
      backend.getMatches(id),
    ]).then(([t, allTeams, allMatches]) => {
      setTournament(t);
      setTeams(allTeams);
      setMatches(allMatches);
      if (t) {
        if (t.status === 'قادمة') setActiveTab('register');
        else if (t.type === 'كاس') setActiveTab('bracket');
        else setActiveTab('standings');
      }
      setLoading(false);
    });
  }, [id]);

  const handleRegister = async () => {
    if (!user || !tournament || !userTeam) return;
    setRegistering(true);
    const res = await backend.registerForTournament(tournament.id, userTeam.id);
    if (res.success) {
      setTournament(prev =>
        prev
          ? { ...prev, registeredTeams: [...prev.registeredTeams, userTeam.id], teamsCount: prev.teamsCount + 1 }
          : prev,
      );
      showToast(`✅ تم تسجيل فريق "${userTeam.name}" في البطولة!`, true);
    } else {
      showToast('حدث خطأ، حاول مجدداً', false);
    }
    setRegistering(false);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 font-bold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-5xl text-gray-200 mb-4 block" />
          <h2 className="font-black text-slate-900 mb-4">البطولة غير موجودة</h2>
          <button
            onClick={() => navigate('/leagues')}
            className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
          >
            العودة للبطولات
          </button>
        </div>
      </div>
    );
  }

  const typeCfg   = TYPE_CFG[tournament.type]   ?? TYPE_CFG['دوري'];
  const statusCfg = STATUS_CFG[tournament.status] ?? STATUS_CFG['قادمة'];

  /* user's team */
  const userTeam = teams.find(t => t.userId === user?.id);

  /* is user's team registered */
  const isRegistered = userTeam ? tournament.registeredTeams.includes(userTeam.id) : false;
  const isFull       = tournament.teamsCount >= tournament.maxTeams;

  /* champion = winner of final match */
  const finalMatch = matches.find(m => m.round === 'final' && m.status === 'انتهت');
  const champion   = finalMatch
    ? (finalMatch.homeScore! > finalMatch.awayScore! ? finalMatch.homeTeam : finalMatch.awayTeam)
    : null;

  /* registered teams (by team id) */
  const regTeams = teams.filter(t => tournament.registeredTeams.includes(t.id));

  /* standings */
  const standings = (tournament.type === 'دوري' || tournament.type === 'دوري وكاس')
    ? calcStandings(
        tournament.registeredTeams,
        teams,
        matches,
        tournament.type === 'دوري وكاس' ? 'group' : undefined,
      )
    : [];

  /* tabs for active/finished */
  const tabs: { id: string; label: string; icon: string }[] = [];
  if (tournament.status !== 'قادمة') {
    if (tournament.type === 'دوري') {
      tabs.push({ id: 'standings', label: 'الترتيب',  icon: 'fa-table-list'  });
      tabs.push({ id: 'matches',   label: 'المباريات', icon: 'fa-calendar-alt' });
    } else if (tournament.type === 'كاس') {
      tabs.push({ id: 'bracket',   label: 'الشجرة',    icon: 'fa-sitemap'     });
      tabs.push({ id: 'matches',   label: 'المباريات', icon: 'fa-calendar-alt' });
    } else {
      tabs.push({ id: 'standings', label: 'المجموعات', icon: 'fa-table-list'  });
      tabs.push({ id: 'bracket',   label: 'الإقصاء',   icon: 'fa-sitemap'     });
      tabs.push({ id: 'matches',   label: 'المباريات', icon: 'fa-calendar-alt' });
    }
  }

  /* group matches by round label */
  const matchesByRound = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const lbl = m.round ? (ROUND_LABELS[m.round] ?? m.round) : 'مباريات';
    if (!acc[lbl]) acc[lbl] = [];
    acc[lbl].push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 inset-x-0 mx-auto w-fit z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Dark Header ── */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">

          {/* Back + Manage row */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/leagues')}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold transition-colors group"
            >
              <i className="fas fa-arrow-right group-hover:-translate-x-0.5 transition-transform" />
              البطولات
            </button>
            {user && (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) && (
              <button
                onClick={() => navigate(`/manage-tournament/${tournament?.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black rounded-xl transition-all shadow-sm shadow-emerald-900/30"
              >
                <i className="fas fa-tools" /> إدارة البطولة
              </button>
            )}
          </div>

          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0 border border-white/20">
              {tournament.name.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${typeCfg.color}`}>
                  <i className={`fas ${typeCfg.icon} me-1`} />{typeCfg.label}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${statusCfg.badge} ${statusCfg.pulse ? 'animate-pulse' : ''}`}>
                  {statusCfg.label}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black leading-tight">{tournament.name}</h1>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-sm text-slate-300">
                <span className="flex items-center gap-1.5"><i className="fas fa-calendar-alt text-emerald-400" />{tournament.startDate}</span>
                <span className="flex items-center gap-1.5"><i className="fas fa-trophy text-amber-400" />{tournament.prizePool}</span>
                <span className="flex items-center gap-1.5"><i className="fas fa-users text-blue-400" />{tournament.teamsCount}/{tournament.maxTeams} فريق</span>
                <span className="flex items-center gap-1.5"><i className="fas fa-futbol text-slate-400" />{tournament.sport}</span>
                {tournament.type === 'كاس' && tournament.cupRounds && (
                  <span className="flex items-center gap-1.5"><i className="fas fa-sitemap text-purple-400" />دور الـ {tournament.cupRounds}</span>
                )}
              </div>
            </div>
          </div>

          {/* Champion banner */}
          {tournament.status === 'منتهية' && champion && (
            <div className="mt-5 bg-gradient-to-l from-amber-500/20 to-yellow-400/10 border border-amber-400/30 rounded-2xl p-4 flex items-center gap-3">
              <div className="text-3xl">🏆</div>
              <div>
                <p className="text-amber-300 text-xs font-black uppercase tracking-wider">بطل البطولة</p>
                <p className="text-white text-lg font-black">{champion}</p>
              </div>
            </div>
          )}

          {/* Teams progress */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-bold">
              <span>الفرق المشاركة</span>
              <span>{tournament.teamsCount}/{tournament.maxTeams}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${tournament.status === 'منتهية' ? 'bg-slate-400' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(100, (tournament.teamsCount / tournament.maxTeams) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── UPCOMING: Registration ── */}
        {tournament.status === 'قادمة' && (
          <div className="space-y-5">
            {/* Format info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-black text-slate-900 mb-2 flex items-center gap-2">
                <i className={`fas ${typeCfg.icon} text-emerald-500`} /> نظام البطولة
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">{typeCfg.desc}</p>
              {tournament.type === 'كاس' && tournament.cupRounds && (
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <i className="fas fa-info-circle text-amber-500 flex-shrink-0" />
                  <span className="text-amber-800 text-sm font-bold">
                    دور الـ {tournament.cupRounds} — {tournament.cupRounds / 2} مباراة في الجولة الأولى
                  </span>
                </div>
              )}
            </div>

            {/* Registered teams */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-slate-900 flex items-center gap-2">
                  <i className="fas fa-users text-emerald-500" /> الفرق المشاركة
                </h2>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full">
                  {tournament.teamsCount}/{tournament.maxTeams}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                {regTeams.map(t => (
                  <div key={t.id} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <span className="text-2xl">{t.logo}</span>
                    <span className="font-bold text-slate-800 text-sm truncate">{t.name}</span>
                  </div>
                ))}
                {[...Array(Math.max(0, tournament.maxTeams - regTeams.length))].map((_, i) => (
                  <div key={`slot-${i}`} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-dashed border-gray-200">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-question text-gray-300 text-sm" />
                    </div>
                    <span className="text-gray-300 text-sm font-bold">مقعد متاح</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {!user ? (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-sign-in-alt" /> سجّل الدخول للمشاركة في البطولة
                </button>
              ) : isRegistered ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                  <i className="fas fa-check-circle text-emerald-500 text-xl flex-shrink-0" />
                  <div>
                    <p className="font-black text-emerald-700">
                      فريق «{userTeam?.name}» مسجّل في هذه البطولة
                    </p>
                    <p className="text-emerald-600 text-xs mt-0.5">سيتم إشعارك عند بدء المباريات</p>
                  </div>
                </div>
              ) : !userTeam ? (
                /* user has no team */
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
                  <i className="fas fa-exclamation-triangle text-amber-500 text-xl flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-black text-amber-700">يجب أن تكون في فريق للتسجيل</p>
                    <p className="text-amber-600 text-xs mt-0.5">أنشئ فريقاً أو انضم لفريق أولاً</p>
                  </div>
                  <button
                    onClick={() => navigate('/teams')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0"
                  >
                    <i className="fas fa-users me-1" /> إدارة فرقي
                  </button>
                </div>
              ) : isFull ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                  <i className="fas fa-lock text-gray-400 text-xl flex-shrink-0" />
                  <p className="font-bold text-gray-500">اكتملت الفرق المشاركة في هذه البطولة</p>
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-emerald-200"
                >
                  {registering
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري التسجيل...</>
                    : <><i className="fas fa-user-plus" /> سجّل فريق «{userTeam.name}»</>
                  }
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── ACTIVE / FINISHED: Tabs + Content ── */}
        {tournament.status !== 'قادمة' && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    activeTab === tab.id
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-white text-slate-500 border-gray-200 hover:border-slate-400 hover:text-slate-700'
                  }`}
                >
                  <i className={`fas ${tab.icon} text-xs`} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Participating teams strip */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex items-center gap-3 overflow-x-auto">
              <span className="text-xs font-black text-slate-400 flex-shrink-0">
                <i className="fas fa-users me-1" /> الفرق ({regTeams.length})
              </span>
              <div className="flex gap-2 flex-wrap">
                {regTeams.map(t => (
                  <span
                    key={t.id}
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                      userTeam?.id === t.id
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-gray-50 text-slate-600 border-gray-200'
                    }`}
                  >
                    {t.logo} {t.name}
                    {userTeam?.id === t.id && <i className="fas fa-star text-[9px] text-emerald-500" />}
                  </span>
                ))}
              </div>
            </div>

            {/* Standings / Groups */}
            {(activeTab === 'standings' || activeTab === 'groups') && (
              <StandingsTable rows={standings} highlightId={userTeam?.id} />
            )}

            {/* Bracket */}
            {activeTab === 'bracket' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-sitemap text-emerald-500" />
                  {tournament.type === 'دوري وكاس' ? 'مرحلة الإقصاء' : 'شجرة البطولة'}
                </h2>
                <BracketView
                  matches={matches.filter(m => m.round !== 'group')}
                  cupRounds={tournament.cupRounds ?? 8}
                />
              </div>
            )}

            {/* Matches list */}
            {activeTab === 'matches' && (
              <div className="space-y-4">
                {matches.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                    <i className="fas fa-calendar text-4xl text-gray-200 mb-3 block" />
                    <p className="font-bold text-slate-400">لا توجد مباريات بعد</p>
                  </div>
                ) : (
                  Object.entries(matchesByRound).map(([roundLabel, rMatches]) => (
                    <div key={roundLabel}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span className="text-xs font-black text-slate-500 uppercase tracking-wide">{roundLabel}</span>
                      </div>
                      <div className="space-y-2">
                        {rMatches.map(m => (
                          <div
                            key={m.id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-black text-slate-900 flex-1 text-end">{m.homeTeam}</div>
                              <div
                                className={`px-4 py-2 rounded-xl font-black text-base min-w-[80px] text-center flex-shrink-0 ${
                                  m.status === 'انتهت' ? 'bg-slate-800 text-white' :
                                  m.status === 'مباشر' ? 'bg-green-500 text-white animate-pulse' :
                                  'bg-gray-100 text-gray-500'
                                }`}
                                dir="ltr"
                              >
                                {m.status === 'مجدولة' ? 'VS' : `${m.homeScore} - ${m.awayScore}`}
                              </div>
                              <div className="text-sm font-black text-slate-900 flex-1">{m.awayTeam}</div>
                            </div>
                            <div className="flex items-center justify-center gap-3 mt-2 text-xs text-slate-400">
                              <span><i className="fas fa-calendar text-emerald-400 me-1" />{m.date}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                m.status === 'انتهت' ? 'bg-gray-100 text-gray-500' :
                                m.status === 'مباشر' ? 'bg-green-100 text-green-700' :
                                'bg-amber-50 text-amber-600'
                              }`}>{m.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetailPage;
