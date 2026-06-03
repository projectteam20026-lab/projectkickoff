import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { backend } from '../services/backend';
import { League, Match, Team } from '../types';

/* ─── mock-data builder (for owner tournaments with non-DB ids) ───────────── */
type OwnerTourneyState = { id:string; name:string; format:string; teams:number; startDate:string; };

const MOCK_NAMES = ['نجوم عمان','أسود الأردن','فرسان الشمال','صقور الجنوب','ذئاب الشرق','نسور البتراء','ليوث الأردن','عقبان الجنوب','هلال إربد','بدر الزرقاء','فجر العقبة','رعد السلط','برق جرش','ثعالب عجلون','سهام مادبا','قوس الكرك'];
const MOCK_LOGOS = ['⭐','🦁','🦅','🔥','🐺','💎','🛡️','👑','🌙','☀️','🌟','⚡','🎯','🦊','🏹','💪'];
const MOCK_SC: [number,number][] = [[2,1],[1,1],[3,0],[1,2],[0,0],[2,0],[1,3],[4,2],[0,1],[3,1],[2,2],[1,0],[0,2],[3,2],[1,1],[2,1],[0,3],[1,2],[2,0],[3,1]];

function buildMock(ot: OwnerTourneyState): { league:League; teams:Team[]; matches:Match[] } {
  const fmt = ot.format.replace('أ','ا'); // normalise كأس → كاس
  const type: League['type'] = fmt === 'كاس' ? 'كاس' : fmt === 'دوري وكاس' ? 'دوري وكاس' : 'دوري';
  const league: League = {
    id: ot.id, name: ot.name, type, status: 'جارية',
    startDate: ot.startDate, maxTeams: ot.teams, teamsCount: ot.teams,
    prizePool: 'JD 500', sport: 'كرة القدم',
    registeredTeams: Array.from({length: ot.teams}, (_,i) => `mt-${ot.id}-${i+1}`),
    matchesGenerated: true,
  };
  const teams: Team[] = Array.from({length: ot.teams}, (_,i) => ({
    id: `mt-${ot.id}-${i+1}`,
    name: MOCK_NAMES[i % MOCK_NAMES.length],
    logo: MOCK_LOGOS[i % MOCK_LOGOS.length],
    wins:0, losses:0, draws:0, points:0,
  }));
  const matches: Match[] = [];
  const isLeague = type === 'دوري' || type === 'دوري وكاس';
  const isCup    = type === 'كاس'  || type === 'دوري وكاس';

  if (isLeague) {
    let idx = 0;
    const doneCount = Math.max(3, Math.floor(ot.teams * (ot.teams-1) / 5));
    for (let i = 0; i < teams.length; i++) {
      for (let j = i+1; j < teams.length; j++) {
        const done = idx < doneCount;
        const [hs,as_] = MOCK_SC[idx % MOCK_SC.length];
        matches.push({ id:`mm-g-${ot.id}-${idx}`, leagueId:ot.id,
          homeTeamId:teams[i].id, awayTeamId:teams[j].id,
          homeTeam:teams[i].name, awayTeam:teams[j].name,
          homeScore:done?hs:null, awayScore:done?as_:null,
          status:done?'انتهت':'مجدولة', date:`2026-09-${String(10+(idx%20)).padStart(2,'0')}`, round:'group' });
        idx++;
      }
    }
  }
  if (isCup) {
    const n = teams.length;
    const rounds: Array<{round:string;count:number;offset:number}> = [];
    if      (n >= 16) rounds.push({round:'r16',count:8,offset:0},{round:'qf',count:4,offset:0},{round:'sf',count:2,offset:0},{round:'final',count:1,offset:0});
    else if (n >= 8)  rounds.push({round:'qf',count:4,offset:0},{round:'sf',count:2,offset:0},{round:'final',count:1,offset:0});
    else if (n >= 4)  rounds.push({round:'sf',count:2,offset:0},{round:'final',count:1,offset:0});
    else              rounds.push({round:'final',count:1,offset:0});

    let matchIdx = 0;
    rounds.forEach(({round,count}) => {
      for (let i = 0; i < count; i++) {
        const isFirstRound = round === rounds[0].round;
        const done = isFirstRound && i < Math.floor(count/2);
        const [hs,as_] = MOCK_SC[(matchIdx+5) % MOCK_SC.length];
        const hIdx = i*2; const aIdx = i*2+1;
        matches.push({ id:`mm-${round}-${ot.id}-${i}`, leagueId:ot.id,
          homeTeamId: isFirstRound?(teams[hIdx]?.id||''):'',
          awayTeamId: isFirstRound?(teams[aIdx]?.id||''):'',
          homeTeam: isFirstRound?(teams[hIdx]?.name||'TBD'):'TBD',
          awayTeam: isFirstRound?(teams[aIdx]?.name||'TBD'):'TBD',
          homeScore:done?hs:null, awayScore:done?as_:null,
          status:done?'انتهت':'مجدولة', date:`2026-10-${String(5+matchIdx).padStart(2,'0')}`, round });
        matchIdx++;
      }
    });
  }
  return { league, teams, matches };
}

/* ─── constants ───────────────────────────────────────────────────────────── */
const ROUND_ORDER  = ['group','r16','qf','sf','final'];
const ROUND_LABELS: Record<string,string> = {
  group:'دور المجموعات', r16:'دور الـ 16', qf:'ربع النهائي', sf:'نصف النهائي', final:'النهائي'
};
const ROUND_ICON: Record<string,string> = {
  group:'fa-layer-group', r16:'fa-list-ol', qf:'fa-compass', sf:'fa-star-half-alt', final:'fa-trophy'
};

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function winner(m: Match): 'home'|'away'|'draw'|null {
  if (m.homeScore===null||m.awayScore===null) return null;
  return m.homeScore>m.awayScore?'home':m.homeScore<m.awayScore?'away':'draw';
}

function calcStandings(teams: Team[], matches: Match[]) {
  const rows: Record<string,{name:string;logo:string;played:number;won:number;drawn:number;lost:number;gf:number;ga:number;pts:number}> = {};
  teams.forEach(t=>{rows[t.id]={name:t.name,logo:t.logo,played:0,won:0,drawn:0,lost:0,gf:0,ga:0,pts:0};});
  matches.filter(m=>m.status==='انتهت'&&m.homeScore!==null&&m.awayScore!==null).forEach(m=>{
    const h=rows[m.homeTeamId??''];const a=rows[m.awayTeamId??''];
    if(!h||!a)return;
    const hs=m.homeScore as number;const as_=m.awayScore as number;
    h.played++;a.played++;h.gf+=hs;h.ga+=as_;a.gf+=as_;a.ga+=hs;
    if(hs>as_){h.won++;h.pts+=3;a.lost++;}
    else if(hs<as_){a.won++;a.pts+=3;h.lost++;}
    else{h.drawn++;h.pts++;a.drawn++;a.pts++;}
  });
  return Object.entries(rows).map(([id,r])=>({id,...r,gd:r.gf-r.ga})).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
}

/* ─── Winner propagation ──────────────────────────────────────────────────── */
const ROUND_NEXT: Record<string,string> = {
  group:'الأدوار الإقصائية', r16:'ربع النهائي', qf:'نصف النهائي', sf:'النهائي', final:'البطولة 🏆',
};

function propagateWinners(matches: Match[], teams: Team[]): Match[] {
  const order = (['r16','qf','sf','final'] as const).filter(r=>matches.some(m=>m.round===r));
  const res   = matches.map(m=>({...m}));
  order.forEach((round,ri)=>{
    if(ri===0) return;
    const prev = res.filter(m=>m.round===order[ri-1]);
    res.filter(m=>m.round===round).forEach((m,mi)=>{
      const fill = (feed:Match|undefined, isHome:boolean)=>{
        if(!feed) return;
        const w=winner(feed);
        if(!w||w==='draw') return;
        const winId   = w==='home'?(feed.homeTeamId||''):(feed.awayTeamId||'');
        const winName = w==='home'?feed.homeTeam:feed.awayTeam;
        const t       = winId?teams.find(t=>t.id===winId):null;
        const name    = t?.name||winName||'TBD';
        if(isHome){ if(!m.homeTeamId){m.homeTeamId=winId;m.homeTeam=name;} }
        else       { if(!m.awayTeamId){m.awayTeamId=winId;m.awayTeam=name;} }
      };
      fill(prev[mi*2],   true);   // home feeder
      fill(prev[mi*2+1], false);  // away feeder
    });
  });
  return res;
}

