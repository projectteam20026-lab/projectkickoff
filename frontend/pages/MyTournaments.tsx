import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backend } from '../services/backend';
import { League, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { translateStatus } from '../utils/translations';

const MyTournaments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    backend.getMyTournaments().then(data => {
      setLeagues(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setDeleteError('');
    const res = await backend.deleteTournament(id);
    if (res.success) {
      setLeagues(prev => prev.filter(l => l.id !== id));
      setDeleteConfirmId(null);
      setSuccess('تم حذف البطولة بنجاح.');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setDeleteError(res.error || 'فشل الحذف، حاول مجدداً.');
    }
    setDeleting(false);
  };

  const statusBadge = (status: League['status']) => {
    if (status === 'جارية')
      return <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-black rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />جارية</span>;
    if (status === 'مكتملة')
      return <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-black rounded-full">مكتملة</span>;
    return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-black rounded-full">التسجيل متاح</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <i className="fas fa-trophy text-amber-500" /> بطولاتي
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">البطولات التي أنشأتها</p>
            </div>
            <button
              onClick={() => navigate('/create-tournament')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-emerald-200 transition-all hover:-translate-y-0.5"
            >
              <i className="fas fa-plus text-xs" /> إنشاء بطولة
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* Success toast */}
        {success && (
          <div className="flex gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-2xl items-center animate-fade-in-up">
            <i className="fas fa-check-circle text-emerald-500 text-lg" /> {success}
          </div>
        )}

        {/* Delete confirmation dialog */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-500 flex-shrink-0">
                  <i className="fas fa-trash text-xl" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">حذف البطولة؟</h3>
                  <p className="text-sm text-slate-500 mt-0.5">سيتم حذف البطولة نهائياً ولا يمكن التراجع</p>
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
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : leagues.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-amber-200 p-12 text-center">
            <div className="text-5xl mb-3">🏆</div>
            <h3 className="text-lg font-black text-slate-900 mb-1">لم تُنشئ أي بطولة بعد</h3>
            <p className="text-slate-400 text-sm mb-5">أنشئ بطولتك الأولى الآن وادعُ الفرق للمشاركة</p>
            <button
              onClick={() => navigate('/create-tournament')}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
            >
              <i className="fas fa-plus me-2" /> إنشاء بطولة
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {leagues.map(league => (
              <div key={league.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0 shadow-sm">
                      {league.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-black text-slate-900 text-lg truncate">{league.name}</h3>
                        {statusBadge(league.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <i className="fas fa-calendar text-emerald-500 text-[10px]" /> {league.startDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="fas fa-users text-blue-500 text-[10px]" />
                          {league.teamsCount}/{league.maxTeams} فريق
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="fas fa-trophy text-amber-500 text-[10px]" /> {league.prizePool}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="fas fa-futbol text-slate-400 text-[10px]" /> {league.sport}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => navigate('/leagues')}
                        title="عرض البطولة"
                        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors border border-slate-200"
                      >
                        <i className="fas fa-eye text-sm" />
                      </button>
                      <button
                        onClick={() => { setDeleteConfirmId(league.id); setDeleteError(''); }}
                        title="حذف البطولة"
                        className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors border border-red-100"
                      >
                        <i className="fas fa-trash text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Link to all tournaments */}
        <div className="text-center">
          <button
            onClick={() => navigate('/leagues')}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-2 mx-auto transition-colors"
          >
            <i className="fas fa-globe text-xs" /> عرض جميع البطولات
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyTournaments;
