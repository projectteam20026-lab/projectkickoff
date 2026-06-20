import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { TeamMessage } from '../services/api';
import { Team } from '../types';

// ── Shield SVG (same as TeamsPage) ───────────────────────────────────────────
const TEMPLATES = ['shield-classic','shield-peak','circle','shield-curved','diamond','hexagon'];

function ShieldSVG({ id, color, size = 80 }: { id: string; color: string; size?: number }) {
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
      <path d="M50 5 L88 20 L88 55 Q88 82 50 106 Q12 82 12 55 L12 20 Z" fill="none" stroke="white" strokeWidth={2} opacity={0.25} />
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
      <path d="M50 6 Q80 8 91 28 Q97 48 91 66 Q76 90 50 105 Q24 90 9 66 Q3 48 9 28 Q20 8 50 6 Z" fill="none" stroke="white" strokeWidth={2} opacity={0.25} />
      {star(50, 36, 13, 6)}{ball(50, 74, 13)}
    </svg>
  );
  if (id === 'diamond') return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M50 4 L96 50 L50 96 L4 50 Z" fill={color} />
      <path d="M50 4 L96 50 L50 96 L4 50 Z" fill="none" stroke="white" strokeWidth={2} opacity={0.25} />
      {star(50, 34, 12, 5.5)}{ball(50, 64, 11)}
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 100 108" fill="none">
      <path d="M50 5 L93 28.5 L93 79.5 L50 103 L7 79.5 L7 28.5 Z" fill={color} />
      <path d="M50 5 L93 28.5 L93 79.5 L50 103 L7 79.5 L7 28.5 Z" fill="none" stroke="white" strokeWidth={2} opacity={0.25} />
      {star(50, 37, 13, 6)}{ball(50, 74, 13)}
    </svg>
  );
}

function LogoDisplay({ logo, color, size = 60 }: { logo: string; color: string; size?: number }) {
  if (!logo) return <ShieldSVG id="shield-classic" color={color} size={size} />;
  if (logo.startsWith('data:') || logo.startsWith('http')) {
    return <img src={logo} alt="" style={{ width: size, height: size }} className="object-cover rounded-2xl" />;
  }
  return <ShieldSVG id={TEMPLATES.includes(logo) ? logo : 'shield-classic'} color={color} size={size} />;
}

