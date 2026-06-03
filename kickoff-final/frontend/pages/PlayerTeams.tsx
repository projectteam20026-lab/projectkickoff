import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { getPlayerProfileAPI, PlayerProfileData, TeamHistory } from '../services/api';
import { Team, TeamChatMessage, League, FriendlyChallenge, ChallengeChat, JoinRequest } from '../types';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function fmtTime(ts: string): string {
  try {
    const d   = new Date(ts);
    const now = new Date();
    const h   = d.getHours();
    const m   = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'م' : 'ص';
    const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
    if (now.getTime() - d.getTime() < 86400000) return `${h12}:${m} ${ampm}`;
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } catch { return ''; }
}

function fmtDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

const statusStyle: Record<string, string> = {
  pending:  'bg-amber-50  border-amber-200  text-amber-700',
  accepted: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  rejected: 'bg-red-50    border-red-200    text-red-600',
  cancelled:'bg-gray-50   border-gray-200   text-gray-500',
};
const statusLabel: Record<string, string> = {
  pending:  '⏳ قيد الانتظار',
  accepted: '✅ مقبول',
  rejected: '❌ مرفوض',
  cancelled:'🚫 ملغي',
};

/* ── Football Badge System ─────────────────────────────────────────────────── */
const BADGE_COLORS = [
  '#dc2626','#1d4ed8','#059669','#7c3aed',
  '#ea580c','#ca8a04','#0891b2','#db2777',
  '#1e3a5f','#374151','#b45309','#0f766e',
];

