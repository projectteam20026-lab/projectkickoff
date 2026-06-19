import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backend } from '../services/backend';
import { Team } from '../types';
import { useAuth } from '../contexts/AuthContext';

const MyTeams: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    backend.getMyTeams().then(data => {
      setMyTeams(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setDeleteError('');
    const ok = await backend.deleteTeam(id);
    if (ok) {
      setMyTeams(prev => prev.filter(t => t.id !== id));
      setDeleteConfirmId(null);
      setSuccess('تم حذف الفريق بنجاح.');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setDeleteError('فشل الحذف، حاول مجدداً.');
    }
    setDeleting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <i className="fas fa-shield-alt text-emerald-500" /> فرقي
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">الفرق التي أنشأتها</p>
            </div>
            <button
              onClick={() => navigate('/teams')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-emerald-200 transition-all hover:-translate-y-0.5"
            >
              <i className="fas fa-plus text-xs" /> إنشاء فريق
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* Success toast */}
        {success && (
          <div className="flex gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-2xl items-center">
            <i className="fas fa-check-circle text-emerald-500 text-lg" /> {success}
          </div>
        )}

        {/* Delete confirmation */}
        {deleteConfirmId && (
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
              {deleteError && (
                <div className="flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-4">
                  <i className="fas fa-exclamation-circle" /> {deleteError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleting
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحذف...</>
                    : <><i className="fas fa-trash" /> نعم، احذف</>
                  }
                </button>
                <button
                  onClick={() => { setDeleteConfirmId(null); setDeleteError(''); }}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : myTeams.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-emerald-200 p-12 text-center">
            <div className="text-5xl mb-3">⚽</div>
            <h3 className="text-lg font-black text-slate-900 mb-1">ليس لديك فريق بعد</h3>
            <p className="text-slate-400 text-sm mb-5">أنشئ فريقك الآن وابدأ المنافسة</p>
            <button
              onClick={() => navigate('/teams')}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
            >
              <i className="fas fa-plus me-2" /> إنشاء فريق
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myTeams.map(team => {
              const accent = team.primaryColor || '#10b981';
              return (
                <div key={team.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                  {/* Color strip */}
                  <div className="h-1" style={{ background: accent }} />

                  <div className="p-5">
                    <div className="flex items-center gap-4">
                      {/* Logo */}
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 border"
                        style={{ background: `${accent}20`, borderColor: `${accent}40` }}
                      >
                        {team.logo}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900 text-lg truncate">{team.name}</h3>
                          <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full">مالك</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                          {team.city && (
                            <span className="flex items-center gap-1">
                              <i className="fas fa-map-marker-alt text-[9px]" /> {team.city}
                            </span>
                          )}
                          {team.formation && (
                            <span className="font-bold" style={{ color: accent }}>{team.formation}</span>
                          )}
                          {team.fieldType && <span>{team.fieldType}</span>}
                          <span className="flex items-center gap-1">
                            <i className="fas fa-users text-[9px]" /> الأعضاء: {(team.membersCount ?? 0) + 1}
                          </span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-emerald-600 font-bold">{team.wins} فوز</span>
                          <span className="text-yellow-600 font-bold">{team.draws} تعادل</span>
                          <span className="text-red-500 font-bold">{team.losses} خسارة</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-700 font-black">{team.points} نقطة</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => navigate('/teams')}
                          title="تعديل الفريق"
                          className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-500 flex items-center justify-center transition-colors border border-blue-100"
                        >
                          <i className="fas fa-edit text-sm" />
                        </button>
                        <button
                          onClick={() => { setDeleteConfirmId(team.id); setDeleteError(''); }}
                          title="حذف الفريق"
                          className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors border border-red-100"
                        >
                          <i className="fas fa-trash text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Link to all teams */}
        <div className="text-center">
          <button
            onClick={() => navigate('/teams')}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-2 mx-auto transition-colors"
          >
            <i className="fas fa-users text-xs" /> عرض جميع الفرق
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyTeams;
