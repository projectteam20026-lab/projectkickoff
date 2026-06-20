import React, { useState, useEffect, useRef } from 'react';
import { backend } from '../../services/backend';
import { Booking, Field } from '../../types';

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1400, start = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4); // ease-out quart
      setVal(Math.round(ease * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return val;
}

// ── Animated number ───────────────────────────────────────────────────────────
function AnimNum({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const n = useCountUp(value);
  return <>{prefix}{n.toLocaleString()}{suffix}</>;
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#10b981', w = 80, h = 32 }: {
  data: number[]; color?: string; w?: number; h?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 4 - ((v - min) / range) * (h - 8);
    return `${x},${y}`;
  }).join(' ');
  const area = `M0,${h} ` + data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 4 - ((v - min) / range) * (h - 8);
    return `L${x},${y}`;
  }).join(' ') + ` L${w},${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        const x = w;
        const y = h - 4 - ((last - min) / range) * (h - 8);
        return <circle cx={x} cy={y} r={3} fill={color} />;
      })()}
    </svg>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function Donut({ segments, size = 120, thickness = 16 }: {
  segments: { value: number; color: string; label: string }[];
  size?: number; thickness?: number;
}) {
  const cx = size / 2, cy = size / 2;
  const r  = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;
  let cum = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      {segments.map((seg, i) => {
        const pct   = seg.value / total;
        const dash  = pct * circ;
        const gap   = circ - dash;
        const off   = -cum * circ;
        cum += pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={off}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease' }}
          />
        );
      })}
      {/* Background track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={thickness}
        style={{ zIndex: -1 }} />
    </svg>
  );
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ bars, color = '#10b981', animate = true }: {
  bars: { label: string; value: number; sublabel?: string }[];
  color?: string; animate?: boolean;
}) {
  const maxVal = Math.max(...bars.map(b => b.value), 1);
  const H = 140;
  return (
    <div className="flex items-end gap-2 h-36 w-full" dir="ltr">
      {bars.map((b, i) => {
        const pct = b.value / maxVal;
        const barH = Math.max(pct * H, b.value > 0 ? 6 : 0);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full" style={{ height: H }}>
              {/* Tooltip */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {b.value} JD
              </div>
              {/* Bar */}
              <div className="absolute bottom-0 left-0 right-0 rounded-t-lg overflow-hidden"
                style={{ height: barH, background: `linear-gradient(to top, ${color}, ${color}cc)`,
                  transition: animate ? `height 0.8s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.06}s` : 'none',
                }} />
            </div>
            <span className="text-[9px] text-slate-400 font-bold truncate w-full text-center">{b.label}</span>
            {b.sublabel && <span className="text-[8px] text-slate-300">{b.sublabel}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Heatmap calendar ──────────────────────────────────────────────────────────
function HeatmapCalendar({ bookings }: { bookings: Booking[] }) {
  const today = new Date();
  const cells: { date: string; count: number; dayStr: string }[] = [];

  // Last 10 weeks (70 days)
  for (let i = 69; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayStr  = ['أح','اث','ث','أر','خ','ج','سب'][d.getDay()];
    cells.push({ date: dateStr, count: 0, dayStr });
  }
  bookings.forEach(b => {
    const cell = cells.find(c => c.date === b.date);
    if (cell && b.status !== 'ملغي') cell.count++;
  });

  const maxC = Math.max(...cells.map(c => c.count), 1);
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const getColor = (count: number) => {
    if (count === 0) return '#f1f5f9';
    const p = count / maxC;
    if (p < 0.25) return '#bbf7d0';
    if (p < 0.5)  return '#34d399';
    if (p < 0.75) return '#10b981';
    return '#047857';
  };

  return (
    <div className="overflow-x-auto" dir="ltr">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell, di) => (
              <div key={di} title={`${cell.date}: ${cell.count} حجز`}
                className="w-3.5 h-3.5 rounded-sm cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all"
                style={{ backgroundColor: getColor(cell.count) }} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-[10px] text-slate-400 font-bold">أقل</span>
        {['#f1f5f9','#bbf7d0','#34d399','#10b981','#047857'].map(c => (
          <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span className="text-[10px] text-slate-400 font-bold">أكثر</span>
      </div>
    </div>
  );
}

// ── Trend arrow ───────────────────────────────────────────────────────────────
function Trend({ value, unit = '%' }: { value: number; unit?: string }) {
  const up = value >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-black ${up ? 'text-emerald-500' : 'text-red-400'}`}>
      <i className={`fas fa-arrow-${up ? 'up' : 'down'} text-[10px]`} />
      {Math.abs(value)}{unit}
    </span>
  );
}

