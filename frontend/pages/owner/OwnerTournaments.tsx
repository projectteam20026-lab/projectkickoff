import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { backend } from '../../services/backend';
import { League, Match, Team, TeamStanding } from '../../types';

type DetailTab = 'overview' | 'matches' | 'bracket' | 'stats' | 'teams' | 'awards' | 'details';
type PageView  = 'tournaments' | 'allteams';

const ROUND_ORDER = ['دور الـ 16', 'ربع النهائي', 'نصف النهائي', 'النهائي'];
const ROUND_COLORS: Record<string, string> = {
  'دور الـ 16':   'bg-slate-500',
  'ربع النهائي': 'bg-blue-500',
  'نصف النهائي': 'bg-violet-500',
  'النهائي':     'bg-amber-500',
};

function getRounds(matches: Match[]) {
  const set = new Set(matches.map(m => m.round || 'الدوري'));
  const filtered = ROUND_ORDER.filter(r => set.has(r));
  return filtered.length > 0 ? filtered : [...set];
}

function getWinner(m: Match): 'home' | 'away' | null {
  if (m.status !== 'انتهت' || m.homeScore === null || m.awayScore === null) return null;
  if (m.homeScore > m.awayScore) return 'home';
  if (m.awayScore > m.homeScore) return 'away';
  return null;
}

function getCurrentRound(matches: Match[]): string {
  const pending = matches.filter(m => m.status !== 'انتهت');
  if (pending.length === 0 && matches.length > 0) return 'مكتملة';
  return getRounds(pending)[0] || 'الدوري';
}

