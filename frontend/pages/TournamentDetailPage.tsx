import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { League, Match, Team, UserRole } from '../types';
import { getTournamentByIdAPI, getMatchesAPI, getTeamsAPI, getMyTeamsAPI, registerTeamForTournamentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

/* ── Shield SVG ──────────────────────────────────────────────────── */
const SHIELD_TEMPLATES = ['shield-classic','shield-peak','circle','shield-curved','diamond','hexagon'];

function ShieldSVG({ id, color, size = 40 }: { id: string; color: string; size?: number }) {
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
      {star(50, 36, 13, 6)}{ball(50, 74, 13)}
    </svg>
  );
  if (id === 'shield-peak') return (
    <svg width={size} height={size} viewBox="0 0 100 108" fill="none">
      <path d="M50 5 L88 20 L88 55 Q88 82 50 106 Q12 82 12 55 L12 20 Z" fill={color} />
      {star(50, 38, 12, 5.5)}{ball(50, 73, 12)}
    </svg>
  );
  if (id === 'circle') return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx={50} cy={50} r={44} fill={color} />
      <circle cx={50} cy={50} r={44} stroke="white" strokeWidth={2} opacity={0.25} />
      {star(50, 36, 13, 6)}{ball(50, 67, 11)}
    </svg>
  );
  if (id === 'shield-curved') return (
    <svg width={size} height={size} viewBox="0 0 100 108" fill="none">
      <path d="M50 6 Q80 8 91 28 Q97 48 91 66 Q76 90 50 105 Q24 90 9 66 Q3 48 9 28 Q20 8 50 6 Z" fill={color} />
      {star(50, 36, 13, 6)}{ball(50, 74, 13)}
    </svg>
  );
  if (id === 'diamond') return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M50 4 L96 50 L50 96 L4 50 Z" fill={color} />
      {star(50, 34, 12, 5.5)}{ball(50, 64, 11)}
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 100 108" fill="none">
      <path d="M50 5 L93 28.5 L93 79.5 L50 103 L7 79.5 L7 28.5 Z" fill={color} />
      {star(50, 37, 13, 6)}{ball(50, 74, 13)}
    </svg>
  );
}

function TeamLogo({ logo, color, size = 40 }: { logo?: string; color?: string; size?: number }) {
  const safeId = logo && SHIELD_TEMPLATES.includes(logo) ? logo : 'shield-classic';
  return <ShieldSVG id={safeId} color={color || '#10b981'} size={size} />;
}

/* ── helpers ─────────────────────────────────────────────────────── */
const TEAM_EMOJIS: Record<string, string> = {};
const EMOJI_LIST = ['⚡','🦅','🌟','🔥','🏆','🦁','⚽','🎯','🛡️','💎','🌊','🏅'];
function teamEmoji(name: string, idx: number): string {
  if (!TEAM_EMOJIS[name]) TEAM_EMOJIS[name] = EMOJI_LIST[idx % EMOJI_LIST.length];
  return TEAM_EMOJIS[name];
}

function isCup(league: League | null): boolean {
  if (!league) return false;
  const f = (league.format || '').toLowerCase();
  return f === 'cup' || f === 'كأس';
}

/* standings calculation from matches */
interface StandingRow {
  name: string; emoji: string;
  played: number; wins: number; draws: number; losses: number;
  gf: number; ga: number; gd: number; points: number;
}
function calcStandings(matches: Match[], teams: string[]): StandingRow[] {
  const map: Record<string, StandingRow> = {};
  teams.forEach((t, i) => {
    map[t] = { name: t, emoji: teamEmoji(t, i), played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0 };
  });
  matches.filter(m => m.status === 'انتهت' && m.homeScore !== null && m.awayScore !== null).forEach(m => {
    const h = map[m.homeTeam];
    const a = map[m.awayTeam];
    if (!h || !a) return;
    const hs = m.homeScore!, as = m.awayScore!;
    h.played++; a.played++;
    h.gf += hs; h.ga += as;
    a.gf += as; a.ga += hs;
    if (hs > as)       { h.wins++;  h.points += 3; a.losses++; }
    else if (hs < as)  { a.wins++;  a.points += 3; h.losses++; }
    else               { h.draws++; h.points += 1; a.draws++; a.points += 1; }
  });
  Object.values(map).forEach(r => { r.gd = r.gf - r.ga; });
  return Object.values(map).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
}