// ── Ring progress ─────────────────────────────────────────────────────────────
function Ring({ pct, color = '#10b981', size = 80, label = '' }: {
  pct: number; color?: string; size?: number; label?: string;
}) {
  const r    = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34,1.2,0.64,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-black text-slate-800">{pct}%</span>
        {label && <span className="text-[9px] text-slate-400 font-bold">{label}</span>}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const OwnerAnalytics: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fields,   setFields]   = useState<Field[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [range,    setRange]    = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    Promise.all([backend.getBookings(), backend.getMyFields()]).then(([bs, fs]) => {
      setBookings(bs); setFields(fs); setLoading(false);
    });
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const now   = new Date();
  const msDay = 86400000;

  const cutoff = range === 'week'  ? new Date(now.getTime() - 7 * msDay)
               : range === 'month' ? new Date(now.getTime() - 30 * msDay)
               : new Date(0);

  const inRange = bookings.filter(b => !b.date || new Date(b.date) >= cutoff);
  const confirmed = inRange.filter(b => b.status === 'مؤكد');
  const pending   = inRange.filter(b => b.status !== 'مؤكد' && b.status !== 'ملغي');
  const cancelled = inRange.filter(b => b.status === 'ملغي');
  const revenue   = confirmed.reduce((s, b) => s + (b.price || 0), 0);
  const cancelRate = inRange.length > 0 ? Math.round((cancelled.length / inRange.length) * 100) : 0;
  const occupRate  = inRange.length > 0 ? Math.round((confirmed.length / inRange.length) * 100) : 0;

  // Previous period comparison
  const prevCutoff = range === 'week'  ? new Date(now.getTime() - 14 * msDay)
                   : range === 'month' ? new Date(now.getTime() - 60 * msDay)
                   : new Date(0);
  const prevPeriod = bookings.filter(b => b.date
    && new Date(b.date) >= prevCutoff
    && new Date(b.date) < cutoff
  );
  const prevRev = prevPeriod.filter(b => b.status === 'مؤكد').reduce((s, b) => s + (b.price || 0), 0);
  const revTrend = prevRev > 0 ? Math.round(((revenue - prevRev) / prevRev) * 100) : 0;

  // Revenue by day/week bars (last 7 days)
  const last7: { label: string; value: number }[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * msDay);
    const dateStr = d.toISOString().split('T')[0];
    const rev = bookings
      .filter(b => b.date === dateStr && b.status === 'مؤكد')
      .reduce((s, b) => s + (b.price || 0), 0);
    const label = ['أح','اث','ث','أر','خ','ج','سب'][d.getDay()];
    return { label, value: rev };
  });

  // Revenue by month (last 6 months)
  const last6months: { label: string; value: number }[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const y = d.getFullYear(), m = d.getMonth();
    const rev = bookings
      .filter(b => {
        if (!b.date) return false;
        const bd = new Date(b.date);
        return bd.getFullYear() === y && bd.getMonth() === m && b.status === 'مؤكد';
      })
      .reduce((s, b) => s + (b.price || 0), 0);
    const label = ['ين','فب','مر','أب','مي','يو','يل','أغ','سب','أك','نو','دي'][m];
    return { label, value: rev };
  });

  // Sparkline data (last 7 days revenue)
  const sparkData = last7.map(d => d.value);

  // Per-field revenue
  const fieldRevMap: Record<string, number> = {};
  confirmed.forEach(b => {
    const fid = String(b.fieldId);
    fieldRevMap[fid] = (fieldRevMap[fid] || 0) + (b.price || 0);
  });
  const topFieldId  = Object.entries(fieldRevMap).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topField    = fields.find(f => f.id === topFieldId);
  const topFieldRev = fieldRevMap[topFieldId || ''] || 0;

  // Hourly distribution
  const hourMap: Record<string, number> = {};
  confirmed.forEach(b => {
    const h = b.timeSlot?.split(':')[0];
    if (h) hourMap[h] = (hourMap[h] || 0) + 1;
  });
  const hourBars = Array.from({ length: 14 }, (_, i) => {
    const h = String(i + 8).padStart(2, '0');
    return { label: `${i + 8}`, value: hourMap[h] || 0 };
  });
  const peakHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]?.[0];

  if (loading) return (
    <div className="space-y-4 animate-pulse" dir="rtl">
      <div className="h-8 bg-gray-200 rounded-2xl w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-5" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-1">لوحة البيانات</p>
          <h1 className="text-2xl font-black text-slate-900">التحليلات</h1>
        </div>
        {/* Range toggle */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([['week','أسبوع'],['month','شهر'],['all','الكل']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setRange(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'الإيرادات',
            value: revenue,
            suffix: ' JD',
            icon: 'fa-coins',
            grad: 'from-amber-400 to-orange-500',
            sparkColor: '#f59e0b',
            trend: revTrend,
          },
          {
            label: 'حجوزات مؤكدة',
            value: confirmed.length,
            icon: 'fa-check-circle',
            grad: 'from-emerald-400 to-teal-500',
            sparkColor: '#10b981',
          },
          {
            label: 'معدل الإشغال',
            value: occupRate,
            suffix: '%',
            icon: 'fa-chart-pie',
            grad: 'from-blue-400 to-indigo-500',
            sparkColor: '#3b82f6',
          },
          {
            label: 'معدل الإلغاء',
            value: cancelRate,
            suffix: '%',
            icon: 'fa-times-circle',
            grad: 'from-red-400 to-rose-500',
            sparkColor: '#ef4444',
          },
        ].map((k, i) => (
          <div key={i} className={`bg-gradient-to-br ${k.grad} rounded-2xl p-4 text-white shadow-md relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)',
            }} />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <i className={`fas ${k.icon} text-white/80 text-lg`} />
                {k.trend !== undefined && <Trend value={k.trend} />}
              </div>
              <p className="text-2xl font-black">
                <AnimNum value={k.value} suffix={k.suffix || ''} />
              </p>
              <p className="text-[11px] font-bold opacity-80 mt-0.5">{k.label}</p>
              <div className="mt-2 opacity-60">
                <Sparkline data={sparkData} color="white" w={80} h={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-slate-800">الإيرادات اليومية</h3>
              <p className="text-xs text-slate-400 mt-0.5">آخر 7 أيام</p>
            </div>
            <div className="text-end">
              <p className="text-xs text-slate-400">إجمالي</p>
              <p className="font-black text-slate-900 text-lg">
                <AnimNum value={last7.reduce((s, d) => s + d.value, 0)} suffix=" JD" />
              </p>
            </div>
          </div>
          <BarChart bars={last7} color="#10b981" />
        </div>

        {/* Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <h3 className="font-black text-slate-800 mb-4">توزيع الحجوزات</h3>
          <div className="flex-1 flex items-center justify-between gap-4">
            <div className="relative">
              <Donut size={120} thickness={14} segments={[
                { value: confirmed.length, color: '#10b981', label: 'مؤكد'  },
                { value: pending.length,   color: '#f59e0b', label: 'معلّق' },
                { value: cancelled.length, color: '#ef4444', label: 'ملغي'  },
              ]} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-black text-slate-800">{inRange.length}</p>
                  <p className="text-[9px] text-slate-400 font-bold">حجز</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { label:'مؤكد',  count:confirmed.length, color:'bg-emerald-400' },
                { label:'معلّق', count:pending.length,   color:'bg-amber-400'   },
                { label:'ملغي',  count:cancelled.length, color:'bg-red-400'     },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                  <span className="text-xs text-slate-500 flex-1">{s.label}</span>
                  <span className="font-black text-slate-800 text-sm">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly revenue + occupancy rings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Monthly bars */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-slate-800">الإيرادات الشهرية</h3>
              <p className="text-xs text-slate-400 mt-0.5">آخر 6 أشهر</p>
            </div>
          </div>
          <BarChart bars={last6months} color="#6366f1" />
        </div>

        {/* Rings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-800 mb-5">مؤشرات الأداء</h3>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Ring pct={occupRate} color="#10b981" size={72} label="إشغال" />
              <div>
                <p className="font-black text-slate-800">معدل الإشغال</p>
                <p className="text-xs text-slate-400 mt-0.5">من إجمالي الحجوزات</p>
                <div className="flex items-center gap-1 mt-1">
                  {occupRate >= 60
                    ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ممتاز</span>
                    : occupRate >= 30
                    ? <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">جيد</span>
                    : <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">يحتاج تحسين</span>
                  }
                </div>
              </div>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center gap-4">
              <Ring pct={Math.max(0, 100 - cancelRate)} color="#6366f1" size={72} label="احتفاظ" />
              <div>
                <p className="font-black text-slate-800">معدل الاحتفاظ</p>
                <p className="text-xs text-slate-400 mt-0.5">حجوزات لم تُلغَ</p>
                <div className="flex items-center gap-1 mt-1">
                  {cancelRate <= 10
                    ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ممتاز</span>
                    : cancelRate <= 25
                    ? <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">مقبول</span>
                    : <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">مرتفع</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-black text-slate-800">نشاط الحجوزات</h3>
            <p className="text-xs text-slate-400 mt-0.5">آخر 10 أسابيع</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <i className="fas fa-calendar-check text-emerald-400" />
            {confirmed.length} حجز مؤكد
          </div>
        </div>
        <HeatmapCalendar bookings={bookings} />
      </div>

      {/* Peak hours */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-black text-slate-800">ساعات الذروة</h3>
            <p className="text-xs text-slate-400 mt-0.5">توزيع الحجوزات بالساعة</p>
          </div>
          {peakHour && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-1.5">
              <i className="fas fa-fire text-orange-400 text-xs" />
              <span className="text-xs font-black text-orange-700">الذروة {peakHour}:00</span>
            </div>
          )}
        </div>
        <BarChart bars={hourBars} color="#f97316" animate />
      </div>

      {/* Top field + insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Top performing field */}
        {topField && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, #10b981 0%, transparent 50%)',
            }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-400 text-xs font-black uppercase tracking-widest">
                  <i className="fas fa-star me-1" />أفضل ملعب
                </span>
              </div>
              <h3 className="font-black text-xl mb-1">{topField.name}</h3>
              <p className="text-slate-400 text-sm">
                <i className="fas fa-map-marker-alt me-1" />{topField.city} · {topField.type}
              </p>
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-2xl font-black text-amber-400">
                    <AnimNum value={topFieldRev} suffix=" JD" />
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">إيراد</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-400">
                    <AnimNum value={confirmed.filter(b => b.fieldId === topFieldId).length} />
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">حجز</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-blue-400">
                    {topField.rating > 0 ? topField.rating : '—'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">تقييم</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Smart insights */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
            <i className="fas fa-lightbulb text-amber-400" /> رؤى ذكية
          </h3>
          <div className="space-y-3">
            {[
              ...(peakHour ? [{
                icon: 'fa-fire', c: 'bg-orange-50 border-orange-100',
                ic: 'text-orange-400',
                text: `الساعة ${peakHour}:00 هي الأكثر طلباً — فكّر في رفع السعر لها`,
              }] : []),
              ...(cancelRate > 20 ? [{
                icon: 'fa-exclamation-triangle', c: 'bg-red-50 border-red-100',
                ic: 'text-red-400',
                text: `معدل الإلغاء ${cancelRate}% مرتفع — جرّب طلب دفعة مقدمة`,
              }] : []),
              ...(cancelRate <= 10 && confirmed.length > 0 ? [{
                icon: 'fa-thumbs-up', c: 'bg-emerald-50 border-emerald-100',
                ic: 'text-emerald-500',
                text: `معدل إلغاء ممتاز! زبائنك ملتزمون — جرّب برنامج ولاء`,
              }] : []),
              ...(last7.filter(d => d.value === 0).length >= 3 ? [{
                icon: 'fa-calendar-times', c: 'bg-amber-50 border-amber-100',
                ic: 'text-amber-500',
                text: `بعض الأيام بدون حجوزات — جرّب عروض خصم للأيام الهادئة`,
              }] : []),
              ...(fields.length > 0 && revenue === 0 ? [{
                icon: 'fa-rocket', c: 'bg-blue-50 border-blue-100',
                ic: 'text-blue-400',
                text: `لم تبدأ الإيرادات بعد — شارك رابط ملعبك على واتساب`,
              }] : []),
              ...(!peakHour && confirmed.length === 0 ? [{
                icon: 'fa-chart-line', c: 'bg-slate-50 border-slate-100',
                ic: 'text-slate-400',
                text: `ابدأ باستقبال الحجوزات وستظهر هنا رؤى مخصصة لملعبك`,
              }] : []),
            ].slice(0, 4).map((tip, i) => (
              <div key={i} className={`flex items-start gap-3 border rounded-xl p-3 ${tip.c}`}>
                <i className={`fas ${tip.icon} ${tip.ic} mt-0.5 flex-shrink-0 text-sm`} />
                <p className="text-xs text-slate-700 font-medium leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerAnalytics;
