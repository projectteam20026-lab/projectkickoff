import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { backend } from '../../services/backend';
import { League, Match, Team, TeamStanding } from '../../types';

type DetailTab = 'overview' | 'matches' | 'bracket' | 'stats' | 'teams' | 'details';
type PageView  = 'tournaments' | 'allteams';

const ROUND_ORDER = ['دور الـ 16', 'ربع النهائي', 'نصف النهائي', 'النهائي'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getRounds(matches: Match[]) {
  const set = new Set(matches.map(m => m.round || 'الدوري'));
  const filtered = ROUND_ORDER.filter(r => set.has(r));
  return filtered.length > 0 ? filtered : [...set];
}

function getTeamStatus(teams: any[], matches: Match[]) {
  const eliminated = new Set<string>();
  matches.filter(m => m.status === 'انتهت').forEach(m => {
    if (m.homeScore !== null && m.awayScore !== null) {
      if ((m.homeScore ?? 0) < (m.awayScore ?? 0)) eliminated.add(m.homeTeam);
      if ((m.awayScore ?? 0) < (m.homeScore ?? 0)) eliminated.add(m.awayTeam);
    }
  });
  return teams.map((t: any) => ({ ...t, eliminated: eliminated.has(t.name) }));
}

function getCurrentRound(matches: Match[]): string {
  const pending = matches.filter(m => m.status !== 'انتهت');
  if (pending.length === 0 && matches.length > 0) return 'مكتملة';
  return getRounds(pending)[0] || 'الدوري';
}

// ── Logo display ──────────────────────────────────────────────────────────────
function TeamLogo({ logo, name, size = 36 }: { logo?: string; name: string; size?: number }) {
  if (logo?.startsWith('data:') || logo?.startsWith('http')) {
    return <img src={logo} alt={name} style={{ width: size, height: size }} className="object-cover rounded-xl" />;
  }
  return (
    <div style={{ width: size, height: size }} className="bg-emerald-100 rounded-xl flex items-center justify-center font-black text-emerald-700 text-sm">
      {name?.[0] || '؟'}
    </div>
  );
}

// ── Result modal ──────────────────────────────────────────────────────────────
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
            <input type="number" min={0} value={home} onChange={e => setHome(Number(e.target.value))}
              className="w-full text-center text-3xl font-black border-2 border-gray-200 rounded-2xl py-3 focus:border-emerald-400 outline-none" />
          </div>
          <span className="text-slate-400 font-black text-xl">:</span>
          <div className="flex-1 text-center">
            <p className="font-black text-slate-800 text-sm mb-2 truncate">{match.awayTeam}</p>
            <input type="number" min={0} value={away} onChange={e => setAway(Number(e.target.value))}
              className="w-full text-center text-3xl font-black border-2 border-gray-200 rounded-2xl py-3 focus:border-emerald-400 outline-none" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-gray-50">إلغاء</button>
          <button disabled={busy} onClick={async () => { setBusy(true); await onSave(home, away); setBusy(false); }}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm disabled:opacity-50">
            {busy ? <span className="flex items-center justify-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></span> : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ tournament, matches, onAdvance, advanceBusy }: {
  tournament: League; matches: Match[]; onAdvance: () => void; advanceBusy: boolean;
}) {
  const isCup = tournament.format === 'cup';
  const currentRound = getCurrentRound(matches);
  const teams = (tournament.registeredTeamsDetail || []) as any[];
  const teamsWithStatus = getTeamStatus(teams, matches);
  const eliminatedCount = teamsWithStatus.filter(t => t.eliminated).length;
  const done = matches.filter(m => m.status === 'انتهت').length;
  const pct = matches.length > 0 ? Math.round((done / matches.length) * 100) : 0;
  const recent = matches.filter(m => m.status === 'انتهت').slice(-3).reverse();
  const upcoming = matches.filter(m => m.status === 'مجدولة').slice(0, 3);
  const curRoundMatches = matches.filter(m => m.round === currentRound || (!m.round && currentRound === 'الدوري'));
  const allCurDone = curRoundMatches.length > 0 && curRoundMatches.every(m => m.status === 'انتهت');

  return (
    <div className="space-y-5">
      {isCup && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="fas fa-trophy text-white" />
            </div>
            <div>
              <p className="font-black text-amber-900 text-sm">نظام الكأس — خروج المغلوب</p>
              <p className="text-amber-700 text-xs mt-0.5">خسارة واحدة = إقصاء فوري من البطولة</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:'تأهل للدور القادم', sub:'فوز',   c:'bg-emerald-50 border-emerald-200 text-emerald-700', i:'fa-check-circle' },
              { label:'خروج من البطولة',   sub:'خسارة', c:'bg-red-50 border-red-200 text-red-600',            i:'fa-times-circle' },
              { label:'ركلات الترجيح',     sub:'تعادل', c:'bg-blue-50 border-blue-200 text-blue-600',          i:'fa-random'       },
            ].map(x => (
              <div key={x.label} className={`border rounded-xl p-3 text-center ${x.c}`}>
                <i className={`fas ${x.i} text-xl mb-1 block`} />
                <p className="font-black text-xs leading-tight">{x.label}</p>
                <p className="text-[10px] mt-0.5 opacity-70">{x.sub}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="bg-orange-400 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10">
          <p className="text-orange-100 text-xs font-bold mb-0.5">المرحلة الحالية</p>
          <h3 className="font-black text-xl mb-4">{currentRound}</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:'فريق متبقي',  val: teams.length - eliminatedCount },
              { label:'فريق مقصي',   val: eliminatedCount },
              { label:'مكتمل',       val: `${pct}%` },
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
      {teamsWithStatus.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <i className="fas fa-shield-alt text-slate-400 text-sm" />
            <span className="font-black text-slate-800 text-sm">حالة الفرق</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {teamsWithStatus.map((t: any, i: number) => (
              <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                t.eliminated ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {t.eliminated ? <i className="fas fa-times text-[10px]" /> : <i className="fas fa-star text-[10px]" />} {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stages */}
      {isCup && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <i className="fas fa-sitemap text-slate-400 text-sm" /><span className="font-black text-slate-800 text-sm">مراحل البطولة</span>
          </div>
          <div className="divide-y divide-gray-50">
            {ROUND_ORDER.map(r => {
              const rm = matches.filter(m => m.round === r);
              const isDone = rm.length > 0 && rm.every(m => m.status === 'انتهت');
              const isCur  = r === currentRound && !isDone;
              return (
                <div key={r} className={`flex items-center justify-between px-5 py-4 ${isCur ? 'bg-amber-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDone ? 'bg-emerald-500' : isCur ? 'bg-amber-400' : 'bg-gray-100'}`}>
                      <i className={`fas ${isDone ? 'fa-check' : isCur ? 'fa-play' : 'fa-lock'} text-xs ${isDone || isCur ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">{r}</p>
                      <p className="text-[10px] text-slate-400">{rm.length > 0 ? `${rm.filter(m=>m.status==='انتهت').length}/${rm.length} مباريات منتهية` : 'لم تبدأ بعد'}</p>
                    </div>
                  </div>
                  {isCur && <span className="text-[10px] font-black bg-amber-400 text-white px-2 py-0.5 rounded-full">جارية الآن</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCup && allCurDone && currentRound !== 'النهائي' && currentRound !== 'مكتملة' && (
        <button onClick={onAdvance} disabled={advanceBusy}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/30">
          {advanceBusy ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><i className="fas fa-arrow-left" /> الانتقال للدور التالي</>}
        </button>
      )}

      {recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <i className="fas fa-flag-checkered text-slate-400 text-sm" /><span className="font-black text-slate-800 text-sm">آخر النتائج</span>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                <p className="flex-1 font-black text-slate-800 text-sm text-end truncate">{m.homeTeam}</p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-sm">{m.homeScore}</span>
                  <span className="text-slate-400 text-xs">-</span>
                  <span className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-sm">{m.awayScore}</span>
                </div>
                <p className="flex-1 font-black text-slate-800 text-sm truncate">{m.awayTeam}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <i className="fas fa-calendar-alt text-slate-400 text-sm" /><span className="font-black text-slate-800 text-sm">المباريات القادمة</span>
          </div>
          <div className="divide-y divide-gray-50">
            {upcoming.map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                <p className="flex-1 font-bold text-slate-800 text-sm text-end truncate">{m.homeTeam}</p>
                <div className="text-center flex-shrink-0">
                  <p className="text-[10px] text-slate-400 font-bold">{m.date}</p>
                  <p className="text-xs font-black text-slate-600">VS</p>
                </div>
                <p className="flex-1 font-bold text-slate-800 text-sm truncate">{m.awayTeam}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Matches tab ───────────────────────────────────────────────────────────────
function MatchesTab({ matches, onResult }: { matches: Match[]; onResult: (m: Match) => void }) {
  const grouped: Record<string, Match[]> = {};
  matches.forEach(m => { const k = m.round || 'الدوري'; grouped[k] = [...(grouped[k] || []), m]; });
  const sortedRounds = Object.keys(grouped).sort((a, b) => ROUND_ORDER.indexOf(a) - ROUND_ORDER.indexOf(b));
  return (
    <div className="space-y-4">
      {matches.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <i className="fas fa-futbol text-4xl text-gray-200 mb-3 block" />
          <p className="font-black text-slate-700 mb-1">لا توجد مباريات بعد</p>
          <p className="text-slate-400 text-sm">قم بتوليد المباريات من تبويب التفاصيل</p>
        </div>
      )}
      {sortedRounds.map(round => (
        <div key={round} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fas fa-layer-group text-slate-400 text-xs" />
              <span className="font-black text-slate-700 text-sm">{round}</span>
            </div>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{grouped[round].length} مباراة</span>
          </div>
          <div className="divide-y divide-gray-50">
            {grouped[round].map(m => (
              <div key={m.id} className="px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] text-slate-400 font-bold">{m.date}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.status==='انتهت' ? 'bg-emerald-100 text-emerald-700' :
                    m.status==='مباشر' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500'
                  }`}>{m.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="flex-1 font-black text-slate-800 text-sm text-end truncate">{m.homeTeam}</p>
                  {m.status === 'انتهت' ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">{m.homeScore}</span>
                      <span className="text-slate-400 text-xs">-</span>
                      <span className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">{m.awayScore}</span>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <span className="text-xs text-slate-400 font-black">VS</span>
                      <button onClick={() => onResult(m)}
                        className="mt-1 text-[10px] bg-emerald-500 text-white px-2 py-1 rounded-lg font-bold hover:bg-emerald-600 transition-colors">
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
  if (format !== 'cup') return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
      <i className="fas fa-table text-3xl text-slate-300 mb-3 block" />
      <p className="font-black text-slate-600 mb-1">بطولة دوري</p>
      <p className="text-slate-400 text-sm">شجرة الإقصاء متاحة فقط لبطولات الكأس</p>
    </div>
  );
  const rounds = getRounds(matches);
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max" style={{ direction: 'ltr' }}>
        {rounds.map((round, ri) => {
          const rms = matches.filter(m => m.round === round);
          return (
            <div key={round} className="flex flex-col" style={{ width: 200 }}>
              <div className="text-center mb-3">
                <span className="text-xs font-black text-white bg-slate-700 px-3 py-1 rounded-full">{round}</span>
              </div>
              <div className="flex flex-col" style={{ gap: Math.pow(2, ri) * 8 }}>
                {rms.map(m => (
                  <div key={m.id} className={`rounded-xl border-2 overflow-hidden ${
                    m.status==='انتهت' ? 'border-gray-200' :
                    m.status==='مباشر' ? 'border-red-400' : 'border-dashed border-gray-300'
                  }`}>
                    {[{ team: m.homeTeam, score: m.homeScore, other: m.awayScore }, { team: m.awayTeam, score: m.awayScore, other: m.homeScore }].map((s, si) => (
                      <div key={si} className={`flex items-center justify-between px-3 py-2 ${si===0 ? 'border-b border-gray-100' : ''} ${
                        m.status==='انتهت' && s.score !== null && s.other !== null && s.score > s.other ? 'bg-emerald-50' : 'bg-white'
                      }`}>
                        <span className="text-xs font-bold text-slate-700 truncate flex-1">{s.team}</span>
                        <span className={`text-xs font-black ms-2 flex-shrink-0 w-5 text-center ${
                          m.status==='انتهت' && s.score !== null && s.other !== null && s.score > s.other ? 'text-emerald-600' : 'text-slate-500'
                        }`}>{s.score ?? '-'}</span>
                      </div>
                    ))}
                  </div>
                ))}
                {rms.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 text-center text-xs text-slate-400 font-bold">في الانتظار</div>
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
              <th className="px-4 py-3 text-right text-xs font-black text-slate-500">#</th>
              <th className="px-4 py-3 text-right text-xs font-black text-slate-500">الفريق</th>
              <th className="px-4 py-3 text-center text-xs font-black text-emerald-600 w-10">ف</th>
              <th className="px-4 py-3 text-center text-xs font-black text-amber-600 w-10">ت</th>
              <th className="px-4 py-3 text-center text-xs font-black text-red-500 w-10">خ</th>
              <th className="px-4 py-3 text-center text-xs font-black text-slate-700 w-10">نق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((t, i) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                    i===0?'bg-amber-400 text-white':i===1?'bg-slate-300 text-slate-700':i===2?'bg-orange-400 text-white':'bg-gray-100 text-slate-500'
                  }`}>{i+1}</span>
                </td>
                <td className="px-4 py-3.5 font-black text-slate-800">{t.name}</td>
                <td className="px-4 py-3.5 text-center text-emerald-600 font-bold">{t.wins}</td>
                <td className="px-4 py-3.5 text-center text-amber-600 font-bold">{t.draws}</td>
                <td className="px-4 py-3.5 text-center text-red-500 font-bold">{t.losses}</td>
                <td className="px-4 py-3.5 text-center font-black text-slate-900 text-base">{t.points}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">لا توجد إحصائيات بعد</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Teams tab (registered teams in tournament) ────────────────────────────────
function TeamsTab({ tournament }: { tournament: League }) {
  const teams = tournament.registeredTeamsDetail || [];
  const remaining = tournament.maxTeams - tournament.teamsCount;
  return (
    <div className="space-y-4">
      {/* Registration progress */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-black text-slate-800 text-sm">التسجيل</span>
          <span className="text-sm font-black text-slate-700">{tournament.teamsCount} / {tournament.maxTeams}</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
            style={{ width: `${tournament.maxTeams > 0 ? (tournament.teamsCount / tournament.maxTeams) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>{remaining > 0 ? `${remaining} مقعد متبقي` : 'اكتملت الفرق'}</span>
          <span className={`font-bold ${remaining === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {remaining === 0 ? 'مكتمل' : tournament.status}
          </span>
        </div>
      </div>

      {/* Teams list */}
      {teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <i className="fas fa-users text-4xl text-gray-200 mb-3 block" />
          <p className="font-black text-slate-700 mb-1">لا توجد فرق مسجلة</p>
          <p className="text-slate-400 text-sm">لم يسجّل أي فريق في هذه البطولة بعد</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <i className="fas fa-shield-alt text-emerald-500 text-sm" />
            <span className="font-black text-slate-800 text-sm">الفرق المسجلة</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-black mr-auto">{teams.length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {teams.map((t: any, i) => (
              <div key={t.id || i} className="flex items-center gap-3 px-5 py-4">
                <span className="w-6 text-xs font-black text-slate-400 flex-shrink-0 text-center">{i+1}</span>
                <TeamLogo logo={t.logo} name={t.name} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 text-sm truncate">{t.name}</p>
                  <p className="text-[10px] text-slate-400">نق: {t.points} · ف: {t.wins} · ت: {t.draws} · خ: {t.losses}</p>
                </div>
                <div className="text-end flex-shrink-0">
                  <p className="font-black text-lg text-slate-900">{t.points}</p>
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

// ── Details tab (full tournament info + generate matches) ─────────────────────
function DetailsTab({ tournament, matches, onGenerateLeague, onGenerateKnockout, busy }: {
  tournament: League; matches: Match[];
  onGenerateLeague: () => void; onGenerateKnockout: () => void; busy: boolean;
}) {
  const isCup = tournament.format === 'cup';
  return (
    <div className="space-y-4">
      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-black text-slate-800 text-sm border-b border-gray-100 pb-3 mb-4">معلومات البطولة</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label:'الاسم',          val: tournament.name },
            { label:'النوع',          val: isCup ? 'كأس (خروج المغلوب)' : 'دوري (نقاط)' },
            { label:'الرياضة',        val: tournament.sport },
            { label:'نوع الملعب',     val: tournament.fieldType },
            { label:'الحالة',         val: tournament.status },
            { label:'تاريخ البدء',    val: tournament.startDate },
            { label:'تاريخ الانتهاء', val: tournament.endDate || '—' },
            { label:'آخر تسجيل',      val: tournament.regDeadline || '—' },
            { label:'عدد الفرق',      val: `${tournament.teamsCount} / ${tournament.maxTeams}` },
            { label:'رسوم المشاركة',  val: tournament.entryFee ? `${tournament.entryFee} JD` : 'مجاني' },
            { label:'الأوقات',        val: tournament.preferredTime || '—' },
            { label:'الأيام',         val: (tournament.preferredDays || []).join('، ') || '—' },
          ].map(f => (
            <div key={f.label} className="flex items-start justify-between gap-3 text-sm py-1 border-b border-gray-50 last:border-none">
              <span className="text-slate-400 font-bold text-xs shrink-0">{f.label}</span>
              <span className="font-black text-slate-800 text-xs text-end">{f.val || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prizes */}
      {(tournament.prize1 || tournament.prize2 || tournament.prize3 || tournament.prizePool) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-800 text-sm border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
            <i className="fas fa-medal text-amber-400" /> الجوائز
          </h3>
          <div className="space-y-3">
            {tournament.prizePool && tournament.prizePool !== '0 JD' && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm font-bold">إجمالي الجوائز</span>
                <span className="font-black text-emerald-600">{tournament.prizePool}</span>
              </div>
            )}
            {[
              { rank: '🥇 المركز الأول', val: tournament.prize1 },
              { rank: '🥈 المركز الثاني', val: tournament.prize2 },
              { rank: '🥉 المركز الثالث', val: tournament.prize3 },
            ].filter(p => p.val).map(p => (
              <div key={p.rank} className="flex items-center justify-between">
                <span className="text-slate-600 text-sm font-bold">{p.rank}</span>
                <span className="font-black text-slate-800 text-sm">{p.val}</span>
              </div>
            ))}
            {tournament.prizeDesc && (
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{tournament.prizeDesc}</p>
            )}
          </div>
        </div>
      )}

      {/* Organizer */}
      {(tournament.organizerName || tournament.organizerPhone || tournament.organizerEmail) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-800 text-sm border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
            <i className="fas fa-user-tie text-slate-400" /> معلومات المنظّم
          </h3>
          <div className="space-y-3">
            {tournament.organizerName && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-user text-slate-500 text-sm" />
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm">{tournament.organizerName}</p>
                  <p className="text-[10px] text-slate-400">منظّم البطولة</p>
                </div>
              </div>
            )}
            {tournament.organizerPhone && (
              <a href={`tel:${tournament.organizerPhone}`} className="flex items-center gap-3 hover:opacity-80">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-phone text-emerald-500 text-sm" />
                </div>
                <span className="font-bold text-slate-700 text-sm" dir="ltr">{tournament.organizerPhone}</span>
              </a>
            )}
            {tournament.organizerEmail && (
              <a href={`mailto:${tournament.organizerEmail}`} className="flex items-center gap-3 hover:opacity-80">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-envelope text-blue-500 text-sm" />
                </div>
                <span className="font-bold text-slate-700 text-sm">{tournament.organizerEmail}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {tournament.notes && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-800 text-sm border-b border-gray-100 pb-3 mb-3 flex items-center gap-2">
            <i className="fas fa-sticky-note text-amber-400" /> ملاحظات
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">{tournament.notes}</p>
        </div>
      )}

      {/* Generate matches */}
      {!tournament.matchesGenerated && tournament.teamsCount >= 2 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <i className="fas fa-magic text-white" />
            </div>
            <div>
              <p className="font-black text-emerald-900 text-sm">توليد المباريات</p>
              <p className="text-emerald-700 text-xs">{isCup ? 'توليد الجولة الأولى بنظام الكأس' : 'توليد جدول الدوري الكامل'}</p>
            </div>
          </div>
          <button onClick={isCup ? onGenerateKnockout : onGenerateLeague} disabled={busy}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {busy ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><i className="fas fa-magic" /> توليد المباريات</>}
          </button>
        </div>
      )}

      {/* Match stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-black text-slate-800 text-sm mb-3">إحصائيات المباريات</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'مجدولة',  val: matches.filter(m=>m.status==='مجدولة').length,  c:'text-slate-600' },
            { label:'مباشرة',  val: matches.filter(m=>m.status==='مباشر').length,   c:'text-red-500'   },
            { label:'منتهية',  val: matches.filter(m=>m.status==='انتهت').length,   c:'text-emerald-600'},
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className={`text-2xl font-black ${s.c}`}>{s.val}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── All teams section ─────────────────────────────────────────────────────────
function AllTeamsSection({ teams, loading }: { teams: Team[]; loading: boolean }) {
  const [search, setSearch] = useState('');
  const filtered = teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.city?.includes(search));
  return (
    <div className="space-y-4">
      <input
        type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="ابحث عن فريق..."
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-colors bg-white"
        dir="rtl"
      />
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <i className="fas fa-users text-4xl text-gray-200 mb-3 block" />
          <p className="font-black text-slate-700 mb-1">{search ? 'لا نتائج' : 'لا توجد فرق'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <TeamLogo logo={t.logo} name={t.name} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 truncate">{t.name}</p>
                  <p className="text-xs text-slate-400">
                    {t.city && <span><i className="fas fa-map-marker-alt me-1 text-slate-300" />{t.city}</span>}
                    {t.fieldType && <span className="mr-2">{t.fieldType}</span>}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label:'فوز',   val: t.wins,   c:'text-emerald-600' },
                  { label:'تعادل', val: t.draws,  c:'text-amber-500'   },
                  { label:'خسارة', val: t.losses, c:'text-red-500'     },
                  { label:'نقطة',  val: t.points, c:'text-slate-800'   },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-lg py-1.5">
                    <p className={`font-black text-sm ${s.c}`}>{s.val}</p>
                    <p className="text-[9px] text-slate-400">{s.label}</p>
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

// ── Main component ────────────────────────────────────────────────────────────
const OwnerTournaments: React.FC = () => {
  const { user } = useAuth();
  const [pageView,    setPageView]    = useState<PageView>('tournaments');
  const [tournaments, setTournaments] = useState<League[]>([]);
  const [allTeams,    setAllTeams]    = useState<Team[]>([]);
  const [selected,    setSelected]    = useState<League | null>(null);
  const [matches,     setMatches]     = useState<Match[]>([]);
  const [standings,   setStandings]   = useState<TeamStanding[]>([]);
  const [tab,         setTab]         = useState<DetailTab>('overview');
  const [loading,     setLoading]     = useState(true);
  const [teamsLoading,setTeamsLoading]= useState(false);
  const [matchLoad,   setMatchLoad]   = useState(false);
  const [toast,       setToast]       = useState('');
  const [toastType,   setToastType]   = useState<'ok'|'err'>('ok');
  const [resultMatch, setResultMatch] = useState<Match | null>(null);
  const [advanceBusy, setAdvanceBusy] = useState(false);
  const [genBusy,     setGenBusy]     = useState(false);
  const [showCreate,  setShowCreate]  = useState(false);
  const [createBusy,  setCreateBusy] = useState(false);
  const [form, setForm] = useState({ name:'', format:'cup', fieldType:'7v7', maxTeams:'8', startDate:'', endDate:'', prizePool:'' });

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast(msg); setToastType(type); setTimeout(() => setToast(''), 3500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate) { showToast('الاسم وتاريخ البدء مطلوبان', 'err'); return; }
    setCreateBusy(true);
    const saved = await backend.saveLeague({
      id:'', name:form.name.trim(), format:form.format, fieldType:form.fieldType,
      maxTeams:Number(form.maxTeams), startDate:form.startDate, endDate:form.endDate,
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setTeamsLoading(true);
    const [ts, teams] = await Promise.all([backend.getLeagues(), backend.getAllTeams()]);
    setTournaments(ts);
    setAllTeams(teams);
    setLoading(false);
    setTeamsLoading(false);
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

  const handleGenerateLeague = async () => {
    if (!selected) return;
    setGenBusy(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://projectkickoff.onrender.com/api'}/tournaments/${selected.id}/generate-matches`, {
      method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'تم توليد المباريات');
      setSelected(s => s ? { ...s, matchesGenerated: true, status: 'جارية' } : s);
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
      setSelected(s => s ? { ...s, matchesGenerated: true, status: 'جارية' } : s);
      await reloadMatches();
    } else showToast(res.error || 'فشل التوليد', 'err');
    setGenBusy(false);
  };

  const handleAdvanceRound = async () => {
    if (!selected) return;
    setAdvanceBusy(true);
    const res = await backend.advanceKnockoutRound(selected.id);
    if (res.success) { showToast(res.finished ? 'اكتملت البطولة!' : `تم توليد مباريات ${res.round}`); await reloadMatches(); }
    else showToast(res.error || 'فشل الانتقال', 'err');
    setAdvanceBusy(false);
  };

  const DETAIL_TABS: { id: DetailTab; label: string; icon: string }[] = [
    { id:'overview', label:'النظرة العامة', icon:'fa-th-large'  },
    { id:'matches',  label:'المباريات',     icon:'fa-futbol'    },
    { id:'bracket',  label:'الشجرة',        icon:'fa-sitemap'   },
    { id:'stats',    label:'الإحصائيات',   icon:'fa-chart-bar' },
    { id:'teams',    label:'الفرق',         icon:'fa-users'     },
    { id:'details',  label:'التفاصيل',      icon:'fa-info-circle'},
  ];

  const statusColor = (s: string) =>
    s==='جارية' ? 'bg-emerald-500' : s==='مكتملة' ? 'bg-slate-500' : 'bg-amber-400';

  return (
    <div dir="rtl">
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
              <button onClick={() => setShowCreate(false)} className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                <i className="fas fa-times text-white text-sm" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">اسم البطولة *</label>
                <input type="text" required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                  placeholder="مثال: كأس الأبطال الشبابي"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-colors" dir="rtl" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">نوع البطولة</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{val:'cup',label:'كأس (خروج المغلوب)',icon:'fa-trophy'},{val:'league',label:'دوري (نقاط)',icon:'fa-table'}].map(f => (
                    <button key={f.val} type="button" onClick={() => setForm(p=>({...p,format:f.val}))}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${form.format===f.val ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-slate-600'}`}>
                      <i className={`fas ${f.icon}`} /> {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">نوع الملعب</label>
                  <select value={form.fieldType} onChange={e => setForm(f=>({...f,fieldType:e.target.value}))}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 bg-white">
                    {['5v5','7v7','11v11'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">الحد الأقصى للفرق</label>
                  <select value={form.maxTeams} onChange={e => setForm(f=>({...f,maxTeams:e.target.value}))}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 bg-white">
                    {['4','8','16','32'].map(v => <option key={v} value={v}>{v} فريق</option>)}
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
                <label className="block text-xs font-black text-slate-700 mb-1.5">الجائزة</label>
                <input type="text" value={form.prizePool} onChange={e => setForm(f=>({...f,prizePool:e.target.value}))}
                  placeholder="مثال: 500 JD"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 transition-colors" dir="rtl" />
              </div>
              <button type="submit" disabled={createBusy}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/30">
                {createBusy ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><i className="fas fa-plus" /> إنشاء البطولة</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Tournament detail view ───────────────────────────────────────────── */}
      {selected ? (
        <>
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
                  <span className="text-[10px] text-slate-400 font-bold">{selected.format==='cup' ? 'كأس' : 'دوري'}</span>
                  {selected.createdBy === user?.id && (
                    <span className="text-[10px] text-amber-400 font-bold"><i className="fas fa-crown me-1" />أنشأتها</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mt-4 border-t border-white/10 pt-4">
                {[
                  { label:'مجدولة',   val: matchLoad ? '—' : matches.filter(m=>m.status==='مجدولة').length },
                  { label:'مباشرة',   val: matchLoad ? '—' : matches.filter(m=>m.status==='مباشر').length  },
                  { label:'منتهية',   val: matchLoad ? '—' : matches.filter(m=>m.status==='انتهت').length  },
                  { label:'المباريات', val: matchLoad ? '—' : matches.length                               },
                  { label:'الفرق',    val: selected.teamsCount                                              },
                ].map((s,i) => (
                  <div key={i} className="text-center">
                    <p className="text-lg font-black text-white">{s.val}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex overflow-x-auto border-t border-white/10 px-6">
              {DETAIL_TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap flex-shrink-0 border-b-2 transition-colors ${
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
                {tab==='overview' && <OverviewTab tournament={selected} matches={matches} onAdvance={handleAdvanceRound} advanceBusy={advanceBusy} />}
                {tab==='matches'  && <MatchesTab matches={matches} onResult={setResultMatch} />}
                {tab==='bracket'  && <BracketTab matches={matches} format={selected.format||'league'} />}
                {tab==='stats'    && <StatsTab standings={standings} />}
                {tab==='teams'    && <TeamsTab tournament={selected} />}
                {tab==='details'  && <DetailsTab tournament={selected} matches={matches} onGenerateLeague={handleGenerateLeague} onGenerateKnockout={handleGenerateKnockout} busy={genBusy} />}
              </>
            )}
          </div>
        </>
      ) : (
        /* ── List view ──────────────────────────────────────────────────────── */
        <>
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-1">لوحة التحكم</p>
              <h1 className="text-2xl font-black text-slate-900">البطولات والفرق</h1>
            </div>
            {pageView === 'tournaments' && (
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black rounded-xl shadow-sm transition-all hover:-translate-y-0.5">
                <i className="fas fa-plus text-xs" /> إنشاء بطولة
              </button>
            )}
          </div>

          {/* Page tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-5 w-fit">
            {([
              { id:'tournaments' as PageView, label:'البطولات', icon:'fa-trophy',  count: tournaments.length },
              { id:'allteams'    as PageView, label:'الفرق',    icon:'fa-users',   count: allTeams.length    },
            ]).map(v => (
              <button key={v.id} onClick={() => setPageView(v.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  pageView===v.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
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
              <p className="text-slate-400 text-sm mb-5">لم يتم إنشاء أي بطولة بعد</p>
              <button onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition-colors">
                <i className="fas fa-plus text-xs" /> إنشاء بطولتك الأولى
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map(t => {
                const isCup = t.format === 'cup';
                const isMine = t.createdBy === user?.id;
                return (
                  <button key={t.id} onClick={() => selectTournament(t)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md p-5 text-start transition-all hover:-translate-y-0.5 group relative">
                    {isMine && (
                      <span className="absolute top-3 left-3 text-[9px] font-black bg-amber-400 text-white px-1.5 py-0.5 rounded-full">
                        <i className="fas fa-crown me-0.5" /> أنشأتها
                      </span>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isCup ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
                        <i className={`fas ${isCup ? 'fa-trophy text-amber-500' : 'fa-table text-blue-500'}`} />
                      </div>
                      <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>{t.status}</span>
                    </div>
                    <h3 className="font-black text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{t.name}</h3>
                    <p className="text-xs text-slate-400 mb-3">{t.startDate} · {isCup ? 'كأس' : 'دوري'}</p>
                    <div className="flex items-center gap-2">
                      {/* Progress bar */}
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${t.maxTeams > 0 ? (t.teamsCount / t.maxTeams) * 100 : 0}%` }} />
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
