import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backend } from '../services/backend';
import { League, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import LoginPromptModal from '../components/LoginPromptModal';

type Filter = 'all' | 'التسجيل متاح' | 'جارية' | 'مكتملة';

const TEAM_EMOJIS = ['⚡','🦅','🌟','🔥','🏆','🦁','⚽','🎯'];

function progressPct(league: League): number {
  if (!league.maxTeams) return 0;
  return Math.round((league.teamsCount / league.maxTeams) * 100);
}

function formatLabel(league: League): { label: string; color: string } {
  const fmt = (league.format || 'league').toLowerCase();
  if (fmt === 'cup' || fmt === 'كأس') return { label: 'كأس 🏆', color: 'bg-amber-100 text-amber-700' };
  return { label: 'دوري 📋', color: 'bg-blue-100 text-blue-700' };
}

function statusLabel(s: string): { text: string; dot: string } {
  if (s === 'جارية')        return { text: 'جارية',   dot: 'bg-emerald-500' };
  if (s === 'مكتملة')       return { text: 'منتهية',  dot: 'bg-gray-400'    };
  return                            { text: 'قادمة',   dot: 'bg-amber-400'   };
}

const Leagues: React.FC = () => {
  const [leagues, setLeagues]   = useState<League[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter,  setFilter]    = useState<Filter>('all');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginMsg, setLoginMsg] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const requireAuth = (msg: string, cb: () => void) => {
    if (!user) { setLoginMsg(msg); setShowLoginPrompt(true); return; }
    cb();
  };

  useEffect(() => {
    backend.getLeagues().then(l => { setLeagues(l); setLoading(false); });
  }, []);

  const counts = {
    all:            leagues.length,
    'التسجيل متاح': leagues.filter(l => l.status === 'التسجيل متاح').length,
    'جارية':        leagues.filter(l => l.status === 'جارية').length,
    'مكتملة':       leagues.filter(l => l.status === 'مكتملة').length,
  };

  const visible = filter === 'all' ? leagues : leagues.filter(l => l.status === filter);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await backend.deleteTournament(deleteId);
    if (res.success) setLeagues(p => p.filter(l => l.id !== deleteId));
    setDeleting(false);
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                البطولات <span className="text-2xl">🏆</span>
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">سجّل فريقك وانافس في أفضل البطولات</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/new-tournament')}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all"
              >
                <i className="fas fa-plus text-xs" /> إنشاء بطولة
              </button>
              <button
                onClick={() => requireAuth('سجّل الدخول لإدارة فريقك.', () => navigate('/my-teams'))}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-sm shadow-emerald-200 transition-all hover:-translate-y-0.5"
              >
                <i className="fas fa-users text-xs" /> إدارة فرقي
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mt-5 flex-wrap">
            {([
              { key: 'all',             label: 'الكل',   count: counts.all            },
              { key: 'التسجيل متاح',    label: 'قادمة',  count: counts['التسجيل متاح'] },
              { key: 'جارية',           label: 'جارية',  count: counts['جارية']        },
              { key: 'مكتملة',          label: 'منتهية', count: counts['مكتملة']       },
            ] as const).map(f => (
              <button key={f.key} onClick={() => setFilter(f.key as Filter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  filter === f.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
                }`}>
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black
                  ${filter === f.key ? 'bg-white/20 text-white' : 'bg-white text-slate-700'}`}>
                  {f.count}
                </span>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-3">🏟️</div>
            <p className="font-bold text-lg">لا توجد بطولات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((league, idx) => {
              const pct    = progressPct(league);
              const fmt    = formatLabel(league);
              const st     = statusLabel(league.status);
              const canDel = !!user && (league.createdBy === user.id || user.role === UserRole.ADMIN);
              const emoji  = TEAM_EMOJIS[idx % TEAM_EMOJIS.length];

              return (
                <div key={league.id}
                  className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer group relative"
                  onClick={() => navigate(`/tournament/${league.id}`)}>

                  {/* Glow */}
                  <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur-3xl opacity-0 group-hover:opacity-10 transition-opacity" />

                  <div className="relative p-5">
                    {/* Badges row */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full ${
                        league.status === 'جارية'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : league.status === 'مكتملة'
                          ? 'bg-gray-500/20 text-gray-400'
                          : 'bg-amber-400/20 text-amber-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.text}
                      </span>
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${fmt.color}`}>
                        {fmt.label}
                      </span>
                    </div>

                    {/* Emoji + Name */}
                    <div className="flex items-start gap-3 mb-5">
                      <span className="text-3xl">{emoji}</span>
                      <h3 className="text-lg font-black text-white leading-tight group-hover:text-emerald-400 transition-colors">
                        {league.name}
                      </h3>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold mb-0.5">الجائزة</p>
                        <p className="text-emerald-400 font-black text-sm">{league.prizePool}</p>
                      </div>
                      <div className="text-center border-x border-white/10">
                        <p className="text-[10px] text-slate-400 font-bold mb-0.5">الفرق</p>
                        <p className="text-white font-black text-sm">{league.teamsCount}/{league.maxTeams}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold mb-0.5">البداية</p>
                        <p className="text-white font-black text-sm">{league.startDate}</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                        <span>الفرق المشاركة</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="text-[11px] text-slate-400 font-bold">
                        {league.status === 'التسجيل متاح' ? 'التسجيل متاح' : 'تابع المباريات'}
                      </span>
                      <div className="w-7 h-7 bg-emerald-500/20 rounded-full flex items-center justify-center group-hover:bg-emerald-500 transition-all">
                        <i className="fas fa-arrow-left text-emerald-400 group-hover:text-white text-xs transition-colors" />
                      </div>
                    </div>
                  </div>

                  {/* Delete */}
                  {canDel && (
                    <button onClick={e => { e.stopPropagation(); setDeleteId(league.id); }}
                      className="absolute top-3 left-3 w-7 h-7 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                      <i className="fas fa-trash text-[10px]" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" dir="rtl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center text-red-500 flex-shrink-0">
                <i className="fas fa-trash" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">حذف البطولة؟</h3>
                <p className="text-xs text-slate-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري...</> : 'حذف'}
              </button>
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-sm">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginPrompt && (
        <LoginPromptModal message={loginMsg} onClose={() => setShowLoginPrompt(false)} />
      )}
    </div>
  );
};

export default Leagues;