/* ─── MatchCard (display only — editing opens ResultModal) ───────────────── */
const MatchCard: React.FC<{match:Match;teams:Team[];onEdit:(m:Match)=>void}> = ({match,teams,onEdit}) => {
  const homeTeam = teams.find(t=>t.id===match.homeTeamId);
  const awayTeam = match.awayTeamId?teams.find(t=>t.id===match.awayTeamId):null;
  const w = winner(match);
  const hasScore = match.homeScore!==null && match.awayScore!==null;
  const winnerTeam = w==='home'?(homeTeam?.name||match.homeTeam):w==='away'?(awayTeam?.name||match.awayTeam):null;
  const winnerLogo = w==='home'?(homeTeam?.logo||'⚽'):w==='away'?(awayTeam?.logo||'⚽'):null;
  const nextRound  = match.round?ROUND_NEXT[match.round]:null;

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all hover:shadow-md ${
      match.status==='مباشر'?'border-green-400 shadow-green-50':
      match.status==='انتهت'?'border-gray-100':'border-gray-200 hover:border-slate-300'
    }`}>
      {/* Status bar */}
      <div className={`px-4 py-1.5 flex items-center justify-between text-xs font-bold ${
        match.status==='مباشر'?'bg-green-500 text-white':
        match.status==='انتهت'?'bg-slate-100 text-slate-400':'bg-gray-50 text-slate-400'
      }`}>
        <span className="flex items-center gap-1.5">
          {match.status==='مباشر'&&<span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block"/>}
          {match.status}
        </span>
        {match.date&&<span className="flex items-center gap-1"><i className="fas fa-calendar text-[9px]"/>{match.date}</span>}
      </div>

      <div className="px-4 py-4 flex items-center gap-3">
        {/* Home */}
        <div className={`flex-1 flex items-center gap-2 justify-end ${w==='away'?'opacity-40':''}`}>
          <div className="text-end flex-1 min-w-0">
            <p className={`font-black text-sm truncate ${w==='home'?'text-slate-900':'text-slate-600'}`}>{homeTeam?.name||match.homeTeam}</p>
            {w==='home'&&<span className="text-[10px] text-emerald-500 font-bold flex items-center justify-end gap-0.5 mt-0.5"><i className="fas fa-check-circle text-[9px]"/>فائز</span>}
          </div>
          <span className="text-2xl shrink-0">{homeTeam?.logo||'⚽'}</span>
        </div>

        {/* Score */}
        <div className={`font-black text-xl min-w-[80px] text-center px-3 py-2 rounded-xl shrink-0 ${
          match.status==='انتهت'?'bg-slate-900 text-white':
          match.status==='مباشر'?'bg-green-500 text-white':'bg-gray-100 text-slate-300'
        }`}>
          {hasScore?`${match.homeScore} - ${match.awayScore}`:'vs'}
        </div>

        {/* Away */}
        <div className={`flex-1 flex items-center gap-2 ${w==='home'?'opacity-40':''}`}>
          <span className="text-2xl shrink-0">{awayTeam?.logo||'⚽'}</span>
          <div className="flex-1 min-w-0">
            <p className={`font-black text-sm truncate ${w==='away'?'text-slate-900':'text-slate-600'}`}>{awayTeam?awayTeam.name:(match.awayTeam||'TBD')}</p>
            {w==='away'&&<span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-0.5"><i className="fas fa-check-circle text-[9px]"/>فائز</span>}
          </div>
        </div>
      </div>

      {/* Winner advancement banner */}
      {w && w!=='draw' && winnerTeam && nextRound && match.round!=='final' && (
        <div className="mx-4 mb-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-base shrink-0">{winnerLogo}</span>
          <span className="font-black text-emerald-700 text-xs truncate flex-1">{winnerTeam}</span>
          <i className="fas fa-arrow-left text-emerald-300 text-xs shrink-0"/>
          <span className="text-emerald-600 font-bold text-xs shrink-0">يتأهل إلى {nextRound}</span>
        </div>
      )}
      {match.round==='final' && w && w!=='draw' && winnerTeam && (
        <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-base shrink-0">{winnerLogo}</span>
          <span className="font-black text-amber-700 text-xs truncate flex-1">{winnerTeam}</span>
          <span className="text-amber-600 font-bold text-xs shrink-0">🏆 بطل البطولة</span>
        </div>
      )}

      <div className="px-4 pb-3 border-t border-gray-50 pt-2 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-bold">{ROUND_LABELS[match.round||'']||match.round||''}</span>
        <button onClick={()=>onEdit(match)}
          className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl transition-all ${
            match.status==='انتهت'
              ?'text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200'
              :'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
          }`}>
          <i className={`fas ${match.status==='انتهت'?'fa-pen':'fa-plus-circle'} text-[10px]`}/>
          {match.status==='انتهت'?'تعديل':'إدخال النتيجة'}
        </button>
      </div>
    </div>
  );
};

