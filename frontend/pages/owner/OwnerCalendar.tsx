import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { backend } from '../../services/backend';
import { Booking } from '../../types';

const HOURS = [
  '08:00','09:00','10:00','11:00','12:00','13:00',
  '14:00','15:00','16:00','17:00','18:00','19:00',
  '20:00','21:00','22:00',
];

const ARABIC_MONTHS = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];
const ARABIC_DAYS   = ['أحد','اثن','ثلا','أرب','خمس','جمع','سبت'];
const ARABIC_DAYS_FULL = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

function pad(n: number) { return String(n).padStart(2, '0'); }
function dateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function todayStr() { return dateStr(new Date()); }

const OwnerCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [bookings,      setBookings]      = useState<Booking[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [calMonth,      setCalMonth]      = useState(() => new Date());
  const [calDay,        setCalDay]        = useState<string>(() => todayStr());
  const [blockedSlots,  setBlockedSlots]  = useState<Record<string, string[]>>({});

  const load = useCallback(() => {
    setLoading(true);
    backend.getBookings().then(data => { setBookings(data); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── calendar grid ───────────────────────────────────────────────── */
  const year  = calMonth.getFullYear();
  const month = calMonth.getMonth();

  const firstDay  = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMon = new Date(year, month + 1, 0).getDate();

  // cells: nulls for padding + day numbers
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMon }, (_, i) => i + 1),
  ];
  // pad end to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  /* ── bookings per day (for dots) ─────────────────────────────────── */
  const bookingsByDay: Record<string, Booking[]> = {};
  bookings.forEach(b => {
    if (!b.date) return;
    if (!bookingsByDay[b.date]) bookingsByDay[b.date] = [];
    bookingsByDay[b.date].push(b);
  });

  /* ── time slot helpers ───────────────────────────────────────────── */
  const bookedSlotsOnDay = (day: string) =>
    (bookingsByDay[day] || []).map(b => b.timeSlot?.split('-')[0]?.trim()).filter(Boolean);

  const isBooked  = (day: string, h: string) => bookedSlotsOnDay(day).some(s => s === h || s?.startsWith(h));
  const isBlocked = (day: string, h: string) => (blockedSlots[day] || []).includes(h);

  const toggleBlock = (day: string, h: string) => {
    if (isBooked(day, h)) return; // can't block a booked slot
    setBlockedSlots(prev => {
      const slots = prev[day] || [];
      return {
        ...prev,
        [day]: slots.includes(h) ? slots.filter(s => s !== h) : [...slots, h],
      };
    });
  };

  const getBookingForSlot = (day: string, h: string) =>
    (bookingsByDay[day] || []).find(b => {
      const start = b.timeSlot?.split('-')[0]?.trim();
      return start === h || start?.startsWith(h);
    });

  /* ── selected day info ───────────────────────────────────────────── */
  const selDate    = calDay ? new Date(calDay) : null;
  const selDayName = selDate ? ARABIC_DAYS_FULL[selDate.getDay()] : '';
  const selLabel   = selDate
    ? `${selDayName}، ${selDate.getDate()} ${ARABIC_MONTHS[selDate.getMonth()]}`
    : '';

  const blockedCount = calDay ? (blockedSlots[calDay] || []).length : 0;
  const bookedCount  = calDay ? bookedSlotsOnDay(calDay).length : 0;

  return (
    <div className="space-y-5" dir="rtl">

      {/* Header */}
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">جدول الملعب</p>
        <h1 className="text-2xl font-black text-slate-900">تقويم الحجوزات</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-start">

        {/* ── LEFT: time-slot panel ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden order-2 lg:order-1">
          {/* Panel header */}
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <span className="text-emerald-500 text-[11px] font-bold block mb-0.5">الخانات الزمنية</span>
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <i className="fas fa-calendar-day text-slate-400 text-sm" />
                {calDay ? selLabel : 'اختر يوماً'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-bold">
                {bookedCount} محجوز
              </span>
              {blockedCount > 0 && (
                <span className="bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <i className="fas fa-ban text-[9px]" /> {blockedCount} محجوب
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !calDay ? (
            <div className="py-16 text-center text-slate-400">
              <i className="fas fa-calendar-alt text-4xl block mb-3 text-gray-200" />
              <p className="font-bold">اختر يوماً من التقويم</p>
            </div>
          ) : (
            <>
              <div className="p-4 grid grid-cols-3 gap-2">
                {HOURS.map(h => {
                  const booked  = isBooked(calDay, h);
                  const blocked = isBlocked(calDay, h);
                  const bk      = booked ? getBookingForSlot(calDay, h) : null;

                  return (
                    <button
                      key={h}
                      onClick={() => {
                        if (booked && bk) navigate(`/owner/bookings`);
                        else toggleBlock(calDay, h);
                      }}
                      className={`rounded-xl py-3 text-center transition-all ${
                        booked
                          ? 'bg-amber-50 border-2 border-amber-300 cursor-pointer hover:bg-amber-100'
                          : blocked
                          ? 'bg-red-50 border-2 border-red-200 cursor-pointer hover:bg-red-100'
                          : 'bg-emerald-50 border-2 border-emerald-200 cursor-pointer hover:bg-emerald-100'
                      }`}
                    >
                      <p className={`font-black text-sm ${
                        booked ? 'text-amber-700' : blocked ? 'text-red-500' : 'text-emerald-700'
                      }`} dir="ltr">{h}</p>
                      <p className={`text-[10px] font-bold mt-0.5 ${
                        booked ? 'text-amber-500' : blocked ? 'text-red-400' : 'text-emerald-500'
                      }`}>
                        {booked ? 'محجوز' : blocked ? 'محجوب' : 'متاح'}
                      </p>
                      {booked && bk && (
                        <p className="text-[9px] text-amber-600 truncate px-1 mt-0.5">{bk.userName || ''}</p>
                      )}
                      {blocked && (
                        <i className="fas fa-ban text-[9px] text-red-400 mt-0.5 block" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="px-4 pb-4 text-center">
                <p className="text-[11px] text-slate-400">
                  اضغط على الخانة المتاحة لحجبها · اضغط على المحجوبة لإلغاء الحجب
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: calendar grid ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 order-1 lg:order-2 lg:w-[420px]">

          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <i className="fas fa-chevron-right text-slate-500 text-xs" />
            </button>
            <h2 className="font-black text-slate-900">
              {ARABIC_MONTHS[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <i className="fas fa-chevron-left text-slate-500 text-xs" />
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 mb-2">
            {ARABIC_DAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-black text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const ds         = `${year}-${pad(month + 1)}-${pad(day)}`;
              const isToday    = ds === todayStr();
              const isSelected = ds === calDay;
              const bCount     = (bookingsByDay[ds] || []).length;
              const hasBlocked = (blockedSlots[ds] || []).length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => setCalDay(ds)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-sm font-black ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-lg'
                      : isToday
                      ? 'bg-emerald-500 text-white shadow-md'
                      : bCount > 0
                      ? 'bg-amber-50 text-amber-700 border-2 border-amber-200 hover:bg-amber-100'
                      : 'hover:bg-gray-100 text-slate-700'
                  }`}
                >
                  {day}
                  {bCount > 0 && !isSelected && (
                    <span className={`absolute bottom-0.5 text-[8px] font-black ${
                      isToday ? 'text-white/80' : 'text-amber-500'
                    }`}>{bCount}</span>
                  )}
                  {hasBlocked && !isSelected && (
                    <span className="absolute top-0.5 end-0.5 w-1.5 h-1.5 bg-red-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 flex-wrap">
            {[
              { color: 'bg-emerald-500', label: 'اليوم'  },
              { color: 'bg-red-400',     label: 'محجوب', dot: true },
              { color: 'bg-gray-200',    label: 'متاح'   },
              { color: 'bg-amber-200',   label: 'محجوز'  },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                {l.dot
                  ? <span className={`w-2 h-2 rounded-full ${l.color}`} />
                  : <span className={`w-3.5 h-3.5 rounded-md ${l.color}`} />}
                {l.label}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OwnerCalendar;