/** Soccer ball: circle + 4 dark pentagon patches */
function mkBall(cx: number, cy: number, r: number, dark = '#111827'): string {
  const pct = (a: number) => ({ x: cx + r * Math.cos((a * Math.PI) / 180), y: cy + r * Math.sin((a * Math.PI) / 180) });
  const patch = (ang: number, size: number) => {
    const c = pct(ang); const s = size;
    return `<polygon points="${c.x},${c.y - s} ${c.x + s * 0.95},${c.y - s * 0.31} ${c.x + s * 0.59},${c.y + s * 0.81} ${c.x - s * 0.59},${c.y + s * 0.81} ${c.x - s * 0.95},${c.y - s * 0.31}" fill="${dark}" opacity="0.85"/>`;
  };
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="${dark}" stroke-width="1"/>` +
    patch(-90, r * 0.38) + patch(18, r * 0.38) + patch(162, r * 0.38) + patch(90, r * 0.3);
}

function mkSVG(content: string): string {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${content}</svg>`;
  try { return `data:image/svg+xml;base64,${btoa(s)}`; }
  catch { return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`; }
}

const BADGES = [
  {
    id: 'b1', label: 'كلاسيك',
    fn: (c: string) => mkSVG(
      `<path d="M50 4L88 16L88 54Q88 78 50 95Q12 78 12 54L12 16Z" fill="${c}"/>` +
      `<path d="M50 8L84 19L84 54Q84 75 50 91Q16 75 16 54L16 19Z" fill="none" stroke="white" stroke-width="1.5" opacity="0.4"/>` +
      mkBall(50, 52, 18)
    ),
  },
  {
    id: 'b2', label: 'دائري',
    fn: (c: string) => mkSVG(
      `<circle cx="50" cy="50" r="45" fill="${c}"/>` +
      `<circle cx="50" cy="50" r="45" fill="none" stroke="white" stroke-width="6" opacity="0.25"/>` +
      `<circle cx="50" cy="50" r="38" fill="none" stroke="white" stroke-width="1.5" opacity="0.4"/>` +
      mkBall(50, 50, 17)
    ),
  },
  {
    id: 'b3', label: 'معين',
    fn: (c: string) => mkSVG(
      `<path d="M50 4L94 50L50 96L6 50Z" fill="${c}"/>` +
      `<path d="M50 11L87 50L50 89L13 50Z" fill="none" stroke="white" stroke-width="1.5" opacity="0.4"/>` +
      mkBall(50, 52, 17)
    ),
  },
  {
    id: 'b4', label: 'خماسي',
    fn: (c: string) => mkSVG(
      `<path d="M50 4L93 35L77 88H23L7 35Z" fill="${c}"/>` +
      `<path d="M50 11L86 38L72 83H28L14 38Z" fill="none" stroke="white" stroke-width="1.5" opacity="0.4"/>` +
      mkBall(50, 53, 18)
    ),
  },
  {
    id: 'b5', label: 'سداسي',
    fn: (c: string) => mkSVG(
      `<path d="M50 4L90 26L90 74L50 96L10 74L10 26Z" fill="${c}"/>` +
      `<path d="M50 10L84 29L84 71L50 90L16 71L16 29Z" fill="none" stroke="white" stroke-width="1.5" opacity="0.4"/>` +
      mkBall(50, 52, 17)
    ),
  },
  {
    id: 'b6', label: 'نجمة',
    fn: (c: string) => mkSVG(
      `<path d="M50 4L62 34H95L70 53L80 84L50 65L20 84L30 53L5 34H38Z" fill="${c}"/>` +
      mkBall(50, 50, 15)
    ),
  },
  {
    id: 'b7', label: 'درع مدور',
    fn: (c: string) => mkSVG(
      `<path d="M50 5L87 18L87 55Q87 82 50 95Q13 82 13 55L13 18Z" fill="${c}"/>` +
      `<path d="M50 5L87 18L87 55Q87 82 50 95L50 5Z" fill="black" opacity="0.08"/>` +
      `<path d="M50 11L81 22L81 55Q81 78 50 89Q19 78 19 55L19 22Z" fill="none" stroke="white" stroke-width="1.5" opacity="0.35"/>` +
      mkBall(50, 54, 18)
    ),
  },
  {
    id: 'b8', label: 'ثماني',
    fn: (c: string) => mkSVG(
      `<path d="M33 5H67L95 33V67L67 95H33L5 67V33Z" fill="${c}"/>` +
      `<path d="M36 11H64L89 36V64L64 89H36L11 64V36Z" fill="none" stroke="white" stroke-width="1.5" opacity="0.4"/>` +
      mkBall(50, 52, 17)
    ),
  },
];

const DEFAULT_BADGE_URL = BADGES[0].fn(BADGE_COLORS[0]);

/* ── BadgePicker component ─────────────────────────────────────────────────── */
const BadgePicker: React.FC<{ onSelect: (url: string) => void }> = ({ onSelect }) => {
  const [selBadge, setSelBadge] = React.useState('b1');
  const [selColor, setSelColor] = React.useState(BADGE_COLORS[0]);

  const emit = (b: string, c: string) => {
    const tmpl = BADGES.find(x => x.id === b);
    if (tmpl) onSelect(tmpl.fn(c));
  };

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide text-center">النموذج</p>
      <div className="grid grid-cols-4 gap-2">
        {BADGES.map(b => (
          <button key={b.id}
            onClick={() => { setSelBadge(b.id); emit(b.id, selColor); }}
            className={`h-14 rounded-xl flex items-center justify-center overflow-hidden transition-all border-2 ${
              selBadge === b.id
                ? 'border-emerald-400 scale-110 shadow-md shadow-emerald-100 bg-emerald-50'
                : 'border-gray-100 bg-gray-50 hover:border-emerald-200 hover:scale-105'
            }`}>
            <img src={b.fn(selColor)} alt={b.label} className="w-10 h-10 object-contain" />
          </button>
        ))}
      </div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide text-center">اللون</p>
      <div className="grid grid-cols-6 gap-2">
        {BADGE_COLORS.map(c => (
          <button key={c}
            onClick={() => { setSelColor(c); emit(selBadge, c); }}
            className={`h-9 rounded-xl transition-all border-2 ${
              selColor === c
                ? 'border-white scale-110 shadow-lg ring-2 ring-emerald-400'
                : 'border-transparent hover:scale-110 hover:border-white/50'
            }`}
            style={{ background: c }} />
        ))}
      </div>
    </div>
  );
};

type NoTeamView = 'choice' | 'create' | 'explore';
type HasTeamTab = 'myTeam' | 'record' | 'findTeams' | 'challenges';
type LogoTab    = 'emoji' | 'upload';

/* ══════════════════════════════════════════════════════════════════════════════
   PLAYER MINI PROFILE MODAL
══════════════════════════════════════════════════════════════════════════════ */
const PlayerMiniProfile: React.FC<{ name: string; onClose: () => void }> = ({ name, onClose }) => {
  const [data, setData]     = useState<PlayerProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPlayerProfileAPI(name).then(d => { setData(d); setLoading(false); });
  }, [name]);

  const firstName = name.split(' ')[0];
  // لون افتراضي مشتق من الحرف الأول إذا ما كان في لون محدد
  const defaultColors = ['10b981','3b82f6','8b5cf6','f59e0b','ef4444','0891b2','dc2626','059669'];
  const charIndex = (name.charCodeAt(0) || 0) % defaultColors.length;
  const bgColor   = data?.profile?.bg || defaultColors[charIndex];
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=${bgColor}&color=fff&size=128&bold=true`;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header gradient */}
        <div className="relative h-24 overflow-hidden" style={{ background: `linear-gradient(135deg,#064e3b,#0f766e)` }}>
          <div className="absolute -top-8 -end-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute top-2 end-3">
            <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors">
              <i className="fas fa-times text-sm" />
            </button>
          </div>
        </div>

        {/* Avatar (overlapping) */}
        <div className="flex justify-center -mt-12 mb-3 relative z-10">
          <div className="w-24 h-24 rounded-3xl border-4 border-white shadow-xl overflow-hidden">
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="px-6 pb-6">
            {/* Name */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-black text-slate-900">
                {data?.profile?.name || name}
              </h2>
            </div>

            {/* Info rows — only what the player actually registered */}
            {data?.profile && (data.profile.age || data.profile.phone || data.profile.nationality) && (
              <div className="space-y-2 mb-4">
                {data.profile.age && (
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                    <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-birthday-cake text-emerald-600 text-[11px]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">العمر</p>
                      <p className="text-sm font-black text-slate-700">{data.profile.age} سنة</p>
                    </div>
                  </div>
                )}
                {data.profile.phone && (
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                    <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-phone text-blue-600 text-[11px]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">الهاتف</p>
                      <p className="text-sm font-black text-slate-700 tracking-wide">{data.profile.phone}</p>
                    </div>
                  </div>
                )}
                {data.profile.nationality && (
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                    <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-flag text-amber-600 text-[11px]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">الجنسية</p>
                      <p className="text-sm font-black text-slate-700">{data.profile.nationality}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Team badge */}
            {data?.team && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 mb-2">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-slate-100 flex items-center justify-center flex-shrink-0">
                  {data.team.logo && (data.team.logo.startsWith('data:') || data.team.logo.startsWith('http'))
                    ? <img src={data.team.logo} alt="logo" className="w-full h-full object-cover" />
                    : <span className="text-xl">{data.team.logo}</span>
                  }
                </div>
                <div className="flex-1">
                  <p className="font-black text-slate-900 text-sm">{data.team.name}</p>
                  <p className="text-xs text-slate-400">{data.team.points} نقطة · {data.team.wins}ف {data.team.draws}ت {data.team.losses}خ</p>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">نشط</span>
              </div>
            )}

            {!data?.profile && !data?.team && (
              <div className="text-center py-4">
                <i className="fas fa-user text-4xl text-gray-200 mb-2 block" />
                <p className="text-slate-400 text-sm font-bold">لا تتوفر معلومات إضافية</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   LOGO PICKER MODAL (emoji + upload)
══════════════════════════════════════════════════════════════════════════════ */
const LogoPickerModal: React.FC<{
  currentLogo: string;
  onSelect: (logo: string) => void;
  onClose: () => void;
}> = ({ currentLogo, onSelect, onClose }) => {
  const [tab, setTab]       = useState<LogoTab>('emoji');
  const [preview, setPreview] = useState<string>(currentLogo);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => { const url = ev.target?.result as string; setPreview(url); };
    reader.readAsDataURL(f);
  };

  const isEmoji = (s: string) => s.length <= 4 && !s.startsWith('data:') && !s.startsWith('http');

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-black text-slate-900">شعار الفريق</h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
            <i className="fas fa-times text-sm text-slate-500" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex justify-center py-5 bg-gray-50 border-b border-gray-100">
          <div className="w-20 h-20 bg-white border-2 border-emerald-200 rounded-2xl flex items-center justify-center shadow-md overflow-hidden">
            {isEmoji(preview)
              ? <span className="text-4xl">{preview}</span>
              : <img src={preview} alt="logo" className="w-full h-full object-cover" />
            }
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[
            { key: 'emoji'  as LogoTab, label: 'شارة الفريق', icon: 'fa-shield-alt' },
            { key: 'upload' as LogoTab, label: 'رفع صورة',    icon: 'fa-image'      },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-all ${
                tab === t.key ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}>
              <i className={`fas ${t.icon} text-xs`} /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'emoji' ? (
            <BadgePicker onSelect={url => setPreview(url)} />
          ) : (
            <div className="space-y-4">
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-emerald-300 rounded-2xl p-8 text-center cursor-pointer transition-colors group">
                <i className="fas fa-cloud-upload-alt text-3xl text-gray-300 group-hover:text-emerald-400 mb-2 block transition-colors" />
                <p className="font-bold text-slate-500 group-hover:text-emerald-600 text-sm transition-colors">اضغط لاختيار صورة</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP — حتى 2MB</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              {preview && !isEmoji(preview) && preview.startsWith('data:') && (
                <p className="text-xs text-emerald-600 font-bold text-center flex items-center justify-center gap-1">
                  <i className="fas fa-check-circle" /> تم تحميل الصورة بنجاح
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <button onClick={onClose}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold rounded-xl text-sm transition-colors">
              إلغاء
            </button>
            <button onClick={() => { onSelect(preview); onClose(); }}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm">
              <i className="fas fa-check me-2 text-xs" /> حفظ الشعار
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
const PlayerTeams: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teams,   setTeams]   = useState<Team[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  const [noTeamView, setNoTeamView] = useState<NoTeamView>('choice');
  const [hasTeamTab, setHasTeamTab] = useState<HasTeamTab>('myTeam');

  /* create form */
  const [step,    setStep]    = useState<1|2>(1);
  const [form,    setForm]    = useState({ name: '', logo: DEFAULT_BADGE_URL, description: '', rules: '' });
  const [createLogoTab, setCreateLogoTab] = useState<LogoTab>('emoji');
  const createFileRef = useRef<HTMLInputElement>(null);
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState('');

  /* join requests */
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [jrLoading,    setJrLoading]    = useState(false);

  /* team info editing */
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm,    setInfoForm]    = useState({ description: '', rules: '' });
  const [infoSaving,  setInfoSaving]  = useState(false);

  /* chat */
  const [chatMsgs,    setChatMsgs]    = useState<TeamChatMessage[]>([]);
  const [chatInput,   setChatInput]   = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* join */
  const [requested,  setRequested]  = useState<Set<string>>(new Set());
  const [requesting, setRequesting] = useState<string | null>(null);

  /* search */
  const [searchQ, setSearchQ] = useState('');

  /* challenge modal */
  const [challengeTarget, setChallengeTarget] = useState<Team | null>(null);
  const [chalForm, setChalForm] = useState({ proposedDate: '', proposedTime: '18:00', proposedFieldName: '', message: '' });
  const [chalSending, setChalSending] = useState(false);
  const [chalErr,     setChalErr]     = useState('');

  /* challenges */
  const [incoming, setIncoming] = useState<FriendlyChallenge[]>([]);
  const [sent,     setSent]     = useState<FriendlyChallenge[]>([]);
  const [challLoading, setChallLoading] = useState(false);

  /* team history (record tab) */
  const [teamHistory,      setTeamHistory]      = useState<TeamHistory>({ matches: [], tournaments: [], champWins: 0 });
  const [historyLoading,   setHistoryLoading]   = useState(false);

  /* challenge chat */
  const [openChalChat,    setOpenChalChat]   = useState<string | null>(null);
  const [chalChatMsgs,    setChalChatMsgs]   = useState<ChallengeChat[]>([]);
  const [chalChatInput,   setChalChatInput]  = useState('');
  const [chalChatSending, setChalChatSend]   = useState(false);
  const chalChatEndRef = useRef<HTMLDivElement>(null);

  /* player profile modal */
  const [profilePlayer, setProfilePlayer] = useState<string | null>(null);

  /* logo picker modal (for existing team) */
  const [showLogoPicker, setShowLogoPicker] = useState(false);

  /* toast */
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  /* ── derived ────────────────────────────────────────────────────────────── */
  const myTeam      = teams.find(t => t.userId === user?.id || t.isUserTeam);
  const otherTeams  = teams.filter(t => !(t.userId === user?.id || t.isUserTeam));
  const openLeagues = leagues.filter(l => l.status === 'قادمة' && l.teamsCount < l.maxTeams);
  const filteredTeams = otherTeams.filter(t => !searchQ || t.name.includes(searchQ));
  const pendingIncoming = incoming.filter(c => c.status === 'pending').length;
  const pendingJoinReqs = joinRequests.length;

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  const isEmoji = (s: string) => s.length <= 4 && !s.startsWith('data:') && !s.startsWith('http');

  /* ── load ───────────────────────────────────────────────────────────────── */
  useEffect(() => {
    Promise.all([backend.getUserTeams('all'), backend.getLeagues()]).then(([ts, ls]) => {
      setTeams(ts); setLeagues(ls); setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!myTeam) return;
    setChatLoading(true);
    backend.getTeamChat(myTeam.id).then(msgs => {
      setChatMsgs(msgs); setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
    });
  }, [myTeam?.id]);

  useEffect(() => {
    if (hasTeamTab !== 'challenges' || !myTeam) return;
    setChallLoading(true);
    backend.getTeamChallenges(myTeam.id).then(({ incoming: i, sent: s }) => {
      setIncoming(i); setSent(s); setChallLoading(false);
    });
  }, [hasTeamTab, myTeam?.id]);

  useEffect(() => {
    if (hasTeamTab !== 'record' || !myTeam) return;
    setHistoryLoading(true);
    backend.getTeamHistory(myTeam.id).then(h => {
      setTeamHistory(h); setHistoryLoading(false);
    });
  }, [hasTeamTab, myTeam?.id]);

  useEffect(() => {
    if (!openChalChat) return;
    backend.getChallengeChat(openChalChat).then(msgs => {
      setChalChatMsgs(msgs);
      setTimeout(() => chalChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    });
  }, [openChalChat]);

  useEffect(() => {
    if (!myTeam) return;
    setJrLoading(true);
    backend.getJoinRequests(myTeam.id).then(reqs => {
      setJoinRequests(reqs);
      setJrLoading(false);
    });
  }, [myTeam?.id]);

  /* ── actions ────────────────────────────────────────────────────────────── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormErr('أدخل اسم الفريق'); return; }
    setSaving(true); setFormErr('');
    const res = await backend.saveTeam({
      id: '', name: form.name.trim(), logo: form.logo,
      description: form.description.trim(), rules: form.rules.trim(),
      wins: 0, losses: 0, draws: 0, points: 0,
      players: [user?.name || ''], isUserTeam: true, userId: user?.id,
    });
    if (res.success) {
      const updatedTeams = await backend.getUserTeams('all');
      setTeams(updatedTeams);
      const newTeam = updatedTeams.find(t => t.userId === user?.id || t.isUserTeam);
      if (newTeam) {
        setJoinRequests(await backend.getJoinRequests(newTeam.id));
      }
      setForm({ name: '', logo: DEFAULT_BADGE_URL, description: '', rules: '' });
      setStep(1); setNoTeamView('choice');
      showToast('🎉 تم إنشاء فريقك بنجاح!', true);
    } else { setFormErr('حدث خطأ، حاول مجدداً'); }
    setSaving(false);
  };

  const handleChangeLogo = async (newLogo: string) => {
    if (!myTeam) return;
    const res = await backend.saveTeam({ ...myTeam, logo: newLogo });
    if (res.success) {
      setTeams(prev => prev.map(t => t.id === myTeam.id ? { ...t, logo: newLogo } : t));
      showToast('✅ تم تغيير الشعار!', true);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !myTeam || chatSending) return;
    setChatSending(true);
    const msg = await backend.sendTeamChat(myTeam.id, chatInput.trim());
    if (msg) { setChatMsgs(prev => [...prev, msg]); setChatInput(''); setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60); }
    setChatSending(false);
  };

  const handleJoin = async (teamId: string) => {
    setRequesting(teamId);
    const res = await backend.requestJoinTeam(teamId);
    if (res.success) { setRequested(prev => new Set([...prev, teamId])); showToast('✅ تم إرسال طلب الانضمام!', true); }
    else showToast(res.error || 'حدث خطأ', false);
    setRequesting(null);
  };

  const handleSendChallenge = async () => {
    if (!challengeTarget || !myTeam) return;
    if (!chalForm.proposedDate) { setChalErr('اختر تاريخ المباراة'); return; }
    setChalSending(true); setChalErr('');
    const res = await backend.sendChallenge(challengeTarget.id, {
      fromTeamId: myTeam.id,
      proposedDate: chalForm.proposedDate,
      proposedTime: chalForm.proposedTime,
      proposedFieldName: chalForm.proposedFieldName,
      message: chalForm.message,
    });
    if (res.success) {
      setChallengeTarget(null);
      setChalForm({ proposedDate: '', proposedTime: '18:00', proposedFieldName: '', message: '' });
      showToast(`⚔️ تم إرسال تحدي لفريق ${challengeTarget.name}!`, true);
    } else { setChalErr(res.error || 'حدث خطأ'); }
    setChalSending(false);
  };

  const handleRespond = async (id: string, status: 'accepted' | 'rejected') => {
    const res = await backend.respondChallenge(id, status);
    if (res.success) {
      setIncoming(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      showToast(status === 'accepted' ? '✅ قبلت التحدي!' : '❌ رفضت التحدي', status === 'accepted');
    }
  };

  const handleSendChalChat = async () => {
    if (!openChalChat || !chalChatInput.trim() || chalChatSending) return;
    setChalChatSend(true);
    const res = await backend.sendChallengeChat(openChalChat, chalChatInput.trim());
    if (res.success && res.data) {
      setChalChatMsgs(prev => [...prev, res.data!]);
      setChalChatInput('');
      setTimeout(() => chalChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
    setChalChatSend(false);
  };

  const goBack = () => { setNoTeamView('choice'); setStep(1); setFormErr(''); };

  /* ── join request management ────────────────────────────────────────────── */
  const handleRespondJoinRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    const res = await backend.respondJoinRequest(requestId, status);
    if (res.success) {
      setJoinRequests(prev => prev.filter(r => r.id !== requestId));
      if (status === 'accepted') {
        setTeams(await backend.getUserTeams('all'));
        showToast('✅ تم قبول الانضمام!', true);
      } else {
        showToast('❌ تم رفض الطلب', false);
      }
    }
  };

  /* ── kick & role ────────────────────────────────────────────────────────── */
  const handleKickMember = async (playerName: string) => {
    if (!myTeam) return;
    if (!window.confirm(`هل تريد طرد "${playerName}" من الفريق؟`)) return;
    const res = await backend.kickMember(myTeam.id, playerName);
    if (res.success) {
      setTeams(prev => prev.map(t =>
        t.id === myTeam.id
          ? { ...t, players: (t.players || []).filter(p => p !== playerName), viceCaptain: t.viceCaptain === playerName ? undefined : t.viceCaptain }
          : t
      ));
      showToast(`🚫 تم طرد ${playerName}`, false);
    }
  };

  const handleToggleViceCaptain = async (playerName: string) => {
    if (!myTeam) return;
    const isVice = myTeam.viceCaptain === playerName;
    const newRole = isVice ? 'player' : 'vice-captain';
    const res = await backend.setViceCaptain(myTeam.id, playerName, newRole);
    if (res.success) {
      setTeams(prev => prev.map(t =>
        t.id === myTeam.id ? { ...t, viceCaptain: isVice ? undefined : playerName } : t
      ));
      showToast(isVice ? `تم إزالة دور مساعد القائد من ${playerName}` : `⭐ تم ترقية ${playerName} لمساعد القائد!`, true);
    }
  };

  /* ── leave team (for non-captain members) ──────────────────────────────── */
  const handleLeaveTeam = async () => {
    if (!myTeam || !user) return;
    if (!window.confirm('هل أنت متأكد من مغادرة الفريق؟')) return;
    const res = await backend.leaveTeam(myTeam.id, user.name);
    if (res.success) {
      setTeams(await backend.getUserTeams('all'));
      showToast('👋 غادرت الفريق بنجاح', true);
    } else {
      showToast(res.error || 'حدث خطأ', false);
    }
  };

  /* ── delete (dissolve) team — captain only ──────────────────────────────── */
  const handleDeleteTeam = async () => {
    if (!myTeam) return;
    if (!window.confirm(`هل تريد حل فريق "${myTeam.name}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    const res = await backend.deleteTeam(myTeam.id);
    if (res.success) {
      setTeams(await backend.getUserTeams('all'));
      setJoinRequests([]);
      showToast('🗑️ تم حل الفريق', false);
    } else {
      showToast(res.error || 'حدث خطأ', false);
    }
  };

  /* ── team info (description + rules) ───────────────────────────────────── */
  const handleSaveTeamInfo = async () => {
    if (!myTeam) return;
    setInfoSaving(true);
    const res = await backend.saveTeam({ ...myTeam, description: infoForm.description, rules: infoForm.rules });
    if (res.success) {
      setTeams(prev => prev.map(t => t.id === myTeam.id ? { ...t, description: infoForm.description, rules: infoForm.rules } : t));
      setEditingInfo(false);
      showToast('✅ تم حفظ المعلومات!', true);
    }
    setInfoSaving(false);
  };

  /* ── create logo file upload ────────────────────────────────────────────── */
  const handleCreateLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => { const url = ev.target?.result as string; setForm(p => ({ ...p, logo: url })); };
    reader.readAsDataURL(f);
  };

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 inset-x-0 mx-auto w-fit z-[200] px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white transition-all ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Player Profile Modal */}
      {profilePlayer && (
        <PlayerMiniProfile name={profilePlayer} onClose={() => setProfilePlayer(null)} />
      )}

      {/* Logo Picker Modal (change existing team logo) */}
      {showLogoPicker && myTeam && (
        <LogoPickerModal
          currentLogo={myTeam.logo}
          onSelect={handleChangeLogo}
          onClose={() => setShowLogoPicker(false)}
        />
      )}

      {/* Challenge Modal */}
      {challengeTarget && myTeam && (
        <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2">⚔️ تحدي مباراة ودية</h3>
                <p className="text-emerald-100 text-sm mt-0.5">
                  {isEmoji(myTeam.logo) ? myTeam.logo : '🏆'} {myTeam.name} &nbsp;⚔️&nbsp; {isEmoji(challengeTarget.logo) ? challengeTarget.logo : '🏆'} {challengeTarget.name}
                </p>
              </div>
              <button onClick={() => setChallengeTarget(null)} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {chalErr && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex gap-2 items-center">
                  <i className="fas fa-exclamation-circle flex-shrink-0" /> {chalErr}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5"><i className="fas fa-calendar text-emerald-500 me-1" /> التاريخ المقترح</label>
                  <input type="date" value={chalForm.proposedDate}
                    onChange={e => setChalForm(p => ({ ...p, proposedDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-emerald-400 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5"><i className="fas fa-clock text-emerald-500 me-1" /> الوقت</label>
                  <select value={chalForm.proposedTime}
                    onChange={e => setChalForm(p => ({ ...p, proposedTime: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-emerald-400 outline-none">
                    {['08:00','09:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5"><i className="fas fa-map-marker-alt text-emerald-500 me-1" /> الملعب المقترح (اختياري)</label>
                <input type="text" value={chalForm.proposedFieldName}
                  onChange={e => setChalForm(p => ({ ...p, proposedFieldName: e.target.value }))}
                  placeholder="مثال: ملعب الأمير محمد"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-emerald-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5"><i className="fas fa-comment text-emerald-500 me-1" /> رسالة للفريق الخصم</label>
                <textarea value={chalForm.message}
                  onChange={e => setChalForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="مثال: جاهزون للتحدي! ⚽🔥"
                  rows={3} maxLength={200}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-emerald-400 outline-none resize-none" />
                <p className="text-[10px] text-slate-400 mt-1 text-end">{chalForm.message.length}/200</p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setChallengeTarget(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold rounded-xl text-sm transition-colors">إلغاء</button>
              <button onClick={handleSendChallenge} disabled={chalSending}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm">
                {chalSending ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الإرسال...</> : <><i className="fas fa-paper-plane" /> إرسال التحدي</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      {(!myTeam && noTeamView === 'choice') ? null : (
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-3">
          {!myTeam && noTeamView !== 'choice' && (
            <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 transition-colors flex-shrink-0">
              <i className="fas fa-arrow-right text-sm" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <i className="fas fa-users text-emerald-500" />
              {!myTeam && noTeamView === 'create' ? 'إنشاء فريق جديد' : !myTeam && noTeamView === 'explore' ? 'انضم لفريق' : 'الفرق'}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {myTeam ? `عضو في فريق «${myTeam.name}» 🏆`
               : noTeamView === 'create'  ? 'أنت ستكون قائد الفريق'
               : noTeamView === 'explore' ? `${otherTeams.length} فريق متاح`
               : 'اختر كيف تريد البدء'}
            </p>
          </div>
          {myTeam && (pendingIncoming > 0 || pendingJoinReqs > 0) && (
            <button onClick={() => setHasTeamTab(pendingJoinReqs > 0 ? 'myTeam' : 'challenges')}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse">
              <i className="fas fa-bell" /> {pendingIncoming + pendingJoinReqs} تنبيه جديد
            </button>
          )}
          {/* زر مغادرة/حل الفريق في أعلى الهيدر */}
          {myTeam && (
            myTeam.userId === user?.id ? (
              <button onClick={handleDeleteTeam} title="مغادرة المجموعة"
                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-red-100 hover:border-red-300 transition-all flex-shrink-0">
                <i className="fas fa-trash-alt text-[10px]" /> مغادرة المجموعة
              </button>
            ) : (
              <button onClick={handleLeaveTeam} title="مغادرة الفريق"
                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-red-100 hover:border-red-300 transition-all flex-shrink-0">
                <i className="fas fa-sign-out-alt text-[10px]" /> مغادرة الفريق
              </button>
            )
          )}
        </div>

        {myTeam && (
          <div className="max-w-4xl mx-auto px-4 pb-0">
            <div className="flex border-b border-gray-100">
              {([
                { key: 'myTeam'     as HasTeamTab, icon: 'fa-shield-alt',  label: 'فريقي'            },
                { key: 'record'     as HasTeamTab, icon: 'fa-history',      label: 'سجل الفريق'       },
                { key: 'findTeams'  as HasTeamTab, icon: 'fa-search',       label: 'البحث عن فرق'     },
                { key: 'challenges' as HasTeamTab, icon: 'fa-fist-raised',  label: 'المباريات الودية',
                  badge: pendingIncoming > 0 ? pendingIncoming : undefined },
              ]).map(tab => (
                <button key={tab.key} onClick={() => setHasTeamTab(tab.key)}
                  className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
                    hasTeamTab === tab.key ? 'text-emerald-600 border-emerald-500' : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}>
                  <i className={`fas ${tab.icon} text-xs`} /> {tab.label}
                  {tab.badge && (
                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      <div className={`space-y-4 ${(!myTeam && noTeamView === 'choice') ? '' : 'max-w-4xl mx-auto px-4 py-6'}`}>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />)}</div>

        ) : myTeam ? (
          <>
            {/* ── TAB: فريقي ─────────────────────────────────────────────────── */}
            {hasTeamTab === 'myTeam' && (
              <div className="space-y-4">
                {/* Team Card with logo picker button */}
                <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute -top-8 -end-8 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
                  <div className="absolute -bottom-10 -start-10 w-44 h-44 bg-white/5 rounded-full pointer-events-none" />

                  <div className="relative flex items-start gap-4">

                    {/* Logo — clickable to change */}
                    <div className="relative flex-shrink-0 group cursor-pointer" onClick={() => setShowLogoPicker(true)}>
                      <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center overflow-hidden">
                        {isEmoji(myTeam.logo)
                          ? <span className="text-3xl">{myTeam.logo}</span>
                          : <img src={myTeam.logo} alt="logo" className="w-full h-full object-cover" />
                        }
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <i className="fas fa-camera text-white text-sm" />
                      </div>
                      <div className="absolute -bottom-1 -end-1 w-5 h-5 bg-emerald-400 rounded-lg flex items-center justify-center shadow-sm">
                        <i className="fas fa-pen text-white text-[8px]" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-xl font-black">{myTeam.name}</h2>
                        <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0">
                          <i className="fas fa-crown text-yellow-400 me-1 text-[8px]" />قائد
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1 flex items-center gap-1.5">
                        <i className="fas fa-users text-[9px]" /> {myTeam.players?.length || 1} لاعب
                        <span className="text-slate-600 text-[9px]">· اضغط على الشعار لتغييره</span>
                      </p>
                      <div className="grid grid-cols-4 gap-1.5 mt-3 bg-white/5 rounded-xl p-3">
                        <div className="text-center"><p className="text-base font-black text-emerald-400">{myTeam.wins}</p><p className="text-[9px] text-slate-400 font-bold">فوز</p></div>
                        <div className="text-center border-s border-white/10"><p className="text-base font-black text-yellow-400">{myTeam.draws}</p><p className="text-[9px] text-slate-400 font-bold">تعادل</p></div>
                        <div className="text-center border-s border-white/10"><p className="text-base font-black text-red-400">{myTeam.losses}</p><p className="text-[9px] text-slate-400 font-bold">خسارة</p></div>
                        <div className="text-center border-s border-white/10">
                          <p className="text-base font-black text-amber-300">{teamHistory.champWins || 0}</p>
                          <p className="text-[9px] text-slate-400 font-bold">🏆 بطولة</p>
                        </div>
                      </div>
                      {/* إنجازات الفريق */}
                      {teamHistory.tournaments.filter(t => t.isChampion || t.isRunnerUp).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {teamHistory.tournaments.filter(t => t.isChampion || t.isRunnerUp).map(t => (
                            <span key={t.id} className={`text-[9px] font-black px-2 py-1 rounded-lg border ${
                              t.isChampion
                                ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                                : 'bg-slate-400/20 text-slate-300 border-slate-400/30'
                            }`}>
                              {t.isChampion ? '🥇' : '🥈'} {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Players — with management actions */}
                  {myTeam.players && myTeam.players.length > 0 && (
                    <div className="relative mt-4 pt-4 border-t border-white/10">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2.5">
                        <i className="fas fa-users me-1" />اللاعبون ({myTeam.players.length})
                      </p>
                      <div className="space-y-1.5">
                        {myTeam.players.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl px-2.5 py-1.5 transition-colors group">
                            <span className="w-6 h-6 bg-emerald-500/30 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 text-emerald-300">{p.charAt(0)}</span>
                            <button onClick={() => setProfilePlayer(p)} className="flex-1 text-start text-xs font-bold text-white/90 hover:text-white flex items-center gap-1.5 min-w-0">
                              <span className="truncate">{p}</span>
                              {p === user?.name && <i className="fas fa-crown text-yellow-400 text-[8px] flex-shrink-0" />}
                              {myTeam.viceCaptain === p && <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded-full font-black flex-shrink-0">مساعد</span>}
                            </button>
                            {/* Captain actions — not shown for self */}
                            {p !== user?.name && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  onClick={() => handleToggleViceCaptain(p)}
                                  title={myTeam.viceCaptain === p ? 'إزالة دور المساعد' : 'ترقية لمساعد القائد'}
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${myTeam.viceCaptain === p ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30' : 'bg-white/10 text-white/50 hover:bg-amber-400/20 hover:text-amber-300'}`}>
                                  <i className="fas fa-star text-[9px]" />
                                </button>
                                <button
                                  onClick={() => handleKickMember(p)}
                                  title="طرد من الفريق"
                                  className="w-6 h-6 rounded-lg bg-white/10 hover:bg-red-500/30 text-white/50 hover:text-red-400 flex items-center justify-center transition-colors">
                                  <i className="fas fa-user-times text-[9px]" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={() => navigate('/leagues')}
                    className="relative mt-4 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all">
                    <i className="fas fa-trophy text-yellow-300 text-xs" /> انضم لبطولة بفريقك
                  </button>

                </div>

                {/* ── Join Requests ─────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-user-plus text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 flex items-center gap-2">
                          طلبات الانضمام
                          {pendingJoinReqs > 0 && (
                            <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{pendingJoinReqs}</span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-400">{pendingJoinReqs > 0 ? `${pendingJoinReqs} طلب في انتظار قرارك` : 'لا طلبات جديدة'}</p>
                      </div>
                    </div>
                  </div>
                  {jrLoading ? (
                    <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
                  ) : joinRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <i className="fas fa-inbox text-3xl text-gray-200" />
                      <p className="text-sm text-slate-400 font-bold">لا طلبات انضمام حالياً</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {joinRequests.map(jr => (
                        <div key={jr.id} className="flex items-center gap-3 px-5 py-3.5">
                          <img src={jr.userAvatar} alt={jr.userName} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">{jr.userName}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <i className="fas fa-clock text-[8px]" />
                              {new Date(jr.requestedAt).toLocaleDateString('ar-JO')}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleRespondJoinRequest(jr.id, 'rejected')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 rounded-xl text-xs font-bold transition-colors">
                              <i className="fas fa-times text-[10px]" /> رفض
                            </button>
                            <button
                              onClick={() => handleRespondJoinRequest(jr.id, 'accepted')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-bold transition-colors">
                              <i className="fas fa-check text-[10px]" /> قبول
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Team Description & Rules ───────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-align-left text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900">وصف الفريق وقواعده</h3>
                        <p className="text-xs text-slate-400">خصّص هوية فريقك</p>
                      </div>
                    </div>
                    {!editingInfo && (
                      <button
                        onClick={() => { setEditingInfo(true); setInfoForm({ description: myTeam.description || '', rules: myTeam.rules || '' }); }}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors">
                        <i className="fas fa-pen text-[9px]" /> تعديل
                      </button>
                    )}
                  </div>
                  <div className="p-5 space-y-4">
                    {editingInfo ? (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">وصف الفريق</label>
                          <textarea value={infoForm.description}
                            onChange={e => setInfoForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="أخبر اللاعبين عن فريقك، أهدافه، وأسلوب لعبه..."
                            rows={3} maxLength={300}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none" />
                          <p className="text-[10px] text-slate-400 mt-0.5 text-end">{infoForm.description.length}/300</p>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">قواعد الفريق</label>
                          <textarea value={infoForm.rules}
                            onChange={e => setInfoForm(p => ({ ...p, rules: e.target.value }))}
                            placeholder="مثال:&#10;• الالتزام بالتدريب إلزامي&#10;• التصرف باحترافية&#10;• الحضور قبل المباراة بـ 30 دقيقة"
                            rows={4} maxLength={500}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none" />
                          <p className="text-[10px] text-slate-400 mt-0.5 text-end">{infoForm.rules.length}/500</p>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => setEditingInfo(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold rounded-xl text-sm transition-colors">إلغاء</button>
                          <button onClick={handleSaveTeamInfo} disabled={infoSaving}
                            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                            {infoSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />جاري الحفظ...</> : <><i className="fas fa-check text-xs" />حفظ</>}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                            <i className="fas fa-info-circle text-slate-300" /> الوصف
                          </p>
                          {myTeam.description
                            ? <p className="text-sm text-slate-700 leading-relaxed">{myTeam.description}</p>
                            : <p className="text-sm text-slate-300 italic">لم يُضَف وصف بعد — اضغط تعديل</p>
                          }
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                            <i className="fas fa-list-ul text-slate-300" /> قواعد الفريق
                          </p>
                          {myTeam.rules
                            ? <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{myTeam.rules}</p>
                            : <p className="text-sm text-slate-300 italic">لم تُحدَّد قواعد بعد — اضغط تعديل</p>
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Chat */}
                <TeamChatSection
                  chatMsgs={chatMsgs} chatLoading={chatLoading}
                  chatInput={chatInput} setChatInput={setChatInput}
                  chatSending={chatSending} chatEndRef={chatEndRef}
                  handleSendChat={handleSendChat} user={user}
                />
                <TournamentBanner openLeagues={openLeagues} navigate={navigate} />
              </div>
            )}

            {/* ── TAB: سجل الفريق ──────────────────────────────────────────────── */}
            {hasTeamTab === 'record' && (
              <div className="space-y-4">
                {historyLoading ? (
                  <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-gray-100" />)}</div>
                ) : (
                  <>
                    {/* ─ إنجازات ─ */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                        <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                          <i className="fas fa-trophy text-amber-500" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">إنجازات الفريق</p>
                          <p className="text-[11px] text-slate-400">{teamHistory.champWins} بطولة محرزة</p>
                        </div>
                      </div>
                      {teamHistory.tournaments.filter(t => t.isChampion || t.isRunnerUp).length === 0 ? (
                        <div className="py-8 text-center">
                          <i className="fas fa-medal text-4xl text-gray-200 mb-2 block" />
                          <p className="text-slate-400 text-sm font-bold">لا توجد إنجازات بعد</p>
                          <p className="text-slate-300 text-xs mt-1">انضم لبطولة وحقق مجدك! 🏆</p>
                        </div>
                      ) : (
                        <div className="p-4 space-y-2">
                          {teamHistory.tournaments.filter(t => t.isChampion || t.isRunnerUp).map(t => (
                            <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                              t.isChampion ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'
                            }`}>
                              <span className="text-2xl">{t.isChampion ? '🥇' : '🥈'}</span>
                              <div className="flex-1">
                                <p className={`text-sm font-black ${t.isChampion ? 'text-amber-700' : 'text-slate-600'}`}>{t.name}</p>
                                <p className="text-[10px] text-slate-400">{t.isChampion ? 'بطل البطولة' : 'المركز الثاني'} · {t.prizePool}</p>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                                t.isChampion ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>{t.type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ─ سجل المباريات ─ */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                        <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                          <i className="fas fa-futbol text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">سجل المباريات</p>
                          <p className="text-[11px] text-slate-400">{teamHistory.matches.length} مباراة</p>
                        </div>
                      </div>
                      {teamHistory.matches.length === 0 ? (
                        <div className="py-8 text-center">
                          <i className="fas fa-futbol text-4xl text-gray-200 mb-2 block" />
                          <p className="text-slate-400 text-sm font-bold">لا توجد مباريات بعد</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {teamHistory.matches.map(m => (
                            <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                              {/* نتيجة */}
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0 ${
                                m.result === 'win'      ? 'bg-emerald-100 text-emerald-700'
                                : m.result === 'loss'   ? 'bg-red-100 text-red-600'
                                : m.result === 'draw'   ? 'bg-amber-100 text-amber-700'
                                : m.result === 'live'   ? 'bg-blue-100 text-blue-600 animate-pulse'
                                : 'bg-slate-100 text-slate-500'
                              }`}>
                                {m.result === 'win' ? 'ف' : m.result === 'loss' ? 'خ' : m.result === 'draw' ? 'ت' : m.result === 'live' ? '●' : '—'}
                              </span>
                              {/* تفاصيل */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-800 truncate">
                                  ضد {m.opponent}
                                  {m.myScore !== null && m.theirScore !== null && (
                                    <span className="font-black text-slate-500 ms-1">({m.myScore} - {m.theirScore})</span>
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">{m.leagueName} · {fmtDate(m.date)}</p>
                              </div>
                              {/* الدور */}
                              {m.round && (
                                <span className="text-[9px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 flex-shrink-0">
                                  {{ group:'مجموعات', qf:'ربع نهائي', sf:'نصف نهائي', final:'النهائي', r16:'دور الـ16' }[m.round] || m.round}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ─ البطولات ─ */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                        <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                          <i className="fas fa-layer-group text-purple-500" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">البطولات المشارك فيها</p>
                          <p className="text-[11px] text-slate-400">{teamHistory.tournaments.length} بطولة</p>
                        </div>
                      </div>
                      {teamHistory.tournaments.length === 0 ? (
                        <div className="py-8 text-center">
                          <i className="fas fa-list text-4xl text-gray-200 mb-2 block" />
                          <p className="text-slate-400 text-sm font-bold">لم يُسجّل في أي بطولة بعد</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {teamHistory.tournaments.map(t => (
                            <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                              <span className="text-xl flex-shrink-0">
                                {t.isChampion ? '🥇' : t.isRunnerUp ? '🥈' : t.status === 'جارية' ? '⚽' : t.status === 'قادمة' ? '🗓️' : '🎖️'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-800 truncate">{t.name}</p>
                                <p className="text-[10px] text-slate-400">{t.type} · {t.prizePool}</p>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-1 rounded-lg border flex-shrink-0 ${
                                t.status === 'جارية'  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : t.status === 'قادمة' ? 'bg-blue-50 text-blue-600 border-blue-100'
                                : 'bg-slate-50 text-slate-500 border-slate-100'
                              }`}>{t.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── TAB: البحث عن فرق ──────────────────────────────────────────── */}
            {hasTeamTab === 'findTeams' && (
              <div className="space-y-4">
                <div className="relative">
                  <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    placeholder="ابحث باسم الفريق..."
                    className="w-full ps-11 pe-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm shadow-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none" />
                  <i className="fas fa-search absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  {searchQ && <button onClick={() => setSearchQ('')} className="absolute end-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><i className="fas fa-times text-sm" /></button>}
                </div>

                {filteredTeams.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                    <i className="fas fa-search text-4xl text-gray-200 mb-3 block" />
                    <p className="font-bold text-slate-400">{searchQ ? `لا نتائج لـ "${searchQ}"` : 'لا توجد فرق أخرى'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wide flex items-center gap-2">
                      <i className="fas fa-users text-emerald-400" /> {filteredTeams.length} فريق متاح
                    </p>
                    {filteredTeams.map((t, rank) => (
                      <FindTeamCard key={t.id} team={t} rank={rank} myTeam={myTeam}
                        onChallenge={() => setChallengeTarget(t)}
                        onPlayerClick={setProfilePlayer}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: المباريات الودية ──────────────────────────────────────── */}
            {hasTeamTab === 'challenges' && (
              <div className="space-y-5">
                {challLoading ? (
                  [...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />)
                ) : (
                  <>
                    <section>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-3">
                        <i className="fas fa-inbox text-red-400" /> طلبات واردة ({incoming.length})
                      </p>
                      {incoming.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                          <i className="fas fa-inbox text-3xl text-gray-200 mb-2 block" />
                          <p className="text-slate-400 text-sm font-bold">لا طلبات واردة</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {incoming.map(ch => (
                            <ChallengeCard key={ch.id} challenge={ch} type="incoming"
                              myTeamId={myTeam.id}
                              onAccept={() => handleRespond(ch.id, 'accepted')}
                              onReject={() => handleRespond(ch.id, 'rejected')}
                              openChalChat={openChalChat} setOpenChalChat={setOpenChalChat}
                              chalChatMsgs={chalChatMsgs}
                              chalChatInput={chalChatInput} setChalChatInput={setChalChatInput}
                              chalChatSending={chalChatSending} handleSendChalChat={handleSendChalChat}
                              chalChatEndRef={chalChatEndRef}
                              onPlayerClick={setProfilePlayer}
                              allTeams={teams}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                    <section>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-3">
                        <i className="fas fa-paper-plane text-emerald-400" /> طلبات مُرسلة ({sent.length})
                      </p>
                      {sent.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                          <i className="fas fa-paper-plane text-3xl text-gray-200 mb-2 block" />
                          <p className="text-slate-400 text-sm font-bold">لم ترسل أي تحديات بعد</p>
                          <button onClick={() => setHasTeamTab('findTeams')} className="mt-3 text-emerald-600 text-sm font-bold hover:underline">ابحث عن فرق لتحديها</button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sent.map(ch => (
                            <ChallengeCard key={ch.id} challenge={ch} type="sent"
                              myTeamId={myTeam.id}
                              openChalChat={openChalChat} setOpenChalChat={setOpenChalChat}
                              chalChatMsgs={chalChatMsgs}
                              chalChatInput={chalChatInput} setChalChatInput={setChalChatInput}
                              chalChatSending={chalChatSending} handleSendChalChat={handleSendChalChat}
                              chalChatEndRef={chalChatEndRef}
                              onPlayerClick={setProfilePlayer}
                              allTeams={teams}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                )}
              </div>
            )}
          </>

        ) : noTeamView === 'choice' ? (

          /* ── CHOICE SCREEN — Full Hero with Buttons Inside ─────────────────── */
          <div
            className="relative flex flex-col items-center justify-center text-center w-full overflow-hidden"
            style={{ minHeight: 'calc(100vh - 73px)' }}
          >
            {/* خلفية الصورة */}
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1600&q=80"
                alt="ملعب"
                className="w-full h-full object-cover object-center scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-950/95" />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 to-transparent" />
            </div>

            {/* المحتوى */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-md mx-auto px-5 py-12">

              {/* العنوان */}
              <h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-5 tracking-tight">
                كوّن فريقك..
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 to-teal-300">
                  وانطلق للمجد! 🏆
                </span>
              </h2>

              {/* وصف */}
              <p className="text-base text-slate-300 leading-relaxed mb-8 font-light">
                أنشئ فريقك الخاص أو انضم لفريق موجود وخض البطولات مع أفضل اللاعبين في الأردن
              </p>

              {/* إحصائيات */}
              <div className="flex items-center gap-8 mb-10">
                {[
                  { val: String(otherTeams.length),  label: 'فريق نشط',    icon: 'fa-users'  },
                  { val: String(openLeagues.length), label: 'بطولة مفتوحة', icon: 'fa-trophy' },
                  { val: String(otherTeams.reduce((s, t) => s + (t.players?.length || 0), 0)), label: 'لاعب مسجّل', icon: 'fa-futbol' },
                ].map((s, i) => (
                  <React.Fragment key={s.label}>
                    {i > 0 && <div className="w-px h-10 bg-white/15" />}
                    <div className="text-center">
                      <i className={`fas ${s.icon} text-emerald-400 text-xs mb-1 block`} />
                      <p className="text-2xl font-black text-white">{s.val}</p>
                      <p className="text-[11px] text-slate-400 font-bold mt-0.5">{s.label}</p>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* الكبسات */}
              <div className="w-full flex flex-col gap-3">

                {/* أنشئ فريقك */}
                <button
                  onClick={() => { setNoTeamView('create'); setStep(1); }}
                  className="w-full flex items-center gap-4 bg-gradient-to-l from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-2xl px-5 py-4 text-start transition-all shadow-lg shadow-emerald-900/50 hover:-translate-y-0.5"
                >
                  <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-shield-alt text-white text-base" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-white text-base">أنشئ فريقك</h3>
                    <p className="text-emerald-100/80 text-xs mt-0.5">كوّن فريقك، اختر الشعار والاسم وادع اللاعبين</p>
                  </div>
                  <i className="fas fa-arrow-left text-white/60 text-sm flex-shrink-0" />
                </button>

                {/* انضم لفريق */}
                <button
                  onClick={() => setNoTeamView('explore')}
                  className="group w-full flex items-center gap-4 bg-white/10 hover:bg-white/18 backdrop-blur-sm border border-white/20 hover:border-white/40 rounded-2xl px-5 py-4 text-start transition-all hover:-translate-y-0.5"
                >
                  <div className="w-11 h-11 bg-blue-500/30 group-hover:bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                    <i className="fas fa-user-plus text-blue-300 group-hover:text-white text-base transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-white text-base">انضم لفريق</h3>
                    <p className="text-slate-400 text-xs mt-0.5">تصفح {otherTeams.length} فريق وأرسل طلب الانضمام</p>
                  </div>
                  <i className="fas fa-arrow-left text-white/40 text-sm flex-shrink-0" />
                </button>

                {/* بانر البطولات */}
                {openLeagues.length > 0 && (
                  <button
                    onClick={() => navigate('/leagues')}
                    className="w-full flex items-center gap-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-400/50 backdrop-blur-sm rounded-2xl px-5 py-3.5 transition-all"
                  >
                    <span className="text-xl">🏆</span>
                    <div className="flex-1 text-start">
                      <p className="font-black text-white text-sm">{openLeagues[0].name}</p>
                      <p className="text-amber-300/80 text-xs font-medium mt-0.5">التسجيل مفتوح · {openLeagues.length} بطولة متاحة</p>
                    </div>
                    <i className="fas fa-arrow-left text-amber-400 text-sm" />
                  </button>
                )}
              </div>
            </div>
          </div>

        ) : noTeamView === 'create' ? (

          /* ── CREATE FLOW ────────────────────────────────────────────────────── */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {[1, 2].map(n => (
                <React.Fragment key={n}>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    step === n ? 'bg-emerald-500 text-white shadow-sm' :
                    step > n   ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-slate-400'
                  }`}>
                    {step > n ? <i className="fas fa-check text-xs" /> : <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-black">{n}</span>}
                    {n === 1 ? 'الشعار' : 'التفاصيل'}
                  </div>
                  {n < 2 && <div className="flex-1 h-0.5 bg-gray-200 rounded-full"><div className={`h-full bg-emerald-400 rounded-full transition-all ${step > 1 ? 'w-full' : 'w-0'}`} /></div>}
                </React.Fragment>
              ))}
            </div>

            {/* STEP 1 — logo picker (emoji + upload) */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Preview */}
                <div className="flex justify-center py-6 bg-gray-50 border-b border-gray-100">
                  <div className="w-24 h-24 bg-white border-2 border-emerald-200 rounded-2xl flex items-center justify-center shadow-md overflow-hidden">
                    {isEmoji(form.logo)
                      ? <span className="text-5xl">{form.logo}</span>
                      : <img src={form.logo} alt="logo" className="w-full h-full object-cover" />
                    }
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                  {[
                    { key: 'emoji'  as LogoTab, label: 'شارة الفريق', icon: 'fa-shield-alt' },
                    { key: 'upload' as LogoTab, label: 'رفع صورة',    icon: 'fa-image'      },
                  ].map(t => (
                    <button key={t.key} onClick={() => setCreateLogoTab(t.key)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-all ${
                        createLogoTab === t.key ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}>
                      <i className={`fas ${t.icon} text-xs`} /> {t.label}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  {createLogoTab === 'emoji' ? (
                    <div className="mb-5">
                      <BadgePicker
                        onSelect={url => setForm(p => ({ ...p, logo: url }))}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4 mb-5">
                      <div
                        onClick={() => createFileRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 hover:border-emerald-300 rounded-2xl p-8 text-center cursor-pointer transition-colors group">
                        <i className="fas fa-cloud-upload-alt text-3xl text-gray-300 group-hover:text-emerald-400 mb-2 block transition-colors" />
                        <p className="font-bold text-slate-500 group-hover:text-emerald-600 text-sm transition-colors">اضغط لاختيار صورة</p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG — حتى 2MB</p>
                      </div>
                      <input ref={createFileRef} type="file" accept="image/*" className="hidden" onChange={handleCreateLogoFile} />
                      {!isEmoji(form.logo) && form.logo.startsWith('data:') && (
                        <p className="text-xs text-emerald-600 font-bold text-center flex items-center justify-center gap-1">
                          <i className="fas fa-check-circle" /> تم تحميل الصورة
                        </p>
                      )}
                    </div>
                  )}

                  <button onClick={() => setStep(2)}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all">
                    التالي: تفاصيل الفريق <i className="fas fa-arrow-left text-xs" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-6 border border-emerald-100">
                  <div className="w-14 h-14 bg-white border-2 border-emerald-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                    {isEmoji(form.logo)
                      ? <span className="text-3xl">{form.logo}</span>
                      : <img src={form.logo} alt="logo" className="w-full h-full object-cover" />
                    }
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-base">{form.name || 'اسم فريقك'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">كرة قدم · قائد: {user?.name}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="ms-auto text-xs text-emerald-600 font-bold hover:underline flex-shrink-0">تغيير الشعار</button>
                </div>

                {formErr && (
                  <div className="flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-4 items-center">
                    <i className="fas fa-exclamation-circle flex-shrink-0" /> {formErr}
                  </div>
                )}

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم الفريق <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type="text" autoFocus value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="مثال: نسور الأردن" maxLength={30}
                        className="w-full ps-11 pe-14 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm" />
                      <i className="fas fa-shield-alt absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-bold">{form.name.length}/30</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">وصف الفريق <span className="text-slate-400 font-normal text-xs">(اختياري)</span></label>
                    <textarea value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="أخبر اللاعبين عن فريقك، أهدافه، وأسلوب لعبه..."
                      rows={2} maxLength={300}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none" />
                    <p className="text-[10px] text-slate-400 mt-0.5 text-end">{form.description.length}/300</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">قواعد الفريق <span className="text-slate-400 font-normal text-xs">(اختياري)</span></label>
                    <textarea value={form.rules}
                      onChange={e => setForm(p => ({ ...p, rules: e.target.value }))}
                      placeholder="مثال: الالتزام بالتدريب إلزامي، التصرف باحترافية..."
                      rows={2} maxLength={300}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none" />
                    <p className="text-[10px] text-slate-400 mt-0.5 text-end">{form.rules.length}/300</p>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={saving || !form.name.trim()}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-all">
                      {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الإنشاء...</> : <><i className="fas fa-rocket text-xs" /> إنشاء الفريق!</>}
                    </button>
                    <button type="button" onClick={() => setStep(1)} className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold rounded-xl text-sm transition-colors">
                      <i className="fas fa-arrow-right text-xs" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

        ) : (

          /* ── EXPLORE ────────────────────────────────────────────────────────── */
          <div className="space-y-4">
            <div className="relative">
              <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="ابحث باسم الفريق..."
                className="w-full ps-11 pe-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm shadow-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none" />
              <i className="fas fa-search absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              {searchQ && <button onClick={() => setSearchQ('')} className="absolute end-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><i className="fas fa-times text-sm" /></button>}
            </div>

            <div className="flex items-center gap-2">
              <i className="fas fa-star text-yellow-400 text-xs" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-wide">فرق مقترحة للانضمام</span>
            </div>

            {filteredTeams.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <i className="fas fa-users text-5xl text-gray-200 mb-3 block" />
                <p className="font-bold text-slate-400">{searchQ ? `لا نتائج لـ "${searchQ}"` : 'لا توجد فرق متاحة'}</p>
              </div>
            ) : (
              filteredTeams.map((t, rank) => {
                const hasReq = requested.has(t.id);
                return (
                  <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <div className="flex items-center gap-3 p-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${
                        rank === 0 ? 'bg-yellow-100 text-yellow-700' : rank === 1 ? 'bg-gray-100 text-gray-500' : rank === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                      }`}>{rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}</div>
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl border border-gray-100 flex-shrink-0 overflow-hidden">
                        {isEmoji(t.logo) ? t.logo : <img src={t.logo} alt="logo" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 truncate">{t.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400"><i className="fas fa-users text-[9px] me-0.5" />{t.players?.length || 0} لاعب</span>
                          <span className="text-xs font-bold text-emerald-600">{t.wins}ف</span>
                          <span className="text-xs text-yellow-500">{t.draws}ت</span>
                          <span className="text-xs text-red-400">{t.losses}خ</span>
                        </div>
                        {/* Player chips — clickable */}
                        {t.players && t.players.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {t.players.slice(0, 4).map((p, i) => (
                              <button key={i} onClick={() => setProfilePlayer(p)}
                                className="text-[10px] bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-500 px-2 py-0.5 rounded-full font-bold transition-colors">
                                {p}
                              </button>
                            ))}
                            {t.players.length > 4 && <span className="text-[10px] text-slate-400 px-1 py-0.5">+{t.players.length - 4}</span>}
                          </div>
                        )}
                      </div>
                      <div className="text-center flex-shrink-0 me-1">
                        <p className="font-black text-slate-900 text-lg leading-tight">{t.points}</p>
                        <p className="text-[10px] text-slate-400 font-bold">نقطة</p>
                      </div>
                      <button onClick={() => !hasReq && handleJoin(t.id)} disabled={hasReq || requesting === t.id}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          hasReq ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default' :
                          requesting === t.id ? 'bg-gray-100 text-gray-400' :
                          'bg-slate-800 hover:bg-slate-900 text-white shadow-sm hover:-translate-y-0.5'
                        }`}>
                        {hasReq ? <><i className="fas fa-check text-xs" /> تم</> :
                          requesting === t.id ? <div className="w-4 h-4 border-2 border-gray-300 border-t-slate-500 rounded-full animate-spin" /> :
                          <><i className="fas fa-user-plus text-xs" /> انضم</>}
                      </button>
                    </div>
                    {hasReq && (
                      <div className="px-4 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
                        <i className="fas fa-clock text-emerald-500 text-xs" />
                        <p className="text-xs text-emerald-700 font-bold">طلبك قيد المراجعة من قبل قائد الفريق</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <TournamentBanner openLeagues={openLeagues} navigate={navigate} />
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── TeamChatSection ─────────────────────────────────────────────────────── */
const TeamChatSection: React.FC<{
  chatMsgs: TeamChatMessage[]; chatLoading: boolean;
  chatInput: string; setChatInput: (v: string) => void;
  chatSending: boolean; chatEndRef: React.RefObject<HTMLDivElement>;
  handleSendChat: () => void; user: any;
}> = ({ chatMsgs, chatLoading, chatInput, setChatInput, chatSending, chatEndRef, handleSendChat, user }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
      <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <i className="fas fa-comments text-emerald-600" />
      </div>
      <div className="flex-1">
        <h3 className="font-black text-slate-900">شات الفريق</h3>
        <p className="text-xs text-slate-400">تواصل مع زملائك</p>
      </div>
      <span className="flex items-center gap-1.5 text-[10px] text-green-600 font-bold">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> مباشر
      </span>
    </div>
    <div className="overflow-y-auto bg-gray-50/40 px-4 py-3 space-y-3" style={{ height: '290px' }} dir="ltr">
      {chatLoading ? (
        <div className="flex items-center justify-center h-full"><div className="w-7 h-7 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : chatMsgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full" dir="rtl">
          <i className="fas fa-comments text-4xl text-gray-200 mb-2" />
          <p className="text-slate-400 text-sm font-bold">لا توجد رسائل بعد</p>
          <p className="text-slate-300 text-xs">كن أول من يبدأ المحادثة!</p>
        </div>
      ) : chatMsgs.map(msg => {
        const isMe = msg.userId === user?.id;
        return (
          <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
            <img src={msg.userAvatar} alt={msg.userName} className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
            <div className={`flex flex-col max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && <span className="text-[10px] font-bold text-slate-500 mb-0.5 mx-1.5">{msg.userName}</span>}
              <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-emerald-500 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-slate-800 shadow-sm rounded-bl-sm'}`}>{msg.text}</div>
              <span className="text-[9px] text-slate-400 mt-0.5 mx-1.5">{fmtTime(msg.timestamp)}</span>
            </div>
          </div>
        );
      })}
      <div ref={chatEndRef} />
    </div>
    <div className="px-4 py-3 border-t border-gray-100 flex gap-2" dir="rtl">
      <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
        placeholder="اكتب رسالتك..." maxLength={300}
        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm" />
      <button onClick={handleSendChat} disabled={!chatInput.trim() || chatSending}
        className="w-10 h-10 flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all">
        {chatSending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <i className="fas fa-paper-plane text-sm" />}
      </button>
    </div>
  </div>
);

/* ─── FindTeamCard ────────────────────────────────────────────────────────── */
const FindTeamCard: React.FC<{
  team: Team; rank: number; myTeam: Team;
  onChallenge: () => void;
  onPlayerClick: (name: string) => void;
}> = ({ team: t, rank, onChallenge, onPlayerClick }) => {
  const isEmoji = (s: string) => s.length <= 4 && !s.startsWith('data:') && !s.startsWith('http');
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="flex items-center gap-3 p-4 pb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${
          rank === 0 ? 'bg-yellow-100 text-yellow-700' : rank === 1 ? 'bg-gray-100 text-gray-500' : rank === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
        }`}>{rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}</div>
        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
          {isEmoji(t.logo) ? <span className="text-2xl">{t.logo}</span> : <img src={t.logo} alt="logo" className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 truncate">{t.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400"><i className="fas fa-users text-[9px] me-0.5" />{t.players?.length || 0} لاعب</span>
            <span className="text-xs font-bold text-emerald-600">{t.wins}ف</span>
            <span className="text-xs text-yellow-500">{t.draws}ت</span>
            <span className="text-xs text-red-400">{t.losses}خ</span>
          </div>
        </div>
        <div className="text-center flex-shrink-0">
          <p className="font-black text-slate-900 text-lg leading-tight">{t.points}</p>
          <p className="text-[10px] text-slate-400 font-bold">نقطة</p>
        </div>
      </div>
      {/* Players */}
      {t.players && t.players.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-slate-400 font-bold mb-1.5">اللاعبون — اضغط للعرض</p>
          <div className="flex flex-wrap gap-1.5">
            {t.players.map((p, i) => (
              <button key={i} onClick={() => onPlayerClick(p)}
                className="flex items-center gap-1 text-[11px] bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-100 hover:border-emerald-200 text-slate-600 px-2.5 py-1 rounded-full font-bold transition-all">
                <span className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-[9px] font-black">{p.charAt(0)}</span>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Challenge button */}
      <div className="px-4 pb-4 pt-1">
        <button onClick={onChallenge}
          className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:-translate-y-0.5">
          <i className="fas fa-fist-raised text-xs" /> تحدي مباراة ودية
        </button>
      </div>
    </div>
  );
};

/* ─── ChallengeCard ───────────────────────────────────────────────────────── */
const ChallengeCard: React.FC<{
  challenge: FriendlyChallenge; type: 'incoming' | 'sent'; myTeamId: string;
  onAccept?: () => void; onReject?: () => void;
  openChalChat: string | null; setOpenChalChat: (id: string | null) => void;
  chalChatMsgs: ChallengeChat[]; chalChatInput: string;
  setChalChatInput: (v: string) => void; chalChatSending: boolean;
  handleSendChalChat: () => void; chalChatEndRef: React.RefObject<HTMLDivElement>;
  onPlayerClick: (name: string) => void;
  allTeams: Team[];
}> = ({ challenge: ch, type, onAccept, onReject, openChalChat, setOpenChalChat,
        chalChatMsgs, chalChatInput, setChalChatInput, chalChatSending,
        handleSendChalChat, chalChatEndRef, onPlayerClick, allTeams }) => {

  const isChatOpen = openChalChat === ch.id;
  const canChat    = ch.status === 'accepted' || ch.status === 'pending';
  const isEmoji    = (s: string) => s.length <= 4 && !s.startsWith('data:') && !s.startsWith('http');

  // Find opponent team data for showing players
  const opponentId  = type === 'incoming' ? ch.fromTeamId : ch.toTeamId;
  const opponentTeam = allTeams.find(t => t.id === opponentId);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        {/* Teams row */}
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-xl">{ch.fromTeamLogo}</span>
            <span className="font-black text-slate-700 text-sm truncate">{ch.fromTeamName}</span>
            <span className="text-slate-300 font-black text-xs px-1">⚔️</span>
            <span className="text-xl">{ch.toTeamLogo}</span>
            <span className="font-black text-slate-700 text-sm truncate">{ch.toTeamName}</span>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border flex-shrink-0 ${statusStyle[ch.status]}`}>
            {statusLabel[ch.status]}
          </span>
        </div>

        {/* Details */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
          {ch.proposedDate && <span className="flex items-center gap-1"><i className="fas fa-calendar text-emerald-400 text-[10px]" />{fmtDate(ch.proposedDate)} الساعة {ch.proposedTime}</span>}
          {ch.proposedFieldName && <span className="flex items-center gap-1"><i className="fas fa-map-marker-alt text-red-400 text-[10px]" />{ch.proposedFieldName}</span>}
        </div>

        {ch.message && (
          <div className="mt-3 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
            <p className="text-sm text-slate-600 italic">"{ch.message}"</p>
          </div>
        )}

        {/* Opponent players */}
        {opponentTeam?.players && opponentTeam.players.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 font-bold mb-1.5">
              لاعبو {type === 'incoming' ? ch.fromTeamName : ch.toTeamName} — اضغط للعرض
            </p>
            <div className="flex flex-wrap gap-1">
              {opponentTeam.players.slice(0, 5).map((p, i) => (
                <button key={i} onClick={() => onPlayerClick(p)}
                  className="text-[10px] bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-100 hover:border-emerald-200 text-slate-500 px-2 py-0.5 rounded-full font-bold transition-all">
                  {p}
                </button>
              ))}
              {opponentTeam.players.length > 5 && <span className="text-[10px] text-slate-400 px-1">+{opponentTeam.players.length - 5}</span>}
            </div>
          </div>
        )}

        {/* Actions */}
        {type === 'incoming' && ch.status === 'pending' && (
          <div className="mt-4 flex gap-2">
            <button onClick={onAccept} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
              <i className="fas fa-check" /> قبول التحدي
            </button>
            <button onClick={onReject} className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all">
              <i className="fas fa-times" /> رفض
            </button>
          </div>
        )}

        {canChat && (
          <button onClick={() => setOpenChalChat(isChatOpen ? null : ch.id)}
            className="mt-3 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors">
            <i className="fas fa-comments text-emerald-500" />
            {isChatOpen ? 'إخفاء المحادثة' : 'فتح المحادثة مع الفريق الخصم'}
            <i className={`fas fa-chevron-${isChatOpen ? 'up' : 'down'} text-[10px]`} />
          </button>
        )}
      </div>

      {/* Challenge Chat */}
      {isChatOpen && canChat && (
        <div className="border-t border-gray-100">
          <div className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center gap-2">
            <i className="fas fa-comments text-emerald-500 text-xs" />
            <span className="text-xs font-black text-emerald-700">محادثة التنسيق بين الفريقين</span>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse ms-auto" />
          </div>
          <div className="overflow-y-auto bg-gray-50/40 px-4 py-3 space-y-2.5" style={{ height: '220px' }} dir="ltr">
            {chalChatMsgs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full" dir="rtl">
                <i className="fas fa-handshake text-3xl text-gray-200 mb-2" />
                <p className="text-slate-400 text-sm font-bold">ابدأ المحادثة مع الفريق الخصم</p>
              </div>
            ) : chalChatMsgs.map(msg => (
              <div key={msg.id} className="flex items-start gap-2">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-[10px] font-black text-emerald-700 flex-shrink-0">{msg.teamName.charAt(0)}</div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-slate-500">{msg.senderName}</span>
                  <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm text-slate-700 mt-0.5 shadow-sm">{msg.text}</div>
                  <span className="text-[9px] text-slate-400">{fmtTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}
            <div ref={chalChatEndRef} />
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex gap-2" dir="rtl">
            <input type="text" value={chalChatInput} onChange={e => setChalChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChalChat(); } }}
              placeholder="اكتب رسالتك للفريق الخصم..." maxLength={200}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-emerald-400 outline-none" />
            <button onClick={handleSendChalChat} disabled={!chalChatInput.trim() || chalChatSending}
              className="w-10 h-10 flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all">
              {chalChatSending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <i className="fas fa-paper-plane text-sm" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── TournamentBanner ────────────────────────────────────────────────────── */
const TournamentBanner: React.FC<{ openLeagues: League[]; navigate: (p: string) => void }> = ({ openLeagues, navigate }) => (
  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-14 h-14 bg-yellow-400/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">🏆</div>
      <div>
        <h3 className="font-black text-lg">انضم لبطولة الآن!</h3>
        <p className="text-slate-400 text-sm mt-0.5">{openLeagues.length > 0 ? `${openLeagues.length} بطولة متاحة للتسجيل` : 'تابع البطولات والنتائج'}</p>
      </div>
    </div>
    {openLeagues.length > 0 && (
      <div className="space-y-2 mb-4">
        {openLeagues.slice(0, 2).map(l => (
          <div key={l.id} onClick={() => navigate(`/tournament/${l.id}`)}
            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 cursor-pointer transition-all">
            <i className="fas fa-trophy text-amber-400 text-sm flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{l.name}</p>
              <p className="text-slate-400 text-xs">{l.teamsCount}/{l.maxTeams} فريق · {l.prizePool}</p>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex-shrink-0">مفتوح</span>
          </div>
        ))}
      </div>
    )}
    <button onClick={() => navigate('/leagues')}
      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all">
      <i className="fas fa-list text-xs" /> عرض جميع البطولات
    </button>
  </div>
);

export default PlayerTeams;