/* ─── ResultModal ─────────────────────────────────────────────────────────── */
const QUICK_SCORES: [number,number][] = [[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[0,2],[3,1],[1,2],[0,3],[2,2]];

interface ResultModalProps { match:Match; teams:Team[]; onSave:(id:string,hs:number,as_:number,status:string,date:string)=>Promise<void>; onClose:()=>void; }

const ResultModal: React.FC<ResultModalProps> = ({match,teams,onSave,onClose}) => {
  const [hs,     setHs]     = useState(match.homeScore??0);
  const [as_,    setAs]     = useState(match.awayScore??0);
  const [status, setStatus] = useState<Match['status']>(match.status==='مجدولة'?'انتهت':match.status);
  const [date,   setDate]   = useState(match.date||'');
  const [saving, setSaving] = useState(false);

  const homeTeam = teams.find(t=>t.id===match.homeTeamId);
  const awayTeam = match.awayTeamId?teams.find(t=>t.id===match.awayTeamId):null;

  const adj = (set:React.Dispatch<React.SetStateAction<number>>, d:number) =>
    set(p=>Math.max(0,Math.min(20,p+d)));

  const resultLabel = hs>as_?`فوز ${homeTeam?.name||'الفريق الأول'}`:hs<as_?`فوز ${awayTeam?.name||'الفريق الثاني'}`:'تعادل';

  const handleSave = async () => {
    setSaving(true);
    await onSave(match.id,hs,as_,status,date);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>

      <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{ROUND_LABELS[match.round||'']||'مباراة'}</p>
            <p className="text-white font-black text-base mt-0.5">إدخال نتيجة المباراة</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all">
            <i className="fas fa-times text-white"/>
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Teams + score controls */}
          <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3">

              {/* Home team */}
              <div className="flex-1 flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-gray-100 flex items-center justify-center text-3xl shadow-sm">
                  {homeTeam?.logo||'⚽'}
                </div>
                <p className="font-black text-slate-900 text-sm leading-tight text-center line-clamp-2 w-full">{homeTeam?.name||match.homeTeam}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <button onClick={()=>adj(setHs,-1)}
                    className="w-9 h-9 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl font-black text-slate-600 text-lg flex items-center justify-center transition-all select-none">−</button>
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-inner">
                    <span className="text-white text-2xl font-black">{hs}</span>
                  </div>
                  <button onClick={()=>adj(setHs,+1)}
                    className="w-9 h-9 bg-emerald-500 hover:bg-emerald-600 active:scale-95 rounded-xl font-black text-white text-lg flex items-center justify-center transition-all select-none">+</button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex flex-col items-center gap-1 shrink-0 pb-6">
                <div className="text-slate-300 font-black text-2xl">–</div>
              </div>

              {/* Away team */}
              <div className="flex-1 flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-gray-100 flex items-center justify-center text-3xl shadow-sm">
                  {awayTeam?.logo||'⚽'}
                </div>
                <p className="font-black text-slate-900 text-sm leading-tight text-center line-clamp-2 w-full">{awayTeam?awayTeam.name:(match.awayTeam||'TBD')}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <button onClick={()=>adj(setAs,-1)}
                    className="w-9 h-9 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl font-black text-slate-600 text-lg flex items-center justify-center transition-all select-none">−</button>
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-inner">
                    <span className="text-white text-2xl font-black">{as_}</span>
                  </div>
                  <button onClick={()=>adj(setAs,+1)}
                    className="w-9 h-9 bg-emerald-500 hover:bg-emerald-600 active:scale-95 rounded-xl font-black text-white text-lg flex items-center justify-center transition-all select-none">+</button>
                </div>
              </div>
            </div>

            {/* Result preview pill */}
            <div className="mt-4 flex items-center justify-center">
              <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl ${
                hs===as_?'bg-slate-100':'bg-emerald-50 border border-emerald-200'
              }`}>
                <span className={`text-2xl font-black ${hs===as_?'text-slate-400':'text-emerald-700'}`}>{hs} - {as_}</span>
                <span className={`text-xs font-black ${hs===as_?'text-slate-400':'text-emerald-600'}`}>{resultLabel}</span>
              </div>
            </div>
          </div>

          {/* Quick score presets */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">نتائج سريعة</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SCORES.map(([h,a])=>(
                <button key={`${h}-${a}`} onClick={()=>{setHs(h);setAs(a);}}
                  className={`min-w-[52px] px-3 py-2 rounded-xl text-sm font-black border-2 transition-all ${
                    hs===h&&as_===a
                      ?'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-100 scale-105'
                      :'bg-white border-gray-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-600'
                  }`}
                >{h} - {a}</button>
              ))}
            </div>
          </div>

          {/* Status + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">حالة المباراة</p>
              <div className="space-y-2">
                {([
                  {v:'مجدولة', icon:'fa-clock',        cls:'border-blue-200 bg-blue-50 text-blue-700',    sel:'bg-blue-500 text-white border-blue-500'},
                  {v:'مباشر',  icon:'fa-circle',        cls:'border-green-200 bg-green-50 text-green-700',  sel:'bg-green-500 text-white border-green-500'},
                  {v:'انتهت',  icon:'fa-check-circle',  cls:'border-gray-200 bg-gray-50 text-gray-600',     sel:'bg-slate-900 text-white border-slate-900'},
                ] as const).map(({v,icon,cls,sel})=>(
                  <button key={v} onClick={()=>setStatus(v)}
                    className={`w-full py-2 rounded-xl text-xs font-black flex items-center gap-2 px-3 border-2 transition-all ${status===v?sel:cls}`}>
                    <i className={`fas ${icon} text-[10px] ${v==='مباشر'&&status===v?'animate-pulse':''}`}/>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">تاريخ المباراة</p>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold outline-none focus:border-emerald-400 bg-gray-50 transition-colors"/>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98]">
              {saving
                ?<><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>جاري الحفظ...</>
                :<><i className="fas fa-check-circle text-base"/>تأكيد النتيجة</>
              }
            </button>
            <button onClick={onClose}
              className="px-5 py-4 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold rounded-2xl text-sm transition-all active:scale-[0.98]">
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Bracket ─────────────────────────────────────────────────────────────── */
/*
  Split bracket layout (16 teams):

  [R16 0] ─┐                              ┌─ [R16 4]
  [R16 1] ─┘─[QF0]─┐          ┌─[QF2]─┘─ [R16 5]
  [R16 2] ─┐       ├─[SF0]─┐  ┌─[SF1]─┤  ┌─ [R16 6]
  [R16 3] ─┘─[QF1]─┘       └──┘       └──┘─[QF3]─┘─ [R16 7]
                                [FINAL]
*/
const S  = 88;   // slot height for outermost round
const CH = 76;   // card height
const CW = 158;  // card width
const CG = 40;   // column gap (connector space)
const LT = 38;   // label row at top

// y-center of match mi at round-depth ri (0 = outermost/R16)
const yMid = (ri: number, mi: number) =>
  LT + S * (mi * Math.pow(2, ri) + Math.pow(2, ri) / 2);
// card top:  yMid - CH/2
// Derivation: each R16 match occupies S px; QF occupies 2S; SF 4S; Final 8S.
// Center of slot = top_of_slot + slot_height/2 = mi*slot + slot/2

type Seg = { x1:number;y1:number;x2:number;y2:number };

// Render one match card at absolute position (x,y)
interface MCProps { m:Match;teams:Team[];x:number;y:number;isFinal?:boolean;onEdit:(m:Match)=>void }
const MatchCard_B: React.FC<MCProps> = ({m,teams,x,y,isFinal,onEdit}) => {
  const w      = winner(m);
  const scored = m.homeScore!==null && m.awayScore!==null;
  const get    = (side:'home'|'away', field:'name'|'logo') => {
    const id   = side==='home'?m.homeTeamId:m.awayTeamId;
    const fallback = side==='home'?(field==='name'?m.homeTeam:'⚽'):(field==='name'?m.awayTeam:'⚽');
    if(!id) return fallback||'TBD';
    const t = teams.find(t=>t.id===id);
    return field==='name'?(t?.name||fallback||'TBD'):(t?.logo||'⚽');
  };
  return (
    <div style={{position:'absolute',left:x,top:y-CH/2,width:CW,height:CH}}
      className={`rounded-xl border-2 bg-white shadow-sm overflow-hidden flex flex-col ${
        m.status==='مباشر' ? 'border-green-400 shadow-green-50' :
        m.status==='انتهت' ? 'border-slate-300' :
        isFinal            ? 'border-amber-300' : 'border-slate-200'
      }`}>
      {/* status strip */}
      <div className={`px-2 py-[2px] flex items-center justify-between shrink-0 text-[9px] font-black ${
        m.status==='مباشر'?'bg-green-500 text-white':
        m.status==='انتهت'?'bg-slate-800 text-slate-300':
        isFinal?'bg-amber-50 text-amber-600':'bg-slate-50 text-slate-400'
      }`} dir="rtl">
        <span className="flex items-center gap-1">
          {m.status==='مباشر'&&<span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"/>}
          {isFinal?'🏆 النهائي':m.status}
        </span>
        {m.date&&<span dir="ltr" className="opacity-50 text-[8px]">{m.date}</span>}
      </div>
      {/* teams */}
      {(['home','away'] as const).map((side,si)=>{
        const isWin = w===side;
        const score = side==='home'?m.homeScore:m.awayScore;
        const name  = get(side,'name');
        const logo  = get(side,'logo');
        const tbd   = name==='TBD';
        return(
          <div key={side} dir="rtl"
            className={`flex-1 flex items-center gap-1.5 px-2 min-w-0 ${
              si===0?'border-b border-slate-100':''} ${isWin?'bg-emerald-50':''}`}>
            <span className={`text-sm shrink-0 ${tbd?'opacity-20':''}`}>{logo}</span>
            <span className={`flex-1 text-[11px] font-bold truncate ${
              isWin?'text-emerald-700':tbd?'text-slate-300':'text-slate-700'}`}>{name}</span>
            <div className="flex items-center gap-0.5 shrink-0">
              <span className={`text-xs font-black w-5 text-center ${
                isWin?'text-emerald-600':scored?'text-slate-500':'text-slate-200'}`}>
                {score!==null?score:'–'}
              </span>
              {isWin&&<i className="fas fa-check-circle text-emerald-400 text-[8px]"/>}
            </div>
          </div>
        );
      })}
      {/* edit */}
      <button onClick={()=>onEdit(m)} dir="rtl"
        className={`shrink-0 w-full py-[2px] text-[9px] font-bold text-center border-t border-slate-100 transition-colors ${
          m.status==='انتهت'
            ?'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            :'text-emerald-500 hover:bg-emerald-50'}`}>
        <i className={`fas ${m.status==='انتهت'?'fa-pen':'fa-plus-circle'} text-[8px] me-1`}/>
        {m.status==='انتهت'?'تعديل':'إدخال نتيجة'}
      </button>
    </div>
  );
};

const BracketView: React.FC<{matches:Match[];teams:Team[];onEdit:(m:Match)=>void}> = ({matches,teams,onEdit}) => {
  if(!matches.length) return(
    <div className="text-center py-14">
      <i className="fas fa-sitemap text-5xl text-gray-200 mb-3 block"/>
      <p className="font-bold text-slate-400">لا توجد أدوار إقصائية بعد</p>
    </div>
  );

  const has = (r:string) => matches.some(m=>m.round===r);
  const get  = (r:string) => matches.filter(m=>m.round===r);
  const isSplit = has('r16'); // 16-team split bracket

  // ── Left-to-right single bracket (< 16 teams) ──────────────────────────
  if(!isSplit){
    const rounds = (['qf','sf','final'] as const).filter(has);
    if(!rounds.length) return null;
    const first   = rounds[0];
    const firstN  = get(first).length || 1;
    const totalH  = firstN * S + LT;
    const totalW  = rounds.length * (CW + CG) - CG;
    const segs:Seg[]=[];
    rounds.forEach((_,ri)=>{
      if(ri===rounds.length-1) return;
      const rms = get(rounds[ri]);
      const pairs = Math.ceil(rms.length/2);
      const mx = ri*(CW+CG)+CW+CG/2;
      for(let j=0;j<pairs;j++){
        const yt=yMid(ri,2*j), yb=yMid(ri,2*j+1), yn=yMid(ri+1,j);
        const x0=ri*(CW+CG)+CW, x1=(ri+1)*(CW+CG);
        segs.push({x1:x0,y1:yt,x2:mx,y2:yt},{x1:x0,y1:yb,x2:mx,y2:yb},
                  {x1:mx,y1:yt,x2:mx,y2:yb},{x1:mx,y1:yn,x2:x1,y2:yn});
      }
    });
    return(
      <div className="overflow-x-auto pb-4" dir="ltr">
        <div style={{position:'relative',width:totalW,height:totalH,minWidth:totalW}}>
          <svg style={{position:'absolute',inset:0,width:totalW,height:totalH,pointerEvents:'none',overflow:'visible'}}>
            {segs.map((s,i)=><line key={i} {...s} stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round"/>)}
          </svg>
          {rounds.map((r,ri)=>get(r).map((m,mi)=>(
            <MatchCard_B key={m.id} m={m} teams={teams} onEdit={onEdit}
              x={ri*(CW+CG)} y={yMid(ri,mi)} isFinal={r==='final'}/>
          )))}
        </div>
      </div>
    );
  }

  // ── Split bracket (16 teams) ─────────────────────────────────────────────
  // Columns (left → right): R16L | QFL | SFL | FINAL | SFR | QFR | R16R
  const NCOLS = 7;
  const totalW = NCOLS * CW + (NCOLS-1) * CG;
  const totalH = 4 * S + LT; // 4 R16 matches per side

  const col = (i:number) => i * (CW + CG); // left edge of column i
  const xL  = [col(0),col(1),col(2)]; // L: R16, QF, SF
  const xFIN= col(3);
  const xR  = [col(6),col(5),col(4)]; // R: R16, QF, SF (indices 0=outermost)

  const r16L = get('r16').slice(0,4);
  const r16R = get('r16').slice(4,8);
  const qfL  = get('qf').slice(0,2);
  const qfR  = get('qf').slice(2,4);
  const sfL  = get('sf').slice(0,1);
  const sfR  = get('sf').slice(1,2);
  const fin  = get('final').slice(0,1);

  const segs: Seg[] = [];

  // Helper: add left-side connectors (connect right edge → next left edge)
  const addL = (ri:number, pairs:number, xFrom:number, xTo:number) => {
    const mx = xFrom + CW + CG/2;
    for(let j=0;j<pairs;j++){
      const yt=yMid(ri,2*j), yb=yMid(ri,2*j+1), yn=yMid(ri+1,j);
      segs.push({x1:xFrom+CW,y1:yt,x2:mx,y2:yt},{x1:xFrom+CW,y1:yb,x2:mx,y2:yb},
                {x1:mx,y1:yt,x2:mx,y2:yb},{x1:mx,y1:yn,x2:xTo,y2:yn});
    }
  };
  // Helper: add right-side connectors (connect left edge → next right edge, leftward)
  const addR = (ri:number, pairs:number, xFrom:number, xToLeft:number) => {
    const mx = xFrom - CG/2;
    for(let j=0;j<pairs;j++){
      const yt=yMid(ri,2*j), yb=yMid(ri,2*j+1), yn=yMid(ri+1,j);
      segs.push({x1:xFrom,y1:yt,x2:mx,y2:yt},{x1:xFrom,y1:yb,x2:mx,y2:yb},
                {x1:mx,y1:yt,x2:mx,y2:yb},{x1:mx,y1:yn,x2:xToLeft+CW,y2:yn});
    }
  };

  // Left: R16→QF→SF→Final
  if(r16L.length) addL(0, 2, xL[0], xL[1]);
  if(qfL.length)  addL(1, 1, xL[1], xL[2]);
  const ySF = yMid(2, 0);
  if(sfL.length)  segs.push({x1:xL[2]+CW, y1:ySF, x2:xFIN, y2:ySF});

  // Right: R16→QF→SF→Final (mirrored)
  if(r16R.length) addR(0, 2, xR[0], xR[1]);
  if(qfR.length)  addR(1, 1, xR[1], xR[2]);
  if(sfR.length)  segs.push({x1:xR[2], y1:ySF, x2:xFIN+CW, y2:ySF});

  // Round labels
  const LABELS: {x:number;label:string;cls:string}[] = [
    {x:xL[0], label:'دور الـ16',    cls:'bg-slate-100 text-slate-600'},
    {x:xL[1], label:'ربع النهائي',  cls:'bg-blue-100 text-blue-700'},
    {x:xL[2], label:'نصف النهائي',  cls:'bg-purple-100 text-purple-700'},
    {x:xFIN,  label:'النهائي 🏆',   cls:'bg-amber-100 text-amber-700'},
    {x:xR[2], label:'نصف النهائي',  cls:'bg-purple-100 text-purple-700'},
    {x:xR[1], label:'ربع النهائي',  cls:'bg-blue-100 text-blue-700'},
    {x:xR[0], label:'دور الـ16',    cls:'bg-slate-100 text-slate-600'},
  ];

  return(
    <div className="overflow-x-auto pb-6" dir="ltr">
      <div style={{position:'relative',width:totalW,height:totalH+4,minWidth:totalW}}>

        {/* SVG connectors */}
        <svg style={{position:'absolute',inset:0,width:totalW,height:totalH,pointerEvents:'none',overflow:'visible'}}>
          {segs.map((s,i)=><line key={i} {...s} stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>)}
        </svg>

        {/* Round labels */}
        {LABELS.map(({x,label,cls},i)=>(
          <div key={i} style={{position:'absolute',top:0,left:x,width:CW}}
            className="flex justify-center">
            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>{label}</span>
          </div>
        ))}

        {/* LEFT SIDE cards */}
        {r16L.map((m,mi)=><MatchCard_B key={m.id} m={m} teams={teams} onEdit={onEdit} x={xL[0]} y={yMid(0,mi)}/>)}
        {qfL.map((m,mi) =><MatchCard_B key={m.id} m={m} teams={teams} onEdit={onEdit} x={xL[1]} y={yMid(1,mi)}/>)}
        {sfL.map((m,mi) =><MatchCard_B key={m.id} m={m} teams={teams} onEdit={onEdit} x={xL[2]} y={yMid(2,mi)}/>)}

        {/* FINAL */}
        {fin.map(m=><MatchCard_B key={m.id} m={m} teams={teams} onEdit={onEdit} x={xFIN} y={ySF} isFinal/>)}

        {/* RIGHT SIDE cards */}
        {r16R.map((m,mi)=><MatchCard_B key={m.id} m={m} teams={teams} onEdit={onEdit} x={xR[0]} y={yMid(0,mi)}/>)}
        {qfR.map((m,mi) =><MatchCard_B key={m.id} m={m} teams={teams} onEdit={onEdit} x={xR[1]} y={yMid(1,mi)}/>)}
        {sfR.map((m,mi) =><MatchCard_B key={m.id} m={m} teams={teams} onEdit={onEdit} x={xR[2]} y={yMid(2,mi)}/>)}

      </div>
    </div>
  );
};

/* ─── Main ────────────────────────────────────────────────────────────────── */
type ManageTab = 'overview'|'matches'|'bracket'|'standings'|'stats'|'settings';

const TournamentManagePage: React.FC = () => {
  const {id}     = useParams<{id:string}>();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [league,  setLeague]  = useState<League|null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams,   setTeams]   = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,          setTab]         = useState<ManageTab>('overview');
  const [toast,        setToast]       = useState<{msg:string;ok:boolean}|null>(null);
  const [editingMatch, setEditingMatch]= useState<Match|null>(null);

  const showToast = (msg:string,ok:boolean) => { setToast({msg,ok}); setTimeout(()=>setToast(null),2500); };

  useEffect(()=>{
    if(!id) return;
    Promise.all([backend.getTournament(id),backend.getMatches(id),backend.getUserTeams('all')])
      .then(([l,ms,ts])=>{
        if(l) {
          // Real backend data
          setLeague(l); setMatches(ms);
          const reg=l.registeredTeams||[];
          setTeams((ts as Team[]).filter((t:Team)=>reg.includes(t.id)));
        } else {
          // Fall back to mock data built from owner-tournament state
          const ot = (location.state as any)?.ownerTournament as OwnerTourneyState | undefined;
          if(ot) {
            const {league:ml,teams:mt,matches:mm} = buildMock(ot);
            setLeague(ml); setTeams(mt); setMatches(mm);
          }
        }
        setLoading(false);
      });
  },[id]);

  const handleSave = useCallback(async (matchId:string,hs:number,as_:number,status:string,date:string)=>{
    try {
      // Skip backend call for mock match IDs (start with 'mm-')
      if(!matchId.startsWith('mm-')) {
        await backend.updateMatchResult(matchId,hs,as_);
      }
      setMatches(p=>p.map(m=>m.id===matchId?{...m,homeScore:hs,awayScore:as_,status:status as any,date:date||m.date}:m));
      showToast('✅ تم حفظ النتيجة',true);
    } catch { showToast('❌ فشل الحفظ',false); }
  },[]);

  if(loading) return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-slate-500 font-bold text-lg">جاري التحميل...</p>
      </div>
    </div>
  );

  if(!league) return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="text-center">
        <i className="fas fa-exclamation-triangle text-5xl text-gray-300 mb-4 block"/>
        <p className="text-slate-500 font-bold mb-4">البطولة غير موجودة</p>
        <button onClick={()=>navigate(-1)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm">رجوع</button>
      </div>
    </div>
  );

  /* ── computed ── */
  const isCup      = league.type==='كاس'||league.type==='دوري وكاس';
  const isLeague   = league.type==='دوري'||league.type==='دوري وكاس';
  const rounds     = ROUND_ORDER.filter(r=>matches.some(m=>m.round===r));
  const done       = matches.filter(m=>m.status==='انتهت').length;
  const live       = matches.filter(m=>m.status==='مباشر').length;
  const pending    = matches.filter(m=>m.status==='مجدولة').length;
  const standings  = isLeague?calcStandings(teams,matches.filter(m=>m.round==='group')):[];
  const pct        = matches.length?Math.round((done/matches.length)*100):0;

  /* champion */
  const finalMatch = matches.find(m=>m.round==='final'&&m.status==='انتهت');
  const champSide  = finalMatch?winner(finalMatch):null;
  const champId    = champSide&&champSide!=='draw'?(champSide==='home'?finalMatch!.homeTeamId:finalMatch!.awayTeamId):null;
  const champ      = champId?teams.find(t=>t.id===champId):null;

  /* goals per team */
  const goalsFor: Record<string,number> = {};
  const goalsAgainst: Record<string,number> = {};
  teams.forEach(t=>{goalsFor[t.id]=0;goalsAgainst[t.id]=0;});
  matches.filter(m=>m.status==='انتهت'&&m.homeScore!==null&&m.awayScore!==null).forEach(m=>{
    if(m.homeTeamId){goalsFor[m.homeTeamId]=(goalsFor[m.homeTeamId]||0)+(m.homeScore as number);}
    if(m.awayTeamId){goalsFor[m.awayTeamId]=(goalsFor[m.awayTeamId]||0)+(m.awayScore as number);}
    if(m.homeTeamId){goalsAgainst[m.homeTeamId]=(goalsAgainst[m.homeTeamId]||0)+(m.awayScore as number);}
    if(m.awayTeamId){goalsAgainst[m.awayTeamId]=(goalsAgainst[m.awayTeamId]||0)+(m.homeScore as number);}
  });
  const teamGoals = teams.map(t=>({...t,gf:goalsFor[t.id]||0,ga:goalsAgainst[t.id]||0})).sort((a,b)=>b.gf-a.gf);
  const totalGoals = teamGoals.reduce((s,t)=>s+t.gf,0);
  const avgGoals = matches.filter(m=>m.status==='انتهت').length
    ? (totalGoals/matches.filter(m=>m.status==='انتهت').length).toFixed(1) : '0';
  const highestMatch = matches.filter(m=>m.status==='انتهت'&&m.homeScore!==null&&m.awayScore!==null)
    .sort((a,b)=>((b.homeScore||0)+(b.awayScore||0))-((a.homeScore||0)+(a.awayScore||0)))[0];

  /* propagate winners into subsequent rounds (for bracket + next-match display) */
  const resolvedMatches = propagateWinners(matches, teams);

  /* upcoming & recent */
  const upcoming = matches.filter(m=>m.status==='مجدولة').slice(0,3);
  const recent   = matches.filter(m=>m.status==='انتهت').slice(-3).reverse();

  /* cup: eliminated teams & current round */
  const eliminatedIds = new Set<string>();
  matches.filter(m=>m.round!=='group'&&m.status==='انتهت').forEach(m=>{
    const w=winner(m);
    if(w==='home'&&m.awayTeamId) eliminatedIds.add(m.awayTeamId);
    if(w==='away'&&m.homeTeamId) eliminatedIds.add(m.homeTeamId);
  });
  const teamsRemaining = teams.filter(t=>!eliminatedIds.has(t.id));
  const currentCupRound =
    ROUND_ORDER.filter(r=>r!=='group').find(r=>matches.some(m=>m.round===r&&m.status!=='انتهت'))
    || [...ROUND_ORDER.filter(r=>r!=='group'&&matches.some(m=>m.round===r))].pop()
    || '';

  /* league / combined */
  const leader       = standings[0]||null;
  const groupMatches = matches.filter(m=>m.round==='group');
  const groupDone    = groupMatches.filter(m=>m.status==='انتهت').length;
  const groupPct     = groupMatches.length?Math.round((groupDone/groupMatches.length)*100):0;
  const knockoutMs   = matches.filter(m=>m.round!=='group');
  const inKnockout   = league.type==='دوري وكاس'&&groupMatches.length>0&&groupDone===groupMatches.length;
  const currentPhase = inKnockout?'الأدوار الإقصائية':'دور المجموعات';

  const typeColor = league.type==='دوري'?'bg-blue-100 text-blue-700 border-blue-200':
                    league.type==='كاس' ?'bg-amber-100 text-amber-700 border-amber-200':
                                         'bg-purple-100 text-purple-700 border-purple-200';

  const TABS = ([
    {id:'overview'  as ManageTab, icon:'fa-th-large',   label:'النظرة العامة', show:true     },
    {id:'matches'   as ManageTab, icon:'fa-futbol',     label:'المباريات',      show:true     },
    {id:'bracket'   as ManageTab, icon:'fa-sitemap',    label:'الشجرة',         show:isCup    },
    {id:'standings' as ManageTab, icon:'fa-table-list', label:'الجدول',         show:isLeague },
    {id:'stats'     as ManageTab, icon:'fa-chart-bar',  label:'الإحصاءات',      show:true     },
    {id:'settings'  as ManageTab, icon:'fa-cog',        label:'الإعدادات',      show:true     },
  ] as {id:ManageTab;icon:string;label:string;show:boolean}[]).filter(t=>t.show);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-sans">
      {editingMatch&&(
        <ResultModal
          match={editingMatch}
          teams={teams}
          onSave={handleSave}
          onClose={()=>setEditingMatch(null)}
        />
      )}
      {toast&&(
        <div className={`fixed top-6 inset-x-0 mx-auto w-fit z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white ${toast.ok?'bg-emerald-500':'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="bg-slate-900 text-white sticky top-0 z-40 shadow-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={()=>navigate(-1)}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all shrink-0">
            <i className="fas fa-arrow-right text-sm"/>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">إدارة البطولة</p>
            <h1 className="font-black text-lg truncate leading-tight">{league.name}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border ${typeColor}`}>{league.type}</span>
            <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${
              league.status==='جارية'?'bg-green-500 text-white':
              league.status==='قادمة'?'bg-emerald-100 text-emerald-700':'bg-slate-600 text-slate-200'
            }`}>
              {league.status==='جارية'&&<span className="w-1.5 h-1.5 bg-white rounded-full inline-block me-1 animate-pulse"/>}
              {league.status}
            </span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t border-white/10 grid grid-cols-5 max-w-5xl mx-auto">
          {[
            {icon:'fa-users',        label:'الفرق',     val:teams.length,   color:'text-blue-400'},
            {icon:'fa-futbol',       label:'المباريات',  val:matches.length, color:'text-white'},
            {icon:'fa-check-circle', label:'منتهية',    val:done,           color:'text-emerald-400'},
            {icon:'fa-broadcast-tower',label:'مباشرة', val:live,           color:'text-green-400'},
            {icon:'fa-clock',        label:'مجدولة',   val:pending,        color:'text-amber-400'},
          ].map((s,i)=>(
            <div key={i} className="px-3 py-3 text-center border-e border-white/10 last:border-none">
              <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
              <p className="text-[10px] text-slate-500 font-bold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-gray-100 sticky top-[130px] z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex gap-0 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                tab===t.id?'border-emerald-500 text-emerald-600 bg-emerald-50/50':'border-transparent text-slate-400 hover:text-slate-700 hover:bg-gray-50'
              }`}>
              <i className={`fas ${t.icon} text-xs`}/>{t.label}
            </button>
          ))}
          {live>0&&(
            <div className="ms-auto flex items-center ps-4 shrink-0">
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>{live} مباشر الآن
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">

        {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
        {tab==='overview'&&(
          <div className="space-y-5">

            {/* Champion banner */}
            {champ&&(
              <div className="bg-gradient-to-l from-amber-500 to-yellow-400 rounded-2xl p-6 flex items-center gap-5 shadow-xl shadow-amber-200">
                <div className="text-5xl">🏆</div>
                <div>
                  <p className="text-amber-900 text-xs font-black uppercase tracking-wider mb-1">بطل البطولة</p>
                  <p className="text-white text-2xl font-black">{champ.logo} {champ.name}</p>
                  <p className="text-amber-100 text-sm mt-1">{league.name}</p>
                </div>
              </div>
            )}

            {/* ── نظام الدوري ───────────────────────────────────────── */}
            {league.type==='دوري'&&(<>

              {/* System rules */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0">
                    <i className="fas fa-table-list text-sm"/>
                  </div>
                  <div>
                    <p className="font-black text-blue-900">نظام الدوري</p>
                    <p className="text-blue-600 text-xs font-bold">كل فريق يلعب ضد الجميع — الأعلى نقاطاً هو البطل</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {icon:'fa-check-circle',label:'فوز',  val:'+3 نقاط', bg:'bg-emerald-100 border-emerald-300 text-emerald-700'},
                    {icon:'fa-equals',      label:'تعادل',val:'+1 نقطة', bg:'bg-amber-100   border-amber-300   text-amber-700'},
                    {icon:'fa-times-circle',label:'خسارة',val:'0 نقاط',  bg:'bg-red-100     border-red-300     text-red-600'},
                  ].map(r=>(
                    <div key={r.label} className={`border rounded-xl p-3 text-center ${r.bg}`}>
                      <i className={`fas ${r.icon} text-lg mb-1 block`}/>
                      <p className="font-black text-sm">{r.val}</p>
                      <p className="text-[11px] font-bold opacity-70">{r.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leader spotlight */}
              {leader&&(
                <div className="bg-gradient-to-l from-blue-600 to-blue-500 rounded-2xl p-5 text-white flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shrink-0">{leader.logo}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-blue-200 text-xs font-bold mb-0.5">صدارة الدوري 🥇</p>
                    <p className="font-black text-xl truncate">{leader.name}</p>
                    <p className="text-blue-200 text-xs mt-1">{leader.played} مباراة · {leader.won} فوز · {leader.drawn} تعادل · {leader.lost} خسارة</p>
                  </div>
                  <div className="text-center shrink-0">
                    <p className="text-4xl font-black leading-none">{leader.pts}</p>
                    <p className="text-blue-200 text-xs font-bold mt-0.5">نقطة</p>
                  </div>
                </div>
              )}

              {/* Mini standings top 5 */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                    <i className="fas fa-list-ol text-blue-500"/>ترتيب الدوري
                  </h3>
                  <button onClick={()=>setTab('standings')} className="text-xs text-blue-500 font-black hover:text-blue-600">عرض الكل ←</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {standings.length===0
                    ?<p className="text-center text-slate-400 text-sm py-8 font-bold">لا توجد نتائج بعد</p>
                    :standings.slice(0,5).map((row,i)=>(
                      <div key={row.id} className={`flex items-center gap-3 px-4 py-3 ${i===0?'bg-blue-50/60':''}`}>
                        <span className={`w-5 text-center text-xs font-black shrink-0 ${i===0?'text-blue-600':i<3?'text-slate-600':'text-slate-400'}`}>
                          {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                        </span>
                        <span className="text-lg shrink-0">{row.logo}</span>
                        <span className="flex-1 font-bold text-slate-800 text-sm truncate">{row.name}</span>
                        <span className="text-[11px] text-slate-400 font-bold shrink-0">{row.played}ل {row.gf}+{row.ga}-</span>
                        <span className={`font-black text-base w-8 text-center shrink-0 ${i===0?'text-blue-600':'text-slate-700'}`}>{row.pts}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Progress */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2"><i className="fas fa-chart-line text-blue-500"/>تقدّم الدوري</h3>
                  <span className="font-black text-blue-600 text-lg">{pct}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700" style={{width:`${pct}%`}}/>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  {[{l:'منتهية',v:done,c:'text-emerald-600',b:'bg-emerald-50'},{l:'مباشرة',v:live,c:'text-green-600',b:'bg-green-50'},{l:'مجدولة',v:pending,c:'text-amber-600',b:'bg-amber-50'}].map(s=>(
                    <div key={s.l} className={`${s.b} rounded-xl py-2.5`}>
                      <p className={`text-xl font-black ${s.c}`}>{s.v}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>)}

            {/* ── نظام الكأس ────────────────────────────────────────── */}
            {league.type==='كاس'&&(<>

              {/* System rules */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0">
                    <i className="fas fa-trophy text-sm"/>
                  </div>
                  <div>
                    <p className="font-black text-amber-900">نظام الكأس — خروج المغلوب</p>
                    <p className="text-amber-700 text-xs font-bold">خسارة واحدة = إقصاء فوري من البطولة</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {icon:'fa-check-circle',  label:'فوز',   val:'تأهّل للدور القادم',  bg:'bg-emerald-100 border-emerald-300 text-emerald-700'},
                    {icon:'fa-times-circle',  label:'خسارة', val:'خروج من البطولة',     bg:'bg-red-100 border-red-300 text-red-600'},
                    {icon:'fa-random',        label:'تعادل', val:'ركلات الترجيح',        bg:'bg-blue-100 border-blue-300 text-blue-600'},
                  ].map(r=>(
                    <div key={r.label} className={`border rounded-xl p-3 text-center ${r.bg}`}>
                      <i className={`fas ${r.icon} text-lg mb-1 block`}/>
                      <p className="font-black text-xs">{r.val}</p>
                      <p className="text-[10px] font-bold opacity-70 mt-0.5">{r.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current round + teams remaining */}
              <div className="bg-gradient-to-l from-amber-500 to-amber-400 rounded-2xl p-5 text-white">
                <p className="text-amber-100 text-xs font-bold mb-1">المرحلة الحالية</p>
                <p className="font-black text-2xl">{ROUND_LABELS[currentCupRound]||'البطولة'}</p>
                <div className="flex gap-3 mt-4">
                  <div className="flex-1 bg-white/20 rounded-xl px-3 py-2.5 text-center">
                    <p className="font-black text-2xl">{teamsRemaining.length}</p>
                    <p className="text-amber-100 text-xs font-bold">فريق متبقٍ</p>
                  </div>
                  <div className="flex-1 bg-white/20 rounded-xl px-3 py-2.5 text-center">
                    <p className="font-black text-2xl">{eliminatedIds.size}</p>
                    <p className="text-amber-100 text-xs font-bold">فريق مُقصى</p>
                  </div>
                  <div className="flex-1 bg-white/20 rounded-xl px-3 py-2.5 text-center">
                    <p className="font-black text-2xl">{pct}%</p>
                    <p className="text-amber-100 text-xs font-bold">مكتمل</p>
                  </div>
                </div>
              </div>

              {/* Teams status */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-sm">
                  <i className="fas fa-shield-alt text-amber-500"/>حالة الفرق
                </h3>
                <div className="flex flex-wrap gap-2">
                  {teams.map(t=>{
                    const out=eliminatedIds.has(t.id);
                    return(
                      <div key={t.id} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        out?'bg-red-50 border-red-100 text-slate-300':'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}>
                        <span className={out?'opacity-40':''}>{t.logo}</span>
                        <span className={out?'line-through opacity-50':''}>{t.name}</span>
                        {!out&&<i className="fas fa-check-circle text-emerald-400 text-[9px]"/>}
                        {out&&<i className="fas fa-times text-red-300 text-[9px]"/>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rounds progress */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-sm">
                  <i className="fas fa-sitemap text-amber-500"/>مراحل البطولة
                </h3>
                <div className="space-y-2">
                  {ROUND_ORDER.filter(r=>r!=='group'&&matches.some(m=>m.round===r)).map(r=>{
                    const rms=matches.filter(m=>m.round===r);
                    const rDone=rms.filter(m=>m.status==='انتهت').length;
                    const isActive=r===currentCupRound;
                    const isDone=rDone===rms.length;
                    return(
                      <div key={r} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isActive?'bg-amber-50 border-amber-200':isDone?'bg-gray-50 border-gray-100':'bg-white border-gray-200'
                      }`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isDone?'bg-slate-900 text-white':isActive?'bg-amber-500 text-white':'bg-gray-100 text-slate-400'
                        }`}>
                          <i className={`fas ${ROUND_ICON[r]||'fa-futbol'} text-xs`}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-black text-sm ${isActive?'text-amber-700':isDone?'text-slate-500':'text-slate-700'}`}>{ROUND_LABELS[r]||r}</p>
                          <p className="text-[11px] text-slate-400 font-bold">{rDone}/{rms.length} مباريات منتهية</p>
                        </div>
                        {isDone&&!isActive&&<i className="fas fa-check-circle text-emerald-500 text-sm shrink-0"/>}
                        {isActive&&<span className="text-[10px] bg-amber-500 text-white px-2.5 py-0.5 rounded-full font-black shrink-0">جارية الآن</span>}
                        {!isDone&&!isActive&&<span className="text-[10px] bg-gray-100 text-slate-400 px-2.5 py-0.5 rounded-full font-bold shrink-0">لاحقاً</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>)}

            {/* ── نظام دوري وكاس ────────────────────────────────────── */}
            {league.type==='دوري وكاس'&&(<>

              {/* System rules */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white shrink-0">
                    <i className="fas fa-layer-group text-sm"/>
                  </div>
                  <div>
                    <p className="font-black text-purple-900">نظام مدمج — دوري + كأس</p>
                    <p className="text-purple-700 text-xs font-bold">مرحلة مجموعات ثم أدوار إقصائية</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {icon:'fa-layer-group',   label:'المرحلة 1', val:'دور المجموعات',    bg:'bg-blue-100 border-blue-200 text-blue-700'},
                    {icon:'fa-arrow-left',    label:'التأهل',    val:'الأفضلون يتأهلون', bg:'bg-purple-100 border-purple-200 text-purple-700'},
                    {icon:'fa-sitemap',       label:'المرحلة 2', val:'أدوار إقصائية',    bg:'bg-amber-100 border-amber-200 text-amber-700'},
                  ].map(r=>(
                    <div key={r.label} className={`border rounded-xl p-3 text-center ${r.bg}`}>
                      <i className={`fas ${r.icon} text-lg mb-1 block`}/>
                      <p className="font-black text-xs leading-tight">{r.val}</p>
                      <p className="text-[10px] font-bold opacity-70 mt-0.5">{r.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current phase banner */}
              <div className="bg-gradient-to-l from-purple-600 to-violet-500 rounded-2xl p-5 text-white">
                <p className="text-purple-200 text-xs font-bold mb-1">المرحلة الحالية</p>
                <p className="font-black text-2xl">{currentPhase}</p>
                <div className="flex gap-3 mt-4">
                  <div className="flex-1 bg-white/15 rounded-xl px-3 py-2.5 text-center">
                    <p className="font-black text-xl">{groupPct}%</p>
                    <p className="text-purple-200 text-xs font-bold">مجموعات</p>
                  </div>
                  <div className="flex-1 bg-white/15 rounded-xl px-3 py-2.5 text-center">
                    <p className="font-black text-xl">{teamsRemaining.length}</p>
                    <p className="text-purple-200 text-xs font-bold">متبقٍ</p>
                  </div>
                  <div className="flex-1 bg-white/15 rounded-xl px-3 py-2.5 text-center">
                    <p className="font-black text-xl">{pct}%</p>
                    <p className="text-purple-200 text-xs font-bold">مكتمل</p>
                  </div>
                </div>
              </div>

              {/* Group stage mini-standings */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between bg-blue-50/50">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <i className="fas fa-layer-group text-blue-500"/>دور المجموعات
                  </h3>
                  <span className="text-xs font-black text-blue-600">{groupDone}/{groupMatches.length} مباراة</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-2 bg-gray-100 rounded-full flex-1 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{width:`${groupPct}%`}}/>
                    </div>
                    <span className="text-xs font-black text-blue-600 ms-3">{groupPct}%</span>
                  </div>
                  <div className="mt-3 divide-y divide-gray-50">
                    {standings.slice(0,4).map((row,i)=>(
                      <div key={row.id} className="flex items-center gap-2.5 py-2.5">
                        <span className="text-xs font-black text-slate-400 w-4 shrink-0">{i+1}</span>
                        <span className="text-base shrink-0">{row.logo}</span>
                        <span className="flex-1 font-bold text-slate-800 text-sm truncate">{row.name}</span>
                        <span className="text-xs text-slate-400 font-bold">{row.pts} ن</span>
                        {i<2&&<span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-black">متأهل</span>}
                      </div>
                    ))}
                    {standings.length===0&&<p className="text-center text-slate-400 text-xs py-4">لا توجد نتائج بعد</p>}
                  </div>
                </div>
              </div>

              {/* Knockout phase */}
              {knockoutMs.length>0&&(
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-50 bg-amber-50/50">
                    <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <i className="fas fa-sitemap text-amber-500"/>الأدوار الإقصائية
                    </h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {ROUND_ORDER.filter(r=>r!=='group'&&matches.some(m=>m.round===r)).map(r=>{
                      const rms=matches.filter(m=>m.round===r);
                      const rDone=rms.filter(m=>m.status==='انتهت').length;
                      const isActive=r===currentCupRound;
                      return(
                        <div key={r} className={`flex items-center gap-3 p-3 rounded-xl ${isActive?'bg-amber-50 border border-amber-200':'bg-gray-50'}`}>
                          <i className={`fas ${ROUND_ICON[r]||'fa-futbol'} text-sm ${isActive?'text-amber-500':'text-slate-400'} shrink-0`}/>
                          <span className={`flex-1 font-bold text-sm ${isActive?'text-amber-700':'text-slate-500'}`}>{ROUND_LABELS[r]||r}</span>
                          <span className="text-xs text-slate-400 font-bold">{rDone}/{rms.length}</span>
                          {rDone===rms.length&&<i className="fas fa-check text-emerald-500 text-xs"/>}
                          {isActive&&<span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black">جارية</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>)}

            {/* ── Upcoming + Recent (مشترك لكل الأنواع) ──────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2">
                  <i className="fas fa-calendar-alt text-slate-500"/>المباريات القادمة
                </h3>
                {upcoming.length===0
                  ?<p className="text-slate-400 text-sm text-center py-6">لا توجد مباريات مجدولة</p>
                  :<div className="space-y-2.5">
                    {upcoming.map(m=>{
                      const ht=teams.find(t=>t.id===m.homeTeamId);
                      const at=teams.find(t=>t.id===m.awayTeamId);
                      return(
                        <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                          <span className="text-sm shrink-0">{ht?.logo||'⚽'}</span>
                          <span className="flex-1 font-bold text-slate-800 text-xs truncate">{ht?.name||m.homeTeam}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-black px-2 py-1 rounded-lg shrink-0">{m.date||'—'}</span>
                          <span className="flex-1 font-bold text-slate-800 text-xs truncate text-end">{at?.name||m.awayTeam}</span>
                          <span className="text-sm shrink-0">{at?.logo||'⚽'}</span>
                        </div>
                      );
                    })}
                  </div>
                }
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2">
                  <i className="fas fa-flag-checkered text-slate-500"/>آخر النتائج
                </h3>
                {recent.length===0
                  ?<p className="text-slate-400 text-sm text-center py-6">لا توجد نتائج بعد</p>
                  :<div className="space-y-2.5">
                    {recent.map(m=>{
                      const ht=teams.find(t=>t.id===m.homeTeamId);
                      const at=teams.find(t=>t.id===m.awayTeamId);
                      const w=winner(m);
                      return(
                        <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                          <span className={`flex-1 text-xs font-black truncate text-end ${w==='home'?'text-emerald-700':'text-slate-400'}`}>{ht?.logo} {ht?.name||m.homeTeam}</span>
                          <div className="bg-slate-900 text-white font-black text-xs px-3 py-1.5 rounded-lg shrink-0 min-w-[52px] text-center">
                            {m.homeScore} - {m.awayScore}
                          </div>
                          <span className={`flex-1 text-xs font-black truncate ${w==='away'?'text-emerald-700':'text-slate-400'}`}>{at?.logo} {at?.name||m.awayTeam}</span>
                        </div>
                      );
                    })}
                  </div>
                }
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button onClick={()=>setTab('matches')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 flex flex-col items-center gap-2 font-bold text-sm transition-all shadow-sm shadow-emerald-100">
                <i className="fas fa-futbol text-xl"/>إدخال النتائج
              </button>
              {isCup&&(
                <button onClick={()=>setTab('bracket')}
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl py-4 flex flex-col items-center gap-2 font-bold text-sm transition-all shadow-sm shadow-amber-100">
                  <i className="fas fa-sitemap text-xl"/>شجرة البطولة
                </button>
              )}
              {isLeague&&(
                <button onClick={()=>setTab('standings')}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl py-4 flex flex-col items-center gap-2 font-bold text-sm transition-all shadow-sm shadow-blue-100">
                  <i className="fas fa-table-list text-xl"/>جدول الترتيب
                </button>
              )}
              <button onClick={()=>setTab('stats')}
                className="bg-violet-500 hover:bg-violet-600 text-white rounded-2xl py-4 flex flex-col items-center gap-2 font-bold text-sm transition-all shadow-sm shadow-violet-100">
                <i className="fas fa-chart-bar text-xl"/>الإحصاءات
              </button>
            </div>

          </div>
        )}

        {/* ══ MATCHES ══════════════════════════════════════════════════════ */}
        {tab==='matches'&&(
          <div className="space-y-6">
            {matches.length===0?(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
                <i className="fas fa-futbol text-5xl text-gray-200 mb-4 block"/>
                <p className="text-slate-400 font-bold">لا توجد مباريات مُولَّدة بعد</p>
              </div>
            ):(
              rounds.map(round=>{
                const rms=resolvedMatches.filter(m=>m.round===round);
                if(!rms.length) return null;
                const rDone=rms.filter(m=>m.status==='انتهت').length;
                const rPct=Math.round((rDone/rms.length)*100);
                return (
                  <div key={round}>
                    <div className="flex items-center gap-3 mb-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                        <i className={`fas ${ROUND_ICON[round]||'fa-futbol'} text-emerald-400`}/>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-slate-900">{ROUND_LABELS[round]||round}</h3>
                        <p className="text-xs text-slate-400 font-bold">{rDone}/{rms.length} منتهية</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-20">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{width:`${rPct}%`}}/>
                        </div>
                        <span className="text-sm font-black text-emerald-600 w-10 text-end">{rPct}%</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {rms.map(m=><MatchCard key={m.id} match={m} teams={teams} onEdit={setEditingMatch}/>)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ══ BRACKET ══════════════════════════════════════════════════════ */}
        {tab==='bracket'&&isCup&&(
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">خروج المغلوب</p>
                <h2 className="text-xl font-black text-slate-900">شجرة البطولة</h2>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg font-bold border border-emerald-200"><i className="fas fa-check-circle text-xs"/>فائز</span>
                <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1.5 rounded-lg font-bold border border-green-200"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block"/>مباشر</span>
                <span className="flex items-center gap-1.5 bg-gray-100 text-slate-500 px-2.5 py-1.5 rounded-lg font-bold"><span className="w-2.5 h-2.5 bg-gray-300 rounded-sm inline-block"/>مجدولة</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <BracketView matches={resolvedMatches} teams={teams} onEdit={setEditingMatch}/>
            </div>
            {champ&&(
              <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-8 text-center shadow-xl shadow-amber-200">
                <i className="fas fa-trophy text-white text-5xl mb-3 block"/>
                <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">بطل البطولة</p>
                <p className="text-white text-4xl font-black">{champ.logo} {champ.name}</p>
                <p className="text-amber-100 text-sm mt-2">{league.name} · {league.prizePool}</p>
              </div>
            )}
          </div>
        )}

        {/* ══ STANDINGS ════════════════════════════════════════════════════ */}
        {tab==='standings'&&isLeague&&(
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">ترتيب الدوري</p>
              <h2 className="text-xl font-black text-slate-900">جدول الترتيب</h2>
            </div>
            {standings.length>0&&(
              <div className="grid grid-cols-3 gap-3">
                {standings.slice(0,3).map((row,i)=>(
                  <div key={row.id} className={`rounded-2xl p-4 text-center border ${
                    i===0?'bg-amber-50 border-amber-200':i===1?'bg-slate-50 border-slate-200':'bg-orange-50 border-orange-200'
                  }`}>
                    <div className="text-2xl mb-1">{i===0?'🥇':i===1?'🥈':'🥉'}</div>
                    <p className="text-2xl mb-1">{row.logo}</p>
                    <p className="font-black text-slate-900 text-sm">{row.name}</p>
                    <p className={`text-xl font-black mt-1 ${i===0?'text-amber-600':i===1?'text-slate-600':'text-orange-600'}`}>{row.pts} نقطة</p>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" dir="rtl">
                  <thead className="bg-slate-900 text-white text-xs font-bold">
                    <tr>
                      <th className="px-4 py-3 text-start">#</th>
                      <th className="px-4 py-3 text-start">الفريق</th>
                      <th className="px-3 py-3 text-center">ل.م</th>
                      <th className="px-3 py-3 text-center text-emerald-400">ف</th>
                      <th className="px-3 py-3 text-center">ت</th>
                      <th className="px-3 py-3 text-center text-red-400">خ</th>
                      <th className="px-3 py-3 text-center">هـ+</th>
                      <th className="px-3 py-3 text-center">هـ-</th>
                      <th className="px-3 py-3 text-center">فارق</th>
                      <th className="px-3 py-3 text-center text-amber-400 font-black">نقاط</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {standings.map((row,i)=>(
                      <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${i===0?'bg-amber-50/50':''}`}>
                        <td className="px-4 py-3.5 font-bold text-slate-400">
                          <div className="flex items-center gap-1">{i+1}{i===0&&<i className="fas fa-crown text-amber-400 text-[10px]"/>}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{row.logo}</span>
                            <span className="font-bold text-slate-900">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-center text-slate-500 font-bold">{row.played}</td>
                        <td className="px-3 py-3.5 text-center text-emerald-600 font-black">{row.won}</td>
                        <td className="px-3 py-3.5 text-center text-slate-400">{row.drawn}</td>
                        <td className="px-3 py-3.5 text-center text-red-500">{row.lost}</td>
                        <td className="px-3 py-3.5 text-center text-slate-500">{row.gf}</td>
                        <td className="px-3 py-3.5 text-center text-slate-500">{row.ga}</td>
                        <td className={`px-3 py-3.5 text-center font-bold ${row.gd>0?'text-emerald-600':row.gd<0?'text-red-500':'text-slate-400'}`}>
                          {row.gd>0?`+${row.gd}`:row.gd}
                        </td>
                        <td className="px-3 py-3.5 text-center font-black text-slate-900 text-lg">{row.pts}</td>
                      </tr>
                    ))}
                    {standings.length===0&&(
                      <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400 font-bold">لا توجد مباريات منتهية بعد</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ STATS ════════════════════════════════════════════════════════ */}
        {tab==='stats'&&(
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">إحصاءات</p>
              <h2 className="text-xl font-black text-slate-900">إحصاءات البطولة</h2>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {label:'إجمالي الأهداف',     val:totalGoals,         icon:'fa-futbol',       bg:'bg-emerald-50 border-emerald-200', tx:'text-emerald-700'},
                {label:'متوسط أهداف/مباراة', val:avgGoals,           icon:'fa-chart-line',   bg:'bg-blue-50 border-blue-200',      tx:'text-blue-700'},
                {label:'مباريات مكتملة',      val:`${pct}%`,         icon:'fa-percentage',   bg:'bg-violet-50 border-violet-200',  tx:'text-violet-700'},
              ].map(s=>(
                <div key={s.label} className={`rounded-2xl border p-5 text-center ${s.bg}`}>
                  <i className={`fas ${s.icon} ${s.tx} text-2xl mb-2 block`}/>
                  <p className={`text-3xl font-black ${s.tx}`}>{s.val}</p>
                  <p className="text-xs text-slate-500 font-bold mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Goals per team */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-black text-slate-900 mb-5 flex items-center gap-2">
                <i className="fas fa-futbol text-emerald-500"/> الأهداف المسجّلة لكل فريق
              </h3>
              {teamGoals.length===0?(
                <p className="text-center text-slate-400 font-bold py-8">لا توجد بيانات بعد</p>
              ):(
                <div className="space-y-3">
                  {teamGoals.map((t,i)=>{
                    const maxG=teamGoals[0].gf||1;
                    return (
                      <div key={t.id} className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 w-4 text-center shrink-0">{i+1}</span>
                        <span className="text-xl shrink-0">{t.logo}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-slate-800 truncate">{t.name}</span>
                            <div className="flex items-center gap-3 shrink-0 ms-2 text-xs font-bold">
                              <span className="text-emerald-600">{t.gf} هدف+</span>
                              <span className="text-red-400">{t.ga} هدف-</span>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${
                              i===0?'bg-amber-400':i===1?'bg-slate-400':i===2?'bg-orange-400':'bg-emerald-400'
                            }`} style={{width:`${maxG>0?(t.gf/maxG)*100:0}%`}}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Highest scoring match */}
            {highestMatch&&(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-fire text-orange-500"/> أكثر مباراة في الأهداف
                </h3>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 text-end">
                    <p className="font-black text-slate-900">{teams.find(t=>t.id===highestMatch.homeTeamId)?.name||highestMatch.homeTeam}</p>
                  </div>
                  <div className="bg-slate-900 text-white font-black text-xl px-5 py-2.5 rounded-xl shrink-0">
                    {highestMatch.homeScore} - {highestMatch.awayScore}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-slate-900">{teams.find(t=>t.id===highestMatch.awayTeamId)?.name||highestMatch.awayTeam}</p>
                  </div>
                </div>
                <p className="text-center text-xs text-slate-400 font-bold mt-2">
                  إجمالي {(highestMatch.homeScore||0)+(highestMatch.awayScore||0)} أهداف · {highestMatch.date}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ══ SETTINGS ═════════════════════════════════════════════════════ */}
        {tab==='settings'&&(
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">تفاصيل</p>
              <h2 className="text-xl font-black text-slate-900">معلومات البطولة</h2>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {icon:'fa-trophy',    bg:'bg-amber-50',   ic:'text-amber-500',   label:'الجائزة',       val:league.prizePool},
                {icon:'fa-calendar',  bg:'bg-blue-50',    ic:'text-blue-500',    label:'تاريخ البدء',   val:league.startDate},
                {icon:'fa-users',     bg:'bg-emerald-50', ic:'text-emerald-500', label:'الفرق',         val:`${league.teamsCount}/${league.maxTeams}`},
                {icon:'fa-futbol',    bg:'bg-violet-50',  ic:'text-violet-500',  label:'الرياضة',        val:league.sport},
              ].map((c,i)=>(
                <div key={i} className={`${c.bg} rounded-2xl p-4 text-center`}>
                  <i className={`fas ${c.icon} ${c.ic} text-xl mb-2 block`}/>
                  <p className="font-black text-slate-900 text-sm">{c.val}</p>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            {/* Teams */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                <i className="fas fa-users text-emerald-500"/> الفرق المشاركة ({teams.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {teams.map((t,i)=>(
                  <div key={t.id} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <span className="text-xl shrink-0">{t.logo}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate">{t.name}</p>
                      <p className="text-[10px] text-slate-400">فريق {i+1}</p>
                    </div>
                  </div>
                ))}
                {teams.length===0&&<p className="col-span-4 text-slate-400 text-sm font-bold py-4 text-center">لا توجد فرق مسجّلة</p>}
              </div>
            </div>

            {/* Progress summary */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute -top-6 -end-6 w-24 h-24 bg-emerald-500/10 rounded-full"/>
              <h3 className="font-black mb-4 flex items-center gap-2">
                <i className="fas fa-chart-pie text-emerald-400"/> ملخص التقدّم
              </h3>
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400 font-bold">مكتمل</span>
                  <span className="font-black text-white">{pct}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                    style={{width:`${pct}%`}}/>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center border-t border-white/10 pt-4">
                {[
                  {label:'منتهية', val:done,    color:'text-emerald-400'},
                  {label:'مباشرة',val:live,    color:'text-green-400'},
                  {label:'مجدولة',val:pending, color:'text-amber-400'},
                ].map((s,i)=>(
                  <div key={i}>
                    <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                    <p className="text-[11px] text-slate-500 font-bold">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TournamentManagePage;
