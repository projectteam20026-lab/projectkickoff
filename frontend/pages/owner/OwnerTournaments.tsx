import React, { useState, useEffect, useCallback } from 'react';
import { backend } from '../../services/backend';
import { League, Match, TeamStanding } from '../../types';

type Tab = 'overview' | 'matches' | 'bracket' | 'stats' | 'settings';

const ROUND_ORDER = ['دور الـ 16', 'ربع النهائي', 'نصف النهائي', 'النهائي'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getRounds(matches: Match[]): string[] {
  const set = new Set(matches.map(m => m.round || 'الدوري'));
  return ROUND_ORDER.filter(r => set.has(r)).length > 0
    ? ROUND_ORDER.filter(r => set.has(r))
    : [...set];
}

function getTeamStatus(teams: any[], matches: Match[]) {
  const finishedMatches = matches.filter(m => m.status === 'انتهت');
  const eliminated = new Set<string>();
  finishedMatches.forEach(m => {
    if (m.homeScore !== null && m.awayScore !== null) {
      if (m.homeScore < m.awayScore) eliminated.add(m.homeTeam);
      if (m.awayScore < m.homeScore) eliminated.add(m.awayTeam);
    }
  });
  return teams.map((t: any) => ({
    ...t,
    eliminated: eliminated.has(t.name),
  }));
}

function getCurrentRound(matches: Match[]): string {
  const pending = matches.filter(m => m.status !== 'انتهت');
  if (pending.length === 0 && matches.length > 0) return 'مكتملة';
  const rounds = getRounds(pending);
  return rounds[0] || 'الدوري';
}

// ── Result entry modal ────────────────────────────────────────────────────────
function ResultModal({ match, onSave, onClose }: {
  match: Match;
  onSave: (home: number, away: number) => void;
  onClose: () => void;
}) {
  const [home, setHome] = useState(match.homeScore ?? 0);
  const [away, setAway] = useState(match.awayScore ?? 0);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    await onSave(home, away);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="font-black text-slate-800 text-lg mb-5 text-center">إدخال النتيجة</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 text-center">
            <p className="font-black text-slate-800 text-sm mb-2 truncate">{match.homeTeam}</p>
            <input
              type="number" min={0} value={home}
              onChange={e => setHome(Number(e.target.value))}
              className="w-full text-center text-3xl font-black border-2 border-gray-200 rounded-2xl py-3 focus:border-emerald-400 outline-none"
            />
          </div>
          <span className="text-slate-400 font-black text-xl">:</span>
          <div className="flex-1 text-center">
            <p className="font-black text-slate-800 text-sm mb-2 truncate">{match.awayTeam}</p>
            <input
              type="number" min={0} value={away}
              onChange={e => setAway(Number(e.target.value))}
              className="w-full text-center text-3xl font-black border-2 border-gray-200 rounded-2xl py-3 focus:border-emerald-400 outline-none"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors">إلغاء</button>
          <button onClick={save} disabled={busy} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition-colors disabled:opacity-50">
            {busy ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></span> : 'حفظ النتيجة'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ tournament, matches, onAdvance, advanceBusy }: {
  tournament: League;
  matches: Match[];
  onAdvance: () => void;
  advanceBusy: boolean;
}) {
  const isCup = tournament.format === 'cup';
  const currentRound = getCurrentRound(matches);
  const teams = (tournament.registeredTeams || []) as any[];
  const teamsWithStatus = getTeamStatus(teams, matches);
  const eliminatedCount = teamsWithStatus.filter(t => t.eliminated).length;
  const remainingCount = teams.length - eliminatedCount;
  const done = matches.filter(m => m.status === 'انتهت').length;
  const completePct = matches.length > 0 ? Math.round((done / matches.length) * 100) : 0;
  const upcoming = matches.filter(m => m.status === 'مجدولة').slice(0, 3);
  const recent = matches.filter(m => m.status === 'انتهت').slice(-3).reverse();
  const currentRoundMatches = matches.filter(m => m.round === currentRound || (!m.round && currentRound === 'الدوري'));
  const currentDone = currentRoundMatches.filter(m => m.status === 'انتهت').length;
  const allCurrentDone = currentRoundMatches.length > 0 && currentDone === currentRoundMatches.length;

  return (
    <div className="space-y-5">
      {isCup && (
        <>
          {/* Knockout system card */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="fas fa-trophy text-white" />
            </div>
            <div>
              <p className="font-black text-amber-900 text-sm">نظام الكأس — خروج المغلوب</p>
              <p className="text-amber-700 text-xs mt-0.5">خسارة واحدة = إقصاء فوري من البطولة</p>
            </div>
          </div>

          {/* 3 outcome cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'تأهل للدور القادم', sub: 'فوز', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: 'fa-check-circle' },
              { label: 'خروج من البطولة',   sub: 'خسارة', color: 'bg-red-50 border-red-200 text-red-600',       icon: 'fa-times-circle' },
              { label: 'ركلات الترجيح',     sub: 'تعادل', color: 'bg-blue-50 border-blue-200 text-blue-600',     icon: 'fa-random'       },
            ].map(c => (
              <div key={c.label} className={`border rounded-xl p-3 text-center ${c.color}`}>
                <i className={`fas ${c.icon} text-xl mb-1 block`} />
                <p className="font-black text-xs leading-tight">{c.label}</p>
                <p className="text-[10px] mt-0.5 opacity-70">{c.sub}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Current stage */}
      <div className="bg-orange-400 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10">
          <p className="text-orange-100 text-xs font-bold mb-0.5">المرحلة الحالية</p>
          <h3 className="font-black text-xl mb-4">{currentRound}</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'فريق متبقي',  val: remainingCount, icon: 'fa-users' },
              { label: 'فريق مقصي',  val: eliminatedCount, icon: 'fa-user-times' },
              { label: 'مكتمل',      val: `${completePct}%`, icon: 'fa-chart-pie' },
            ].map(s => (
              <div key={s.label} className="bg-white/20 rounded-xl py-3 text-center">
                <p className="text-xl font-black">{s.val}</p>
                <p className="text-[10px] text-orange-100 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team status chips */}
      {teams.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <i className="fas fa-shield-alt text-slate-500 text-sm" />
            <span className="font-black text-slate-800 text-sm">حالة الفرق</span>
            <i className="far fa-question-circle text-slate-400 text-xs" />
          </div>
          <div className="flex flex-wrap gap-2">
            {teamsWithStatus.map((t: any, i: number) => (
              <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                t.eliminated
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {t.eliminated ? <i className="fas fa-times text-[10px]" /> : <i className="fas fa-star text-[10px]" />}
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tournament stages */}
      {isCup && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <i className="fas fa-sitemap text-slate-500 text-sm" />
            <span className="font-black text-slate-800 text-sm">مراحل البطولة</span>
          </div>
          <div className="divide-y divide-gray-50">
            {ROUND_ORDER.map((r, i) => {
              const rMatches = matches.filter(m => m.round === r);
              const isDone = rMatches.length > 0 && rMatches.every(m => m.status === 'انتهت');
              const isCurrent = r === currentRound && !isDone;
              return (
                <div key={r} className={`flex items-center justify-between px-5 py-4 ${isCurrent ? 'bg-amber-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isDone ? 'bg-emerald-500' : isCurrent ? 'bg-amber-400' : 'bg-gray-100'
                    }`}>
                      <i className={`fas ${isDone ? 'fa-check' : isCurrent ? 'fa-play' : 'fa-lock'} text-${isDone || isCurrent ? 'white' : 'slate-400'} text-xs`} />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">{r}</p>
                      <p className="text-[10px] text-slate-400">{rMatches.length > 0 ? `${rMatches.filter(m => m.status === 'انتهت').length}/${rMatches.length} مباريات منتهية` : 'لم تبدأ بعد'}</p>
                    </div>
                  </div>
                  {isCurrent && <span className="text-[10px] font-black bg-amber-400 text-white px-2 py-0.5 rounded-full">جارية الآن</span>}
                  {!isCurrent && !isDone && rMatches.length === 0 && <span className="text-[10px] text-slate-400 font-bold">لاحقاً</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Advance round button */}
      {isCup && allCurrentDone && currentRound !== 'النهائي' && (
        <button
          onClick={onAdvance}
          disabled={advanceBusy}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/30"
        >
          {advanceBusy
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><i className="fas fa-arrow-left" /> الانتقال للدور التالي</>
          }
        </button>
      )}

      {/* Recent results */}
      {recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <i className="fas fa-flag-checkered text-slate-500 text-sm" />
            <span className="font-black text-slate-800 text-sm">آخر النتائج</span>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 text-end">
                  <p className="font-black text-slate-800 text-sm truncate">{m.homeTeam}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-sm">{m.homeScore}</span>
                  <span className="text-slate-400 font-black text-xs">-</span>
                  <span className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-sm">{m.awayScore}</span>
                </div>
                <div className="flex-1">
                  <p className="font-black text-slate-800 text-sm truncate">{m.awayTeam}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming matches */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <i className="fas fa-calendar-alt text-slate-500 text-sm" />
            <span className="font-black text-slate-800 text-sm">المباريات القادمة</span>
          </div>
          <div className="divide-y divide-gray-50">
            {upcoming.map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div className="flex-1 text-end">
                  <p className="font-bold text-slate-800 text-sm truncate">{m.homeTeam}</p>
                </div>
                <div className="text-center flex-shrink-0">
                  <p className="text-[10px] text-slate-400 font-bold">{m.date}</p>
                  <p className="text-xs font-black text-slate-600">VS</p>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm truncate">{m.awayTeam}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Matches tab ───────────────────────────────────────────────────────────────
function MatchesTab({ matches, onResult }: {
  matches: Match[];
  onResult: (match: Match) => void;
}) {
  const grouped: Record<string, Match[]> = {};
  matches.forEach(m => {
    const key = m.round || 'الدوري';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });

  const sortedRounds = Object.keys(grouped).sort(
    (a, b) => ROUND_ORDER.indexOf(a) - ROUND_ORDER.indexOf(b)
  );

  return (
    <div className="space-y-4">
      {matches.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <i className="fas fa-futbol text-4xl text-gray-200 mb-3 block" />
          <p className="font-black text-slate-700 mb-1">لا توجد مباريات بعد</p>
          <p className="text-slate-400 text-sm">قم بتوليد المباريات من تبويب الإعدادات</p>
        </div>
      )}
      {sortedRounds.map(round => (
        <div key={round} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 bg-slate-50 flex items-center gap-2">
            <i className="fas fa-layer-group text-slate-400 text-xs" />
            <span className="font-black text-slate-700 text-sm">{round}</span>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold mr-auto">
              {grouped[round].length} مباراة
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {grouped[round].map(m => (
              <div key={m.id} className="px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] text-slate-400 font-bold">{m.date}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.status === 'انتهت' ? 'bg-emerald-100 text-emerald-700' :
                    m.status === 'مباشر' ? 'bg-red-100 text-red-600 animate-pulse' :
                    'bg-slate-100 text-slate-500'
                  }`}>{m.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="flex-1 font-black text-slate-800 text-sm text-end truncate">{m.homeTeam}</p>
                  {m.status === 'انتهت' ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">{m.homeScore}</span>
                      <span className="text-slate-400 font-black text-xs">-</span>
                      <span className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">{m.awayScore}</span>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <span className="text-xs text-slate-400 font-black">VS</span>
                      <button
                        onClick={() => onResult(m)}
                        className="mt-1 text-[10px] bg-emerald-500 text-white px-2 py-1 rounded-lg font-bold hover:bg-emerald-600 transition-colors"
                      >
                        إدخال النتيجة
                      </button>
                    </div>
                  )}
                  <p className="flex-1 font-black text-slate-800 text-sm truncate">{m.awayTeam}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Bracket tab ───────────────────────────────────────────────────────────────
function BracketTab({ matches, format }: { matches: Match[]; format: string }) {
  if (format !== 'cup') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <i className="fas fa-table text-3xl text-slate-300 mb-3 block" />
        <p className="font-black text-slate-600 mb-1">بطولة دوري</p>
        <p className="text-slate-400 text-sm">شجرة الإقصاء متاحة فقط لبطولات الكأس</p>
      </div>
    );
  }

  const rounds = getRounds(matches);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max" style={{ direction: 'ltr' }}>
        {rounds.map((round, ri) => {
          const rMatches = matches.filter(m => m.round === round);
          const spacer = Math.pow(2, ri);
          return (
            <div key={round} className="flex flex-col" style={{ width: 200 }}>
              <div className="text-center mb-3">
                <span className="text-xs font-black text-white bg-slate-700 px-3 py-1 rounded-full">{round}</span>
              </div>
              <div className="flex flex-col" style={{ gap: spacer * 8 }}>
                {rMatches.map(m => (
                  <div key={m.id} className={`rounded-xl border-2 overflow-hidden flex-shrink-0 ${
                    m.status === 'انتهت' ? 'border-gray-200' :
                    m.status === 'مباشر' ? 'border-red-400' : 'border-dashed border-gray-300'
                  }`}>
                    {/* Home */}
                    <div className={`flex items-center justify-between px-3 py-2 border-b border-gray-100 ${
                      m.status === 'انتهت' && m.homeScore !== null && m.awayScore !== null && m.homeScore > m.awayScore
                        ? 'bg-emerald-50' : 'bg-white'
                    }`}>
                      <span className="text-xs font-bold text-slate-700 truncate flex-1">{m.homeTeam}</span>
                      <span className={`text-xs font-black ms-2 flex-shrink-0 w-5 text-center ${
                        m.status === 'انتهت' && m.homeScore !== null && m.awayScore !== null && m.homeScore > m.awayScore
                          ? 'text-emerald-600' : 'text-slate-500'
                      }`}>{m.homeScore ?? '-'}</span>
                    </div>
                    {/* Away */}
                    <div className={`flex items-center justify-between px-3 py-2 ${
                      m.status === 'انتهت' && m.homeScore !== null && m.awayScore !== null && m.awayScore > m.homeScore
                        ? 'bg-emerald-50' : 'bg-white'
                    }`}>
                      <span className="text-xs font-bold text-slate-700 truncate flex-1">{m.awayTeam}</span>
                      <span className={`text-xs font-black ms-2 flex-shrink-0 w-5 text-center ${
                        m.status === 'انتهت' && m.homeScore !== null && m.awayScore !== null && m.awayScore > m.homeScore
                          ? 'text-emerald-600' : 'text-slate-500'
                      }`}>{m.awayScore ?? '-'}</span>
                    </div>
                  </div>
                ))}
                {rMatches.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 text-center text-xs text-slate-400 font-bold">
                    في الانتظار
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stats tab ─────────────────────────────────────────────────────────────────
function StatsTab({ standings }: { standings: TeamStanding[] }) {
  const sorted = [...standings].sort((a, b) => b.points - a.points || b.wins - a.wins);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" dir="rtl">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-100">
              <th className="px-4 py-3 text-right font-black text-slate-600 text-xs">#</th>
              <th className="px-4 py-3 text-right font-black text-slate-600 text-xs">الفريق</th>
              <th className="px-4 py-3 text-center font-black text-slate-600 text-xs w-12">ف</th>
              <th className="px-4 py-3 text-center font-black text-slate-600 text-xs w-12">ت</th>
              <th className="px-4 py-3 text-center font-black text-slate-600 text-xs w-12">خ</th>
              <th className="px-4 py-3 text-center font-black text-emerald-600 text-xs w-12">نق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((t, i) => (
              <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${i < 3 ? 'font-bold' : ''}`}>
                <td className="px-4 py-3.5">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                    i === 0 ? 'bg-amber-400 text-white' :
                    i === 1 ? 'bg-slate-300 text-slate-700' :
                    i === 2 ? 'bg-orange-400 text-white' :
                    'bg-gray-100 text-slate-500'
                  }`}>{i + 1}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-black text-slate-800">{t.name}</span>
                </td>
                <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">{t.wins}</td>
                <td className="px-4 py-3.5 text-center text-amber-600 font-bold">{t.draws}</td>
                <td className="px-4 py-3.5 text-center text-red-500 font-bold">{t.losses}</td>
                <td className="px-4 py-3.5 text-center">
                  <span className="font-black text-slate-900 text-base">{t.points}</span>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">لا توجد إحصائيات بعد</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────────
function SettingsTab({ tournament, matches, onGenerateLeague, onGenerateKnockout, busy }: {
  tournament: League;
  matches: Match[];
  onGenerateLeague: () => void;
  onGenerateKnockout: () => void;
  busy: boolean;
}) {
  const isCup = tournament.format === 'cup';
  return (
    <div className="space-y-4">
      {/* Tournament info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-black text-slate-800 text-sm border-b border-gray-100 pb-3">معلومات البطولة</h3>
        {[
          { label: 'الاسم',         val: tournament.name },
          { label: 'النوع',         val: isCup ? 'كأس (خروج المغلوب)' : 'دوري (نقاط)' },
          { label: 'الحالة',        val: tournament.status },
          { label: 'تاريخ البدء',   val: tournament.startDate },
          { label: 'الفرق',         val: `${tournament.teamsCount} / ${tournament.maxTeams}` },
          { label: 'الجائزة',       val: tournament.prizePool },
        ].map(f => (
          <div key={f.label} className="flex items-center justify-between text-sm">
            <span className="text-slate-500 font-bold">{f.label}</span>
            <span className="font-black text-slate-800">{f.val || '—'}</span>
          </div>
        ))}
      </div>

      {/* Generate matches */}
      {!tournament.matchesGenerated && tournament.teamsCount >= 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-800 text-sm mb-3">توليد المباريات</h3>
          <p className="text-slate-400 text-xs mb-4">{isCup ? 'سيتم توليد مباريات الجولة الأولى بشكل عشوائي بنظام خروج المغلوب.' : 'سيتم توليد مباريات الدوري حيث يلعب كل فريق مع الآخر مرة واحدة.'}</p>
          <button
            onClick={isCup ? onGenerateKnockout : onGenerateLeague}
            disabled={busy}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><i className="fas fa-magic" /> توليد المباريات</>
            }
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-black text-slate-800 text-sm mb-3">إحصائيات المباريات</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'مجدولة',  val: matches.filter(m => m.status === 'مجدولة').length,  color: 'text-slate-600' },
            { label: 'مباشرة',  val: matches.filter(m => m.status === 'مباشر').length,   color: 'text-red-500'   },
            { label: 'منتهية',  val: matches.filter(m => m.status === 'انتهت').length,   color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const OwnerTournaments: React.FC = () => {
  const [tournaments, setTournaments]   = useState<League[]>([]);
  const [selected,   setSelected]       = useState<League | null>(null);
  const [matches,    setMatches]        = useState<Match[]>([]);
  const [standings,  setStandings]      = useState<TeamStanding[]>([]);
  const [tab,        setTab]            = useState<Tab>('overview');
  const [loading,    setLoading]        = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [toast,      setToast]          = useState('');
  const [toastType,  setToastType]      = useState<'ok'|'err'>('ok');
  const [resultMatch, setResultMatch]   = useState<Match | null>(null);
  const [advanceBusy, setAdvanceBusy]   = useState(false);
  const [genBusy,     setGenBusy]       = useState(false);
  const [showCreate,  setShowCreate]    = useState(false);
  const [createBusy,  setCreateBusy]   = useState(false);
  const [form, setForm] = useState({
    name: '', format: 'cup', fieldType: '7v7',
    maxTeams: '8', startDate: '', endDate: '', prizePool: '',
  });

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate) {
      showToast('الاسم وتاريخ البدء مطلوبان', 'err');
      return;
    }
    setCreateBusy(true);
    const saved = await backend.saveLeague({
      id: '',
      name: form.name.trim(),
      format: form.format,
      fieldType: form.fieldType,
      maxTeams: Number(form.maxTeams),
      startDate: form.startDate,
      endDate: form.endDate,
      prizePool: form.prizePool || '0 JD',
      sport: 'كرة القدم',
      status: 'التسجيل متاح',
      teamsCount: 0,
      registeredTeams: [],
      matchesGenerated: false,
    } as any);
    if (saved) {
      showToast('تم إنشاء البطولة بنجاح');
      setShowCreate(false);
      setForm({ name: '', format: 'cup', fieldType: '7v7', maxTeams: '8', startDate: '', endDate: '', prizePool: '' });
      await loadTournaments();
    } else {
      showToast('فشل إنشاء البطولة', 'err');
    }
    setCreateBusy(false);
  };

  const loadTournaments = useCallback(async () => {
    const data = await backend.getMyTournaments();
    setTournaments(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadTournaments(); }, [loadTournaments]);

  const selectTournament = async (t: League) => {
    setSelected(t);
    setTab('overview');
    setMatchLoading(true);
    const [ms, st] = await Promise.all([
      backend.getMatches(t.id),
      backend.getTournamentStandings(t.id),
    ]);
    setMatches(ms);
    setStandings(st);
    setMatchLoading(false);
  };

  const reloadMatches = async () => {
    if (!selected) return;
    const [ms, st] = await Promise.all([
      backend.getMatches(selected.id),
      backend.getTournamentStandings(selected.id),
    ]);
    setMatches(ms);
    setStandings(st);
  };

  const handleResultSave = async (home: number, away: number) => {
    if (!resultMatch) return;
    const ok = await backend.updateMatchResult(resultMatch.id, home, away);
    if (ok) { showToast('تم حفظ النتيجة'); await reloadMatches(); }
    else     showToast('فشل حفظ النتيجة', 'err');
    setResultMatch(null);
  };

  const handleGenerateLeague = async () => {
    if (!selected) return;
    setGenBusy(true);
    // Use existing round-robin generator
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://projectkickoff.onrender.com/api'}/tournaments/${selected.id}/generate-matches`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'تم توليد المباريات');
      await loadTournaments();
      const updated = { ...selected, matchesGenerated: true, status: 'جارية' as const };
      setSelected(updated);
      await reloadMatches();
    } else showToast(data.error || 'فشل التوليد', 'err');
    setGenBusy(false);
  };

  const handleGenerateKnockout = async () => {
    if (!selected) return;
    setGenBusy(true);
    const res = await backend.generateKnockoutMatches(selected.id);
    if (res.success) {
      showToast(res.message || 'تم توليد مباريات الكأس');
      await loadTournaments();
      const updated = { ...selected, matchesGenerated: true, status: 'جارية' as const };
      setSelected(updated);
      await reloadMatches();
    } else showToast(res.error || 'فشل التوليد', 'err');
    setGenBusy(false);
  };

  const handleAdvanceRound = async () => {
    if (!selected) return;
    setAdvanceBusy(true);
    const res = await backend.advanceKnockoutRound(selected.id);
    if (res.success) {
      showToast(res.finished ? 'اكتملت البطولة!' : `تم توليد مباريات ${res.round}`);
      await reloadMatches();
    } else showToast(res.error || 'فشل الانتقال', 'err');
    setAdvanceBusy(false);
  };

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview',  label: 'النظرة العامة', icon: 'fa-th-large'  },
    { id: 'matches',   label: 'المباريات',      icon: 'fa-futbol'    },
    { id: 'bracket',   label: 'الشجرة',          icon: 'fa-sitemap'   },
    { id: 'stats',     label: 'الإحصائيات',     icon: 'fa-chart-bar' },
    { id: 'settings',  label: 'الإعدادات',      icon: 'fa-cog'       },
  ];

  const statusColor = (s: string) =>
    s === 'جارية' ? 'bg-emerald-500' :
    s === 'مكتملة' ? 'bg-slate-500' : 'bg-amber-400';

  return (
    <div dir="rtl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 ${toastType === 'ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          <i className={`fas fa-${toastType === 'ok' ? 'check' : 'exclamation-circle'}`} /> {toast}
        </div>
      )}
      {resultMatch && (
        <ResultModal match={resultMatch} onSave={handleResultSave} onClose={() => setResultMatch(null)} />
      )}

      {/* ── Create modal ──────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">إنشاء جديد</p>
                <h3 className="font-black text-white text-lg">بطولة جديدة</h3>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                <i className="fas fa-times text-white text-sm" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">اسم البطولة *</label>
                <input
                  type="text" required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="مثال: كأس الأبطال الشبابي"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-colors"
                  dir="rtl"
                />
              </div>

              {/* Format */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">نوع البطولة</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'cup',    label: 'كأس (خروج المغلوب)', icon: 'fa-trophy'   },
                    { val: 'league', label: 'دوري (نقاط)',         icon: 'fa-table'    },
                  ].map(f => (
                    <button
                      key={f.val} type="button"
                      onClick={() => setForm(prev => ({ ...prev, format: f.val }))}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        form.format === f.val
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-slate-600 hover:border-gray-300'
                      }`}
                    >
                      <i className={`fas ${f.icon} text-sm`} /> {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field type + Max teams */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">نوع الملعب</label>
                  <select
                    value={form.fieldType}
                    onChange={e => setForm(f => ({ ...f, fieldType: e.target.value }))}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 bg-white"
                  >
                    {['5v5', '7v7', '11v11'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">الحد الأقصى للفرق</label>
                  <select
                    value={form.maxTeams}
                    onChange={e => setForm(f => ({ ...f, maxTeams: e.target.value }))}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 bg-white"
                  >
                    {['4', '8', '16', '32'].map(v => <option key={v} value={v}>{v} فريق</option>)}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">تاريخ البدء *</label>
                  <input
                    type="date" required
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Prize */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">الجائزة</label>
                <input
                  type="text"
                  value={form.prizePool}
                  onChange={e => setForm(f => ({ ...f, prizePool: e.target.value }))}
                  placeholder="مثال: 500 JD"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-colors"
                  dir="rtl"
                />
              </div>

              <button
                type="submit"
                disabled={createBusy}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/30"
              >
                {createBusy
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><i className="fas fa-plus" /> إنشاء البطولة</>
                }
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Page header ────────────────────────────────────────────────────── */}
      {!selected ? (
        // Tournament list
        <>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-1">لوحة التحكم</p>
              <h1 className="text-2xl font-black text-slate-900">إدارة البطولات</h1>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
            >
              <i className="fas fa-plus text-xs" /> إنشاء بطولة
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-40 animate-pulse border border-gray-100" />)}
            </div>
          ) : tournaments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
              <i className="fas fa-trophy text-5xl text-gray-200 mb-4 block" />
              <h3 className="font-black text-slate-700 mb-1">لا توجد بطولات</h3>
              <p className="text-slate-400 text-sm mb-5">لم تنشئ أي بطولات بعد</p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition-colors"
              >
                <i className="fas fa-plus text-xs" /> إنشاء بطولتك الأولى
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map(t => {
                const done = 0; // We don't have match counts here
                const isCup = t.format === 'cup';
                return (
                  <button
                    key={t.id}
                    onClick={() => selectTournament(t)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md p-5 text-start transition-all hover:-translate-y-0.5 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i className={`fas ${isCup ? 'fa-trophy' : 'fa-table'} text-amber-500`} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>{t.status}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{isCup ? 'كأس' : 'دوري'}</span>
                      </div>
                    </div>
                    <h3 className="font-black text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{t.name}</h3>
                    <p className="text-xs text-slate-400 mb-3">{t.startDate}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500"><i className="fas fa-users text-slate-300 me-1" />{t.teamsCount}/{t.maxTeams} فريق</span>
                      <span className="text-slate-500"><i className="fas fa-trophy text-slate-300 me-1" />{t.prizePool}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        // Tournament management view
        <>
          {/* Header */}
          <div className="bg-slate-900 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 10% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative z-10 px-6 pt-5 pb-4">
              <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold mb-3 transition-colors">
                <i className="fas fa-arrow-right text-xs" /> كل البطولات
              </button>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-slate-400 text-xs font-bold mb-1">إدارة البطولة</p>
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">{selected.name}</h1>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[10px] font-black text-white px-2.5 py-1 rounded-full ${statusColor(selected.status)}`}>{selected.status}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{selected.format === 'cup' ? 'كأس' : 'دوري'}</span>
                </div>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-5 gap-2 mt-4 border-t border-white/10 pt-4">
                {[
                  { label: 'مجدولة',  val: matchLoading ? '—' : matches.filter(m => m.status === 'مجدولة').length },
                  { label: 'مباشرة',  val: matchLoading ? '—' : matches.filter(m => m.status === 'مباشر').length  },
                  { label: 'منتهية',  val: matchLoading ? '—' : matches.filter(m => m.status === 'انتهت').length  },
                  { label: 'المباريات', val: matchLoading ? '—' : matches.length                                   },
                  { label: 'الفرق',   val: selected.teamsCount                                                     },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-lg font-black text-white">{s.val}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-t border-white/10 px-6 no-scrollbar">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap flex-shrink-0 border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <i className={`fas ${t.icon}`} /> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="pb-6">
            {matchLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />)}
              </div>
            ) : (
              <>
                {tab === 'overview'  && <OverviewTab tournament={selected} matches={matches} onAdvance={handleAdvanceRound} advanceBusy={advanceBusy} />}
                {tab === 'matches'   && <MatchesTab matches={matches} onResult={setResultMatch} />}
                {tab === 'bracket'   && <BracketTab matches={matches} format={selected.format || 'league'} />}
                {tab === 'stats'     && <StatsTab standings={standings} />}
                {tab === 'settings'  && <SettingsTab tournament={selected} matches={matches} onGenerateLeague={handleGenerateLeague} onGenerateKnockout={handleGenerateKnockout} busy={genBusy} />}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OwnerTournaments;