/* bracket round grouping */
function groupBracket(matches: Match[]): Match[][] {
  const total = matches.length;
  if (total === 0) return [];
  // 8 teams → 4 QF, 2 SF, 1 Final = 7 matches
  // 4 teams → 2 SF, 1 Final = 3 matches
  if (total >= 7) return [matches.slice(0, 4), matches.slice(4, 6), matches.slice(6, 7)];
  if (total >= 3) return [matches.slice(0, 2), matches.slice(2, 3)];
  return [matches];
}

const ROUND_NAMES: Record<number, string> = {
  0: 'ربع النهائي',
  1: 'نصف النهائي',
  2: 'النهائي',
};

/* ── Match card ─────────────────────────────────────────────────── */
const MatchCard: React.FC<{ match: Match; highlight?: boolean }> = ({ match, highlight }) => {
  const done = match.status === 'انتهت';
  const tbd  = match.homeTeam === 'TBD' || match.awayTeam === 'TBD' || !match.homeTeam || !match.awayTeam;

  if (tbd && !done) return (
    <div className={`rounded-xl border-2 px-3 py-2.5 text-center text-xs font-bold ${
      highlight ? 'border-amber-400/50 bg-amber-400/10 text-amber-300' : 'border-white/10 bg-white/5 text-slate-500'}`}>
      <p className={highlight ? 'text-amber-300' : 'text-slate-500'}>TBD</p>
      <p className="text-[9px] opacity-60">vs</p>
      <p className={highlight ? 'text-amber-300' : 'text-slate-500'}>TBD</p>
      <p className="text-[9px] opacity-50 mt-1 flex items-center justify-center gap-1">
        <i className="fas fa-calendar-alt" /> {match.date}
      </p>
    </div>
  );

  const hw = done && match.homeScore! > match.awayScore!;
  const aw = done && match.awayScore! > match.homeScore!;

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${
      highlight ? 'border-amber-400/60 shadow-lg shadow-amber-400/10' : 'border-white/10'}`}>
      {/* Home */}
      <div className={`flex items-center justify-between px-3 py-1.5 ${hw ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
        <span className={`text-xs font-black ${hw ? 'text-white' : 'text-slate-300'}`}>{match.homeTeam}</span>
        {done && <span className={`text-sm font-black min-w-[18px] text-center ${hw ? 'text-emerald-400' : 'text-slate-400'}`}>{match.homeScore}</span>}
      </div>
      <div className="h-px bg-white/10" />
      {/* Away */}
      <div className={`flex items-center justify-between px-3 py-1.5 ${aw ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
        <span className={`text-xs font-black ${aw ? 'text-white' : 'text-slate-300'}`}>{match.awayTeam}</span>
        {done && <span className={`text-sm font-black min-w-[18px] text-center ${aw ? 'text-emerald-400' : 'text-slate-400'}`}>{match.awayScore}</span>}
      </div>
      {/* Date */}
      <div className="px-3 py-1 bg-black/20 text-[9px] text-slate-500 flex items-center gap-1">
        <i className="fas fa-calendar-alt text-emerald-500/60" /> {match.date}
      </div>
    </div>
  );
};

/* ── main component ─────────────────────────────────────────────── */
const TournamentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

  const [league,    setLeague]    = useState<League | null>(null);
  const [matches,   setMatches]   = useState<Match[]>([]);
  const [teams,     setTeams]     = useState<Team[]>([]);
  const [myTeams,   setMyTeams]   = useState<Team[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<'bracket' | 'matches' | 'standings'>('matches');
  const [deleteId,  setDeleteId]  = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  /* registration */
  const [showReg,   setShowReg]   = useState(false);
  const [selTeamId, setSelTeamId] = useState('');
  const [regLoading,setRegLoading]= useState(false);
  const [regMsg,    setRegMsg]    = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getTournamentByIdAPI(id),
      getMatchesAPI(id),
      getTeamsAPI(false),
    ]).then(([l, m, t]) => {
      setLeague(l);
      setMatches(m);
      setTeams(t);
      setLoading(false);
      if (l) setTab(isCup(l) ? 'bracket' : 'matches');
    });
  }, [id]);

  /* fetch my teams when user opens registration modal */
  useEffect(() => {
    if (showReg && user) getMyTeamsAPI().then(setMyTeams);
  }, [showReg, user]);

  const handleRegister = async () => {
    if (!id || !selTeamId) return;
    setRegLoading(true);
    setRegMsg(null);
    const res = await registerTeamForTournamentAPI(id, selTeamId);
    setRegLoading(false);
    if (res.success) {
      setRegMsg({ ok: true, text: 'تم تسجيل فريقك بنجاح! 🎉' });
      /* refresh league to update teamsCount */
      getTournamentByIdAPI(id).then(l => { if (l) setLeague(l); });
      setTimeout(() => { setShowReg(false); setRegMsg(null); setSelTeamId(''); }, 2000);
    } else {
      setRegMsg({ ok: false, text: res.error || 'حدث خطأ، حاول مجدداً' });
    }
  };

  const cup = isCup(league);
  const pct = league ? Math.round((league.teamsCount / league.maxTeams) * 100) : 0;

  /* unique teams from matches + registered */
  const teamNames = useMemo(() => {
    const fromMatches = matches.flatMap(m => [m.homeTeam, m.awayTeam]).filter(Boolean);
    const fromTeams   = teams.filter(t => league?.registeredTeams.includes(t.id)).map(t => t.name);
    return [...new Set([...fromTeams, ...fromMatches])];
  }, [matches, teams, league]);

  const standings = useMemo(() => calcStandings(matches, teamNames), [matches, teamNames]);
  const bracketRounds = useMemo(() => groupBracket(matches), [matches]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!league) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="text-center text-slate-800">
        <div className="text-5xl mb-3">🏆</div>
        <p className="font-black text-lg">{t.tournamentDetail.notFound}</p>
        <button onClick={() => navigate('/leagues')} className="text-emerald-600 mt-2 text-sm font-bold hover:underline">
          {t.tournamentDetail.backToLeagues}
        </button>
      </div>
    </div>
  );

  const fmtStr = cup ? 'كأس 🏆' : 'دوري 📋';
  const stColor = league.status === 'جارية' ? 'bg-emerald-500 text-white'
    : league.status === 'مكتملة' ? 'bg-gray-600 text-white'
    : 'bg-amber-400 text-amber-900';
  const canDelete = !!user && (league.createdBy === user.id || user.role === UserRole.ADMIN);

  const handleDelete = async () => {
    setDeleting(true);
    const { backend } = await import('../services/backend');
    const res = await backend.deleteTournament(league.id);
    setDeleting(false);
    if (res.success) navigate('/leagues');
  };

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <button onClick={() => navigate('/leagues')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 text-sm font-bold mb-5 transition-colors">
            {t.tournamentDetail.backBreadcrumb} <i className="fas fa-arrow-left text-xs" />
          </button>

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 bg-slate-100 border border-gray-200 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-800 flex-shrink-0">
              {league.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${stColor} flex items-center gap-1`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" /> {league.status === 'جارية' ? 'جارية' : league.status === 'مكتملة' ? 'منتهية' : 'قادمة'}
                </span>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {fmtStr}
                </span>
              </div>
              {/* Name */}
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{league.name}</h1>
              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {[
                  { icon: 'fa-trophy',     val: league.prizePool,         color: 'text-amber-600' },
                  { icon: 'fa-users',      val: `${league.teamsCount}/${league.maxTeams} ${t.tournamentDetail.teamsLabel}`, color: 'text-slate-600' },
                  { icon: 'fa-futbol',     val: league.sport || 'كرة قدم', color: 'text-slate-600' },
                  { icon: 'fa-calendar',   val: league.startDate,          color: 'text-slate-600' },
                ].map(s => (
                  <span key={s.val} className="flex items-center gap-1.5 text-sm font-bold">
                    <i className={`fas ${s.icon} text-xs text-emerald-500`} />
                    <span className={s.color}>{s.val}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              {/* Register button — only when open */}
              {league.status === 'التسجيل متاح' && league.teamsCount < league.maxTeams && (
                <button onClick={() => { if (!user) navigate('/login'); else setShowReg(true); }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
                  <i className="fas fa-plus text-xs" /> {t.tournamentDetail.registerTeam}
                </button>
              )}
              {canDelete && (
                <button onClick={() => setDeleteId(true)}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors">
                  <i className="fas fa-trash" /> {t.tournamentDetail.deleteBtn}
                </button>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="mt-5">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
              <span>{t.tournamentDetail.participatingTeams}</span>
              <span>{league.teamsCount}/{league.maxTeams}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-5">
          {cup ? (
            <>
              <button onClick={() => setTab('bracket')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'bracket' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-500 hover:bg-gray-200'}`}>
                <i className="fas fa-sitemap text-xs" /> {t.tournamentDetail.tabBracket}
              </button>
              <button onClick={() => setTab('matches')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'matches' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-500 hover:bg-gray-200'}`}>
                <i className="fas fa-calendar-alt text-xs" /> {t.tournamentDetail.tabMatches}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setTab('matches')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'matches' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-500 hover:bg-gray-200'}`}>
                <i className="fas fa-calendar-alt text-xs" /> {t.tournamentDetail.tabMatches}
              </button>
              <button onClick={() => setTab('standings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'standings' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-500 hover:bg-gray-200'}`}>
                <i className="fas fa-list-ol text-xs" /> {t.tournamentDetail.tabStandings}
              </button>
            </>
          )}
        </div>

        {/* ── Teams row ────────────────────────────────────────── */}
        {teamNames.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max">
              <span className="text-slate-500 text-xs font-black flex items-center gap-1.5 flex-shrink-0">
                <i className="fas fa-users" /> {t.tournamentDetail.teamsLabel} ({teamNames.length})
              </span>
              <div className="w-px h-5 bg-gray-200" />
              {teamNames.map((t, i) => (
                <span key={t} className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 whitespace-nowrap">
                  {teamEmoji(t, i)} {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Bracket ─────────────────────────────────────────── */}
        {tab === 'bracket' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-slate-900 font-black mb-5 flex items-center gap-2">
              <i className="fas fa-sitemap text-emerald-500" /> {t.tournamentDetail.bracketTitle}
            </h2>
            {bracketRounds.length === 0 ? (
              <p className="text-center text-slate-400 py-10 font-bold">{t.tournamentDetail.noMatches}</p>
            ) : (
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max" dir="ltr">
                  {bracketRounds.map((round, ri) => (
                    <div key={ri} className="flex flex-col gap-0">
                      {/* Round header */}
                      <div className={`text-center text-[11px] font-black px-3 py-1.5 rounded-lg mb-3 ${
                        ri === bracketRounds.length - 1
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-white/5 text-slate-400'}`}>
                        {ROUND_NAMES[ri] || `الدور ${ri + 1}`}
                      </div>
                      {/* Matches */}
                      <div className={`flex flex-col gap-3 w-44 ${ri > 0 ? 'justify-around h-full' : ''}`}>
                        {round.map((m, mi) => (
                          <MatchCard key={m.id || mi} match={m} highlight={ri === bracketRounds.length - 1} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Matches list ─────────────────────────────────────── */}
        {tab === 'matches' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {matches.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <i className="fas fa-futbol text-3xl mb-3 text-slate-300" />
                <p className="font-bold">{t.tournamentDetail.noMatches}</p>
              </div>
            ) : (
              <>
                {/* Group by date/round */}
                {(() => {
                  const groups: Record<string, Match[]> = {};
                  matches.forEach(m => {
                    const key = m.date || 'غير محدد';
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(m);
                  });
                  return Object.entries(groups).map(([date, gMatches]) => (
                    <div key={date}>
                      <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-black text-slate-600">{date}</span>
                      </div>
                      {gMatches.map((m, i) => (
                        <div key={m.id || i} className="px-5 py-4 border-b border-gray-100 last:border-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="font-black text-sm text-slate-900 min-w-[80px] text-start">{m.homeTeam}</span>
                              <div className={`px-3 py-1.5 rounded-lg text-sm font-black min-w-[70px] text-center ${
                                m.status === 'انتهت' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-slate-500'}`} dir="ltr">
                                {m.status === 'انتهت' ? `${m.homeScore} - ${m.awayScore}` : 'VS'}
                              </div>
                              <span className="font-black text-sm text-slate-900 min-w-[80px] text-end">{m.awayTeam}</span>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mr-3 ${
                              m.status === 'انتهت' ? 'bg-gray-200 text-gray-600' :
                              m.status === 'مباشر' ? 'bg-emerald-500 text-white animate-pulse' :
                              'bg-gray-100 text-slate-500'}`}>
                              {m.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </>
            )}
          </div>
        )}

        {/* ── Standings ────────────────────────────────────────── */}
        {tab === 'standings' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {standings.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold">
                {t.tournamentDetail.noStandings}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {t.tournamentDetail.standingsHeaders.map(h => (
                        <th key={h} className={`px-3 py-3 text-[11px] font-black text-slate-500 ${h === 'الفريق' ? 'text-start' : 'text-center'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, i) => (
                      <tr key={row.name} className={`border-b border-gray-100 last:border-0 ${i < 2 ? 'bg-emerald-50' : ''}`}>
                        <td className="px-3 py-3 text-center">
                          <span className="text-slate-500 font-bold text-xs flex items-center justify-center gap-1">
                            {i === 0 ? <i className="fas fa-crown text-amber-400" /> : i + 1}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-2 font-black text-slate-900">
                            {row.emoji} {row.name}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-slate-700 font-bold">{row.played}</td>
                        <td className="px-3 py-3 text-center text-emerald-600 font-bold">{row.wins}</td>
                        <td className="px-3 py-3 text-center text-slate-500 font-bold">{row.draws}</td>
                        <td className="px-3 py-3 text-center text-red-500 font-bold">{row.losses}</td>
                        <td className="px-3 py-3 text-center text-slate-700 font-bold">{row.gf}</td>
                        <td className="px-3 py-3 text-center text-slate-700 font-bold">{row.ga}</td>
                        <td className="px-3 py-3 text-center font-bold">
                          <span className={row.gd > 0 ? 'text-emerald-600' : row.gd < 0 ? 'text-red-500' : 'text-slate-400'}>
                            {row.gd > 0 ? '+' : ''}{row.gd}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-slate-900 font-black text-base">{row.points}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Registration modal ───────────────────────────────────── */}
      {showReg && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <i className="fas fa-users text-emerald-500" /> {t.tournamentDetail.regModal.title}
              </h3>
              <button onClick={() => { setShowReg(false); setRegMsg(null); setSelTeamId(''); }}
                className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-slate-500">
                <i className="fas fa-times text-xs" />
              </button>
            </div>

            <p className="text-slate-500 text-xs font-bold mb-4">
              {t.tournamentDetail.regModal.selectTeam} <span className="text-slate-900">{league.name}</span>
            </p>

            {myTeams.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">👥</div>
                <p className="text-slate-500 text-sm font-bold mb-3">{t.tournamentDetail.regModal.noTeams}</p>
                <button onClick={() => navigate('/my-teams')}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors">
                  {t.tournamentDetail.regModal.createTeam}
                </button>
              </div>
            ) : (
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {myTeams.map(t => (
                  <button key={t.id} onClick={() => setSelTeamId(t.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-start ${
                      selTeamId === t.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}>
                    <TeamLogo logo={t.logo} color={t.primaryColor} size={36} />
                    <div>
                      <p className="font-black text-slate-900 text-sm">{t.name}</p>
                      <p className="text-slate-500 text-[11px]">{t.membersCount || 0} لاعب</p>
                    </div>
                    {selTeamId === t.id && (
                      <i className="fas fa-check-circle text-emerald-400 me-auto text-sm" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {regMsg && (
              <div className={`flex items-center gap-2 text-sm font-bold px-3 py-2.5 rounded-xl mb-3 ${
                regMsg.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                <i className={`fas ${regMsg.ok ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
                {regMsg.text}
              </div>
            )}

            {myTeams.length > 0 && (
              <button onClick={handleRegister} disabled={!selTeamId || regLoading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                {regLoading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t.tournamentDetail.regModal.registering}</>
                  : <><i className="fas fa-check text-xs" /> {t.tournamentDetail.regModal.confirmBtn}</>}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl" dir="rtl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400">
                <i className="fas fa-trash" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">{t.tournamentDetail.deleteTitle}</h3>
                <p className="text-xs text-slate-500">{t.tournamentDetail.deleteCannotUndo}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t.tournamentDetail.deleteBtn}
              </button>
              <button onClick={() => setDeleteId(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-sm">
                {t.tournamentDetail.deleteCancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetailPage;
