import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { Booking } from '../types';

type StatusFilter = 'all' | 'مؤكد' | 'قيد الانتظار' | 'ملغي' | 'منتهي';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  'مؤكد':          { color: 'text-emerald-700', bg: 'bg-emerald-100',  icon: 'fa-check-circle',   label: 'مؤكد'          },
  'قيد الانتظار':  { color: 'text-amber-700',   bg: 'bg-amber-100',    icon: 'fa-clock',          label: 'قيد الانتظار'  },
  'ملغي':          { color: 'text-red-600',     bg: 'bg-red-100',      icon: 'fa-times-circle',   label: 'ملغي'          },
  'منتهي':         { color: 'text-slate-500',   bg: 'bg-slate-100',    icon: 'fa-flag-checkered', label: 'منتهي'         },
};

const PlayerBookings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<StatusFilter>('all');
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    backend.getBookings().then(data => {
      setBookings(data.filter(b => b.userId === user?.id || !b.userId));
      setLoading(false);
    });
  }, [user?.id]);

  const handleCancel = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) return;
    setCancelling(id);
    const res = await backend.cancelBooking(id);
    if (res.success && res.data) {
      setBookings(res.data.filter(b => b.userId === user?.id || !b.userId));
    }
    setCancelling(null);
  };

  const visible = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const counts = {
    all:             bookings.length,
    'مؤكد':          bookings.filter(b => b.status === 'مؤكد').length,
    'قيد الانتظار':  bookings.filter(b => b.status === 'قيد الانتظار').length,
    'ملغي':          bookings.filter(b => b.status === 'ملغي').length,
    'منتهي':         bookings.filter(b => b.status === 'منتهي').length,
  };

  const FILTERS: { id: StatusFilter; label: string; icon: string }[] = [
    { id: 'all',           label: 'الكل',           icon: 'fa-list'            },
    { id: 'مؤكد',          label: 'مؤكدة',          icon: 'fa-check-circle'    },
    { id: 'قيد الانتظار',  label: 'قيد الانتظار',   icon: 'fa-clock'           },
    { id: 'منتهي',         label: 'منتهية',          icon: 'fa-flag-checkered'  },
    { id: 'ملغي',          label: 'ملغاة',           icon: 'fa-times-circle'    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <i className="fas fa-calendar-check text-emerald-500" />
                حجوزاتي
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">تابع حجوزاتك الحالية وأدرها بسهولة</p>
            </div>
            <button
              onClick={() => navigate('/explore')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-emerald-200 transition-all hover:-translate-y-0.5">
              <i className="fas fa-plus text-xs" /> حجز جديد
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-2 mt-5">
            {[
              { label: 'إجمالي',        val: counts.all,             color: 'text-slate-700',   bg: 'bg-slate-100'  },
              { label: 'مؤكدة',         val: counts['مؤكد'],         color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'انتظار',        val: counts['قيد الانتظار'], color: 'text-amber-700',   bg: 'bg-amber-50'   },
              { label: 'منتهية',        val: counts['منتهي'],        color: 'text-slate-500',   bg: 'bg-slate-50'   },
              { label: 'ملغاة',         val: counts['ملغي'],         color: 'text-red-600',     bg: 'bg-red-50'     },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-2xl p-3 text-center border border-white shadow-sm`}>
                <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                <p className={`text-xs font-bold ${s.color} opacity-70 mt-0.5`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ══ FILTER TABS ════════════════════════════════════════════════════ */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {FILTERS.map(f => {
            const cnt = f.id === 'all' ? counts.all : counts[f.id];
            return (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                  filter === f.id
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200'
                    : 'bg-white text-slate-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
                }`}>
                <i className={`fas ${f.icon} text-xs`} />
                {f.label}
                {cnt > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    filter === f.id ? 'bg-white/25 text-white' : 'bg-gray-100 text-slate-500'
                  }`}>{cnt}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ══ BOOKINGS LIST ══════════════════════════════════════════════════ */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              {filter === 'all' ? 'لا توجد حجوزات بعد' : `لا توجد حجوزات ${FILTERS.find(f => f.id === filter)?.label}`}
            </h3>
            <p className="text-slate-400 text-sm mb-5">ابدأ بحجز ملعبك المفضل الآن</p>
            <button onClick={() => navigate('/explore')}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors">
              <i className="fas fa-search me-2" /> تصفح الملاعب
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map(b => {
              const st = STATUS_CONFIG[b.status] ?? STATUS_CONFIG['قيد الانتظار'];
              const canCancel = b.status === 'قيد الانتظار'; // لا إلغاء بعد التأكيد أو الانتهاء
              return (
                <div key={b.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">

                  {/* Status stripe */}
                  <div className={`h-1 ${b.status === 'مؤكد' ? 'bg-emerald-400' : b.status === 'قيد الانتظار' ? 'bg-amber-400' : b.status === 'منتهي' ? 'bg-slate-300' : 'bg-red-300'}`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: field info */}
                      <div className="flex gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-futbol text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-slate-900 text-base truncate">{b.fieldName}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <i className="fas fa-calendar text-emerald-400 text-xs" /> {b.date}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <i className="fas fa-clock text-emerald-400 text-xs" /> {b.timeSlot}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: status + price */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${st.bg} ${st.color}`}>
                          <i className={`fas ${st.icon} text-[10px]`} /> {st.label}
                        </span>
                        <span className="text-slate-900 font-black text-lg">
                          {b.price}<span className="text-emerald-600 text-sm font-bold"> د.أ</span>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {canCancel && (
                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                          <i className="fas fa-info-circle me-1 text-blue-400" />
                          يمكنك الإلغاء قبل 24 ساعة من موعد الحجز
                        </p>
                        <button
                          onClick={() => handleCancel(b.id)}
                          disabled={cancelling === b.id}
                          className="flex items-center gap-1.5 px-4 py-2 border-2 border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 text-xs font-bold rounded-xl transition-all disabled:opacity-50">
                          {cancelling === b.id
                            ? <><div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"/> جاري الإلغاء...</>
                            : <><i className="fas fa-times text-xs" /> إلغاء الحجز</>
                          }
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerBookings;
