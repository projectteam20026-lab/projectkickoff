import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { Team } from '../types';

const PlayerTeams: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    backend.getAllTeams().then(d => setAllTeams(d)).finally(() => setLoading(false));
  }, []);

  const handleJoin = async (teamId: string) => {
    setJoiningId(teamId);
    const res = await backend.joinTeam(teamId);
    if (res.success && res.team) {
      setAllTeams(prev => prev.map(t => t.id === teamId ? res.team! : t));
      setSuccess('تم الانضمام للفريق بنجاح! ✅');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res.error || 'فشل الانضمام، حاول مجدداً.');
      setTimeout(() => setError(''), 3000);
    }
    setJoiningId(null);
  };

  const handleLeave = async (teamId: string) => {
    setJoiningId(teamId);
    const res = await backend.leaveTeam(teamId);
    if (res.success && res.team) {
      setAllTeams(prev => prev.map(t => t.id === teamId ? res.team! : t));
      setSuccess('تم مغادرة الفريق.');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res.error || 'فشل الخروج، حاول مجدداً.');
      setTimeout(() => setError(''), 3000);
    }
    setJoiningId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <i className="fas fa-users text-emerald-500" /> جميع الفرق
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">تصفح الفرق وانضم إليها</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {success && (
          <div className="flex gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-2xl items-center animate-fade-in-up">
            <i className="fas fa-check-circle text-emerald-500 text-lg" /> {success}
          </div>
        )}
        {error && (
          <div className="flex gap-2 bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-2xl items-center animate-fade-in-up">
            <i className="fas fa-exclamation-circle text-red-400 text-lg" /> {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-sm font-black text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <i className="fas fa-users text-slate-400 text-xs" /> الفرق
                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {allTeams.length}
                </span>
              </h2>

              {allTeams.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-slate-400 shadow-sm">
                  <i className="fas fa-users text-4xl mb-3 block text-gray-200" />
                  لا توجد فرق مسجّلة بعد
                </div>
              ) : (
                <div className="space-y-2">
                  {allTeams.map((t: Team, rank: number) => {
                    const isOwner = !!user && t.createdBy === user.id;
                    const isMember = !!user && (t.members || []).includes(user.id);
                    const accent = t.primaryColor || '#e2e8f0';
                    const loadingThis = joiningId === t.id;
                    return (
                      <div
                        key={t.id}
                        className={`bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md overflow-hidden ${
                          isOwner ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-100'
                        }`}
                      >
                        <div className="h-1" style={{ background: accent }} />
                        <div className="flex items-center gap-4 p-4">
                          {/* Rank badge */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${
                            rank === 0 ? 'bg-yellow-100 text-yellow-700' :
                            rank === 1 ? 'bg-gray-100 text-gray-600' :
                            rank === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}
                          </div>

                          {/* Logo */}
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl border flex-shrink-0"
                            style={{ background: `${accent}20`, borderColor: `${accent}40` }}
                          >
                            {t.logo}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-black text-slate-900 truncate">{t.name}</p>
                              {isOwner && (
                                <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0">
                                  فريقي
                                </span>
                              )}
                              {isMember && !isOwner && (
                                <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0">
                                  عضو
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                              {t.city && (
                                <span className="flex items-center gap-1">
                                  <i className="fas fa-map-marker-alt text-[9px]" />{t.city}
                                </span>
                              )}
                              {t.formation && (
                                <span className="font-bold" style={{ color: accent }}>{t.formation}</span>
                              )}
                              {t.fieldType && <span>{t.fieldType}</span>}
                              <span>{t.wins}ف · {t.draws}ت · {t.losses}خ</span>
                              <span className="flex items-center gap-1">
                                <i className="fas fa-users text-[9px]" />
                                الأعضاء: {(t.membersCount ?? 0) + 1}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isOwner ? (
                              <button
                                onClick={() => navigate('/my-teams')}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 transition-colors flex items-center gap-1"
                              >
                                <i className="fas fa-cog text-[10px]" /> إدارة
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                {isMember ? (
                                  <button
                                    onClick={() => handleLeave(t.id)}
                                    disabled={loadingThis}
                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-lg border border-red-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {loadingThis
                                      ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                      : <i className="fas fa-sign-out-alt text-[10px]" />
                                    }
                                    مغادرة
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleJoin(t.id)}
                                    disabled={loadingThis}
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {loadingThis
                                      ? <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                      : <i className="fas fa-user-plus text-[10px]" />
                                    }
                                    انضمام
                                  </button>
                                )}
                                <div className="text-end">
                                  <p className="text-xl font-black text-slate-900">{t.points}</p>
                                  <p className="text-[10px] text-slate-400 font-bold">نقطة</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CTA banner */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-yellow-400/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                  🏆
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-lg">انضم لبطولة الآن!</h3>
                  <p className="text-slate-400 text-sm mt-0.5">سجّل فريقك في أحدث بطولات المنصة وتنافس على الجوائز</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/leagues')}
                className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-trophy text-yellow-300" /> عرض البطولات المتاحة
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlayerTeams;
