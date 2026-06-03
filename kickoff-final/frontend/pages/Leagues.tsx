import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { backend } from '../services/backend';
import { League, UserRole } from '../types';
import TournamentModal from '../components/TournamentModal';
import LoginPromptModal from '../components/LoginPromptModal';
import { useAuth } from '../contexts/AuthContext';

type StatusTab = 'all' | 'قادمة' | 'جارية' | 'منتهية';

const TYPE_BADGE: Record<string, { label: string; cls: string; icon: string }> = {
  'دوري':       { label: 'دوري',       cls: 'bg-blue-100 text-blue-700 border-blue-200',         icon: 'fa-table-list'  },
  'كاس':        { label: 'كأس',        cls: 'bg-amber-100 text-amber-700 border-amber-200',       icon: 'fa-trophy'      },
  'دوري وكاس': { label: 'دوري + كأس', cls: 'bg-purple-100 text-purple-700 border-purple-200',   icon: 'fa-layer-group' },
};

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: 'all',    label: 'الكل'    },
  { id: 'قادمة',  label: 'قادمة'   },
  { id: 'جارية',  label: 'جارية'   },
  { id: 'منتهية', label: 'منتهية'  },
];

const Leagues: React.FC = () => {
  const [leagues, setLeagues]                   = useState<League[]>([]);
  const [statusTab, setStatusTab]               = useState<StatusTab>('all');
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt]   = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('');

  const { user }    = useAuth();
  const userRole    = (user?.role as UserRole) ?? UserRole.PLAYER;
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();
  const isManageMode = searchParams.get('manage') === '1' && (userRole === UserRole.OWNER || userRole === UserRole.ADMIN);

  const requireAuth = (message: string, action: () => void) => {
    if (!user) { setLoginPromptMessage(message); setShowLoginPrompt(true); return; }
    action();
  };

  useEffect(() => {
    backend.getLeagues().then(setLeagues);
  }, []);

  const handleCreateLeague = async (league: League) => {
    await backend.saveLeague(league);
    backend.getLeagues().then(setLeagues);
    setIsTournamentModalOpen(false);
  };

  const filtered = statusTab === 'all' ? leagues : leagues.filter(l => l.status === statusTab);

  const counts = {
    all:      leagues.length,
    'قادمة':  leagues.filter(l => l.status === 'قادمة').length,
    'جارية':  leagues.filter(l => l.status === 'جارية').length,
    'منتهية': leagues.filter(l => l.status === 'منتهية').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen" dir="rtl">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
            <i className="fas fa-trophy text-amber-400 text-3xl" />
            البطولات
          </h1>
          <p className="text-gray-500 mt-2 text-lg">سجّل فريقك وانافس في أفضل البطولات</p>
        </div>
        <div className="flex gap-3">
          {userRole !== UserRole.PLAYER && (
            <button
              onClick={() => requireAuth('سجّل الدخول لإنشاء بطولة.', () => setIsTournamentModalOpen(true))}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <i className="fas fa-plus text-sm" /> إنشاء بطولة
            </button>
          )}
          <button
            onClick={() => requireAuth('سجّل الدخول لإدارة فرقك.', () => navigate('/teams'))}
            className="px-5 py-2.5 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-400 transition-all hover:-translate-y-0.5 flex items-center gap-2 shadow-sm shadow-emerald-200"
          >
            <i className="fas fa-users text-sm" /> إدارة فرقي
          </button>
        </div>
      </div>

      {/* ── Manage mode banner ── */}
      {isManageMode && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <i className="fas fa-tools text-white text-sm" />
          </div>
          <div>
            <p className="font-black text-emerald-700 text-sm">وضع إدارة البطولات</p>
            <p className="text-emerald-600 text-xs mt-0.5">اختر بطولة لإدارة مبارياتها ونتائجها</p>
          </div>
        </div>
      )}

      {/* ── Status tabs ── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
              statusTab === tab.id
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-white text-slate-500 border-gray-200 hover:border-slate-400 hover:text-slate-700'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              statusTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-slate-500'
            }`}>
              {tab.id === 'all' ? counts.all : counts[tab.id as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
          <i className="fas fa-trophy text-5xl text-gray-200 mb-4 block" />
          <h3 className="text-lg font-black text-slate-900 mb-1">لا توجد بطولات</h3>
          <p className="text-gray-400 text-sm">لا توجد بطولات في هذا التصنيف حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(league => {
            const tb = TYPE_BADGE[league.type] ?? TYPE_BADGE['دوري'];
            const fillPct = Math.round((league.teamsCount / league.maxTeams) * 100);
            return (
              <div
                key={league.id}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col"
                onClick={() => navigate(`/tournament/${league.id}`)}
              >
                {/* Dark header */}
                <div className="h-40 bg-slate-900 relative p-6 flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity" />

                  <div className="flex justify-between items-start relative z-10">
                    {/* Type badge */}
                    <span className={`px-2.5 py-1 text-xs rounded-lg font-black border ${tb.cls}`}>
                      <i className={`fas ${tb.icon} me-1`} />{tb.label}
                    </span>
                    {/* Status badge */}
                    <span className={`px-2.5 py-1 text-xs rounded-lg font-bold ${
                      league.status === 'جارية'  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 animate-pulse' :
                      league.status === 'قادمة'  ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-600 text-slate-200'
                    }`}>
                      {league.status === 'جارية' ? '● جارية' : league.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white relative z-10 group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {league.name}
                  </h3>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-3 gap-3 mb-5 pb-5 border-b border-gray-50">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">الجائزة</p>
                      <p className="font-black text-emerald-600 text-sm">{league.prizePool}</p>
                    </div>
                    <div className="text-center border-r border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">الفرق</p>
                      <p className="font-black text-slate-800 text-sm">{league.teamsCount}/{league.maxTeams}</p>
                    </div>
                    <div className="text-center border-r border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">البداية</p>
                      <p className="font-bold text-slate-800 text-xs">{league.startDate}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-400 mb-1.5">
                      <span>الفرق المشاركة</span>
                      <span>{fillPct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          league.status === 'منتهية' ? 'bg-slate-300' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    {isManageMode ? (
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/manage-tournament/${league.id}`); }}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-200"
                      >
                        <i className="fas fa-tools" /> إدارة البطولة
                      </button>
                    ) : (
                      <>
                        <span className="text-xs text-slate-400 font-medium">
                          {league.status === 'قادمة'  ? 'التسجيل متاح' :
                           league.status === 'جارية'  ? 'تابع المباريات' :
                           'عرض النتائج'}
                        </span>
                        <i className="fas fa-arrow-left text-emerald-400 group-hover:-translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {isTournamentModalOpen && (
        <TournamentModal
          onClose={() => setIsTournamentModalOpen(false)}
          onSave={handleCreateLeague}
        />
      )}
      {showLoginPrompt && (
        <LoginPromptModal
          message={loginPromptMessage}
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
    </div>
  );
};

export default Leagues;
