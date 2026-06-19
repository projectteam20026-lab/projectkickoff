import React, { useState, useEffect } from 'react';
import { backend } from '../../services/backend';
import { type OwnerRevenue } from '../../services/api';

type Period = 'daily' | 'weekly' | 'monthly' | 'total';

const PERIODS: { key: Period; label: string; icon: string; color: string }[] = [
  { key: 'daily',   label: 'اليوم',     icon: 'fa-sun',          color: 'text-amber-600 bg-amber-50 border-amber-200'    },
  { key: 'weekly',  label: 'هذا الأسبوع', icon: 'fa-calendar-week', color: 'text-blue-600 bg-blue-50 border-blue-200'     },
  { key: 'monthly', label: 'هذا الشهر', icon: 'fa-calendar-alt', color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { key: 'total',   label: 'الإجمالي',  icon: 'fa-infinity',     color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
];

const statusBadge = (status: string) => {
  if (status === 'مؤكد') return 'bg-emerald-100 text-emerald-700';
  if (status === 'ملغي') return 'bg-red-100 text-red-600';
  return 'bg-amber-100 text-amber-700';
};

const OwnerRevenuePage: React.FC = () => {
  const [data, setData]     = useState<OwnerRevenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    backend.getOwnerRevenue().then(d => { setData(d); setLoading(false); });
  }, []);

  const getPeriod = (key: Period) => data?.[key] ?? { revenue: 0, count: 0 };

  return (
    <div className="space-y-6" dir="rtl">

      {/* Header */}
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">التقارير المالية</p>
        <h1 className="text-2xl font-black text-slate-900">الإيرادات</h1>
      </div>

      {/* Revenue cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {PERIODS.map(p => {
            const period = getPeriod(p.key);
            return (
              <div key={p.key} className={`bg-white rounded-2xl border-2 p-5 shadow-sm hover:shadow-md transition-all ${p.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black opacity-70">{p.label}</p>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center opacity-80 ${p.color}`}>
                    <i className={`fas ${p.icon} text-sm`} />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 mb-0.5">
                  {period.revenue.toLocaleString()} <span className="text-sm font-bold text-slate-400">د.أ</span>
                </p>
                <p className="text-xs opacity-60 font-bold">{period.count} حجز</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Visual bar — monthly comparison indicator */}
      {!loading && data && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-900 mb-4 text-sm">مقارنة الإيرادات</h3>
          <div className="space-y-3">
            {PERIODS.map(p => {
              const period = getPeriod(p.key);
              const max    = getPeriod('total').revenue || 1;
              const pct    = Math.round((period.revenue / max) * 100);
              return (
                <div key={p.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-600">{p.label}</span>
                    <span className="text-xs font-black text-slate-900">{period.revenue} د.أ</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <span className="text-emerald-500 text-[11px] font-bold block mb-0.5">آخر الحجوزات المدفوعة</span>
          <h3 className="font-black text-slate-900">آخر الحجوزات</h3>
        </div>
        {loading ? (
          <div className="p-10 text-center">
            <div className="w-7 h-7 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !data?.recentBookings?.length ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">💳</div>
            <p className="text-slate-400 font-bold text-sm">لا توجد حجوزات بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.recentBookings.map((b: any, i: number) => (
              <div key={b.id ?? i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50">
                {/* Avatar */}
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-100">
                  <i className="fas fa-receipt text-emerald-500 text-sm" />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{b.fieldName || 'ملعب'}</p>
                  <p className="text-xs text-slate-400">
                    {b.date} · <span dir="ltr">{b.timeSlot}</span>
                    {b.userName && <> · {b.userName}</>}
                  </p>
                </div>
                {/* Price + status */}
                <div className="text-end flex-shrink-0">
                  <p className="font-black text-emerald-600 text-sm">{b.price} <span className="text-xs text-slate-400 font-bold">د.أ</span></p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(b.status)}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerRevenuePage;
