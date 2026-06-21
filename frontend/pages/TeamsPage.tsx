import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { TeamMessage } from '../services/api';
import type { FriendlyMatch } from '../services/backend';
import { Team, League } from '../types';

// ── Shield colour palette ─────────────────────────────────────────────────────
const PALETTE = [
  '#eab308','#f97316','#8b5cf6','#10b981',
  '#3b82f6','#ef4444','#14b8a6','#a16207',
  '#1e293b','#1e40af','#ec4899','#06b6d4',
];

// ── SVG shield templates ──────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'shield-classic', label: 'درع بنجمة'   },
  { id: 'shield-peak',    label: 'درع بقمة'     },
  { id: 'circle',         label: 'دائرة بنجمة'  },
  { id: 'shield-curved',  label: 'درع منحنية'   },
  { id: 'diamond',        label: 'معيّن بنجمة'  },
  { id: 'hexagon',        label: 'سداسي بنجمة'  },
];

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
      <path d="M34 20 L50 7 L66 20" fill="none" stroke="white" strokeWidth={2.5} opacity={0.55} strokeLinejoin="round" />
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

function LogoDisplay({ logo, color, size = 44 }: { logo: string; color: string; size?: number }) {
  const isCustom = logo.startsWith('data:') || logo.startsWith('http');
  if (isCustom) {
    return (
      <img
        src={logo}
        alt="شعار الفريق"
        style={{ width: size, height: size }}
        className="object-cover rounded-xl"
      />
    );
  }
  const templateId = TEMPLATES.some(t => t.id === logo) ? logo : 'shield-classic';
  return <ShieldSVG id={templateId} color={color} size={size} />;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const FORMATIONS = [
  { v: '4-3-3',   desc: 'هجومي، ضغط عالٍ'   },
  { v: '4-4-2',   desc: 'متوازن، كلاسيكي'    },
  { v: '4-2-3-1', desc: 'دفاعي متحرك'         },
  { v: '3-5-2',   desc: 'جنحات مزدوجة'       },
  { v: '5-3-2',   desc: 'مرتد سريع'           },
  { v: '3-4-3',   desc: 'هجومي جريء'          },
];
const FIELD_TYPES = ['5v5', '6v6', '7v7', '8v8', '11v11'];
const AGE_GROUPS  = ['ناشئون (تحت 18)', 'شباب (18-23)', 'بالغون (23+)', 'مختلط'];
const CITIES      = ['عمان','الزرقاء','إربد','العقبة','السلط','مادبا','جرش','عجلون','المفرق','الكرك','الطفيلة','معان'];

const DEFAULT_FORM = {
  name: '', logo: 'shield-classic', primaryColor: '#10b981',
  formation: '4-3-3', fieldType: '7v7',
  city: 'عمان', ageGroup: 'بالغون (23+)',
  captain: '', description: '',
};

type Tab       = 'all' | 'mine';
type FormMode  = 'none' | 'create' | 'edit';
type LogoTab   = 'shields' | 'upload';

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

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-80 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            <div className="text-center">
              <i className="fas fa-comments text-3xl mb-2 block text-gray-200" />
              لا توجد رسائل بعد، كن أول من يتحدث!
            </div>
          </div>
        ) : messages.map(m => {
          const isMe = m.userId === userId;
          return (
            <div key={m._id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ${isMe ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {m.userName?.[0] || '؟'}
              </div>
              <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isMe && (
                  <span className="text-[10px] text-slate-400 font-bold mb-0.5 px-1">{m.userName}</span>
                )}
                <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-emerald-500 text-white rounded-tr-sm' : 'bg-white text-slate-800 border border-gray-200 rounded-tl-sm shadow-sm'}`}>
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5 px-1">{fmt(m.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 bg-white p-3 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="اكتب رسالة..."
          className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          dir="rtl"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white flex items-center justify-center flex-shrink-0 transition-colors"
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

// ── Main Component ─────────────────────────────────────────────────────────────
const TeamsPage: React.FC = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const fileRef    = useRef<HTMLInputElement>(null);
  const tabsRef    = useRef<HTMLDivElement>(null);

  // ── State ────────────────────────────────────────────────────────────────────
  const [tab,           setTab]          = useState<Tab>('all');
  const [allTeams,      setAllTeams]     = useState<Team[]>([]);
  const [myTeams,       setMyTeams]      = useState<Team[]>([]);
  const [loading,       setLoading]      = useState(true);
  const [joiningId,     setJoiningId]    = useState<string | null>(null);
  const [toastOk,       setToastOk]      = useState('');
  const [toastErr,      setToastErr]     = useState('');
  const [formMode,      setFormMode]     = useState<FormMode>('none');
  const [editingTeam,   setEditingTeam]  = useState<Team | null>(null);
  const [form,          setForm]         = useState({ ...DEFAULT_FORM });
  const [formStep,      setFormStep]     = useState<1 | 2>(1);
  const [logoTab,       setLogoTab]      = useState<LogoTab>('shields');
  const [saving,        setSaving]       = useState(false);
  const [formError,     setFormError]    = useState('');
  const [delConfirmId,  setDelConfirmId] = useState<string | null>(null);
  const [deleting,      setDeleting]     = useState(false);
  const [openChatId,    setOpenChatId]   = useState<string | null>(null);
  const [openTourneys,  setOpenTourneys] = useState<League[]>([]);
  const [searchQ,       setSearchQ]      = useState('');

  // Friendly matches state
  const [friendlyMatches,       setFriendlyMatches]      = useState<FriendlyMatch[]>([]);
  const [fmLoading,             setFmLoading]            = useState(false);
  const [showChallengeModal,    setShowChallengeModal]   = useState(false);
  const [challengeTarget,       setChallengeTarget]      = useState<Team | null>(null);
  const [challengeForm,         setChallengeForm]        = useState({ fromTeamId: '', proposedDate: '', proposedTime: '', venue: '', fieldType: '7v7', message: '' });
  const [challengeSending,      setChallengeSending]     = useState(false);
  const [challengeError,        setChallengeError]       = useState('');
  const [fmActionId,            setFmActionId]           = useState<string | null>(null);

  // ── Loaders ──────────────────────────────────────────────────────────────────
  const loadFriendlyMatches = useCallback(async () => {
    setFmLoading(true);
    const matches = await backend.getMyFriendlyMatches();
    setFriendlyMatches(matches);
    setFmLoading(false);
  }, []);

  const loadAll = useCallback(async () => {
    const [all, mine, tourneys] = await Promise.all([
      backend.getAllTeams(),
      backend.getMyTeams(),
      backend.getLeagues(),
    ]);
    setAllTeams(all);
    setMyTeams(mine);
    setOpenTourneys(tourneys.filter(t => t.status === 'التسجيل متاح'));
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { if (user) loadFriendlyMatches(); }, [user, loadFriendlyMatches]);

  const toast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    if (type === 'ok') { setToastOk(msg); setTimeout(() => setToastOk(''), 3500); }
    else               { setToastErr(msg); setTimeout(() => setToastErr(''), 3500); }
  };

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => {
    setForm({ ...DEFAULT_FORM });
    setFormError('');
    setEditingTeam(null);
    setFormStep(1);
    setLogoTab('shields');
    setFormMode('create');
  };

  const openEdit = (team: Team) => {
    setForm({
      name:         team.name         || '',
      logo:         team.logo         || 'shield-classic',
      primaryColor: team.primaryColor || '#10b981',
      formation:    team.formation    || '4-3-3',
      fieldType:    team.fieldType    || '7v7',
      city:         team.city         || 'عمان',
      ageGroup:     team.ageGroup     || 'بالغون (23+)',
      captain:      team.captain      || '',
      description:  team.description  || '',
    });
    setFormError('');
    setEditingTeam(team);
    setFormStep(1);
    const isCustomLogo = team.logo?.startsWith('data:') || team.logo?.startsWith('http');
    setLogoTab(isCustomLogo ? 'upload' : 'shields');
    setFormMode('edit');
  };

  const cancelForm = () => { setFormMode('none'); setFormError(''); setEditingTeam(null); };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFormError('الصورة يجب أن تكون أقل من 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      // resize via canvas to cap at ~300px
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 300;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        set('logo', canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('أدخل اسم الفريق'); return; }
    setSaving(true);
    setFormError('');
    const payload: Partial<Team> = {
      id:           formMode === 'edit' ? editingTeam?.id : '',
      name:         form.name.trim(),
      logo:         form.logo,
      primaryColor: form.primaryColor,
      formation:    form.fieldType === '11v11' ? form.formation : '',
      fieldType:    form.fieldType,
      city:         form.city,
      ageGroup:     form.ageGroup,
      captain:      form.captain,
      description:  form.description,
      wins:    formMode === 'edit' ? (editingTeam?.wins   || 0) : 0,
      losses:  formMode === 'edit' ? (editingTeam?.losses || 0) : 0,
      draws:   formMode === 'edit' ? (editingTeam?.draws  || 0) : 0,
      points:  formMode === 'edit' ? (editingTeam?.points || 0) : 0,
      players: formMode === 'edit' ? (editingTeam?.players || [user?.name || '']) : [user?.name || ''],
    };
    const res = await backend.saveTeam(payload as Team);
    if (res.success) {
      await loadAll();
      toast(formMode === 'create' ? 'تم إنشاء الفريق بنجاح! 🎉' : 'تم تحديث الفريق بنجاح! ✅');
      setFormMode('none');
      setEditingTeam(null);
    } else {
      setFormError('حدث خطأ، حاول مجدداً');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    const ok = await backend.deleteTeam(id);
    if (ok) {
      await loadAll();
      setDelConfirmId(null);
      toast('تم حذف الفريق.');
    } else {
      toast('فشل الحذف، حاول مجدداً.', 'err');
    }
    setDeleting(false);
  };

  const handleJoin = async (teamId: string) => {
    setJoiningId(teamId);
    const res = await backend.joinTeam(teamId);
    if (res.success) {
      await loadAll();
      toast('تم الانضمام للفريق بنجاح! ✅');
    } else {
      toast(res.error || 'فشل الانضمام', 'err');
    }
    setJoiningId(null);
  };

  const handleLeave = async (teamId: string) => {
    setJoiningId(teamId);
    const res = await backend.leaveTeam(teamId);
    if (res.success) {
      await loadAll();
      toast('تم مغادرة الفريق.');
    } else {
      toast(res.error || 'فشل الخروج', 'err');
    }
    setJoiningId(null);
  };

  // ── Friendly match handlers ───────────────────────────────────────────────────
  const openChallengeModal = (target: Team) => {
    const defaultFromTeam = myTeams[0]?.id || '';
    setChallengeTarget(target);
    setChallengeForm({ fromTeamId: defaultFromTeam, proposedDate: '', proposedTime: '', venue: '', fieldType: target.fieldType || '7v7', message: '' });
    setChallengeError('');
    setShowChallengeModal(true);
  };

  const handleSendChallenge = async () => {
    if (!challengeTarget) return;
    if (!challengeForm.fromTeamId) { setChallengeError('اختر فريقك أولاً'); return; }
    setChallengeSending(true);
    setChallengeError('');
    const res = await backend.sendChallenge({
      fromTeamId: challengeForm.fromTeamId,
      toTeamId: challengeTarget.id,
      proposedDate: challengeForm.proposedDate,
      proposedTime: challengeForm.proposedTime,
      venue: challengeForm.venue,
      fieldType: challengeForm.fieldType,
      message: challengeForm.message,
    });
    if (res.success) {
      setShowChallengeModal(false);
      setChallengeTarget(null);
      toast('تم إرسال طلب المباراة الودية! 🎉');
      await loadFriendlyMatches();
    } else {
      setChallengeError(res.error || 'فشل إرسال الطلب');
    }
    setChallengeSending(false);
  };

  const handleAcceptChallenge = async (id: string) => {
    setFmActionId(id);
    const res = await backend.acceptChallenge(id);
    if (res.success) { toast('تم قبول التحدي الودي! ✅'); await loadFriendlyMatches(); }
    else toast(res.error || 'فشل القبول', 'err');
    setFmActionId(null);
  };

  const handleRejectChallenge = async (id: string) => {
    setFmActionId(id);
    const res = await backend.rejectChallenge(id);
    if (res.success) { toast('تم رفض التحدي.'); await loadFriendlyMatches(); }
    else toast(res.error || 'فشل الرفض', 'err');
    setFmActionId(null);
  };

  const handleCancelChallenge = async (id: string) => {
    setFmActionId(id);
    const res = await backend.cancelChallenge(id);
    if (res.success) { toast('تم إلغاء التحدي.'); await loadFriendlyMatches(); }
    else toast(res.error || 'فشل الإلغاء', 'err');
    setFmActionId(null);
  };

  // ── Filtered ─────────────────────────────────────────────────────────────────
  const filtered = allTeams.filter(t =>
    !searchQ || t.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    t.city?.toLowerCase().includes(searchQ.toLowerCase())
  );

  const isCustomLogoInForm = form.logo.startsWith('data:') || form.logo.startsWith('http');

  // ── Friendly match derived data ───────────────────────────────────────────────
  const myTeamIds    = myTeams.map(t => t.id);
  const fmIncoming   = friendlyMatches.filter(m => myTeamIds.includes(m.toTeamId)   && m.status === 'pending');
  const fmOutgoing   = friendlyMatches.filter(m => myTeamIds.includes(m.fromTeamId) && m.status === 'pending');
  const fmHistory    = friendlyMatches.filter(m => m.status !== 'pending');
  const pendingFmCount = fmIncoming.length;

  // ── Full-screen form ─────────────────────────────────────────────────────────
  if (formMode !== 'none') {
    const accent = form.primaryColor;
    return (
      <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-4">
            <button onClick={cancelForm} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <i className="fas fa-arrow-right text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {formMode === 'create' ? 'إنشاء فريق جديد' : 'تعديل الفريق'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">أنت ستكون قائد الفريق</p>
            </div>
          </div>
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex border-b border-gray-100">
              {[{ step: 1 as const, label: 'الشعار' }, { step: 2 as const, label: 'التفاصيل' }].map(t => (
                <button
                  key={t.step}
                  onClick={() => { if (t.step === 2 && !form.name.trim() && formMode === 'create') return; setFormStep(t.step); }}
                  className={`flex-1 py-3.5 text-sm font-black transition-all border-b-2 ${formStep === t.step ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                >{t.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          {formError && (
            <div className="flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3.5 rounded-xl mb-5">
              <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0" /> {formError}
            </div>
          )}

          {/* ── STEP 1: Logo designer ──────────────────────────────────────── */}
          {formStep === 1 && (
            <div className="space-y-6">
              {/* Preview */}
              <div className="flex flex-col items-center gap-3 py-6">
                <div
                  className="w-32 h-32 rounded-3xl flex items-center justify-center shadow-xl border-4 border-white overflow-hidden"
                  style={{ background: isCustomLogoInForm ? '#f1f5f9' : `${accent}22` }}
                >
                  <LogoDisplay logo={form.logo} color={accent} size={96} />
                </div>
                {!isCustomLogoInForm && (
                  <p className="text-sm font-bold text-slate-500">
                    {TEMPLATES.find(t => t.id === form.logo)?.label || ''}
                  </p>
                )}
              </div>

              {/* Logo source tabs */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setLogoTab('shields'); if (isCustomLogoInForm) set('logo', 'shield-classic'); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${logoTab === 'shields' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                >
                  <i className="fas fa-shield-alt me-1.5" /> الشعارات
                </button>
                <button
                  type="button"
                  onClick={() => setLogoTab('upload')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${logoTab === 'upload' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                >
                  <i className="fas fa-image me-1.5" /> رفع صورة
                </button>
              </div>

              {logoTab === 'shields' ? (
                <>
                  {/* Template grid */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">النموذج</p>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                      {TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => set('logo', t.id)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${form.logo === t.id ? 'border-slate-800 bg-slate-50 shadow-md scale-105' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                        >
                          <ShieldSVG id={t.id} color={form.logo === t.id ? accent : '#94a3b8'} size={44} />
                          <span className="text-[10px] font-bold text-slate-500 text-center leading-tight">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color grid */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">اللون</p>
                    <div className="grid grid-cols-6 gap-2.5">
                      {PALETTE.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => set('primaryColor', c)}
                          className={`h-11 rounded-xl transition-all ${form.primaryColor === c ? 'ring-4 ring-offset-2 ring-slate-600 scale-105 shadow-md' : 'hover:scale-105 hover:shadow-sm'}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Upload image */
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  {isCustomLogoInForm ? (
                    <div className="flex flex-col items-center gap-4">
                      <img src={form.logo} alt="شعار مرفوع" className="w-28 h-28 object-cover rounded-2xl border-2 border-emerald-200 shadow" />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-sm rounded-xl border border-emerald-200 transition-colors"
                        >
                          <i className="fas fa-redo me-1.5 text-xs" /> تغيير الصورة
                        </button>
                        <button
                          type="button"
                          onClick={() => { set('logo', 'shield-classic'); setLogoTab('shields'); }}
                          className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-slate-600 font-bold text-sm rounded-xl border border-gray-200 transition-colors"
                        >
                          <i className="fas fa-times me-1.5 text-xs" /> إزالة
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex flex-col items-center gap-4 py-10 border-2 border-dashed border-emerald-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
                    >
                      <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                        <i className="fas fa-cloud-upload-alt text-emerald-500 text-2xl" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-700">اضغط لرفع صورة شعار الفريق</p>
                        <p className="text-xs text-slate-400 mt-1">PNG، JPG — حتى 2MB</p>
                      </div>
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setFormStep(2)}
                className="w-full py-4 rounded-2xl text-white font-black text-base shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{ background: accent }}
              >
                التالي — إضافة التفاصيل
                <i className="fas fa-arrow-left me-2 text-sm" />
              </button>
            </div>
          )}

          {/* ── STEP 2: Details ────────────────────────────────────────────── */}
          {formStep === 2 && (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Preview card */}
              <div className="rounded-2xl p-5 flex items-center gap-4 shadow-lg" style={{ background: accent }}>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                  <LogoDisplay logo={form.logo} color="white" size={52} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 text-xs font-bold">اسم الفريق</p>
                  <p className="text-white font-black text-xl truncate mt-0.5">{form.name || 'اكتب اسم فريقك'}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.fieldType === '11v11' && form.formation && (
                      <span className="text-white/70 text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full font-bold">{form.formation}</span>
                    )}
                    <span className="text-white/70 text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full font-bold">{form.fieldType}</span>
                    {form.city && (
                      <span className="text-white/70 text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full font-bold">
                        <i className="fas fa-map-marker-alt text-[9px] me-1" />{form.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Name + description */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">
                    اسم الفريق <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="مثال: نسور الأردن"
                    autoFocus
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">
                    وصف الفريق <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={3}
                    placeholder="وصف قصير عن الفريق..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm resize-none"
                  />
                </div>
              </div>

              {/* Field type */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">التفاصيل</p>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">نوع الملعب</label>
                  <div className="flex flex-wrap gap-2">
                    {FIELD_TYPES.map(ft => (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => set('fieldType', ft)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${form.fieldType === ft ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200 text-slate-600 hover:border-blue-300 bg-gray-50'}`}
                      >{ft}</button>
                    ))}
                  </div>
                </div>

                {/* Formation — only for 11v11 */}
                {form.fieldType === '11v11' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      التشكيلة <span className="text-xs text-emerald-600 font-normal">(متاحة فقط لـ 11 ضد 11)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {FORMATIONS.map(f => (
                        <button
                          key={f.v}
                          type="button"
                          onClick={() => set('formation', f.v)}
                          className={`p-3 rounded-xl border-2 text-start transition-all ${form.formation === f.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200 bg-gray-50'}`}
                        >
                          <div className={`text-base font-black mb-0.5 ${form.formation === f.v ? 'text-blue-700' : 'text-slate-700'}`}>{f.v}</div>
                          <div className="text-[10px] text-slate-400 leading-tight">{f.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">الفئة العمرية</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AGE_GROUPS.map(ag => (
                      <button
                        key={ag}
                        type="button"
                        onClick={() => set('ageGroup', ag)}
                        className={`py-2.5 px-3 rounded-xl font-bold text-sm border-2 transition-all text-start ${form.ageGroup === ag ? 'bg-amber-50 border-amber-400 text-amber-800' : 'border-gray-200 text-slate-600 hover:border-amber-200 bg-gray-50'}`}
                      >{ag}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">المدينة</label>
                  <select
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-bold appearance-none"
                  >
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormStep(1)}
                  className="px-5 py-4 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-2xl text-sm transition-colors"
                >
                  <i className="fas fa-arrow-right me-2 text-xs" />رجوع
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-4 text-white font-black rounded-2xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ background: accent }}
                >
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</>
                    : formMode === 'create' ? '! إنشاء الفريق' : 'حفظ التعديلات'
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── Main list view ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">
      {/* Delete confirm modal */}
      {delConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-500 flex-shrink-0">
                <i className="fas fa-trash text-xl" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">حذف الفريق؟</h3>
                <p className="text-sm text-slate-500 mt-0.5">سيتم حذف الفريق نهائياً ولا يمكن التراجع</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(delConfirmId)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري...</>
                  : <><i className="fas fa-trash" /> نعم، احذف</>
                }
              </button>
              <button
                onClick={() => setDelConfirmId(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Challenge modal ─────────────────────────────────────────────────── */}
      {showChallengeModal && challengeTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowChallengeModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-black text-lg flex items-center gap-2">
                  <i className="fas fa-bolt" /> تحدي ودي
                </h2>
                <button onClick={() => setShowChallengeModal(false)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors">
                  <i className="fas fa-times text-sm" />
                </button>
              </div>
              <div className="flex items-center gap-3 bg-white/15 rounded-xl p-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <LogoDisplay logo={challengeTarget.logo || 'shield-classic'} color={challengeTarget.primaryColor || '#10b981'} size={36} />
                </div>
                <div>
                  <p className="font-black text-sm">{challengeTarget.name}</p>
                  <p className="text-white/70 text-xs">{challengeTarget.city} · {challengeTarget.fieldType}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {challengeError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2">
                  <i className="fas fa-exclamation-circle" /> {challengeError}
                </div>
              )}

              {/* Select your team */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">فريقك <span className="text-red-500">*</span></label>
                <select
                  value={challengeForm.fromTeamId}
                  onChange={e => setChallengeForm(p => ({ ...p, fromTeamId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white"
                >
                  <option value="">اختر فريقك</option>
                  {myTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">التاريخ المقترح</label>
                  <input
                    type="date"
                    value={challengeForm.proposedDate}
                    onChange={e => setChallengeForm(p => ({ ...p, proposedDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">الوقت</label>
                  <input
                    type="time"
                    value={challengeForm.proposedTime}
                    onChange={e => setChallengeForm(p => ({ ...p, proposedTime: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">مكان اللقاء (اختياري)</label>
                <input
                  type="text"
                  value={challengeForm.venue}
                  onChange={e => setChallengeForm(p => ({ ...p, venue: e.target.value }))}
                  placeholder="اسم الملعب أو المنطقة..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Field type */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">نوع الملعب</label>
                <div className="flex flex-wrap gap-2">
                  {FIELD_TYPES.map(ft => (
                    <button
                      key={ft}
                      type="button"
                      onClick={() => setChallengeForm(p => ({ ...p, fieldType: ft }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${challengeForm.fieldType === ft ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-gray-200 hover:border-emerald-300'}`}
                    >{ft}</button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">رسالة (اختياري)</label>
                <textarea
                  value={challengeForm.message}
                  onChange={e => setChallengeForm(p => ({ ...p, message: e.target.value }))}
                  rows={2}
                  placeholder="أي ملاحظة للفريق الآخر..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 pt-0 flex gap-3">
              <button
                onClick={handleSendChallenge}
                disabled={challengeSending}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {challengeSending
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الإرسال...</>
                  : <><i className="fas fa-bolt" /> إرسال التحدي</>
                }
              </button>
              <button
                onClick={() => setShowChallengeModal(false)}
                className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero banner ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ minHeight: 340 }}>
        {/* Background image + overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/80 to-black/90" />

        {/* Glow dots */}
        <div className="absolute top-8 left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-8 right-16 w-40 h-40 bg-emerald-400/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 py-10 flex flex-col items-center text-center">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-1">
            كوّن فريقك..
          </h1>
          <h2 className="text-4xl sm:text-5xl font-black text-emerald-400 leading-tight mb-3">
            وانطلق للمجد!
          </h2>
          <div className="text-emerald-400 text-3xl mb-4">🏆</div>
          <p className="text-slate-300 text-sm sm:text-base max-w-md leading-relaxed mb-6">
            أنشئ فريقك الخاص أو انضم لفريق موجود وخض البطولات مع أفضل اللاعبين في الأردن
          </p>

          {/* Stats */}
          {!loading && (
            <div className="flex items-center gap-6 sm:gap-10 mb-7 text-center">
              <div>
                <p className="text-2xl font-black text-white">
                  {allTeams.reduce((s, t) => s + (t.membersCount ?? 0) + 1, 0)}
                </p>
                <p className="text-slate-400 text-xs font-bold flex items-center gap-1 justify-center mt-0.5">
                  <i className="fas fa-crosshairs text-emerald-400 text-[10px]" /> لاعب مسجّل
                </p>
              </div>
              <div className="w-px h-10 bg-white/15" />
              <div>
                <p className="text-2xl font-black text-white">{openTourneys.length}</p>
                <p className="text-slate-400 text-xs font-bold flex items-center gap-1 justify-center mt-0.5">
                  <i className="fas fa-trophy text-emerald-400 text-[10px]" /> بطولة مفتوحة
                </p>
              </div>
              <div className="w-px h-10 bg-white/15" />
              <div>
                <p className="text-2xl font-black text-white">{allTeams.length}</p>
                <p className="text-slate-400 text-xs font-bold flex items-center gap-1 justify-center mt-0.5">
                  <i className="fas fa-users text-emerald-400 text-[10px]" /> فريق نشط
                </p>
              </div>
            </div>
          )}

          {/* Action cards */}
          <div className="w-full max-w-lg space-y-2.5">
            {/* Create team */}
            <button
              onClick={() => { setTab('mine'); setTimeout(() => { tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(openCreate, 200); }, 50); }}
              className="w-full flex items-center gap-4 px-5 py-4 bg-emerald-500 hover:bg-emerald-400 rounded-2xl text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 text-start"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-shield-alt text-lg" />
              </div>
              <div className="flex-1">
                <p className="font-black text-base">أنشئ فريقك</p>
                <p className="text-emerald-100 text-xs mt-0.5">كوّن فريقك، اختر الشعار والاسم واجمع اللاعبين</p>
              </div>
              <i className="fas fa-arrow-left text-white/60 text-sm flex-shrink-0" />
            </button>

            {/* Browse teams */}
            <button
              onClick={() => {
                setTab('all');
                setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
              }}
              className="w-full flex items-center gap-4 px-5 py-4 bg-white/8 hover:bg-white/14 border border-white/12 rounded-2xl text-white transition-all hover:-translate-y-0.5 text-start"
            >
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-user-plus text-lg" />
              </div>
              <div className="flex-1">
                <p className="font-black text-base">انضم لفريق</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  تصفح {allTeams.length} فريق وأرسل طلب الانضمام
                </p>
              </div>
              <i className="fas fa-arrow-left text-white/40 text-sm flex-shrink-0" />
            </button>

          </div>
        </div>
      </div>

      {/* Header */}
      <div ref={tabsRef} className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-slate-500 text-sm">تصفح الفرق، انضم أو أنشئ فريقك</p>
            </div>
            {tab === 'mine' && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
              >
                <i className="fas fa-plus text-xs" /> إنشاء فريق
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {([
              { id: 'all',  label: 'جميع الفرق', icon: 'users',      count: allTeams.length, badge: 0 },
              { id: 'mine', label: 'فريقي',        icon: 'shield-alt', count: myTeams.length,  badge: pendingFmCount },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-black border-b-2 transition-all ${tab === t.id ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                <i className={`fas fa-${t.icon} text-xs`} />
                {t.label}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {t.count}
                </span>
                {t.badge > 0 && (
                  <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Toasts */}
        {toastOk && (
          <div className="flex gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-2xl items-center">
            <i className="fas fa-check-circle text-emerald-500 text-lg" /> {toastOk}
          </div>
        )}
        {toastErr && (
          <div className="flex gap-2 bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-2xl items-center">
            <i className="fas fa-exclamation-circle text-red-400 text-lg" /> {toastErr}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <>
            {/* ── ALL TEAMS tab ──────────────────────────────────────────── */}
            {tab === 'all' && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    placeholder="ابحث عن فريق أو مدينة..."
                    className="w-full pr-10 pl-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-400 text-sm"
                  />
                </div>

                {filtered.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-slate-400 shadow-sm">
                    <i className="fas fa-users text-4xl mb-3 block text-gray-200" />
                    لا توجد فرق مطابقة
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((t, rank) => {
                      const isOwner  = !!user && t.createdBy === user.id;
                      const isMember = !!user && (t.members || []).includes(user.id);
                      const accent   = t.primaryColor || '#e2e8f0';
                      const loading  = joiningId === t.id;
                      return (
                        <div
                          key={t.id}
                          className={`bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md overflow-hidden cursor-pointer ${isOwner ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-100'}`}
                          onClick={e => {
                            if ((e.target as HTMLElement).closest('button')) return;
                            navigate(`/teams/${t.id}`);
                          }}
                        >
                          <div className="h-1" style={{ background: accent }} />
                          <div className="flex items-center gap-4 p-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${rank === 0 ? 'bg-yellow-100 text-yellow-700' : rank === 1 ? 'bg-gray-100 text-gray-600' : rank === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                              {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}
                            </div>
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border overflow-hidden"
                              style={{ background: `${accent}20`, borderColor: `${accent}40` }}
                            >
                              <LogoDisplay logo={t.logo || 'shield-classic'} color={accent} size={40} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-black text-slate-900 truncate">{t.name}</p>
                                {isOwner  && <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0">فريقي</span>}
                                {isMember && !isOwner && <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0">عضو</span>}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                                {t.city && <span className="flex items-center gap-1"><i className="fas fa-map-marker-alt text-[9px]" />{t.city}</span>}
                                {t.formation && t.fieldType === '11v11' && <span className="font-bold" style={{ color: accent }}>{t.formation}</span>}
                                {t.fieldType && <span>{t.fieldType}</span>}
                                <span>{t.wins}ف · {t.draws}ت · {t.losses}خ</span>
                                <span className="flex items-center gap-1"><i className="fas fa-users text-[9px]" /> {(t.membersCount ?? 0) + 1}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Friendly match challenge button */}
                              {!isOwner && myTeams.length > 0 && user && (
                                <button
                                  onClick={() => openChallengeModal(t)}
                                  className="px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg border border-yellow-200 transition-colors flex items-center gap-1"
                                  title="تحدي ودي"
                                >
                                  <i className="fas fa-bolt text-[10px]" /> تحدي
                                </button>
                              )}
                              {isOwner ? (
                                <button
                                  onClick={() => setTab('mine')}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 transition-colors flex items-center gap-1"
                                >
                                  <i className="fas fa-cog text-[10px]" /> إدارة
                                </button>
                              ) : isMember ? (
                                <button
                                  onClick={() => handleLeave(t.id)}
                                  disabled={loading}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-lg border border-red-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  {loading ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <i className="fas fa-sign-out-alt text-[10px]" />}
                                  مغادرة
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleJoin(t.id)}
                                  disabled={loading}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  {loading ? <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <i className="fas fa-user-plus text-[10px]" />}
                                  انضمام
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* CTA */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-yellow-400/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">🏆</div>
                    <div className="flex-1">
                      <h3 className="font-black text-lg">انضم لبطولة الآن!</h3>
                      <p className="text-slate-400 text-sm mt-0.5">سجّل فريقك في أحدث بطولات المنصة</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/leagues')}
                    className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-trophy text-yellow-300" /> عرض البطولات المتاحة
                  </button>
                </div>
              </div>
            )}

            {/* ── MY TEAMS tab ───────────────────────────────────────────── */}
            {tab === 'mine' && (
              <div className="space-y-5">
                {myTeams.length === 0 ? (
                  <div className="bg-white rounded-2xl border-2 border-dashed border-emerald-200 p-12 text-center">
                    <div className="flex justify-center mb-4">
                      <ShieldSVG id="shield-classic" color="#d1d5db" size={64} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">ليس لديك فريق بعد</h3>
                    <p className="text-slate-400 text-sm mb-5">أنشئ فريقك الآن وابدأ المنافسة</p>
                    <button
                      onClick={openCreate}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
                    >
                      <i className="fas fa-plus me-2" /> إنشاء فريق
                    </button>
                  </div>
                ) : myTeams.map(team => {
                  const accent = team.primaryColor || '#10b981';
                  const chatOpen = openChatId === team.id;
                  const isMember = !!user && ((team.members || []).includes(user.id) || team.createdBy === user.id);
                  return (
                    <div
                      key={team.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={e => { if ((e.target as HTMLElement).closest('button')) return; navigate(`/teams/${team.id}`); }}
                    >
                      <div className="h-1.5" style={{ background: accent }} />
                      <div className="p-5">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border overflow-hidden"
                            style={{ background: `${accent}18`, borderColor: `${accent}35` }}
                          >
                            <LogoDisplay logo={team.logo || 'shield-classic'} color={accent} size={50} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-slate-900 text-lg truncate">{team.name}</h3>
                              <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full">مالك</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                              {team.city && <span className="flex items-center gap-1"><i className="fas fa-map-marker-alt text-[9px]" /> {team.city}</span>}
                              {team.fieldType === '11v11' && team.formation && (
                                <span className="font-bold" style={{ color: accent }}>{team.formation}</span>
                              )}
                              {team.fieldType && <span>{team.fieldType}</span>}
                              <span className="flex items-center gap-1"><i className="fas fa-users text-[9px]" /> {(team.membersCount ?? 0) + 1}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span className="text-emerald-600 font-bold">{team.wins} فوز</span>
                              <span className="text-yellow-600 font-bold">{team.draws} تعادل</span>
                              <span className="text-red-500 font-bold">{team.losses} خسارة</span>
                              <span className="text-slate-400">|</span>
                              <span className="text-slate-700 font-black">{team.points} نقطة</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isMember && (
                              <button
                                onClick={() => setOpenChatId(chatOpen ? null : team.id)}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border text-sm ${chatOpen ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-500 border-emerald-100'}`}
                                title="دردشة الفريق"
                              >
                                <i className="fas fa-comments" />
                              </button>
                            )}
                            <button
                              onClick={() => openEdit(team)}
                              className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-500 flex items-center justify-center transition-colors border border-blue-100"
                            >
                              <i className="fas fa-edit text-sm" />
                            </button>
                            <button
                              onClick={() => setDelConfirmId(team.id)}
                              className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors border border-red-100"
                            >
                              <i className="fas fa-trash text-sm" />
                            </button>
                          </div>
                        </div>

                        {/* Chat panel */}
                        {chatOpen && user && (
                          <div className="mt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <i className="fas fa-comments text-emerald-500 text-sm" />
                              <span className="text-sm font-black text-slate-700">دردشة الفريق</span>
                              <span className="text-[10px] text-slate-400">· أعضاء الفريق فقط</span>
                            </div>
                            <TeamChat teamId={team.id} userId={user.id} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Friendly Match Challenges section ──────────────────────── */}
            {tab === 'mine' && myTeams.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-bolt text-yellow-600 text-sm" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">التحديات الودية</h3>
                      {pendingFmCount > 0 && (
                        <p className="text-xs text-red-500 font-bold">{pendingFmCount} تحدٍّ جديد ينتظر ردك</p>
                      )}
                    </div>
                  </div>
                  {fmLoading && <div className="w-4 h-4 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />}
                </div>

                {friendlyMatches.length === 0 && !fmLoading ? (
                  <div className="p-8 text-center text-slate-400">
                    <i className="fas fa-bolt text-3xl mb-2 block text-gray-200" />
                    <p className="text-sm">لا توجد تحديات بعد</p>
                    <p className="text-xs mt-1 text-slate-300">تصفح الفرق وتحدَّ أيّاً منها لمباراة ودية</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {/* Incoming */}
                    {fmIncoming.length > 0 && (
                      <div className="px-5 py-3">
                        <p className="text-[10px] font-black text-red-500 uppercase mb-3 flex items-center gap-1.5">
                          <i className="fas fa-inbox" /> تحديات واردة ({fmIncoming.length})
                        </p>
                        <div className="space-y-3">
                          {fmIncoming.map(m => (
                            <div key={m.id} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-3">
                              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">⚡</div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900 text-sm">{m.fromTeamName}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  يتحدى <strong>{m.toTeamName}</strong>
                                  {m.proposedDate && <> · {m.proposedDate}</>}
                                  {m.proposedTime && <> الساعة {m.proposedTime}</>}
                                </p>
                                {m.venue && <p className="text-xs text-slate-400 mt-0.5"><i className="fas fa-map-marker-alt text-[9px]" /> {m.venue}</p>}
                                {m.message && <p className="text-xs text-slate-500 mt-1 italic">"{m.message}"</p>}
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleAcceptChallenge(m.id)}
                                    disabled={fmActionId === m.id}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1"
                                  >
                                    {fmActionId === m.id ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> : <i className="fas fa-check" />}
                                    قبول
                                  </button>
                                  <button
                                    onClick={() => handleRejectChallenge(m.id)}
                                    disabled={fmActionId === m.id}
                                    className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-500 text-xs font-bold rounded-lg border border-red-200 transition-colors disabled:opacity-60 flex items-center gap-1"
                                  >
                                    <i className="fas fa-times" /> رفض
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Outgoing */}
                    {fmOutgoing.length > 0 && (
                      <div className="px-5 py-3">
                        <p className="text-[10px] font-black text-yellow-600 uppercase mb-3 flex items-center gap-1.5">
                          <i className="fas fa-paper-plane" /> تحديات مرسلة ({fmOutgoing.length})
                        </p>
                        <div className="space-y-3">
                          {fmOutgoing.map(m => (
                            <div key={m.id} className="flex items-start gap-3 bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">⚡</div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900 text-sm">{m.fromTeamName} <span className="text-slate-400 font-normal">ضد</span> {m.toTeamName}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {m.proposedDate ? m.proposedDate : 'تاريخ مفتوح'}
                                  {m.proposedTime && <> الساعة {m.proposedTime}</>}
                                  <span className="mx-1.5">·</span>
                                  <span className="bg-yellow-200 text-yellow-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">معلق</span>
                                </p>
                                {m.venue && <p className="text-xs text-slate-400 mt-0.5"><i className="fas fa-map-marker-alt text-[9px]" /> {m.venue}</p>}
                                <button
                                  onClick={() => handleCancelChallenge(m.id)}
                                  disabled={fmActionId === m.id}
                                  className="mt-2 px-3 py-1 bg-white hover:bg-red-50 text-red-400 hover:text-red-500 text-xs font-bold rounded-lg border border-gray-200 transition-colors disabled:opacity-60 flex items-center gap-1"
                                >
                                  {fmActionId === m.id ? <div className="w-3 h-3 border border-red-300 border-t-red-500 rounded-full animate-spin" /> : <i className="fas fa-ban text-[9px]" />}
                                  إلغاء التحدي
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* History */}
                    {fmHistory.length > 0 && (
                      <div className="px-5 py-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                          <i className="fas fa-history" /> السجل
                        </p>
                        <div className="space-y-2">
                          {fmHistory.slice(0, 5).map(m => {
                            const statusMap = {
                              accepted:  { label: 'مقبول', cls: 'bg-emerald-100 text-emerald-700' },
                              rejected:  { label: 'مرفوض', cls: 'bg-red-100 text-red-600' },
                              cancelled: { label: 'ملغى',   cls: 'bg-gray-100 text-gray-500' },
                            };
                            const s = statusMap[m.status as keyof typeof statusMap] || { label: m.status, cls: 'bg-gray-100 text-gray-500' };
                            return (
                              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                <span className={`text-[9px] font-black px-2 py-1 rounded-full flex-shrink-0 ${s.cls}`}>{s.label}</span>
                                <p className="text-xs text-slate-600 flex-1 truncate">{m.fromTeamName} ضد {m.toTeamName}</p>
                                {m.proposedDate && <p className="text-[10px] text-slate-400 flex-shrink-0">{m.proposedDate}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Tournaments CTA (mine tab) ─────────────────────────────── */}
            {openTourneys.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-lg flex items-center gap-2">
                      <span>🏆</span> انضم لبطولة الآن!
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {openTourneys.length} بطولة متاحة للتسجيل
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {openTourneys.slice(0, 3).map(t => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 cursor-pointer transition-colors"
                      onClick={() => navigate(`/leagues/${t.id}`)}
                    >
                      <i className="fas fa-trophy text-yellow-400 text-sm flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{t.name}</p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {t.prizePool && t.prizePool !== '0 JD' && `${t.prizePool} · `}
                          فريق {t.teamsCount}/{t.maxTeams}
                        </p>
                      </div>
                      <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex-shrink-0">
                        مفتوح
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/leagues')}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-list text-xs" /> عرض جميع البطولات
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;
