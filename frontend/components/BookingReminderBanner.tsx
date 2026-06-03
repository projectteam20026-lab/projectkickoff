/**
 * BookingReminderBanner
 * شريط الإشعارات اللصيق الذي يظهر:
 *  – باللون الكهرماني عند اقتراب موعد الحجز (≈ 60 دقيقة)
 *  – باللون الأحمر عند الإلغاء التلقائي (≤ 30 دقيقة بدون تأكيد)
 */
import React, { useState } from 'react';
import { ReminderItem } from '../hooks/useBookingReminder';
import { backend } from '../services/backend';

interface Props {
  items: ReminderItem[];
  onDismiss: (bookingId: string) => void;
}

export const BookingReminderBanner: React.FC<Props> = ({ items, onDismiss }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (items.length === 0) return null;

  const handleConfirm = async (bookingId: string) => {
    setLoadingId('c-' + bookingId);
    try { await backend.confirmBooking(bookingId); } catch { /* ignore */ }
    setLoadingId(null);
    onDismiss(bookingId);
  };

  const handleCancel = async (bookingId: string) => {
    setLoadingId('x-' + bookingId);
    try { await backend.cancelBooking(bookingId); } catch { /* ignore */ }
    setLoadingId(null);
    onDismiss(bookingId);
  };

  return (
    <div className="flex flex-col gap-2 px-3 pt-3 pb-1 max-w-2xl mx-auto w-full">
      {items.map(item => {
        const { booking, type, minutesLeft } = item;
        const isReminder = type === 'reminder';
        const isConfLoading = loadingId === 'c-' + booking.id;
        const isCancLoading = loadingId === 'x-' + booking.id;
        const busy         = isConfLoading || isCancLoading;

        return isReminder ? (
          /* ── تذكير: كهرماني ────────────────────────────────────────── */
          <div
            key={booking.id}
            dir="rtl"
            className="relative rounded-2xl overflow-hidden shadow-lg border border-amber-200"
            style={{ background: 'linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)' }}
          >
            {/* شريط علوي */}
            <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-400" />

            <div className="flex items-start gap-3 px-4 py-3">
              {/* أيقونة */}
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="fas fa-bell text-amber-600 text-base" />
              </div>

              {/* نص */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-900 text-sm leading-tight">
                  ⏰ تذكير بحجزك القادم
                </p>
                <p className="text-amber-800 text-xs mt-0.5">
                  لديك{' '}
                  <span className="font-bold text-amber-700">
                    {minutesLeft} دقيقة
                  </span>{' '}
                  لتأكيد حجزك في{' '}
                  <span className="font-semibold">{booking.fieldName}</span>
                </p>
                <p className="text-amber-600 text-[11px] mt-0.5">
                  {booking.timeSlot} · {booking.date}
                </p>

                {/* أزرار */}
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={() => handleConfirm(booking.id)}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition disabled:opacity-60"
                  >
                    {isConfLoading
                      ? <i className="fas fa-circle-notch fa-spin text-[11px]" />
                      : <i className="fas fa-check text-[11px]" />}
                    تأكيد الحجز
                  </button>
                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold transition disabled:opacity-60"
                  >
                    {isCancLoading
                      ? <i className="fas fa-circle-notch fa-spin text-[11px]" />
                      : <i className="fas fa-times text-[11px]" />}
                    إلغاء
                  </button>
                </div>
              </div>

              {/* إغلاق */}
              <button
                onClick={() => onDismiss(booking.id)}
                className="text-amber-400 hover:text-amber-700 transition mt-0.5 flex-shrink-0"
                aria-label="إغلاق"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>
          </div>
        ) : (
          /* ── إلغاء تلقائي: أحمر ─────────────────────────────────────── */
          <div
            key={booking.id}
            dir="rtl"
            className="relative rounded-2xl overflow-hidden shadow-lg border border-red-200"
            style={{ background: 'linear-gradient(135deg,#fff5f5 0%,#fee2e2 100%)' }}
          >
            <div className="h-1 w-full bg-gradient-to-r from-red-400 to-rose-500" />

            <div className="flex items-start gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="fas fa-calendar-times text-red-500 text-base" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-red-900 text-sm leading-tight">
                  ❌ تم إلغاء الحجز تلقائياً
                </p>
                <p className="text-red-700 text-xs mt-0.5">
                  تم إلغاء حجزك في{' '}
                  <span className="font-semibold">{booking.fieldName}</span>{' '}
                  لعدم التأكيد خلال الوقت المحدد
                </p>
                <p className="text-red-400 text-[11px] mt-0.5">
                  {booking.timeSlot} · {booking.date}
                </p>
              </div>

              <button
                onClick={() => onDismiss(booking.id)}
                className="text-red-300 hover:text-red-600 transition mt-0.5 flex-shrink-0"
                aria-label="إغلاق"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BookingReminderBanner;
