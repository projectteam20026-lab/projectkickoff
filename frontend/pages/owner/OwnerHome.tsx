import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { backend } from '../../services/backend';
import { type OwnerStats } from '../../services/api';
import { Booking } from '../../types';

const OwnerHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]       = useState<OwnerStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([backend.getOwnerStats(), backend.getBookings()]).then(([s, bs]) => {
      setStats(s);
      setBookings(bs.slice(0, 6));
      setLoading(false);
    });
  }, []);

  const KPI = [
    { icon: 'fa-futbol',         color: 'bg-emerald-500', label: 'إجمالي الملاعب',    val: stats?.totalFields    ?? '—' },
    { icon: 'fa-calendar-check', color: 'bg-blue-500',    label: 'إجمالي الحجوزات',   val: stats?.totalBookings  ?? '—' },
    { icon: 'fa-clock',          color: 'bg-amber-500',   label: 'حجوزات اليوم',       val: stats?.todayBookings  ?? '—' },
    { icon: 'fa-money-bill-wave',color: 'bg-teal-500',    label: 'إيرادات الشهر',      val: stats ? `${stats.monthlyRevenue} د.أ` : '—' },
    { icon: 'fa-star',           color: 'bg-violet-500',  label: 'متوسط التقييم',      val: stats?.avgRating      ?? '—' },
    { icon: 'fa-comment',        color: 'bg-pink-500',    label: 'إجمالي التقييمات',   val: stats?.totalReviews   ?? '—' },
  ];

  return (
    <div className="space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">لوحة التحكم</p>
          <h1 className="text-2xl font-black text-slate-900">
            مرحباً، {user?.name?.split(' ')[0]} 👋
          </h1>
        </div>
        <button
          onClick={() => navigate('/owner/fields')}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
        >
          <i className="fas fa-plus text-xs" /> إضافة ملعب
        </button>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {KPI.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
              <div className={`w-10 h-10 ${c.color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                <i className={`fas ${c.icon} text-white text-sm`} />
              </div>
              <p className="text-slate-400 text-xs font-bold mb-1">{c.label}</p>
              <p className="text-2xl font-black text-slate-900">{c.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent bookings */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <span className="text-emerald-500 text-[11px] font-bold block mb-0.5">آخر النشاط</span>
              <h3 className="font-black text-slate-900">آخر الحجوزات</h3>
            </div>
            <button
              onClick={() => navigate('/owner/bookings')}
              className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <i className="fas fa-arrow-right text-xs" /> عرض الكل
            </button>
          </div>
          {loading ? (
            <div className="p-10 text-center">
              <div className="w-7 h-7 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-slate-400 font-bold text-sm">لا توجد حجوزات بعد</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {bookings.map(b => (
                <div key={b.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                    📅
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{b.fieldName}</p>
                    <p className="text-xs text-slate-400">{b.date} · <span dir="ltr">{b.timeSlot}</span></p>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      b.status === 'مؤكد'            ? 'bg-emerald-100 text-emerald-700' :
                      b.status === 'ملغي'            ? 'bg-red-100 text-red-600' :
                                                        'bg-amber-100 text-amber-700'
                    }`}>{b.status}</span>
                    <p className="text-xs font-black text-emerald-600 mt-1">{b.price} <span className="font-bold">د.أ</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="space-y-3">
          <div className="bg-slate-900 rounded-2xl p-5 text-white">
            <p className="text-slate-400 text-xs font-bold mb-1">الإيرادات الشهرية</p>
            <p className="text-3xl font-black mb-4">{stats?.monthlyRevenue ?? 0} <span className="text-sm text-slate-400 font-medium">د.أ</span></p>
            <button
              onClick={() => navigate('/owner/revenue')}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <i className="fas fa-chart-line me-2" /> تقرير الإيرادات
            </button>
          </div>

          {[
            { label: 'إدارة الملاعب',    icon: 'fa-futbol',        path: '/owner/fields',    color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { label: 'مراجعة الحجوزات',  icon: 'fa-calendar-alt', path: '/owner/bookings',  color: 'text-blue-600 bg-blue-50 border-blue-100'         },
            { label: 'التقييمات',         icon: 'fa-star',          path: '/owner/reviews',   color: 'text-amber-600 bg-amber-50 border-amber-100'       },
          ].map(l => (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold transition-all hover:scale-[1.01] ${l.color}`}
            >
              <i className={`fas ${l.icon}`} />
              <span className="flex-1 text-start">{l.label}</span>
              <i className="fas fa-arrow-left text-xs opacity-50" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OwnerHome;