function pct(num: number, den: number) {
  return den > 0 ? Math.round((num / den) * 100) : 0;
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo({ logo, name, size = 36 }: { logo?: string; name: string; size?: number }) {
  if (logo?.startsWith('data:') || logo?.startsWith('http')) {
    return <img src={logo} alt={name} style={{ width: size, height: size }} className="object-cover rounded-xl flex-shrink-0" />;
  }
  return (
    <div style={{ width: size, height: size }}
      className="bg-emerald-100 rounded-xl flex items-center justify-center font-black text-emerald-700 text-sm flex-shrink-0">
      {name?.[0] || '؟'}
    </div>
  );
}

// ── Result Modal ──────────────────────────────────────────────────────────────
function ResultModal({ match, onSave, onClose }: {
  match: Match; onSave: (h: number, a: number) => void; onClose: () => void;
}) {
  const [home, setHome] = useState(match.homeScore ?? 0);
  const [away, setAway] = useState(match.awayScore ?? 0);
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="font-black text-slate-800 text-lg mb-5 text-center">إدخال النتيجة</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 text-center">
            <p className="font-black text-slate-800 text-sm mb-2 truncate">{match.homeTeam}</p>
            <input type="number" min={0} value={home} onChange={e => setHome(+e.target.value)}
              className="w-full text-center text-3xl font-black border-2 border-gray-200 rounded-2xl py-3 focus:border-emerald-400 outline-none" />
          </div>
          <span className="text-slate-400 font-black text-xl">:</span>
          <div className="flex-1 text-center">
            <p className="font-black text-slate-800 text-sm mb-2 truncate">{match.awayTeam}</p>
            <input type="number" min={0} value={away} onChange={e => setAway(+e.target.value)}
              className="w-full text-center text-3xl font-black border-2 border-gray-200 rounded-2xl py-3 focus:border-emerald-400 outline-none" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-gray-50">إلغاء</button>
          <button disabled={busy} onClick={async () => { setBusy(true); await onSave(home, away); setBusy(false); }}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm disabled:opacity-50">
            {busy ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── IMPROVED BRACKET with connecting lines ────────────────────────────────────
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
      <p className="text-slate-400 text-sm">اذهب لتبويب التفاصيل وولّد مباريات البطولة</p>
    </div>
  );

  const CARD_H = 72;   // height of each match card px
  const GAP    = 16;   // gap between cards in same round px
  const COL_W  = 210;  // width of each round column px
  const COL_GAP= 48;   // horizontal gap between columns px

  // Build rounds from right to left (RTL: first round on right)
  const roundsRTL = [...rounds].reverse();

  // Calculate row positions per round
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

  // We'll render using absolute positioned divs
  return (
    <div className="overflow-x-auto pb-4" dir="ltr">
      <div className="relative" style={{ width: svgW, height: svgH + 50 }}>

        {/* Round labels */}
        {rounds.map((round, ri) => {
          const x = ri * (COL_W + COL_GAP);
          return (
            <div key={round} className="absolute top-0 flex justify-center items-center"
              style={{ left: x, width: COL_W }}>
              <span className={`text-[11px] font-black text-white px-3 py-1 rounded-full ${ROUND_COLORS[round] || 'bg-slate-500'}`}>{round}</span>
            </div>
          );
        })}

        {/* SVG connecting lines */}
        <svg className="absolute inset-0 pointer-events-none" width={svgW} height={svgH + 50} style={{ top: 0, left: 0 }}>
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
              const nextY = mi % 2 === 0
                ? 30 + nextPositions[Math.floor(mi / 2)] + CARD_H / 2
                : null;
              return (
                <g key={`${ri}-${mi}`}>
                  {/* Horizontal line from card to midpoint */}
                  <line x1={x1} y1={cardMidY} x2={x1 + COL_GAP / 2} y2={cardMidY} stroke="#cbd5e1" strokeWidth="1.5" />
                  {/* Vertical connector to partner */}
                  {mi % 2 === 0 && (
                    <line x1={x1 + COL_GAP / 2} y1={cardMidY} x2={x1 + COL_GAP / 2} y2={partnerMidY} stroke="#cbd5e1" strokeWidth="1.5" />
                  )}
                  {/* Horizontal line to next round */}
                  {mi % 2 === 0 && nextY !== null && (
                    <line x1={x1 + COL_GAP / 2} y1={(cardMidY + partnerMidY) / 2} x2={x2} y2={nextY} stroke="#cbd5e1" strokeWidth="1.5" />
                  )}
                </g>
              );
            });
          })}
        </svg>

        {/* Match cards */}
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
                  m.status === 'مباشر' ? 'border-red-400 shadow-md shadow-red-100' :
                  'border-dashed border-gray-200'
                } ${isFinal ? 'ring-2 ring-amber-400/50' : ''}`}>
                  {[
                    { team: m.homeTeam, score: m.homeScore, isWinner: winner === 'home' },
                    { team: m.awayTeam, score: m.awayScore, isWinner: winner === 'away' },
                  ].map((s, si) => (
                    <div key={si} className={`flex items-center justify-between px-2.5 ${si === 0 ? 'h-8 border-b border-gray-100' : 'h-8'} ${
                      s.isWinner ? 'bg-emerald-50' : 'bg-white'
                    }`}>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {s.isWinner && <i className="fas fa-check text-emerald-500 text-[9px] flex-shrink-0" />}
                        {isFinal && s.isWinner && <i className="fas fa-crown text-amber-400 text-[9px] flex-shrink-0" />}
                        <span className={`text-[11px] truncate font-bold ${s.isWinner ? 'text-emerald-700 font-black' : 'text-slate-600'}`}>{s.team}</span>
                      </div>
                      <span className={`text-sm font-black flex-shrink-0 ml-1 w-5 text-center ${
                        s.isWinner ? 'text-emerald-600' : 'text-slate-500'
                      }`}>{s.score ?? '-'}</span>
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

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab({ tournament, matches, onAdvance, advanceBusy, onResult }: {
  tournament: League; matches: Match[]; onAdvance: () => void; advanceBusy: boolean;
  onResult: (m: Match) => void;
}) {
  const isCup   = tournament.format === 'cup';
  const curRound = getCurrentRound(matches);
  const done     = matches.filter(m => m.status === 'انتهت').length;
  const live     = matches.filter(m => m.status === 'مباشر').length;
  const upcoming = matches.filter(m => m.status === 'مجدولة');
  const progress = pct(done, matches.length);

  const curRoundMatches = matches.filter(m => m.round === curRound || (!m.round && curRound === 'الدوري'));
  const allCurDone = curRoundMatches.length > 0 && curRoundMatches.every(m => m.status === 'انتهت');
  const canAdvance = isCup && allCurDone && curRound !== 'النهائي' && curRound !== 'مكتملة';

  const recent = matches.filter(m => m.status === 'انتهت').slice(-4).reverse();
  const nextMatch = upcoming[0];

  // Count registered teams status
  const teams = tournament.registeredTeamsDetail || [];

  return (
    <div className="space-y-4">
      {/* Tournament progress card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-slate-400 text-xs font-bold">{isCup ? 'بطولة كأس' : 'بطولة دوري'}</p>
            <p className="font-black text-lg">{curRound === 'مكتملة' ? '🏆 اكتملت البطولة!' : curRound}</p>
          </div>
          <div className={`text-4xl font-black ${progress === 100 ? 'text-amber-400' : 'text-emerald-400'}`}>{progress}%</div>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label:'منتهية', val:done,           c:'text-emerald-400' },
            { label:'مباشرة', val:live,           c:'text-red-400'     },
            { label:'قادمة',  val:upcoming.length, c:'text-slate-300'  },
            { label:'الفرق',  val:tournament.teamsCount, c:'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl py-2 text-center">
              <p className={`text-xl font-black ${s.c}`}>{s.val}</p>
              <p className="text-[10px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next match countdown */}
      {nextMatch && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="fas fa-calendar-alt text-white text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mb-0.5">المباراة القادمة</p>
            <p className="font-black text-slate-800 text-sm truncate">{nextMatch.homeTeam} <span className="text-slate-400">vs</span> {nextMatch.awayTeam}</p>
            <p className="text-xs text-slate-500 mt-0.5">{nextMatch.date} {nextMatch.round && `· ${nextMatch.round}`}</p>
          </div>
          <button onClick={() => onResult(nextMatch)}
            className="flex-shrink-0 text-[11px] bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg transition-colors">
            نتيجة
          </button>
        </div>
      )}

      {/* Advance round */}
      {canAdvance && (
        <button onClick={onAdvance} disabled={advanceBusy}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/30">
          {advanceBusy
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><i className="fas fa-arrow-up-right-from-square" /> الانتقال للدور التالي</>}
        </button>
      )}

      {/* Cup stages timeline */}
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
              const hasMatches = rm.length > 0;
              return (
                <React.Fragment key={r}>
                  {i > 0 && <div className={`h-0.5 flex-1 min-w-4 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                      isDone ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' :
                      isCur  ? 'bg-amber-400 text-white animate-pulse' :
                      hasMatches ? 'bg-slate-200 text-slate-500' : 'bg-gray-100 text-slate-300'
                    }`}>
                      {isDone ? <i className="fas fa-check" /> :
                       isCur  ? <i className="fas fa-play text-xs" /> :
                       <i className="fas fa-lock text-xs" />}
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

      {/* Recent results */}
      {recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
            <i className="fas fa-flag-checkered text-slate-400 text-sm" />
            <span className="font-black text-slate-800 text-sm">آخر النتائج</span>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.map(m => {
              const w = getWinner(m);
              return (
                <div key={m.id} className="flex items-center gap-2 px-5 py-3">
                  <p className={`flex-1 text-sm text-end truncate font-bold ${w === 'home' ? 'text-emerald-700 font-black' : 'text-slate-600'}`}>{m.homeTeam}</p>
                  <div className="flex items-center gap-1 flex-shrink-0 bg-slate-900 rounded-lg px-2 py-1">
                    <span className="text-white font-black text-sm">{m.homeScore}</span>
                    <span className="text-slate-500 text-xs">-</span>
                    <span className="text-white font-black text-sm">{m.awayScore}</span>
                  </div>
                  <p className={`flex-1 text-sm truncate font-bold ${w === 'away' ? 'text-emerald-700 font-black' : 'text-slate-600'}`}>{m.awayTeam}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Registered teams mini list */}
      {teams.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fas fa-users text-slate-400 text-sm" />
              <span className="font-black text-slate-800 text-sm">الفرق المشاركة</span>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-full">{teams.length}</span>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {teams.map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-2.5 py-1.5 border border-gray-100">
                <Logo logo={t.logo} name={t.name} size={20} />
                <span className="text-xs font-bold text-slate-700 truncate max-w-24">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Matches Tab ───────────────────────────────────────────────────────────────
function MatchesTab({ matches, onResult }: { matches: Match[]; onResult: (m: Match) => void }) {
  const [filter, setFilter] = useState<'all' | 'مجدولة' | 'انتهت'>('all');
  const filtered = filter === 'all' ? matches : matches.filter(m => m.status === filter);
  const grouped: Record<string, Match[]> = {};
  filtered.forEach(m => { const k = m.round || 'الدوري'; grouped[k] = [...(grouped[k] || []), m]; });
  const sortedRounds = Object.keys(grouped).sort((a, b) => ROUND_ORDER.indexOf(a) - ROUND_ORDER.indexOf(b));

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl w-fit">
        {([['all','الكل'],['مجدولة','قادمة'],['انتهت','منتهية']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {l} {v !== 'all' && <span className="opacity-60">({matches.filter(m => v === 'all' || m.status === v).length})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <i className="fas fa-futbol text-4xl text-gray-200 mb-3 block" />
          <p className="font-black text-slate-700">لا توجد مباريات</p>
        </div>
      )}

      {sortedRounds.map(round => (
        <div key={round} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${ROUND_COLORS[round] || 'bg-slate-400'}`} />
              <span className="font-black text-slate-700 text-sm">{round}</span>
            </div>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{grouped[round].length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {grouped[round].map(m => {
              const w = getWinner(m);
              return (
                <div key={m.id} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-slate-400 font-bold">{m.date}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.status === 'انتهت' ? 'bg-emerald-100 text-emerald-700' :
                      m.status === 'مباشر' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500'
                    }`}>{m.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`flex-1 text-sm text-end truncate ${w === 'home' ? 'font-black text-emerald-700' : 'font-bold text-slate-800'}`}>{m.homeTeam}</p>
                    {m.status === 'انتهت' ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0 bg-slate-900 rounded-xl px-3 py-1.5">
                        <span className="text-white font-black">{m.homeScore}</span>
                        <span className="text-slate-500 text-xs">-</span>
                        <span className="text-white font-black">{m.awayScore}</span>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <span className="text-xs text-slate-400 font-black">VS</span>
                        <button onClick={() => onResult(m)}
                          className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold transition-colors">
                          نتيجة
                        </button>
                      </div>
                    )}
                    <p className={`flex-1 text-sm truncate ${w === 'away' ? 'font-black text-emerald-700' : 'font-bold text-slate-800'}`}>{m.awayTeam}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────
function StatsTab({ standings, matches }: { standings: TeamStanding[]; matches: Match[] }) {
  const sorted = [...standings].sort((a, b) => b.points - a.points || b.wins - a.wins);
  const totalGoals = matches.filter(m => m.status === 'انتهت').reduce((s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  const played     = matches.filter(m => m.status === 'انتهت').length;
  const avgGoals   = played > 0 ? (totalGoals / played).toFixed(1) : '0.0';

  return (
    <div className="space-y-4">
      {/* Quick stat chips */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'مباريات ملعوبة', val:played,    icon:'fa-futbol',     c:'bg-blue-50 text-blue-600 border-blue-100'    },
          { label:'مجموع الأهداف', val:totalGoals, icon:'fa-star',       c:'bg-amber-50 text-amber-600 border-amber-100' },
          { label:'معدل الأهداف',  val:avgGoals,   icon:'fa-chart-line', c:'bg-emerald-50 text-emerald-600 border-emerald-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.c}`}>
            <i className={`fas ${s.icon} text-lg mb-1 block`} />
            <p className="text-2xl font-black">{s.val}</p>
            <p className="text-[10px] font-bold mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Standings table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="px-4 py-3 text-right text-xs font-black text-slate-500 w-8">#</th>
                <th className="px-4 py-3 text-right text-xs font-black text-slate-500">الفريق</th>
                <th className="px-4 py-3 text-center text-xs font-black text-emerald-600 w-10">ف</th>
                <th className="px-4 py-3 text-center text-xs font-black text-amber-600 w-10">ت</th>
                <th className="px-4 py-3 text-center text-xs font-black text-red-500 w-10">خ</th>
                <th className="px-4 py-3 text-center text-xs font-black text-slate-700 w-10">نق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-sm">لا توجد إحصائيات بعد</td></tr>
              ) : sorted.map((t, i) => (
                <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${i < 3 ? 'font-bold' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                      i===0 ? 'bg-amber-400 text-white' : i===1 ? 'bg-slate-300 text-slate-700' : i===2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-slate-500'
                    }`}>{i+1}</span>
                  </td>
                  <td className="px-4 py-3 font-black text-slate-800">{t.name}</td>
                  <td className="px-4 py-3 text-center text-emerald-600 font-bold">{t.wins}</td>
                  <td className="px-4 py-3 text-center text-amber-600 font-bold">{t.draws}</td>
                  <td className="px-4 py-3 text-center text-red-500 font-bold">{t.losses}</td>
                  <td className="px-4 py-3 text-center font-black text-slate-900 text-base">{t.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Awards / Podium Tab ───────────────────────────────────────────────────────
function AwardsTab({ tournament, standings, matches }: {
  tournament: League; standings: TeamStanding[]; matches: Match[];
}) {
  const sorted   = [...standings].sort((a, b) => b.points - a.points || b.wins - a.wins);
  const champion = sorted[0];
  const runner   = sorted[1];
  const third    = sorted[2];
  const finalMatch = matches.find(m => m.round === 'النهائي' && m.status === 'انتهت');

  const [mvp,    setMvp]    = useState('');
  const [scorer, setScorer] = useState('');
  const [gk,     setGk]     = useState('');
  const [saved,  setSaved]  = useState(false);

  return (
    <div className="space-y-5">
      {/* Trophy podium */}
      <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl border border-amber-100 p-6">
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">🏆</div>
          <h3 className="font-black text-slate-800 text-xl">{tournament.name}</h3>
          {tournament.prizePool && tournament.prizePool !== '0 JD' && (
            <p className="text-amber-600 font-bold text-sm mt-1">إجمالي الجوائز: {tournament.prizePool}</p>
          )}
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-3 mb-4" style={{ height: 140 }}>
          {/* 2nd */}
          <div className="flex flex-col items-center" style={{ flex: 1 }}>
            {runner ? (
              <>
                <div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center font-black text-slate-700 text-lg mb-2">
                  {runner.name?.[0]}
                </div>
                <p className="text-xs font-black text-slate-600 text-center truncate w-full px-1">{runner.name}</p>
              </>
            ) : <div className="w-12 h-12 border-2 border-dashed border-gray-200 rounded-2xl" />}
            <div className="w-full bg-slate-300 rounded-t-xl flex items-center justify-center text-white font-black text-xl" style={{ height: 70 }}>🥈</div>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center" style={{ flex: 1 }}>
            {champion ? (
              <>
                <div className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center font-black text-white text-xl mb-2 shadow-lg shadow-amber-300">
                  {champion.name?.[0]}
                </div>
                <p className="text-xs font-black text-amber-700 text-center truncate w-full px-1">{champion.name}</p>
              </>
            ) : <div className="w-14 h-14 border-2 border-dashed border-gray-200 rounded-2xl" />}
            <div className="w-full bg-amber-400 rounded-t-xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-amber-300" style={{ height: 100 }}>🥇</div>
          </div>
          {/* 3rd */}
          <div className="flex flex-col items-center" style={{ flex: 1 }}>
            {third ? (
              <>
                <div className="w-12 h-12 bg-orange-200 rounded-2xl flex items-center justify-center font-black text-orange-700 text-lg mb-2">
                  {third.name?.[0]}
                </div>
                <p className="text-xs font-black text-orange-700 text-center truncate w-full px-1">{third.name}</p>
              </>
            ) : <div className="w-12 h-12 border-2 border-dashed border-gray-200 rounded-2xl" />}
            <div className="w-full bg-orange-400 rounded-t-xl flex items-center justify-center text-white font-black text-xl" style={{ height: 50 }}>🥉</div>
          </div>
        </div>

        {/* Final match result */}
        {finalMatch && (
          <div className="bg-amber-100 rounded-xl p-3 text-center">
            <p className="text-[10px] text-amber-700 font-bold mb-1">نتيجة النهائي</p>
            <p className="font-black text-slate-800 text-sm">
              {finalMatch.homeTeam} <span className="bg-slate-900 text-white px-2 py-0.5 rounded-lg text-sm font-black mx-1">
                {finalMatch.homeScore} - {finalMatch.awayScore}
              </span> {finalMatch.awayTeam}
            </p>
          </div>
        )}
      </div>

      {/* Prize breakdown */}
      {(tournament.prize1 || tournament.prize2 || tournament.prize3) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
            <i className="fas fa-medal text-amber-400" /> توزيع الجوائز
          </h3>
          <div className="space-y-3">
            {[
              { rank:'🥇 المركز الأول', val:tournament.prize1, bg:'bg-amber-50 border-amber-200' },
              { rank:'🥈 المركز الثاني',val:tournament.prize2, bg:'bg-slate-50 border-slate-200' },
              { rank:'🥉 المركز الثالث',val:tournament.prize3, bg:'bg-orange-50 border-orange-200' },
            ].filter(p => p.val).map(p => (
              <div key={p.rank} className={`flex items-center justify-between border rounded-xl px-4 py-3 ${p.bg}`}>
                <span className="font-bold text-slate-700 text-sm">{p.rank}</span>
                <span className="font-black text-slate-900">{p.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player awards (manual entry) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
          <i className="fas fa-award text-violet-500" /> جوائز اللاعبين
        </h3>
        <div className="space-y-3">
          {[
            { label:'🌟 أفضل لاعب (MVP)',     val:mvp,    set:setMvp,    placeholder:'اسم اللاعب' },
            { label:'⚽ هداف البطولة',         val:scorer, set:setScorer, placeholder:'اسم اللاعب - عدد الأهداف' },
            { label:'🧤 أفضل حارس مرمى',      val:gk,     set:setGk,     placeholder:'اسم الحارس' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-black text-slate-500 mb-1.5">{f.label}</label>
              <input value={f.val} onChange={e => { f.set(e.target.value); setSaved(false); }}
                placeholder={f.placeholder}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-violet-400 transition-colors" dir="rtl" />
            </div>
          ))}
        </div>
        <button onClick={() => setSaved(true)}
          className={`w-full mt-4 py-2.5 rounded-xl text-sm font-black transition-colors ${saved ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-500 hover:bg-violet-600 text-white'}`}>
          {saved ? <><i className="fas fa-check me-1" /> تم الحفظ</> : 'حفظ الجوائز'}
        </button>
        <p className="text-[10px] text-slate-400 text-center mt-2">* يتم حفظها محلياً للعرض فقط</p>
      </div>
    </div>
  );
}

// ── Teams Tab ─────────────────────────────────────────────────────────────────
function TeamsTab({ tournament }: { tournament: League }) {
  const teams = tournament.registeredTeamsDetail || [];
  const remaining = tournament.maxTeams - tournament.teamsCount;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-black text-slate-800 text-sm">تسجيل الفرق</span>
          <span className="font-black text-slate-700">{tournament.teamsCount} / {tournament.maxTeams}</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
            style={{ width: `${pct(tournament.teamsCount, tournament.maxTeams)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>{remaining > 0 ? `${remaining} مقعد متبقي` : 'اكتملت الفرق 🎉'}</span>
          <span className={remaining === 0 ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'}>{tournament.status}</span>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <i className="fas fa-users text-4xl text-gray-200 mb-3 block" />
          <p className="font-black text-slate-700">لم يسجّل أي فريق بعد</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {teams.map((t: any, i: number) => (
              <div key={t.id || i} className="flex items-center gap-3 px-5 py-4">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  i===0 ? 'bg-amber-400 text-white' : i===1 ? 'bg-slate-300 text-slate-700' : i===2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-slate-500'
                }`}>{i+1}</span>
                <Logo logo={t.logo} name={t.name} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 text-sm truncate">{t.name}</p>
                  <p className="text-[10px] text-slate-400">نق: {t.points} · ف: {t.wins} · ت: {t.draws} · خ: {t.losses}</p>
                </div>
                <div className="text-end flex-shrink-0">
                  <p className="font-black text-xl text-slate-900">{t.points}</p>
                  <p className="text-[10px] text-slate-400">نقطة</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Details Tab ───────────────────────────────────────────────────────────────
function DetailsTab({ tournament, matches, onGenLeague, onGenKnockout, busy }: {
  tournament: League; matches: Match[];
  onGenLeague: () => void; onGenKnockout: () => void; busy: boolean;
}) {
  const isCup = tournament.format === 'cup';
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-black text-slate-800 text-sm border-b border-gray-100 pb-3 mb-4">معلومات البطولة</h3>
        <div className="space-y-2">
          {[
            ['الاسم',          tournament.name],
            ['النوع',          isCup ? 'كأس (خروج المغلوب)' : 'دوري (نقاط)'],
            ['الرياضة',        tournament.sport],
            ['نوع الملعب',     tournament.fieldType || '—'],
            ['الحالة',         tournament.status],
            ['تاريخ البدء',    tournament.startDate],
            ['تاريخ الانتهاء', tournament.endDate || '—'],
            ['آخر تسجيل',      (tournament as any).regDeadline || '—'],
            ['عدد الفرق',      `${tournament.teamsCount} / ${tournament.maxTeams}`],
            ['رسوم المشاركة',  (tournament as any).entryFee ? `${(tournament as any).entryFee} JD` : 'مجاني'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-none">
              <span className="text-xs text-slate-400 font-bold">{k}</span>
              <span className="text-xs font-black text-slate-800 text-end max-w-48 truncate">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Organizer */}
      {((tournament as any).organizerName || (tournament as any).organizerPhone) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2">
            <i className="fas fa-user-tie text-slate-400" /> المنظّم
          </h3>
          <div className="space-y-2">
            {(tournament as any).organizerName && (
              <p className="font-bold text-slate-700 text-sm">{(tournament as any).organizerName}</p>
            )}
            {(tournament as any).organizerPhone && (
              <a href={`tel:${(tournament as any).organizerPhone}`} className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                <i className="fas fa-phone text-emerald-400 text-xs" /> {(tournament as any).organizerPhone}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {(tournament as any).notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs font-black text-amber-700 mb-1 flex items-center gap-1"><i className="fas fa-sticky-note" /> ملاحظات</p>
          <p className="text-sm text-amber-800">{(tournament as any).notes}</p>
        </div>
      )}

      {/* Match stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-black text-slate-800 text-sm mb-3">إحصائيات المباريات</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'مجدولة', val:matches.filter(m=>m.status==='مجدولة').length, c:'text-slate-600' },
            { label:'مباشرة', val:matches.filter(m=>m.status==='مباشر').length,  c:'text-red-500'   },
            { label:'منتهية', val:matches.filter(m=>m.status==='انتهت').length,  c:'text-emerald-600'},
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className={`text-2xl font-black ${s.c}`}>{s.val}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Generate matches */}
      {!tournament.matchesGenerated && tournament.teamsCount >= 2 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center"><i className="fas fa-magic text-white" /></div>
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
  const [sort, setSort] = useState<'points'|'wins'|'name'>('points');
  const filtered = teams
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.city?.includes(search))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'ar') : (b[sort] as number) - (a[sort] as number));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن فريق..."
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-colors bg-white" dir="rtl" />
        <select value={sort} onChange={e => setSort(e.target.value as any)}
          className="px-3 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 bg-white appearance-none">
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
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <Logo logo={t.logo} name={t.name} size={44} />
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

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
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

  const statusColor = (s: string) =>
    s==='جارية' ? 'bg-emerald-500' : s==='مكتملة' ? 'bg-slate-500' : 'bg-amber-400';

  const DETAIL_TABS: { id: DetailTab; label: string; icon: string }[] = [
    { id:'overview', label:'النظرة العامة', icon:'fa-th-large'   },
    { id:'matches',  label:'المباريات',     icon:'fa-futbol'     },
    { id:'bracket',  label:'الشجرة',        icon:'fa-sitemap'    },
    { id:'stats',    label:'الإحصائيات',   icon:'fa-chart-bar'  },
    { id:'teams',    label:'الفرق',         icon:'fa-users'      },
    { id:'awards',   label:'الجوائز',       icon:'fa-trophy'     },
    { id:'details',  label:'التفاصيل',      icon:'fa-info-circle'},
  ];

  return (
    <div dir="rtl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 ${toastType==='ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          <i className={`fas fa-${toastType==='ok' ? 'check' : 'exclamation-circle'}`} /> {toast}
        </div>
      )}

      {resultMatch && <ResultModal match={resultMatch} onSave={handleResultSave} onClose={() => setResultMatch(null)} />}

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

      {/* ── Detail view ─────────────────────────────────────────────────────── */}
      {selected ? (
        <>
          <div className="bg-slate-900 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-5">
            {/* No absolute overlay to avoid blocking tab clicks */}
            <div className="px-6 pt-5 pb-0">
              <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold mb-4 transition-colors">
                <i className="fas fa-arrow-right text-xs" /> كل البطولات
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
                  <span className="text-[10px] text-slate-400 font-bold">{selected.format==='cup' ? 'كأس' : 'دوري'}</span>
                </div>
              </div>
              {/* Stats strip */}
              <div className="grid grid-cols-5 gap-0 border-t border-white/10 pt-3 mb-0">
                {[
                  { label:'مجدولة',   val:matchLoad ? '…' : matches.filter(m=>m.status==='مجدولة').length },
                  { label:'مباشرة',   val:matchLoad ? '…' : matches.filter(m=>m.status==='مباشر').length  },
                  { label:'منتهية',   val:matchLoad ? '…' : matches.filter(m=>m.status==='انتهت').length  },
                  { label:'المباريات', val:matchLoad ? '…' : matches.length                               },
                  { label:'الفرق',    val:selected.teamsCount                                              },
                ].map((s, i) => (
                  <div key={i} className="text-center py-3 border-e border-white/10 last:border-none">
                    <p className="text-lg font-black text-white">{s.val}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Tab bar — no absolute overlay above this */}
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
                {tab==='overview' && <OverviewTab tournament={selected} matches={matches} onAdvance={handleAdvance} advanceBusy={advanceBusy} onResult={setResultMatch} />}
                {tab==='matches'  && <MatchesTab matches={matches} onResult={setResultMatch} />}
                {tab==='bracket'  && <BracketTab matches={matches} format={selected.format||'league'} />}
                {tab==='stats'    && <StatsTab standings={standings} matches={matches} />}
                {tab==='teams'    && <TeamsTab tournament={selected} />}
                {tab==='awards'   && <AwardsTab tournament={selected} standings={standings} matches={matches} />}
                {tab==='details'  && <DetailsTab tournament={selected} matches={matches} onGenLeague={handleGenLeague} onGenKnockout={handleGenKnockout} busy={genBusy} />}
              </>
            )}
          </div>
        </>
      ) : (
        /* ── List view ────────────────────────────────────────────────────── */
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

          {/* Page toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-5 w-fit">
            {[
              { id:'tournaments' as PageView, label:'البطولات', icon:'fa-trophy',  count:tournaments.length },
              { id:'allteams'    as PageView, label:'الفرق',    icon:'fa-users',   count:allTeams.length    },
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
                const isCup  = t.format === 'cup';
                const isMine = t.createdBy === user?.id;
                const prog   = pct(t.teamsCount, t.maxTeams);
                return (
                  <button key={t.id} onClick={() => selectTournament(t)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md p-5 text-start transition-all hover:-translate-y-0.5 group relative overflow-hidden">
                    {isMine && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isCup ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
                        <i className={`fas ${isCup ? 'fa-trophy text-amber-500' : 'fa-table text-blue-500'}`} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>{t.status}</span>
                        {isMine && <span className="text-[9px] text-amber-600 font-bold"><i className="fas fa-crown me-0.5" />أنشأتها</span>}
                      </div>
                    </div>
                    <h3 className="font-black text-slate-900 mb-0.5 group-hover:text-emerald-600 transition-colors truncate">{t.name}</h3>
                    <p className="text-xs text-slate-400 mb-3">{t.startDate} · {isCup ? 'كأس' : 'دوري'}</p>
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