// ── Team Chat ─────────────────────────────────────────────────────────────────
function TeamChat({ teamId, userId }: { teamId: string; userId: string }) {
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const msgs = await backend.getTeamMessages(teamId);
    setMessages(msgs);
  }, [teamId]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 4000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    await backend.sendTeamMessage(teamId, text.trim());
    setText('');
    await load();
    setSending(false);
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-96 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-slate-400">
              <i className="fas fa-comments text-4xl mb-3 block text-gray-200" />
              <p className="text-sm font-bold">لا توجد رسائل بعد</p>
              <p className="text-xs mt-1">كن أول من يتحدث مع زملائك!</p>
            </div>
          </div>
        ) : messages.map(m => {
          const isMe = m.userId === userId;
          return (
            <div key={m._id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black flex-shrink-0 ${isMe ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {m.userName?.[0] || '؟'}
              </div>
              <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && <span className="text-[10px] text-slate-400 font-bold mb-0.5 px-1">{m.userName}</span>}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-emerald-500 text-white rounded-tr-sm' : 'bg-white text-slate-800 border border-gray-200 rounded-tl-sm shadow-sm'}`}>
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5 px-1">{fmt(m.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="border-t border-gray-200 bg-white p-3 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="اكتب رسالة لزملائك..."
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          dir="rtl"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0 transition-colors"
        >
          {sending
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <i className="fas fa-paper-plane text-sm" />
          }
        </button>
      </form>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const TeamDetailPage: React.FC = () => {
  const { id }       = useParams<{ id: string }>();
  const { user }     = useAuth();
  const navigate     = useNavigate();

  const [team,       setTeam]      = useState<Team | null>(null);
  const [loading,    setLoading]   = useState(true);
  const [notFound,   setNotFound]  = useState(false);
  const [actionBusy, setActionBusy]= useState(false);
  const [toast,      setToast]     = useState('');
  const [toastType,  setToastType] = useState<'ok'|'err'>('ok');
  const [activeTab,  setActiveTab] = useState<'info'|'chat'>('info');

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    if (!id) return;
    const t = await backend.getTeamDetail(id);
    if (!t) { setNotFound(true); setLoading(false); return; }
    setTeam(t);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="space-y-4 w-full max-w-2xl px-4">
        <div className="bg-white rounded-3xl h-48 animate-pulse" />
        <div className="bg-white rounded-2xl h-24 animate-pulse" />
        <div className="bg-white rounded-2xl h-32 animate-pulse" />
      </div>
    </div>
  );

  if (notFound || !team) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center p-8">
        <i className="fas fa-users text-6xl text-gray-200 mb-4 block" />
        <h2 className="text-xl font-black text-slate-700 mb-2">الفريق غير موجود</h2>
        <button onClick={() => navigate('/teams')} className="mt-4 px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl text-sm">
          <i className="fas fa-arrow-right me-2" /> العودة للفرق
        </button>
      </div>
    </div>
  );

  const accent    = team.primaryColor || '#10b981';
  const isOwner   = !!user && team.createdBy === user.id;
  const isMember  = !!user && (team.members || []).includes(user.id);
  const canChat   = isOwner || isMember;
  const totalGames = team.wins + team.draws + team.losses;

  const handleJoin = async () => {
    setActionBusy(true);
    const res = await backend.joinTeam(team.id);
    if (res.success) { await load(); showToast('تم الانضمام للفريق! ✅'); }
    else              showToast(res.error || 'فشل الانضمام', 'err');
    setActionBusy(false);
  };

  const handleLeave = async () => {
    setActionBusy(true);
    const res = await backend.leaveTeam(team.id);
    if (res.success) { await load(); showToast('تم مغادرة الفريق.'); }
    else              showToast(res.error || 'فشل الخروج', 'err');
    setActionBusy(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-10" dir="rtl">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 ${toastType === 'ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          <i className={`fas fa-${toastType === 'ok' ? 'check' : 'exclamation-circle'}`} /> {toast}
        </div>
      )}

      {/* ── Hero header ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent}dd 0%, ${accent}99 100%)` }}>
        {/* Blurred bg logo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none" aria-hidden>
          <LogoDisplay logo={team.logo || 'shield-classic'} color="white" size={280} />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 pt-5 pb-6">
          {/* Back */}
          <button
            onClick={() => navigate('/teams')}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-bold mb-5 transition-colors"
          >
            <i className="fas fa-arrow-right text-xs" /> الفرق
          </button>

          <div className="flex items-center gap-5">
            {/* Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border border-white/30 overflow-hidden">
              <LogoDisplay logo={team.logo || 'shield-classic'} color="white" size={72} />
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{team.name}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {team.city && (
                  <span className="text-white/80 text-xs font-bold bg-white/15 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <i className="fas fa-map-marker-alt text-[9px]" /> {team.city}
                  </span>
                )}
                {team.fieldType && (
                  <span className="text-white/80 text-xs font-bold bg-white/15 px-2.5 py-1 rounded-full">{team.fieldType}</span>
                )}
                {team.fieldType === '11v11' && team.formation && (
                  <span className="text-white/80 text-xs font-bold bg-white/15 px-2.5 py-1 rounded-full">{team.formation}</span>
                )}
                {team.ageGroup && (
                  <span className="text-white/80 text-xs font-bold bg-white/15 px-2.5 py-1 rounded-full">{team.ageGroup}</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            {[
              { label: 'فوز',    value: team.wins,    color: 'text-emerald-300' },
              { label: 'تعادل',  value: team.draws,   color: 'text-amber-300'   },
              { label: 'خسارة',  value: team.losses,  color: 'text-red-300'     },
              { label: 'نقطة',   value: team.points,  color: 'text-white'        },
            ].map(s => (
              <div key={s.label} className="bg-white/15 backdrop-blur rounded-xl py-3 text-center border border-white/20">
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-white/70 text-[10px] font-bold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Action bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Tabs */}
          <div className="flex gap-1 flex-1">
            {([
              { id: 'info', label: 'تفاصيل الفريق', icon: 'info-circle' },
              { id: 'chat', label: 'الدردشة',         icon: 'comments'   },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                disabled={t.id === 'chat' && !canChat}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === t.id
                    ? 'bg-slate-900 text-white shadow'
                    : 'text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <i className={`fas fa-${t.icon}`} /> {t.label}
                {t.id === 'chat' && !canChat && (
                  <i className="fas fa-lock text-[9px] opacity-60" />
                )}
              </button>
            ))}
          </div>

          {/* Action button */}
          {isOwner ? (
            <button
              onClick={() => navigate('/teams')}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors flex-shrink-0"
            >
              <i className="fas fa-cog text-[10px]" /> إدارة
            </button>
          ) : isMember ? (
            <button
              onClick={handleLeave}
              disabled={actionBusy}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-xl border border-red-100 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {actionBusy ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <i className="fas fa-sign-out-alt text-[10px]" />}
              مغادرة
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={actionBusy}
              className="flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex-shrink-0 shadow-sm"
              style={{ background: accent }}
            >
              {actionBusy ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <i className="fas fa-user-plus text-[10px]" />}
              انضمام للفريق
            </button>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* ── INFO TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'info' && (
          <>
            {/* Members */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <i className="fas fa-users text-emerald-500 text-sm" />
                  <span className="font-black text-slate-800 text-sm">اللاعبون</span>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                    {(team.membersCount ?? 0) + 1}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {/* Owner (creator) */}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                    style={{ background: `${accent}25`, color: accent }}
                  >
                    {team.captain?.[0] || team.name?.[0] || '؟'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-800">{team.captain || 'القائد'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">قائد الفريق</p>
                  </div>
                  <span className="text-amber-500 text-sm" title="قائد"><i className="fas fa-crown" /></span>
                </div>

                {/* Members */}
                {(team.membersDetail || []).length > 0 ? (
                  team.membersDetail!.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-black text-slate-500 flex-shrink-0 overflow-hidden">
                        {m.avatar
                          ? <img src={m.avatar} alt="" className="w-full h-full object-cover" />
                          : m.name?.[0] || '؟'
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-700">{m.name || 'لاعب'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">عضو</p>
                      </div>
                    </div>
                  ))
                ) : (team.players || []).length > 0 ? (
                  team.players!.filter(p => p !== team.captain).map((p, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-black text-slate-500 flex-shrink-0">
                        {p[0]}
                      </div>
                      <p className="text-sm font-bold text-slate-700">{p}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-slate-400">
                    <i className="fas fa-user-slash text-2xl mb-2 block text-gray-200" />
                    <p className="text-sm">لا يوجد أعضاء بعد</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats card */}
            {totalGames > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <i className="fas fa-chart-bar text-blue-500 text-sm" />
                  <span className="font-black text-slate-800 text-sm">الإحصائيات</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'انتصارات', value: team.wins,   color: 'bg-emerald-500', pct: totalGames > 0 ? (team.wins / totalGames) * 100 : 0 },
                    { label: 'تعادلات',  value: team.draws,  color: 'bg-amber-400',   pct: totalGames > 0 ? (team.draws / totalGames) * 100 : 0 },
                    { label: 'خسارات',   value: team.losses, color: 'bg-red-400',     pct: totalGames > 0 ? (team.losses / totalGames) * 100 : 0 },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span className="font-bold">{s.label}</span>
                        <span className="font-black text-slate-700">{s.value} من {totalGames}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {team.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-align-right text-purple-500 text-sm" />
                  <span className="font-black text-slate-800 text-sm">عن الفريق</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{team.description}</p>
              </div>
            )}

            {/* Join CTA (non-members) */}
            {!isOwner && !isMember && (
              <div
                className="rounded-2xl p-5 text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${accent}ee, ${accent}bb)` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">⚽</div>
                  <div>
                    <h3 className="font-black text-lg">انضم لـ {team.name}</h3>
                    <p className="text-white/80 text-sm">{(team.membersCount ?? 0) + 1} لاعب · انضم الآن</p>
                  </div>
                </div>
                <button
                  onClick={handleJoin}
                  disabled={actionBusy}
                  className="w-full py-3 bg-white font-black text-sm rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ color: accent }}
                >
                  {actionBusy
                    ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> جاري الانضمام...</span>
                    : <span><i className="fas fa-user-plus me-2" /> انضم للفريق الآن</span>
                  }
                </button>
              </div>
            )}
          </>
        )}

        {/* ── CHAT TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'chat' && canChat && user && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-slate-500 font-bold">مباشر · يتجدد كل 4 ثواني</span>
            </div>
            <TeamChat teamId={team.id} userId={user.id} />
          </div>
        )}

        {activeTab === 'chat' && !canChat && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <i className="fas fa-lock text-4xl text-gray-200 mb-3 block" />
            <h3 className="font-black text-slate-700 mb-1">الدردشة للأعضاء فقط</h3>
            <p className="text-slate-400 text-sm mb-5">انضم للفريق أولاً للوصول إلى الدردشة</p>
            <button onClick={handleJoin} disabled={actionBusy} className="px-6 py-2.5 text-white font-bold rounded-xl text-sm transition-colors" style={{ background: accent }}>
              <i className="fas fa-user-plus me-2" /> انضم للفريق
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetailPage;
