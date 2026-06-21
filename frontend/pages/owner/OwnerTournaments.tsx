'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { backend } from '../../services/backend';
import { League, Match, Team, TeamStanding } from '../../types';

type DetailTab = 'overview' | 'matches' | 'bracket' | 'standings' | 'stats' | 'settings';
type PageView  = 'tournaments' | 'allteams';

const ROUND_ORDER = ['دور الـ 16', 'ربع النهائي', 'نصف النهائي', 'النهائي'];
const ROUND_COLORS: Record<string, string> = {
  'دور الـ 16':   'bg-slate-500',
  'ربع النهائي': 'bg-blue-500',
  'نصف النهائي': 'bg-violet-500',
  'النهائي':     'bg-amber-500',
};
const TEAM_COLORS = [
  'bg-amber-400','bg-orange-400','bg-red-400','bg-pink-400','bg-violet-400',
  'bg-blue-400','bg-cyan-400','bg-teal-400','bg-emerald-400','bg-lime-400',
];

function getRounds(matches: Match[]) {
  const set = new Set(matches.map(m => m.round || 'الدوري'));
  const filtered = ROUND_ORDER.filter(r => set.has(r));
  return filtered.length > 0 ? filtered : [...set];
}
function getWinner(m: Match): 'home' | 'away' | 'draw' | null {
  if (m.status !== 'انتهت' || m.homeScore === null || m.awayScore === null) return null;
  if (m.homeScore > m.awayScore) return 'home';
  if (m.awayScore > m.homeScore) return 'away';
  return 'draw';
}
function getCurrentRound(matches: Match[]): string {
  const pending = matches.filter(m => m.status !== 'انتهت');
  if (pending.length === 0 && matches.length > 0) return 'مكتملة';
  return getRounds(pending)[0] || 'الدوري';
}
function pct(num: number, den: number) {
  return den > 0 ? Math.round((num / den) * 100) : 0;
}
function computeTeamGoals(matches: Match[]) {
  const g: Record<string, { for: number; against: number }> = {};
  matches.filter(m => m.status === 'انتهت').forEach(m => {
    if (!g[m.homeTeam]) g[m.homeTeam] = { for: 0, against: 0 };
    if (!g[m.awayTeam]) g[m.awayTeam] = { for: 0, against: 0 };
    g[m.homeTeam].for     += m.homeScore ?? 0;
    g[m.homeTeam].against += m.awayScore ?? 0;
    g[m.awayTeam].for     += m.awayScore ?? 0;
    g[m.awayTeam].against += m.homeScore ?? 0;
  });
  return g;
}
function findBestMatch(matches: Match[]): Match | null {
  const played = matches.filter(m => m.status === 'انتهت' && m.homeScore !== null && m.awayScore !== null);
  return played.reduce<Match | null>((best, m) => {
    const t = (m.homeScore ?? 0) + (m.awayScore ?? 0);
    const bt = best ? (best.homeScore ?? 0) + (best.awayScore ?? 0) : -1;
    return t > bt ? m : best;
  }, null);
}
function getTeamLogo(teams: any[], name: string): string {
  return teams?.find((t: any) => t.name === name)?.logo || '';
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo({ logo, name, size = 36, idx = 0 }: { logo?: string; name: string; size?: number; idx?: number }) {
  if (logo?.startsWith('data:') || logo?.startsWith('http')) {
    return <img src={logo} alt={name} style={{ width: size, height: size }} className="object-cover rounded-xl flex-shrink-0" />;
  }
  if (logo && [...logo].length <= 4) {
    return (
      <span className="flex items-center justify-center flex-shrink-0 select-none"
        style={{ fontSize: size * 0.65, width: size, height: size, lineHeight: `${size}px` }}>
        {logo}
      </span>
    );
  }
  const bg = TEAM_COLORS[idx % TEAM_COLORS.length];
  return (
    <div style={{ width: size, height: size }}
      className={`${bg} rounded-xl flex items-center justify-center font-black text-white flex-shrink-0`}>
      <span style={{ fontSize: size * 0.45 }}>{name?.[0] || '؟'}</span>
    </div>
  );
}

// ── Result Modal ──────────────────────────────────────────────────────────────
const QUICK_SCORES = [[1,1],[1,0],[0,3],[0,2],[0,1],[0,0],[2,2],[3,0],[2,1],[1,3],[2,0],[1,2]];

function ResultModal({ match, teams, onSave, onClose }: {
  match: Match; teams: any[]; onSave: (h: number, a: number) => void; onClose: () => void;
}) {
  const [home,   setHome]   = useState(match.homeScore ?? 0);
  const [away,   setAway]   = useState(match.awayScore ?? 0);
  const [status, setStatus] = useState<'مجدولة' | 'مباشر' | 'انتهت'>(match.status || 'انتهت');
  const [busy,   setBusy]   = useState(false);

  const homeLogo = getTeamLogo(teams, match.homeTeam);
  const awayLogo = getTeamLogo(teams, match.awayTeam);
  const homeIdx  = teams.findIndex((t: any) => t.name === match.homeTeam);
  const awayIdx  = teams.findIndex((t: any) => t.name === match.awayTeam);

  const resultLabel = home > away ? `فوز ${match.homeTeam}`
    : away > home ? `فوز ${match.awayTeam}` : 'تعادل';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-[10px] text-slate-400 font-bold mb-0.5">{match.round || 'دور المجموعات'}</p>
            <h3 className="font-black text-slate-900 text-base">إدخال نتيجة المباراة</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
            <i className="fas fa-times text-slate-500 text-sm" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Teams + Score */}
          <div className="flex items-center gap-3">
            {/* Home (right in RTL = first shown) */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <Logo logo={homeLogo} name={match.homeTeam} size={40} idx={homeIdx} />
              <p className="text-xs font-black text-slate-800 text-center truncate w-full px-1">{match.homeTeam}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setHome(h => Math.max(0, h - 1))}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl font-black text-slate-600 text-lg transition-colors flex items-center justify-center">
                  −
                </button>
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-black text-2xl">{home}</span>
                </div>
                <button onClick={() => setHome(h => h + 1)}
                  className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-black text-white text-lg transition-colors flex items-center justify-center">
                  +
                </button>
              </div>
            </div>

            {/* Live score */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="bg-slate-100 rounded-xl px-3 py-1.5 text-center">
                <span className="font-black text-slate-700 text-sm">{home} − {away}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">{resultLabel}</span>
            </div>

            {/* Away */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <Logo logo={awayLogo} name={match.awayTeam} size={40} idx={awayIdx} />
              <p className="text-xs font-black text-slate-800 text-center truncate w-full px-1">{match.awayTeam}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setAway(a => Math.max(0, a - 1))}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl font-black text-slate-600 text-lg transition-colors flex items-center justify-center">
                  −
                </button>
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-black text-2xl">{away}</span>
                </div>
                <button onClick={() => setAway(a => a + 1)}
                  className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-black text-white text-lg transition-colors flex items-center justify-center">
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Quick scores */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-end">نتائج سريعة</p>
            <div className="grid grid-cols-6 gap-1.5">
              {QUICK_SCORES.map(([h, a]) => {
                const active = home === h && away === a;
                return (
                  <button key={`${h}-${a}`} onClick={() => { setHome(h); setAway(a); }}
                    className={`py-1.5 rounded-xl text-xs font-black transition-all ${
                      active ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-slate-600'
                    }`}>
                    {h}-{a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 text-end">تاريخ المباراة</p>
              <input type="date" defaultValue={match.date}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-400 transition-colors" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 text-end">حالة المباراة</p>
              <div className="space-y-1">
                {(['مجدولة', 'مباشر', 'انتهت'] as const).map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className={`w-full py-1.5 px-3 rounded-xl text-xs font-black text-end transition-all flex items-center justify-end gap-2 ${
                      status === s
                        ? s === 'مجدولة' ? 'bg-slate-100 text-slate-700 border-2 border-slate-300'
                          : s === 'مباشر' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                          : 'bg-slate-900 text-white border-2 border-slate-900'
                        : 'bg-gray-50 text-slate-400 border-2 border-transparent'
                    }`}>
                    {s}
                    {s === 'مجدولة' && <i className="fas fa-info-circle text-[10px]" />}
                    {s === 'مباشر' && <span className="w-2 h-2 bg-emerald-500 rounded-full" />}
                    {s === 'انتهت' && <span className="w-2 h-2 bg-slate-400 rounded-full" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-200 text-slate-600 font-bold rounded-2xl text-sm hover:bg-gray-50 transition-colors">
              إلغاء
            </button>
            <button disabled={busy}
              onClick={async () => { setBusy(true); await onSave(home, away); setBusy(false); }}
              className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/30">
              {busy
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><i className="fas fa-check" /> تأكيد النتيجة</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bracket ───────────────────────────────────────────────────────────────────
function BracketTab({ matches, format }: { matches: Match[]; format: string }) {
  if (format !== 'cup') return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
      <i className="fas fa-table text-4xl text-slate-200 mb-3 block" />
      <p className="font-black text-slate-600 mb-1">بطولة دوري</p>
      <p className="text-slate-400 text-sm">شجرة الإقصاء متاحة لبطولات الكأس فقط</p>
    </div>
  );

  const rounds = getRounds(matches);
  if (rounds.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
      <i className="fas fa-sitemap text-4xl text-slate-200 mb-3 block" />
      <p className="font-black text-slate-600 mb-1">لم تُولَّد المباريات بعد</p>
      <p className="text-slate-400 text-sm">اذهب لتبويب الإعدادات وولّد مباريات البطولة</p>
    </div>
  );

  const CARD_H = 72; const GAP = 16; const COL_W = 210; const COL_GAP = 48;
  function getPositions(roundIdx: number, totalRounds: number) {
    const matchCount = matches.filter(m => m.round === rounds[roundIdx]).length;
    const spacing = Math.pow(2, roundIdx) * (CARD_H + GAP);
    const totalH  = matchCount * spacing - GAP;
    const offset  = (Math.pow(2, totalRounds - 1) * (CARD_H + GAP) - totalH) / 2;
    return Array.from({ length: matchCount }, (_, i) => offset + i * spacing);
  }
  const totalRounds = rounds.length;
  const svgH = Math.max(300, Math.pow(2, totalRounds - 1) * (CARD_H + GAP) + 60);
  const svgW = totalRounds * (COL_W + COL_GAP) + 40;

  return (
    <div className="overflow-x-auto pb-4" dir="ltr">
      <div className="relative" style={{ width: svgW, height: svgH + 50 }}>
        {rounds.map((round, ri) => {
          const x = ri * (COL_W + COL_GAP);
          return (
            <div key={round} className="absolute top-0 flex justify-center items-center" style={{ left: x, width: COL_W }}>
              <span className={`text-[11px] font-black text-white px-3 py-1 rounded-full ${ROUND_COLORS[round] || 'bg-slate-500'}`}>{round}</span>
            </div>
          );
        })}
        <svg className="absolute inset-0 pointer-events-none" width={svgW} height={svgH + 50}>
          {rounds.slice(0, -1).map((round, ri) => {
            const positions = getPositions(ri, totalRounds);
            const nextPositions = getPositions(ri + 1, totalRounds);
            const x1 = ri * (COL_W + COL_GAP) + COL_W;
            const x2 = (ri + 1) * (COL_W + COL_GAP);
            return positions.map((y, mi) => {
              const cardMidY = 30 + y + CARD_H / 2;
              const partnerY = mi % 2 === 0 ? positions[mi + 1] : positions[mi - 1];
              if (partnerY === undefined) return null;
              const partnerMidY = 30 + partnerY + CARD_H / 2;
              const nextY = mi % 2 === 0 ? 30 + nextPositions[Math.floor(mi / 2)] + CARD_H / 2 : null;
              return (
                <g key={`${ri}-${mi}`}>
                  <line x1={x1} y1={cardMidY} x2={x1 + COL_GAP / 2} y2={cardMidY} stroke="#cbd5e1" strokeWidth="1.5" />
                  {mi % 2 === 0 && <line x1={x1 + COL_GAP / 2} y1={cardMidY} x2={x1 + COL_GAP / 2} y2={partnerMidY} stroke="#cbd5e1" strokeWidth="1.5" />}
                  {mi % 2 === 0 && nextY !== null && <line x1={x1 + COL_GAP / 2} y1={(cardMidY + partnerMidY) / 2} x2={x2} y2={nextY} stroke="#cbd5e1" strokeWidth="1.5" />}
                </g>
              );
            });
          })}
        </svg>
        {rounds.map((round, ri) => {
          const roundMatches = matches.filter(m => m.round === round);
          const positions = getPositions(ri, totalRounds);
          const x = ri * (COL_W + COL_GAP);
          return roundMatches.map((m, mi) => {
            const y = 30 + (positions[mi] ?? 0);
            const winner = getWinner(m);
            const isFinal = round === 'النهائي';
            return (
              <div key={m.id} className="absolute" style={{ left: x, top: y, width: COL_W, height: CARD_H }}>
                <div className={`rounded-xl border-2 overflow-hidden h-full ${
                  m.status === 'انتهت' ? 'border-gray-200 shadow-sm' :
                  m.status === 'مباشر' ? 'border-red-400 shadow-md shadow-red-100' : 'border-dashed border-gray-200'
                } ${isFinal ? 'ring-2 ring-amber-400/50' : ''}`}>
                  {[
                    { team: m.homeTeam, score: m.homeScore, isWinner: winner === 'home' },
                    { team: m.awayTeam, score: m.awayScore, isWinner: winner === 'away' },
                  ].map((s, si) => (
                    <div key={si} className={`flex items-center justify-between px-2.5 ${si === 0 ? 'h-8 border-b border-gray-100' : 'h-8'} ${s.isWinner ? 'bg-emerald-50' : 'bg-white'}`}>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {s.isWinner && <i className="fas fa-check text-emerald-500 text-[9px]" />}
                        {isFinal && s.isWinner && <i className="fas fa-crown text-amber-400 text-[9px]" />}
                        <span className={`text-[11px] truncate font-bold ${s.isWinner ? 'text-emerald-700 font-black' : 'text-slate-600'}`}>{s.team}</span>
                      </div>
                      <span className={`text-sm font-black w-5 text-center ${s.isWinner ? 'text-emerald-600' : 'text-slate-500'}`}>{s.score ?? '−'}</span>
                    </div>
                  ))}
                </div>
                {m.status === 'مباشر' && (
                  <div className="absolute -top-2 -right-1 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <span className="w-1 h-1 bg-white rounded-full animate-pulse" /> LIVE
                  </div>
                )}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ tournament, matches, standings, onAdvance, advanceBusy, onResult }: {
  tournament: League; matches: Match[]; standings: TeamStanding[];
  onAdvance: () => void; advanceBusy: boolean; onResult: (m: Match) => void;
}) {
  const isCup    = tournament.format === 'cup';
  const curRound = getCurrentRound(matches);
  const done     = matches.filter(m => m.status === 'انتهت').length;
  const live     = matches.filter(m => m.status === 'مباشر').length;
  const upcoming = matches.filter(m => m.status === 'مجدولة');
  const progress = pct(done, matches.length);
  const teams    = tournament.registeredTeamsDetail || [];

  const curRoundMatches = matches.filter(m => m.round === curRound || (!m.round && curRound === 'الدوري'));
  const allCurDone = curRoundMatches.length > 0 && curRoundMatches.every(m => m.status === 'انتهت');
  const canAdvance = isCup && allCurDone && curRound !== 'النهائي' && curRound !== 'مكتملة';

  const recent   = matches.filter(m => m.status === 'انتهت').slice(-3).reverse();
  const nextThree = upcoming.slice(0, 3);

  const sorted   = [...standings].sort((a, b) => b.points - a.points || b.wins - a.wins);
  const leader   = sorted[0];
  const leaderLogo = leader ? getTeamLogo(teams, leader.name) : '';
  const leaderIdx  = teams.findIndex((t: any) => t.name === leader?.name);

  return (
    <div className="space-y-4">
      {/* League system card */}
      {!isCup && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <span className="font-black text-slate-800 text-sm">نظام الدوري</span>
            <i className="fas fa-list-alt text-slate-300 text-lg" />
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-100 rtl:divide-x-reverse">
            {[
              { label:'خسارة', pts:'0 نقاط',  bg:'bg-red-50',     icon:'fa-times-circle', ic:'text-red-400'     },
              { label:'تعادل', pts:'1+ نقطة', bg:'bg-amber-50',   icon:'fa-equals',       ic:'text-amber-400'   },
              { label:'فوز',   pts:'3+ نقاط', bg:'bg-emerald-50', icon:'fa-check-circle', ic:'text-emerald-500' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} flex flex-col items-center justify-center py-4 gap-1.5`}>
                <i className={`fas ${s.icon} text-2xl ${s.ic}`} />
                <p className="font-black text-slate-800 text-sm">{s.pts}</p>
                <p className="text-[10px] text-slate-500 font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leader card */}
      {leader && !isCup && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">صدارة الدوري</p>
              <div className="flex items-center gap-2 mt-1">
                <Logo logo={leaderLogo} name={leader.name} size={32} idx={leaderIdx} />
                <h3 className="font-black text-xl">{leader.name}</h3>
              </div>
            </div>
            <div className="text-end">
              <p className="text-4xl font-black text-white">{leader.points}</p>
              <p className="text-blue-200 text-xs font-bold">نقطة</p>
            </div>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2 text-xs font-bold text-blue-100 flex items-center gap-2 flex-wrap">
            <span>{(leader.wins + leader.draws + leader.losses)} مباراة</span>
            <span>·</span>
            <span>{leader.wins} فوز</span>
            <span>·</span>
            <span>{leader.draws} تعادل</span>
            <span>·</span>
            <span>{leader.losses} خسارة</span>
          </div>
        </div>
      )}

      {/* Mini standings */}
      {sorted.length > 0 && !isCup && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fas fa-list-ol text-slate-400 text-sm" />
              <span className="font-black text-slate-800 text-sm">ترتيب الدوري</span>
            </div>
            <span className="text-xs text-emerald-600 font-bold">عرض الكل ←</span>
          </div>
          <div className="divide-y divide-gray-50">
            {sorted.slice(0, 5).map((t, i) => {
              const tLogo = getTeamLogo(teams, t.name);
              const tIdx  = teams.findIndex((tm: any) => tm.name === t.name);
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                    i===0 ? 'bg-amber-400 text-white' : i===1 ? 'bg-slate-300 text-slate-700' : i===2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-slate-500'
                  }`}>{i+1}</span>
                  <Logo logo={tLogo} name={t.name} size={24} idx={tIdx} />
                  <span className="flex-1 text-sm font-black text-slate-800 truncate">{t.name}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{t.wins}ف · {t.draws}ت · {t.losses}خ</span>
                  <span className="font-black text-slate-900 w-6 text-center">{t.points}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <i className="fas fa-chart-line text-slate-400 text-sm" />
            <span className="font-black text-slate-800 text-sm">تقدّم {isCup ? 'البطولة' : 'الدوري'}</span>
          </div>
          <span className="font-black text-blue-600 text-lg">{progress}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'مجدولة', val:upcoming.length, bg:'bg-amber-50 text-amber-600'   },
            { label:'مباشرة', val:live,            bg:'bg-red-50 text-red-500'        },
            { label:'منتهية', val:done,            bg:'bg-emerald-50 text-emerald-600'},
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl py-3 text-center`}>
              <p className="text-2xl font-black">{s.val}</p>
              <p className="text-[10px] font-bold mt-0.5 opacity-70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Advance round */}
      {canAdvance && (
        <button onClick={onAdvance} disabled={advanceBusy}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/30">
          {advanceBusy
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><i className="fas fa-arrow-up-right-from-square" /> الانتقال للدور التالي</>}
        </button>
      )}

      {/* Cup stages */}
      {isCup && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
            <i className="fas fa-road text-slate-400 text-sm" />
            <span className="font-black text-slate-800 text-sm">مسار البطولة</span>
          </div>
          <div className="p-4 flex items-center gap-1 overflow-x-auto">
            {ROUND_ORDER.map((r, i) => {
              const rm = matches.filter(m => m.round === r);
              const isDone = rm.length > 0 && rm.every(m => m.status === 'انتهت');
              const isCur  = r === curRound;
              const has    = rm.length > 0;
              return (
                <React.Fragment key={r}>
                  {i > 0 && <div className={`h-0.5 flex-1 min-w-4 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                      isDone ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' :
                      isCur  ? 'bg-amber-400 text-white animate-pulse' :
                      has    ? 'bg-slate-200 text-slate-500' : 'bg-gray-100 text-slate-300'
                    }`}>
                      {isDone ? <i className="fas fa-check" /> : isCur ? <i className="fas fa-play text-xs" /> : <i className="fas fa-lock text-xs" />}
                    </div>
                    <span className={`text-[9px] font-black whitespace-nowrap ${isCur ? 'text-amber-600' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {r.replace('دور الـ', 'دور')}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent + Upcoming */}
      <div className="grid grid-cols-2 gap-3">
        {recent.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-1.5">
              <i className="fas fa-flag-checkered text-slate-400 text-xs" />
              <span className="font-black text-slate-800 text-xs">آخر النتائج</span>
            </div>
            <div className="divide-y divide-gray-50">
              {recent.map(m => {
                const w = getWinner(m);
                const hLogo = getTeamLogo(teams, m.homeTeam);
                const aLogo = getTeamLogo(teams, m.awayTeam);
                const hi = teams.findIndex((t: any) => t.name === m.homeTeam);
                const ai = teams.findIndex((t: any) => t.name === m.awayTeam);
                return (
                  <div key={m.id} className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 flex-1 justify-end">
                        <p className={`text-[11px] truncate font-bold text-end ${w === 'home' ? 'text-emerald-700 font-black' : 'text-slate-600'}`}>{m.homeTeam}</p>
                        <Logo logo={hLogo} name={m.homeTeam} size={18} idx={hi} />
                      </div>
                      <div className="bg-slate-900 rounded-lg px-1.5 py-0.5 flex-shrink-0">
                        <span className="text-white font-black text-xs">{m.homeScore}-{m.awayScore}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-1">
                        <Logo logo={aLogo} name={m.awayTeam} size={18} idx={ai} />
                        <p className={`text-[11px] truncate font-bold ${w === 'away' ? 'text-emerald-700 font-black' : 'text-slate-600'}`}>{m.awayTeam}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {nextThree.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-1.5">
              <i className="fas fa-calendar-alt text-slate-400 text-xs" />
              <span className="font-black text-slate-800 text-xs">المباريات القادمة</span>
            </div>
            <div className="divide-y divide-gray-50">
              {nextThree.map(m => {
                const hLogo = getTeamLogo(teams, m.homeTeam);
                const aLogo = getTeamLogo(teams, m.awayTeam);
                const hi = teams.findIndex((t: any) => t.name === m.homeTeam);
                const ai = teams.findIndex((t: any) => t.name === m.awayTeam);
                return (
                  <div key={m.id} className="px-4 py-3">
                    <p className="text-[9px] text-slate-400 font-bold mb-1.5 text-end">{m.date}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 flex-1 justify-end">
                        <p className="text-[11px] font-bold text-slate-700 truncate">{m.homeTeam}</p>
                        <Logo logo={hLogo} name={m.homeTeam} size={18} idx={hi} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold flex-shrink-0">VS</span>
                      <div className="flex items-center gap-1 flex-1">
                        <Logo logo={aLogo} name={m.awayTeam} size={18} idx={ai} />
                        <p className="text-[11px] font-bold text-slate-700 truncate">{m.awayTeam}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Matches Tab ───────────────────────────────────────────────────────────────
function MatchesTab({ matches, teams, onResult }: { matches: Match[]; teams: any[]; onResult: (m: Match) => void }) {
  const [filter, setFilter] = useState<string>('all');
  const filtered = filter === 'all' ? matches : matches.filter(m => m.status === filter);
  const grouped: Record<string, Match[]> = {};
  filtered.forEach(m => { const k = m.date || m.round || 'الدوري'; grouped[k] = [...(grouped[k] || []), m]; });
  const sortedKeys = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl w-fit">
        {([['all','الكل'],['مجدولة','قادمة'],['انتهت','منتهية']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {l} {v !== 'all' && <span className="opacity-60">({matches.filter(m => m.status === v).length})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <i className="fas fa-futbol text-4xl text-gray-200 mb-3 block" />
          <p className="font-black text-slate-700">لا توجد مباريات</p>
        </div>
      )}

      {sortedKeys.map(key => (
        <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-2.5 border-b border-gray-50 bg-slate-50 flex items-center justify-between">
            <span className="font-black text-slate-600 text-xs">{key}</span>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{grouped[key].length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {grouped[key].map(m => {
              const w      = getWinner(m);
              const hLogo  = getTeamLogo(teams, m.homeTeam);
              const aLogo  = getTeamLogo(teams, m.awayTeam);
              const hi     = teams.findIndex((t: any) => t.name === m.homeTeam);
              const ai     = teams.findIndex((t: any) => t.name === m.awayTeam);
              return (
                <div key={m.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.status === 'انتهت' ? 'bg-emerald-100 text-emerald-700' :
                      m.status === 'مباشر' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500'
                    }`}>{m.status}</span>
                    {m.round && <span className="text-[10px] text-slate-400 font-bold">{m.round}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center justify-end gap-2">
                      <p className={`text-sm truncate ${w === 'home' ? 'font-black text-emerald-700' : 'font-bold text-slate-800'}`}>{m.homeTeam}</p>
                      <Logo logo={hLogo} name={m.homeTeam} size={28} idx={hi} />
                    </div>

                    {m.status === 'انتهت' ? (
                      <div className="flex items-center gap-1 flex-shrink-0 bg-slate-900 rounded-xl px-3 py-1.5">
                        <span className="text-white font-black">{m.homeScore}</span>
                        <span className="text-slate-500 text-xs">-</span>
                        <span className="text-white font-black">{m.awayScore}</span>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <span className="text-xs text-slate-400 font-black">VS</span>
                        <button onClick={() => onResult(m)}
                          className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold transition-colors">
                          إدخال النتيجة
                        </button>
                      </div>
                    )}

                    <div className="flex-1 flex items-center gap-2">
                      <Logo logo={aLogo} name={m.awayTeam} size={28} idx={ai} />
                      <p className={`text-sm truncate ${w === 'away' ? 'font-black text-emerald-700' : 'font-bold text-slate-800'}`}>{m.awayTeam}</p>
                    </div>
                  </div>

                  {m.status === 'انتهت' && (
                    <div className="flex justify-start mt-2">
                      <button onClick={() => onResult(m)}
                        className="flex items-center gap-1 text-[10px] border border-gray-200 text-slate-500 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors font-bold">
                        <i className="fas fa-pencil-alt text-[9px]" /> تعديل
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Standings Tab (League) ────────────────────────────────────────────────────
function StandingsTab({ standings, matches, teams }: {
  standings: TeamStanding[]; matches: Match[]; teams: any[];
}) {
  const goals  = computeTeamGoals(matches);
  const sorted = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = (goals[a.name]?.for ?? 0) - (goals[a.name]?.against ?? 0);
    const gdB = (goals[b.name]?.for ?? 0) - (goals[b.name]?.against ?? 0);
    return gdB - gdA;
  });
  const [p1, p2, p3] = sorted;

  if (standings.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
      <i className="fas fa-trophy text-4xl text-gray-200 mb-3 block" />
      <p className="font-black text-slate-700">لا توجد إحصائيات بعد</p>
      <p className="text-slate-400 text-sm mt-1">ولّد المباريات أولاً</p>
    </div>
  );

  function PodiumCard({ t, rank }: { t?: TeamStanding; rank: 1 | 2 | 3 }) {
    if (!t) return null;
    const logo = getTeamLogo(teams, t.name);
    const idx  = teams.findIndex((tm: any) => tm.name === t.name);
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
    const bg    = rank === 1 ? 'bg-amber-50 border-amber-200' : rank === 2 ? 'bg-slate-50 border-slate-200' : 'bg-orange-50 border-orange-200';
    const pts   = rank === 1 ? 'text-amber-600' : rank === 2 ? 'text-slate-500' : 'text-orange-600';
    return (
      <div className={`${bg} border rounded-2xl p-4 flex flex-col items-center gap-2 flex-1 text-center`}>
        <span className="text-2xl">{medal}</span>
        <Logo logo={logo} name={t.name} size={40} idx={idx} />
        <p className="font-black text-slate-800 text-sm truncate w-full">{t.name}</p>
        <p className={`${pts} font-black text-lg`}>{t.points} <span className="text-xs font-bold">نقطة</span></p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Podium */}
      {sorted.length >= 2 && (
        <div className="flex gap-3">
          {p2 && <PodiumCard t={p2} rank={2} />}
          {p1 && <PodiumCard t={p1} rank={1} />}
          {p3 && <PodiumCard t={p3} rank={3} />}
        </div>
      )}

      {/* Full standings table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-3 py-3 text-right text-[10px] font-black w-8">#</th>
                <th className="px-3 py-3 text-right text-[10px] font-black">الفريق</th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-slate-300 w-9">م.ل</th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-emerald-400 w-9">ف</th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-amber-400 w-9">ت</th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-red-400 w-9">خ</th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-emerald-300 w-9">ه+</th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-red-300 w-9">ه-</th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-blue-300 w-9">فارق</th>
                <th className="px-3 py-3 text-center text-[10px] font-black text-white w-10">نقاط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((t, i) => {
                const gf = goals[t.name]?.for ?? 0;
                const ga = goals[t.name]?.against ?? 0;
                const gd = gf - ga;
                const logo = getTeamLogo(teams, t.name);
                const idx  = teams.findIndex((tm: any) => tm.name === t.name);
                const played = t.wins + t.draws + t.losses;
                return (
                  <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${i < 3 ? 'font-bold' : ''}`}>
                    <td className="px-3 py-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                        i===0 ? 'bg-amber-400 text-white' : i===1 ? 'bg-slate-300 text-slate-700' : i===2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-slate-500'
                      }`}>{i+1}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Logo logo={logo} name={t.name} size={24} idx={idx} />
                        <span className="font-black text-slate-800 text-sm truncate">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-slate-600 font-bold text-xs">{played}</td>
                    <td className="px-3 py-3 text-center text-emerald-600 font-bold text-xs">{t.wins}</td>
                    <td className="px-3 py-3 text-center text-amber-600 font-bold text-xs">{t.draws}</td>
                    <td className="px-3 py-3 text-center text-red-500 font-bold text-xs">{t.losses}</td>
                    <td className="px-3 py-3 text-center text-emerald-600 font-bold text-xs">{gf}</td>
                    <td className="px-3 py-3 text-center text-red-500 font-bold text-xs">{ga}</td>
                    <td className="px-3 py-3 text-center font-bold text-xs">
                      <span className={gd > 0 ? 'text-emerald-600' : gd < 0 ? 'text-red-500' : 'text-slate-400'}>
                        {gd > 0 ? `+${gd}` : gd}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-black text-slate-900 text-base">{t.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────
function StatsTab({ standings, matches, teams }: {
  standings: TeamStanding[]; matches: Match[]; teams: any[];
}) {
  const goals      = computeTeamGoals(matches);
  const sorted     = [...standings].sort((a, b) => b.points - a.points || b.wins - a.wins);
  const played     = matches.filter(m => m.status === 'انتهت').length;
  const totalGoals = matches.filter(m => m.status === 'انتهت').reduce((s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  const avgGoals   = played > 0 ? (totalGoals / played).toFixed(1) : '0.0';
  const completePct = pct(played, matches.length);
  const bestMatch  = findBestMatch(matches);

  const goalsSorted = sorted
    .map(t => ({ ...t, gf: goals[t.name]?.for ?? 0, ga: goals[t.name]?.against ?? 0 }))
    .sort((a, b) => b.gf - a.gf);

  const maxGoals = Math.max(...goalsSorted.map(t => t.gf), 1);

  const BAR_COLORS = ['bg-amber-400','bg-slate-400','bg-orange-400','bg-red-400','bg-pink-400','bg-violet-400','bg-blue-400','bg-cyan-400','bg-teal-400','bg-emerald-400'];

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'مباريات مكتملة', val:`${completePct}%`, icon:'fa-percent',    c:'text-violet-600', bg:'bg-violet-50 border-violet-100' },
          { label:'متوسط أهداف/مباراة', val:avgGoals,        icon:'fa-chart-line', c:'text-blue-600',   bg:'bg-blue-50 border-blue-100'     },
          { label:'إجمالي الأهداف', val:totalGoals,        icon:'fa-futbol',     c:'text-emerald-600',bg:'bg-emerald-50 border-emerald-100'},
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-4 text-center`}>
            <i className={`fas ${s.icon} text-xl mb-2 block ${s.c}`} />
            <p className={`text-2xl font-black ${s.c}`}>{s.val}</p>
            <p className="text-[10px] font-bold mt-1 text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Goals per team bar chart */}
      {goalsSorted.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fas fa-chart-bar text-slate-400 text-sm" />
              <span className="font-black text-slate-800 text-sm">الأهداف المسجلة لكل فريق</span>
            </div>
            <i className="fas fa-info-circle text-slate-300 text-sm" />
          </div>
          <div className="divide-y divide-gray-50">
            {goalsSorted.map((t, i) => {
              const logo = getTeamLogo(teams, t.name);
              const idx  = teams.findIndex((tm: any) => tm.name === t.name);
              const barW = pct(t.gf, maxGoals);
              const barColor = BAR_COLORS[i % BAR_COLORS.length];
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-6 text-center text-[10px] font-black text-slate-400 flex-shrink-0">{i + 1}</span>
                  <Logo logo={logo} name={t.name} size={24} idx={idx} />
                  <span className="w-20 text-xs font-black text-slate-700 truncate text-end">{t.name}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${barW}%` }} />
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] font-black text-emerald-600">+{t.gf} هدف</span>
                    <span className="text-[11px] font-black text-red-500">-{t.ga} هدف</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Best match */}
      {bestMatch && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-amber-100 flex items-center gap-2">
            <i className="fas fa-fire text-amber-500 text-sm" />
            <span className="font-black text-amber-900 text-sm">أكثر مباراة في الأهداف</span>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="font-black text-slate-800 text-sm truncate">{bestMatch.homeTeam}</span>
                <Logo logo={getTeamLogo(teams, bestMatch.homeTeam)} name={bestMatch.homeTeam} size={28}
                  idx={teams.findIndex((t: any) => t.name === bestMatch.homeTeam)} />
              </div>
              <div className="bg-slate-900 rounded-2xl px-4 py-2 flex-shrink-0">
                <span className="text-white font-black text-xl">{bestMatch.homeScore} - {bestMatch.awayScore}</span>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Logo logo={getTeamLogo(teams, bestMatch.awayTeam)} name={bestMatch.awayTeam} size={28}
                  idx={teams.findIndex((t: any) => t.name === bestMatch.awayTeam)} />
                <span className="font-black text-slate-800 text-sm truncate">{bestMatch.awayTeam}</span>
              </div>
            </div>
            <p className="text-center text-xs text-amber-700 font-bold mt-3">
              {bestMatch.date} · إجمالي {(bestMatch.homeScore ?? 0) + (bestMatch.awayScore ?? 0)} أهداف
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Settings Tab (was DetailsTab) ─────────────────────────────────────────────
function SettingsTab({ tournament, matches, onGenLeague, onGenKnockout, busy }: {
  tournament: League; matches: Match[];
  onGenLeague: () => void; onGenKnockout: () => void; busy: boolean;
}) {
  const isCup   = tournament.format === 'cup';
  const teams   = tournament.registeredTeamsDetail || [];
  const remaining = tournament.maxTeams - tournament.teamsCount;

  return (
    <div className="space-y-4">
      {/* 4 info cards */}
      <div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 text-end">تفاصيل</p>
        <h2 className="text-xl font-black text-slate-900 text-end mb-3">معلومات البطولة</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label:'الرياضة',       val:tournament.sport || 'كرة القدم', icon:'fa-futbol',         bg:'bg-violet-50 border-violet-100', ic:'text-violet-500' },
            { label:'الفرق',         val:`${tournament.teamsCount}/${tournament.maxTeams}`,  icon:'fa-users',          bg:'bg-emerald-50 border-emerald-100', ic:'text-emerald-500' },
            { label:'تاريخ البدء',  val:tournament.startDate,            icon:'fa-calendar-alt',   bg:'bg-blue-50 border-blue-100',    ic:'text-blue-500'    },
            { label:'الجائزة',       val:tournament.prizePool || '—',     icon:'fa-trophy',         bg:'bg-amber-50 border-amber-100',  ic:'text-amber-500'   },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-2xl p-4 flex flex-col items-center gap-2`}>
              <i className={`fas ${s.icon} text-2xl ${s.ic}`} />
              <p className="font-black text-slate-900 text-sm text-center">{s.val}</p>
              <p className="text-[10px] text-slate-500 font-bold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Participating teams */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fas fa-users text-slate-400 text-sm" />
            <span className="font-black text-slate-800 text-sm">الفرق المشاركة</span>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-full">({teams.length})</span>
        </div>

        {/* Progress bar */}
        <div className="px-5 py-3 border-b border-gray-50">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span>{remaining > 0 ? `${remaining} مقعد متبقي` : 'اكتملت الفرق 🎉'}</span>
            <span>{tournament.teamsCount}/{tournament.maxTeams}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
              style={{ width: `${pct(tournament.teamsCount, tournament.maxTeams)}%` }} />
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="p-10 text-center">
            <i className="fas fa-users text-3xl text-gray-200 mb-2 block" />
            <p className="font-black text-slate-600 text-sm">لم يسجّل أي فريق بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-4">
            {teams.map((t: any, i: number) => (
              <div key={t.id || i} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                <Logo logo={t.logo} name={t.name} size={28} idx={i} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 text-xs truncate">{t.name}</p>
                  <p className="text-[9px] text-slate-400">فريق {i + 1}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
        <h3 className="font-black text-slate-800 text-sm mb-3">تفاصيل إضافية</h3>
        {[
          ['النوع',          isCup ? 'كأس (خروج المغلوب)' : 'دوري (نقاط)'],
          ['الحالة',         tournament.status],
          ['نوع الملعب',     tournament.fieldType || '—'],
          ['تاريخ الانتهاء', tournament.endDate || '—'],
          ['آخر تسجيل',      tournament.regDeadline || '—'],
          ['رسوم المشاركة',  tournament.entryFee ? `${tournament.entryFee} JD` : 'مجاني'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-none">
            <span className="text-xs text-slate-400 font-bold">{k}</span>
            <span className="text-xs font-black text-slate-800">{v}</span>
          </div>
        ))}
      </div>

      {/* Generate matches */}
      {!tournament.matchesGenerated && tournament.teamsCount >= 2 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <i className="fas fa-magic text-white" />
            </div>
            <div>
              <p className="font-black text-emerald-900 text-sm">توليد المباريات</p>
              <p className="text-emerald-700 text-xs">{isCup ? 'توليد الجولة الأولى بنظام الكأس' : 'توليد الجدول الكامل للدوري'}</p>
            </div>
          </div>
          <button onClick={isCup ? onGenKnockout : onGenLeague} disabled={busy}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {busy ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><i className="fas fa-magic" /> توليد المباريات</>}
          </button>
        </div>
      )}
    </div>
  );
}

// ── All Teams Section ─────────────────────────────────────────────────────────
function AllTeamsSection({ teams, loading }: { teams: Team[]; loading: boolean }) {
  const [search, setSearch] = useState('');
  const [sort, setSort]     = useState<'points'|'wins'|'name'>('points');
  const filtered = teams
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.city?.includes(search))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'ar') : (b[sort] as number) - (a[sort] as number));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن فريق..."
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-colors bg-white" dir="rtl" />
        <select value={sort} onChange={e => setSort(e.target.value as any)}
          className="px-3 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 bg-white">
          <option value="points">الأعلى نقاطاً</option>
          <option value="wins">الأكثر فوزاً</option>
          <option value="name">الاسم</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <i className="fas fa-users text-4xl text-gray-200 mb-3 block" />
          <p className="font-black text-slate-700">{search ? 'لا توجد نتائج' : 'لا توجد فرق'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, i) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <Logo logo={t.logo} name={t.name} size={44} idx={i} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 truncate">{t.name}</p>
                  <p className="text-xs text-slate-400">
                    {t.city && <span><i className="fas fa-map-marker-alt me-1 text-slate-300" />{t.city}</span>}
                    {t.fieldType && <span className="ms-2">{t.fieldType}</span>}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[['فوز',t.wins,'text-emerald-600'],['تعادل',t.draws,'text-amber-500'],['خسارة',t.losses,'text-red-500'],['نقطة',t.points,'text-slate-900']].map(([l,v,c]) => (
                  <div key={l as string} className="bg-gray-50 rounded-lg py-1.5">
                    <p className={`font-black text-sm ${c}`}>{v}</p>
                    <p className="text-[9px] text-slate-400">{l}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-slate-400">
                <span><i className="fas fa-users me-1" />{(t.membersCount ?? 0) + 1} لاعب</span>
                {t.ageGroup && <span>{t.ageGroup}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
const OwnerTournaments: React.FC = () => {
  const { user } = useAuth();
  const [pageView,     setPageView]     = useState<PageView>('tournaments');
  const [tournaments,  setTournaments]  = useState<League[]>([]);
  const [allTeams,     setAllTeams]     = useState<Team[]>([]);
  const [selected,     setSelected]     = useState<League | null>(null);
  const [matches,      setMatches]      = useState<Match[]>([]);
  const [standings,    setStandings]    = useState<TeamStanding[]>([]);
  const [tab,          setTab]          = useState<DetailTab>('overview');
  const [loading,      setLoading]      = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [matchLoad,    setMatchLoad]    = useState(false);
  const [toast,        setToast]        = useState('');
  const [toastType,    setToastType]    = useState<'ok'|'err'>('ok');
  const [resultMatch,  setResultMatch]  = useState<Match | null>(null);
  const [advanceBusy,  setAdvanceBusy]  = useState(false);
  const [genBusy,      setGenBusy]      = useState(false);
  const [showCreate,   setShowCreate]   = useState(false);
  const [createBusy,   setCreateBusy]   = useState(false);
  const [form, setForm] = useState({ name:'', format:'cup', fieldType:'7v7', maxTeams:'8', startDate:'', endDate:'', prizePool:'' });

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast(msg); setToastType(type); setTimeout(() => setToast(''), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true); setTeamsLoading(true);
    const [ts, teams] = await Promise.all([backend.getLeagues(), backend.getAllTeams()]);
    setTournaments(ts); setAllTeams(teams);
    setLoading(false); setTeamsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const selectTournament = async (t: League) => {
    setSelected(t); setTab('overview'); setMatchLoad(true);
    const [ms, st] = await Promise.all([backend.getMatches(t.id), backend.getTournamentStandings(t.id)]);
    setMatches(ms); setStandings(st); setMatchLoad(false);
  };

  const reloadMatches = async () => {
    if (!selected) return;
    const [ms, st] = await Promise.all([backend.getMatches(selected.id), backend.getTournamentStandings(selected.id)]);
    setMatches(ms); setStandings(st);
  };

  const handleResultSave = async (home: number, away: number) => {
    if (!resultMatch) return;
    const ok = await backend.updateMatchResult(resultMatch.id, home, away);
    if (ok) { showToast('تم حفظ النتيجة'); await reloadMatches(); }
    else showToast('فشل حفظ النتيجة', 'err');
    setResultMatch(null);
  };

  const handleGenLeague = async () => {
    if (!selected) return; setGenBusy(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://projectkickoff.onrender.com/api'}/tournaments/${selected.id}/generate-matches`, {
        method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'تم توليد المباريات');
        setSelected(s => s ? { ...s, matchesGenerated: true, status: 'جارية' } : s);
        await reloadMatches();
      } else showToast(data.error || 'فشل التوليد', 'err');
    } catch { showToast('خطأ في الاتصال', 'err'); }
    setGenBusy(false);
  };

  const handleGenKnockout = async () => {
    if (!selected) return; setGenBusy(true);
    const res = await backend.generateKnockoutMatches(selected.id);
    if (res.success) {
      showToast(res.message || 'تم توليد مباريات الكأس');
      setSelected(s => s ? { ...s, matchesGenerated: true, status: 'جارية' } : s);
      await reloadMatches();
    } else showToast(res.error || 'فشل التوليد', 'err');
    setGenBusy(false);
  };

  const handleAdvance = async () => {
    if (!selected) return; setAdvanceBusy(true);
    const res = await backend.advanceKnockoutRound(selected.id);
    if (res.success) { showToast(res.finished ? '🏆 اكتملت البطولة!' : `تم توليد مباريات ${res.round}`); await reloadMatches(); }
    else showToast(res.error || 'فشل الانتقال', 'err');
    setAdvanceBusy(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate) { showToast('الاسم وتاريخ البدء مطلوبان', 'err'); return; }
    setCreateBusy(true);
    const saved = await backend.saveLeague({
      id:'', name:form.name.trim(), format:form.format, fieldType:form.fieldType,
      maxTeams:+form.maxTeams, startDate:form.startDate, endDate:form.endDate,
      prizePool:form.prizePool||'0 JD', sport:'كرة القدم', status:'التسجيل متاح',
      teamsCount:0, registeredTeams:[], matchesGenerated:false,
    } as any);
    if (saved) {
      showToast('تم إنشاء البطولة بنجاح');
      setShowCreate(false);
      setForm({ name:'', format:'cup', fieldType:'7v7', maxTeams:'8', startDate:'', endDate:'', prizePool:'' });
      await loadData();
    } else showToast('فشل إنشاء البطولة', 'err');
    setCreateBusy(false);
  };

  const isCup = selected?.format === 'cup';
  const teams = selected?.registeredTeamsDetail || [];

  const ALL_TABS: { id: DetailTab; label: string; icon: string; cupOnly?: boolean; leagueOnly?: boolean }[] = [
    { id:'overview',  label:'النظرة العامة', icon:'fa-th-large'   },
    { id:'matches',   label:'المباريات',     icon:'fa-futbol'     },
    { id:'bracket',   label:'الشجرة',        icon:'fa-sitemap',   cupOnly: true  },
    { id:'standings', label:'الجدول',        icon:'fa-table',     leagueOnly: true },
    { id:'stats',     label:'الإحصاءات',    icon:'fa-chart-bar'  },
    { id:'settings',  label:'الإعدادات',    icon:'fa-cog'        },
  ];
  const DETAIL_TABS = ALL_TABS.filter(t => {
    if (t.cupOnly    && !isCup) return false;
    if (t.leagueOnly && isCup)  return false;
    return true;
  });

  const statusColor = (s: string) =>
    s==='جارية' ? 'bg-emerald-500' : s==='مكتملة' ? 'bg-slate-500' : 'bg-amber-400';

  return (
    <div dir="rtl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 ${toastType==='ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          <i className={`fas fa-${toastType==='ok' ? 'check' : 'exclamation-circle'}`} /> {toast}
        </div>
      )}

      {resultMatch && (
        <ResultModal match={resultMatch} teams={teams} onSave={handleResultSave} onClose={() => setResultMatch(null)} />
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">إنشاء جديد</p>
                <h3 className="font-black text-white text-lg">بطولة جديدة</h3>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-times text-white text-sm" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">اسم البطولة *</label>
                <input type="text" required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                  placeholder="مثال: كأس الأبطال الشبابي"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400" dir="rtl" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">نوع البطولة</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{v:'cup',l:'كأس (خروج المغلوب)',i:'fa-trophy'},{v:'league',l:'دوري (نقاط)',i:'fa-table'}].map(f => (
                    <button key={f.v} type="button" onClick={() => setForm(p=>({...p,format:f.v}))}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${form.format===f.v ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-slate-600'}`}>
                      <i className={`fas ${f.i}`} /> {f.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">نوع الملعب</label>
                  <select value={form.fieldType} onChange={e => setForm(f=>({...f,fieldType:e.target.value}))}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 bg-white">
                    {['5v5','7v7','11v11'].map(v=><option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">الحد الأقصى للفرق</label>
                  <select value={form.maxTeams} onChange={e => setForm(f=>({...f,maxTeams:e.target.value}))}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 bg-white">
                    {['4','8','16','32'].map(v=><option key={v} value={v}>{v} فرق</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">تاريخ البدء *</label>
                  <input type="date" required value={form.startDate} onChange={e => setForm(f=>({...f,startDate:e.target.value}))}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">تاريخ الانتهاء</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f=>({...f,endDate:e.target.value}))}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">الجائزة الكلية</label>
                <input type="text" value={form.prizePool} onChange={e => setForm(f=>({...f,prizePool:e.target.value}))}
                  placeholder="مثال: 500 JD"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400" dir="rtl" />
              </div>
              <button type="submit" disabled={createBusy}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/30">
                {createBusy ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><i className="fas fa-plus" /> إنشاء البطولة</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail view ──────────────────────────────────────────────────────── */}
      {selected ? (
        <>
          <div className="bg-slate-900 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-5">
            <div className="px-6 pt-5 pb-0">
              <button onClick={() => setSelected(null)}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold mb-4 transition-colors">
                <i className="fas fa-arrow-right text-xs" /> إدارة البطولة
              </button>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-slate-400 text-xs font-bold mb-0.5">إدارة البطولة</p>
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">{selected.name}</h1>
                  {selected.createdBy === user?.id && (
                    <span className="text-[10px] text-amber-400 font-bold mt-1 block"><i className="fas fa-crown me-1" />أنشأتها</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[10px] font-black text-white px-2.5 py-1 rounded-full ${statusColor(selected.status)}`}>{selected.status}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{isCup ? '🏆 كأس' : '📋 دوري'}</span>
                </div>
              </div>
              {/* Stats strip */}
              <div className="grid grid-cols-5 border-t border-white/10 pt-3 mb-0">
                {[
                  { label:'مجدولة',    val:matchLoad ? '…' : matches.filter(m=>m.status==='مجدولة').length },
                  { label:'مباشرة',    val:matchLoad ? '…' : matches.filter(m=>m.status==='مباشر').length  },
                  { label:'منتهية',    val:matchLoad ? '…' : matches.filter(m=>m.status==='انتهت').length  },
                  { label:'المباريات', val:matchLoad ? '…' : matches.length                                },
                  { label:'الفرق',     val:selected.teamsCount                                              },
                ].map((s, i) => (
                  <div key={i} className="text-center py-3 border-e border-white/10 last:border-none">
                    <p className="text-lg font-black text-white">{s.val}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Tab bar */}
            <div className="flex overflow-x-auto border-t border-white/10 px-2">
              {DETAIL_TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-[11px] font-bold whitespace-nowrap flex-shrink-0 border-b-2 transition-colors ${
                    tab===t.id ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}>
                  <i className={`fas ${t.icon}`} /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pb-6">
            {matchLoad ? (
              <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />)}</div>
            ) : (
              <>
                {tab==='overview'  && <OverviewTab tournament={selected} matches={matches} standings={standings} onAdvance={handleAdvance} advanceBusy={advanceBusy} onResult={setResultMatch} />}
                {tab==='matches'   && <MatchesTab matches={matches} teams={teams} onResult={setResultMatch} />}
                {tab==='bracket'   && <BracketTab matches={matches} format={selected.format||'league'} />}
                {tab==='standings' && <StandingsTab standings={standings} matches={matches} teams={teams} />}
                {tab==='stats'     && <StatsTab standings={standings} matches={matches} teams={teams} />}
                {tab==='settings'  && <SettingsTab tournament={selected} matches={matches} onGenLeague={handleGenLeague} onGenKnockout={handleGenKnockout} busy={genBusy} />}
              </>
            )}
          </div>
        </>
      ) : (
        /* ── List view ──────────────────────────────────────────────────────── */
        <>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-1">لوحة التحكم</p>
              <h1 className="text-2xl font-black text-slate-900">البطولات والفرق</h1>
            </div>
            {pageView === 'tournaments' && (
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black rounded-xl shadow-sm transition-all hover:-translate-y-0.5">
                <i className="fas fa-plus text-xs" /> بطولة جديدة
              </button>
            )}
          </div>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-5 w-fit">
            {[
              { id:'tournaments' as PageView, label:'البطولات', icon:'fa-trophy', count:tournaments.length },
              { id:'allteams'    as PageView, label:'الفرق',    icon:'fa-users',  count:allTeams.length    },
            ].map(v => (
              <button key={v.id} onClick={() => setPageView(v.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${pageView===v.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <i className={`fas ${v.icon}`} /> {v.label}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${pageView===v.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-slate-500'}`}>{v.count}</span>
              </button>
            ))}
          </div>

          {pageView === 'allteams' ? (
            <AllTeamsSection teams={allTeams} loading={teamsLoading} />
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_,i) => <div key={i} className="bg-white rounded-2xl h-40 animate-pulse border border-gray-100" />)}
            </div>
          ) : tournaments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
              <i className="fas fa-trophy text-5xl text-gray-200 mb-4 block" />
              <h3 className="font-black text-slate-700 mb-1">لا توجد بطولات</h3>
              <p className="text-slate-400 text-sm mb-5">أنشئ بطولتك الأولى الآن</p>
              <button onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm">
                <i className="fas fa-plus text-xs" /> إنشاء بطولة
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map(t => {
                const cup   = t.format === 'cup';
                const mine  = t.createdBy === user?.id;
                const prog  = pct(t.teamsCount, t.maxTeams);
                return (
                  <button key={t.id} onClick={() => selectTournament(t)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md p-5 text-start transition-all hover:-translate-y-0.5 group relative overflow-hidden">
                    {mine && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />}
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cup ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
                        <i className={`fas ${cup ? 'fa-trophy text-amber-500' : 'fa-table text-blue-500'}`} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>{t.status}</span>
                        {mine && <span className="text-[9px] text-amber-600 font-bold"><i className="fas fa-crown me-0.5" />أنشأتها</span>}
                      </div>
                    </div>
                    <h3 className="font-black text-slate-900 mb-0.5 group-hover:text-emerald-600 transition-colors truncate">{t.name}</h3>
                    <p className="text-xs text-slate-400 mb-3">{t.startDate} · {cup ? 'كأس' : 'دوري'}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width:`${prog}%` }} />
                      </div>
                      <span className="text-xs font-black text-slate-500 flex-shrink-0">{t.teamsCount}/{t.maxTeams}</span>
                    </div>
                    {t.prizePool && t.prizePool !== '0 JD' && (
                      <p className="text-xs text-amber-600 font-bold mt-2"><i className="fas fa-medal me-1" />{t.prizePool}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OwnerTournaments;
