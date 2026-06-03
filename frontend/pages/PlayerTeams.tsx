import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { Team } from '../types';

const PlayerTeams: React.FC = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [teams, setTeams]       = useState<Team[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name: '', logo: '' });
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const LOGOS = ['⚽','🦅','🦁','🦆','⚡','🔥','🌙','🦊','🐺','🏆','💎','🚀'];

  useEffect(() => {
    backend.getUserTeams('all').then(data => {
      setTeams(data);
      setLoading(false);
    });
  }, []);

  const myTeam = teams.find(t => t.userId === user?.id || t.isUserTeam);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('أدخل اسم الفريق'); return; }
    setSaving(true); setError('');
    const res = await backend.saveTeam({
      id: '',
      name: form.name.trim(),
      logo: form.logo || '⚽',
      wins: 0, losses: 0, draws: 0, points: 0,
      players: [user?.name || ''],
      isUserTeam: true,
      userId: user?.id,
    });
    if (res.success) {
      setTeams(await backend.getUserTeams('all'));
      setSuccess('تم إنشاء فريقك بنجاح! 🎉');
      setShowCreate(false);
      setForm({ name: '', logo: '' });
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('حدث خطأ، حاول مجدداً');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <i className="fas fa-users text-emerald-500" />
                الفرق
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">أنشئ فريقك أو انضم للبطولات</p>
            </div>
            {!myTeam && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-emerald-200 transition-all hover:-translate-y-0.5">
                <i className="fas fa-plus text-xs" /> إنشاء فريق
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {success && (
          <div className="flex gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-2xl items-center">
            <i className="fas fa-check-circle text-emerald-500" /> {success}
          </div>
        )}

        {/* ══ CREATE TEAM FORM ════════════════════════════════════════════════ */}
        {showCreate && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-md p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <i className="fas fa-plus-circle text-emerald-500" /> إنشاء فريق جديد
              </h2>
              <button onClick={() => { setShowCreate(false); setError(''); }}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <i className="fas fa-times text-xs" />
              </button>
            </div>

            {error && (
              <div className="flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-4">
                <i className="fas fa-exclamation-circle" /> {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم الفريق <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                    placeholder="مثال: نسور الأردن"
                    className="w-full ps-11 pe-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm" />
                  <i className="fas fa-shield-alt absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">شعار الفريق</label>
                <div className="grid grid-cols-6 gap-2">
                  {LOGOS.map(logo => (
                    <button key={logo} type="button" onClick={() => setForm(p => ({...p, logo}))}
                      className={`h-12 rounded-xl text-2xl flex items-center justify-center transition-all border-2 ${
                        form.logo === logo
                          ? 'bg-emerald-50 border-emerald-400 scale-110 shadow-md'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:scale-105'
                      }`}>
                      {logo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> جاري الإنشاء...</>
                    : <><i className="fas fa-check" /> إنشاء الفريق</>
                  }
                </button>
                <button type="button" onClick={() => { setShowCreate(false); setError(''); }}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold rounded-xl text-sm transition-colors">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══ MY TEAM ════════════════════════════════════════════════════════ */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />)}
          </div>
        ) : (
          <>
            {myTeam ? (
              <div>
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <i className="fas fa-star text-yellow-400 text-xs" /> فريقي
                </h2>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                      {myTeam.logo}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black">{myTeam.name}</h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          <i className="fas fa-users text-[9px]" /> {myTeam.players?.length || 1} لاعب
                        </span>
                        <span className="flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          <i className="fas fa-star text-yellow-300 text-[9px]" /> {myTeam.points} نقطة
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-2xl font-black">{myTeam.wins}</div>
                      <div className="text-emerald-200 text-[10px] font-bold">انتصار</div>
                    </div>
                  </div>

                  {/* Stats bar */}
                  <div className="grid grid-cols-3 gap-2 mt-4 bg-black/15 rounded-xl p-3">
                    {[
                      { label: 'فوز',   val: myTeam.wins,   color: 'text-emerald-300' },
                      { label: 'تعادل', val: myTeam.draws,  color: 'text-yellow-300'  },
                      { label: 'خسارة', val: myTeam.losses, color: 'text-red-300'     },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                        <p className="text-white/60 text-[10px] font-bold">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => navigate('/leagues')}
                    className="mt-4 w-full py-2.5 bg-white/20 hover:bg-white/30 border border-white/20 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                    <i className="fas fa-trophy text-yellow-300 text-xs" /> انضم لبطولة بفريقك
                  </button>
                </div>
              </div>
            ) : (
              !showCreate && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-emerald-200 p-10 text-center">
                  <div className="text-5xl mb-3">⚽</div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">ليس لديك فريق بعد</h3>
                  <p className="text-slate-400 text-sm mb-5">أنشئ فريقك الآن وابدأ المنافسة في البطولات</p>
                  <button onClick={() => setShowCreate(true)}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm shadow-emerald-200">
                    <i className="fas fa-plus me-2" /> إنشاء فريق
                  </button>
                </div>
              )
            )}

            {/* ══ ALL TEAMS ══════════════════════════════════════════════════ */}
            <div>
              <h2 className="text-sm font-black text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <i className="fas fa-users text-slate-400 text-xs" /> جميع الفرق
                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">{teams.length}</span>
              </h2>

              {teams.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-slate-400 shadow-sm">
                  <i className="fas fa-users text-4xl mb-3 block text-gray-200" />
                  لا توجد فرق مسجّلة بعد
                </div>
              ) : (
                <div className="space-y-3">
                  {teams.map((t, rank) => {
                    const isMe = t.userId === user?.id || t.isUserTeam;
                    return (
                      <div key={t.id}
                        className={`bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md overflow-hidden ${
                          isMe ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-100'
                        }`}>
                        <div className="flex items-center gap-4 p-4">
                          {/* Rank */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${
                            rank === 0 ? 'bg-yellow-100 text-yellow-700' :
                            rank === 1 ? 'bg-gray-100 text-gray-600' :
                            rank === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-500'
                          }`}>
                            {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}
                          </div>

                          {/* Logo */}
                          <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-2xl border border-gray-100 flex-shrink-0">
                            {t.logo}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-slate-900 truncate">{t.name}</p>
                              {isMe && (
                                <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0">
                                  فريقي
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <i className="fas fa-users text-[10px]" /> {t.players?.length || 0} لاعب
                              </span>
                              <span>{t.wins}ف · {t.draws}ت · {t.losses}خ</span>
                            </div>
                          </div>

                          {/* Points */}
                          <div className="text-end flex-shrink-0">
                            <p className="text-xl font-black text-slate-900">{t.points}</p>
                            <p className="text-[10px] text-slate-400 font-bold">نقطة</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ══ JOIN TOURNAMENT CTA ════════════════════════════════════════ */}
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
              <button onClick={() => navigate('/leagues')}
                className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
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
