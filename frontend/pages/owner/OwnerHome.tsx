import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { backend } from '../../services/backend';
import { type OwnerStats, type OwnerRevenue } from '../../services/api';
import { Booking, Field } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../utils/translations';

const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

const OwnerHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const [stats,        setStats]        = useState<OwnerStats | null>(null);
  const [revenue,      setRevenue]      = useState<OwnerRevenue | null>(null);
  const [bookings,     setBookings]     = useState<Booking[]>([]);
  const [fields,       setFields]       = useState<Field[]>([]);
  const [fieldsLoading,setFieldsLoading]= useState(true);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      backend.getOwnerStats(),
      backend.getOwnerRevenue(),
      backend.getBookings(),
    ]).then(([s, r, bs]) => {
      setStats(s);
      setRevenue(r);
      setBookings(bs);
      setLoading(false);
    });
    backend.getMyFields().then(fs => {
      setFields(fs);
      setFieldsLoading(false);
    });
  }, []);

  const confirmed  = bookings.filter(b => b.status === 'مؤكد');
  const pending    = bookings.filter(b => b.status === 'قيد الانتظار');
  const cancelled  = bookings.filter(b => b.status === 'ملغي');
  const totalRev   = revenue?.total.revenue ?? 0;
  const cancRate   = bookings.length ? Math.round((cancelled.length / bookings.length) * 100) : 0;
  const occupancy  = bookings.length ? Math.round((confirmed.length / bookings.length) * 100) : 0;

  // day-of-week frequency from bookings
  const dayFreq: Record<number, number> = {};
  bookings.forEach(b => {
    if (b.date) {
      const dayIdx = new Date(b.date).getDay();
      dayFreq[dayIdx] = (dayFreq[dayIdx] || 0) + 1;
    }
  });
  const DAYS = [
    t.ownerDashboard.days.sun,
    t.ownerDashboard.days.mon,
    t.ownerDashboard.days.tue,
    t.ownerDashboard.days.wed,
    t.ownerDashboard.days.thu,
    t.ownerDashboard.days.fri,
    t.ownerDashboard.days.sat,
  ];
  const dayCounts   = DAYS.map((_, i) => dayFreq[i] || 0);
  const maxDayCount = Math.max(...dayCounts, 1);

  // peak hours
  const hourFreq: Record<string, number> = {};
  bookings.filter(b => b.status === 'مؤكد').forEach(b => {
    if (b.timeSlot) {
      const h = b.timeSlot.split(':')[0].trim();
      if (h) hourFreq[h] = (hourFreq[h] || 0) + 1;
    }
  });
  const peakHours = Object.entries(hourFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([h, count]) => ({ label: `${h}:00`, count }));
  const maxHour = Math.max(...peakHours.map(h => h.count), 1);

  // payment method
  const cashCount  = bookings.filter(b => !b.paymentMethod || b.paymentMethod === 'كاش').length;
  const visaCount  = bookings.filter(b => b.paymentMethod === 'فيزا').length;
  const totalPay   = cashCount + visaCount;
  const cashPct    = totalPay ? Math.round((cashCount / totalPay) * 100) : 0;
  const visaPct    = totalPay ? Math.round((visaCount / totalPay) * 100) : 0;

  // today's confirmed schedule
  const todayStr      = new Date().toISOString().split('T')[0];
  const todayBookings = bookings
    .filter(b => b.date === todayStr && b.status === 'مؤكد')
    .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));

  const monthlyPct = totalRev ? Math.round(((revenue?.monthly.revenue ?? 0) / totalRev) * 100) : 0;
  const weeklyPct  = totalRev ? Math.round(((revenue?.weekly.revenue  ?? 0) / totalRev) * 100) : 0;

  const KPI = [
    { icon:'fa-calendar-check',  bg:'bg-emerald-50', border:'border-emerald-200', ic:'text-emerald-600', label:t.ownerDashboard.kpis.totalBookings,    val:bookings.length,                              sub:t.ownerDashboard.kpiSubs.bookingRegistered },
    { icon:'fa-fire-alt',        bg:'bg-orange-50',  border:'border-orange-200',  ic:'text-orange-500',  label:t.ownerDashboard.kpis.monthlyRevenue,   val:`${revenue?.monthly.revenue ?? 0} د.أ`,        sub:t.ownerDashboard.kpiSubs.currentMonth      },
    { icon:'fa-bolt',            bg:'bg-blue-50',    border:'border-blue-200',    ic:'text-blue-600',    label:t.ownerDashboard.kpis.weeklyRevenue,    val:`${revenue?.weekly.revenue  ?? 0} د.أ`,        sub:t.ownerDashboard.kpiSubs.last7Days         },
    { icon:'fa-sun',             bg:'bg-yellow-50',  border:'border-yellow-200',  ic:'text-yellow-600',  label:t.ownerDashboard.kpis.todayRevenue,      val:`${revenue?.daily.revenue   ?? 0} د.أ`,        sub:t.ownerDashboard.kpiSubs.todayOnly         },
    { icon:'fa-chart-pie',       bg:'bg-teal-50',    border:'border-teal-200',    ic:'text-teal-600',    label:t.ownerDashboard.kpis.occupancy,         val:`${occupancy}%`,                              sub:t.ownerDashboard.kpiSubs.ofConfirmed       },
    { icon:'fa-times-circle',    bg:'bg-red-50',     border:'border-red-200',     ic:'text-red-500',     label:t.ownerDashboard.kpis.cancelled,          val:cancelled.length,                             sub:`${cancRate}% ${t.ownerDashboard.cancellationRate}` },
    { icon:'fa-futbol',          bg:'bg-indigo-50',  border:'border-indigo-200',  ic:'text-indigo-600',  label:t.ownerDashboard.kpis.totalFields,       val:stats?.totalFields ?? 0,                      sub:t.ownerDashboard.kpiSubs.fieldRegistered   },
    { icon:'fa-star',            bg:'bg-amber-50',   border:'border-amber-200',   ic:'text-amber-600',   label:t.ownerDashboard.kpis.avgRating,        val:stats?.avgRating?.toFixed(1) ?? '—',           sub:`${stats?.totalReviews ?? 0} ${t.ownerDashboard.kpiSubs.reviews}` },
  ];

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'}>

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-slate-900 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-6" style={{ minHeight: 220 }}>
        <img
          src="https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1600&q=80"
          className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105" alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-900/95" />

        {/* Welcome row */}
        <div className="relative z-10 px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">{t.ownerDashboard.title}</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">{t.ownerDashboard.welcomePrefix} {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-slate-400 text-sm">{t.ownerDashboard.welcomeDefault}</p>
          </div>
          {!loading && pending.length > 0 && (
            <button
              onClick={() => navigate('/owner/bookings')}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold rounded-xl hover:bg-amber-400/30 transition-all self-start sm:self-auto"
            >
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              {pending.length} {t.ownerDashboard.pendingBooking}
            </button>
          )}
        </div>

        {/* 4-stat strip */}
        <div className="relative z-10 grid grid-cols-4 border-t border-white/10">
          {[
            { icon:'fa-coins',        color:'text-emerald-400', label:t.ownerDashboard.strip.totalRevenue, val: loading ? '—' : `${totalRev} د.أ`                        },
            { icon:'fa-check-circle', color:'text-blue-400',    label:t.ownerDashboard.strip.confirmed,    val: loading ? '—' : confirmed.length                          },
            { icon:'fa-clock',        color:'text-amber-400',   label:t.ownerDashboard.strip.pending,      val: loading ? '—' : pending.length                            },
            { icon:'fa-star',         color:'text-violet-400',  label:t.ownerDashboard.strip.avgRating,    val: loading ? '—' : (stats?.avgRating?.toFixed(1) ?? '—')     },
          ].map((s, i) => (
            <div key={i} className="px-4 py-4 text-center border-e border-white/10 last:border-none">
              <i className={`fas ${s.icon} ${s.color} text-sm mb-1 block`} />
              <p className="text-xl font-black text-white">{s.val}</p>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">

        {/* ── 8 KPI cards ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {KPI.map((c, i) => (
              <div key={i} className={`bg-white rounded-2xl border-2 ${c.border} p-4 shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <i className={`fas ${c.icon} ${c.ic} text-sm`} />
                </div>
                <p className="text-xl font-black text-slate-900">{c.val}</p>
                <p className="text-xs font-black text-slate-600 mt-0.5">{c.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Revenue dark card + Day-of-week chart ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Revenue breakdown */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
            <div className="absolute -top-8 -end-8 w-32 h-32 bg-emerald-500/10 rounded-full" />
            <div className="absolute -bottom-10 -start-10 w-40 h-40 bg-blue-500/10 rounded-full" />
            <div className="relative z-10">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{t.ownerDashboard.revenueBreakdown}</p>
              <p className="text-4xl font-black mb-0.5">
                {totalRev} <span className="text-base text-slate-400 font-medium">د.أ</span>
              </p>
              <p className="text-slate-500 text-xs mb-5">{t.ownerDashboard.totalFromConfirmed}</p>

              <div className="space-y-3">
                {[
                  { label:t.ownerDashboard.thisMonth, val: revenue?.monthly.revenue ?? 0, color:'bg-emerald-500', icon:'fa-calendar-alt',  pct: monthlyPct },
                  { label:t.ownerDashboard.thisWeek,  val: revenue?.weekly.revenue  ?? 0, color:'bg-blue-500',   icon:'fa-calendar-week', pct: weeklyPct  },
                ].map(p => (
                  <div key={p.label}>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <i className={`fas ${p.icon} text-slate-400`} />
                        <span className="text-slate-300 font-bold">{p.label}</span>
                      </div>
                      <span className="font-black text-white">
                        {p.val} د.أ <span className="text-slate-500 font-normal">({p.pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${p.color} rounded-full transition-all duration-700`} style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                {[
                  { label:t.ownerDashboard.statusConfirmed,    val: confirmed.length,   color:'text-emerald-400' },
                  { label:t.ownerDashboard.statusPending,      val: pending.length,     color:'text-amber-400'   },
                  { label:t.ownerDashboard.cancellationRate,   val: `${cancRate}%`,     color:'text-red-400'     },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 rounded-xl py-2">
                    <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Day-of-week chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t.ownerDashboard.analysis}</p>
            <h3 className="font-black text-slate-900 mb-5">{t.ownerDashboard.bookingsByDay}</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-7 h-7 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2.5">
                {DAYS.map((d, i) => (
                  <div key={d} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-16 text-start shrink-0">{d}</span>
                    <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full rounded-lg flex items-center justify-end pe-2 transition-all duration-700 ${dayCounts[i] > 0 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : ''}`}
                        style={{ width: `${dayCounts[i] > 0 ? Math.max(Math.round((dayCounts[i] / maxDayCount) * 100), 10) : 0}%` }}
                      >
                        {dayCounts[i] > 0 && <span className="text-[10px] font-black text-white">{dayCounts[i]}</span>}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 w-6 text-start">{dayCounts[i]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Peak hours + Cash/Visa ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Peak hours */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t.ownerDashboard.analysis}</p>
            <h3 className="font-black text-slate-900 mb-5">{t.ownerDashboard.peakHoursTitle}</h3>
            {loading ? (
              <div className="flex justify-center py-8"><div className="w-7 h-7 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : peakHours.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">{t.ownerDashboard.notEnoughData}</div>
            ) : (
              <div className="space-y-2.5">
                {peakHours.map((h, i) => (
                  <div key={h.label} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-14 text-start shrink-0">{h.label}</span>
                    <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full rounded-lg flex items-center justify-end pe-2 transition-all duration-700 ${
                          i === 0 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                          i === 1 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                          'bg-gradient-to-r from-slate-300 to-slate-400'
                        }`}
                        style={{ width: `${Math.max(Math.round((h.count / maxHour) * 100), 12)}%` }}
                      >
                        <span className="text-[10px] font-black text-white">{h.count}</span>
                      </div>
                    </div>
                    {i === 0 && <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">{t.ownerDashboard.highest}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cash / Visa + status breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t.ownerDashboard.analysis}</p>
            <h3 className="font-black text-slate-900 mb-5">{t.ownerDashboard.paymentAndStatus}</h3>

            {/* Payment donut (CSS) */}
            <div className="flex items-center gap-5 mb-5">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="4"
                    strokeDasharray={`${cashPct} ${100 - cashPct}`} strokeLinecap="round" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="4"
                    strokeDasharray={`${visaPct} ${100 - visaPct}`}
                    strokeDashoffset={`${-(cashPct)}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs font-black text-slate-700">{totalPay}</p>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                    <span className="text-xs font-bold text-slate-600">{t.ownerDashboard.cash}</span>
                  </div>
                  <span className="font-black text-slate-900 text-sm">{cashCount} <span className="text-[10px] text-slate-400 font-normal">({cashPct}%)</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full" />
                    <span className="text-xs font-bold text-slate-600">{t.ownerDashboard.visa}</span>
                  </div>
                  <span className="font-black text-slate-900 text-sm">{visaCount} <span className="text-[10px] text-slate-400 font-normal">({visaPct}%)</span></span>
                </div>
              </div>
            </div>

            {/* Confirmed / cancelled bar */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 mb-2">{t.ownerDashboard.bookingsByStatus}</p>
              {[
                { label: t.ownerDashboard.statusConfirmed,  count: confirmed.length,  color: 'bg-emerald-400', pct: bookings.length ? Math.round(confirmed.length / bookings.length * 100) : 0 },
                { label: t.ownerDashboard.statusPending,    count: pending.length,    color: 'bg-amber-400',   pct: bookings.length ? Math.round(pending.length / bookings.length * 100) : 0   },
                { label: t.ownerDashboard.statusCancelled,  count: cancelled.length,  color: 'bg-red-400',     pct: bookings.length ? Math.round(cancelled.length / bookings.length * 100) : 0 },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="font-bold">{s.label}</span>
                    <span className="font-black text-slate-700">{s.count} ({s.pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Today's schedule + Recent bookings ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Today */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <span className="text-emerald-500 text-[11px] font-bold block mb-0.5">{t.ownerDashboard.today}</span>
                <h3 className="font-black text-slate-900">{t.ownerDashboard.todaySchedule}</h3>
              </div>
              <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                <i className="fas fa-calendar-day text-emerald-500 text-sm" />
              </div>
            </div>
            {loading ? (
              <div className="p-10 text-center">
                <div className="w-7 h-7 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : todayBookings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-slate-400 font-bold text-sm">{t.ownerDashboard.noConfirmedToday}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {todayBookings.slice(0, 6).map(b => (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-14 text-center flex-shrink-0">
                      <p className="text-xs font-black text-slate-700" dir="ltr">{b.timeSlot?.split('-')[0] || b.timeSlot}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{b.fieldName || 'ملعب'}</p>
                      <p className="text-xs text-slate-400">{b.userName || '—'}</p>
                    </div>
                    <p className="font-black text-emerald-600 text-sm flex-shrink-0">
                      {b.price} <span className="text-xs font-bold">د.أ</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent bookings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <span className="text-emerald-500 text-[11px] font-bold block mb-0.5">{t.ownerDashboard.recentActivity}</span>
                <h3 className="font-black text-slate-900">{t.ownerDashboard.recentBookings}</h3>
              </div>
              <button
                onClick={() => navigate('/owner/bookings')}
                className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <i className="fas fa-arrow-right text-xs" /> {t.ownerDashboard.viewAll}
              </button>
            </div>
            {loading ? (
              <div className="p-10 text-center">
                <div className="w-7 h-7 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-slate-400 font-bold text-sm">{t.ownerDashboard.noBookings}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {bookings.slice(0, 5).map(b => (
                  <div key={b.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      b.status === 'مؤكد' ? 'bg-emerald-50' : b.status === 'ملغي' ? 'bg-red-50' : 'bg-amber-50'
                    }`}>
                      <i className={`fas text-sm ${
                        b.status === 'مؤكد' ? 'fa-check text-emerald-600' : b.status === 'ملغي' ? 'fa-times text-red-500' : 'fa-clock text-amber-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{b.fieldName}</p>
                      <p className="text-xs text-slate-400">{b.date} · <span dir="ltr">{b.timeSlot}</span></p>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === 'مؤكد' ? 'bg-emerald-100 text-emerald-700' :
                        b.status === 'ملغي' ? 'bg-red-100 text-red-600' :
                                               'bg-amber-100 text-amber-700'
                      }`}>{b.status}</span>
                      <p className="text-xs font-black text-emerald-600 mt-1">{b.price} <span className="font-bold">د.أ</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── My Fields ───────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <span className="text-emerald-500 text-[11px] font-bold block mb-0.5">{t.ownerDashboard.fieldManagement}</span>
              <h3 className="font-black text-slate-900">{t.ownerDashboard.myFields}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/owner/fields')}
                className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                <i className="fas fa-arrow-right text-xs" /> {t.ownerDashboard.viewAll}
              </button>
              <button onClick={() => navigate('/owner/fields')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors">
                <i className="fas fa-plus text-[10px]" /> {t.ownerDashboard.addField}
              </button>
            </div>
          </div>

          {fieldsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
              {[1,2].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : fields.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">🏟️</div>
              <h3 className="font-black text-slate-800 mb-1">{t.ownerDashboard.noFields}</h3>
              <p className="text-sm text-slate-400 mb-4">{t.ownerDashboard.noFieldsDesc}</p>
              <button onClick={() => navigate('/owner/fields')}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors">
                <i className="fas fa-plus me-2" /> {t.ownerDashboard.addField}
              </button>
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.slice(0, 4).map(f => {
                const hash = f.name.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffffffff, 0);
                const palettes = [
                  ['#064e3b','#065f46'],['#1e3a5f','#1e40af'],['#3b0764','#6b21a8'],
                  ['#7f1d1d','#991b1b'],['#134e4a','#0f766e'],['#1c1917','#292524'],
                  ['#0c4a6e','#0369a1'],['#14532d','#166534'],['#713f12','#92400e'],
                  ['#1e1b4b','#312e81'],
                ];
                const [from, to] = palettes[Math.abs(hash) % palettes.length];
                const fb  = bookings.filter(b => b.fieldId === f.id);
                const rev = fb.filter(b => b.status !== 'ملغي').reduce((s, b) => s + (b.price || 0), 0);
                return (
                  <button key={f.id} onClick={() => navigate('/owner/fields')}
                    className="group text-start rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    {/* Gradient banner */}
                    <div className="relative h-20 overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}>
                      <svg viewBox="0 0 200 80" className="absolute inset-0 w-full h-full opacity-[0.07]"
                        fill="none" stroke="white" strokeWidth="1">
                        <rect x="5" y="5" width="190" height="70" rx="2"/>
                        <line x1="100" y1="5" x2="100" y2="75"/>
                        <circle cx="100" cy="40" r="15"/>
                        <rect x="5" y="22" width="24" height="36"/>
                        <rect x="171" y="22" width="24" height="36"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center px-4">
                        <div>
                          <p className="text-white font-black text-sm leading-tight">{f.name}</p>
                          <p className="text-white/60 text-[10px] mt-0.5">{f.city} · {f.type}</p>
                        </div>
                      </div>
                      {f.rating > 0 && (
                        <div className="absolute top-2 left-2 bg-black/30 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <i className="fas fa-star text-[8px]" /> {f.rating}
                        </div>
                      )}
                    </div>
                    {/* Stats row */}
                    <div className="bg-white px-4 py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span><i className="fas fa-calendar-check text-emerald-400 me-1" />{fb.length} {t.ownerDashboard.bookingCount}</span>
                        <span className="font-black text-emerald-600">{rev} د.أ</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{f.pricePerHour} د.أ/ساعة</span>
                    </div>
                  </button>
                );
              })}
              {fields.length > 4 && (
                <button onClick={() => navigate('/owner/fields')}
                  className="col-span-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-emerald-600 hover:text-emerald-700 border-2 border-dashed border-emerald-200 rounded-2xl hover:bg-emerald-50 transition-all">
                  <i className="fas fa-th-list text-xs" /> {t.ownerDashboard.viewAll} ({fields.length})
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default OwnerHome;
