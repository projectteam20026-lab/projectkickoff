import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { Booking } from '../types';

type StatusFilter = 'all' | 'مؤكد' | 'قيد الانتظار' | 'ملغي' | 'منتهي';

const PlayerBookingsHistory: React.FC = () => {
  const { user } = useAuth();
  const [all, setAll]         = useState<Booking[]>([]);
  const [filter, setFilter]   = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    backend.getBookings().then(data => {
      setAll(data.filter(b => !b.userId || b.userId === user?.id));
      setLoading(false);
    });
  }, [user?.id]);

  const visible = filter === 'all' ? all : all.filter(b => b.status === filter);

  const STATUS_STYLE: Record<string, { chip: string; dot: string }> = {
    'مؤكد':         { chip: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
    'قيد الانتظار': { chip: 'bg-amber-100   text-amber-700',   dot: 'bg-amber-400'   },
    'ملغي':         { chip: 'bg-red-100     text-red-600',     dot: 'bg-red-400'     },
    'منتهي':        { chip: 'bg-slate-100   text-slate-500',   dot: 'bg-slate-300'   },
  };

  const counts = {
    all: all.length,
    'مؤكد':         all.filter(b => b.status === 'مؤكد').length,
    'قيد الانتظار': all.filter(b => b.status === 'قيد الانتظار').length,
    'ملغي':         all.filter(b => b.status === 'ملغي').length,
    'منتهي':        all.filter(b => b.status === 'منتهي').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <i className="fas fa-calendar-check text-emerald-500" />
            <span className="font-bold text-slate-600">حجوزاتي</span>
            <i className="fas fa-chevron-left text-[9px]" />
            <span>السجل</span>
          </div>
          <h1 className="text-xl font-black text-slate-900">سجل الحجوزات</h1>
          <p className="text-slate-500 text-xs mt-0.5">جميع حجوزاتك السابقة والحالية</p>

          {/* Summary cards */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {[
              { label: 'الكل',     val: counts.all,             color: 'text-slate-700',   bg: 'bg-slate-50'   },
              { label: 'مؤكدة',    val: counts['مؤكد'],         color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'انتظار',   val: counts['قيد الانتظار'], color: 'text-amber-700',   bg: 'bg-amber-50'   },
              { label: 'منتهية',   val: counts['منتهي'],        color: 'text-slate-500',   bg: 'bg-slate-100'  },
              { label: 'ملغاة',    val: counts['ملغي'],         color: 'text-red-600',     bg: 'bg-red-50'     },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-2.5 text-center border border-white shadow-sm`}>
                <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                <p className={`text-[10px] font-bold ${s.color} opacity-70`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">

        {/* Sub-nav */}
        <div className="flex gap-2 mb-5">
          {[
            { path: '/bookings/current', label: 'الحالية', icon: 'fa-calendar-check' },
            { path: '/bookings/history', label: 'السجل',   icon: 'fa-history'        },
            { path: '/bookings/manage',  label: 'الإدارة', icon: 'fa-tasks'          },
          ].map(t => (
            <Link key={t.path} to={t.path}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                t.path === '/bookings/history'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : 'bg-white text-slate-500 border-gray-200 hover:border-emerald-200 hover:text-emerald-600'
              }`}>
              <i className={`fas ${t.icon} text-[10px]`} /> {t.label}
            </Link>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all', 'مؤكد', 'قيد الانتظار', 'منتهي', 'ملغي'] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                filter === f
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-gray-200 hover:border-slate-400'
              }`}>
              {f === 'all' ? 'الكل' : f}
              <span className={`ms-1.5 text-[9px] font-black ${filter === f ? 'text-white/70' : 'text-slate-400'}`}>
                {f === 'all' ? counts.all : counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-gray-100" />)}</div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <i className="fas fa-history text-4xl text-gray-200 mb-3 block" />
            <p className="font-bold text-slate-400">لا توجد نتائج</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visible.map(b => {
              const st = STATUS_STYLE[b.status] || STATUS_STYLE['قيد الانتظار'];
              return (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 p-4">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-sm truncate">{b.fieldName}</p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span><i className="fas fa-calendar text-[10px] text-emerald-400 me-1" />{b.date}</span>
                        <span><i className="fas fa-clock text-[10px] text-emerald-400 me-1" />{b.timeSlot}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${st.chip}`}>{b.status}</span>
                      <span className="text-sm font-black text-slate-900">{b.price} <span className="text-emerald-600 text-xs">د.أ</span></span>
                    </div>
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

export default PlayerBookingsHistory;
