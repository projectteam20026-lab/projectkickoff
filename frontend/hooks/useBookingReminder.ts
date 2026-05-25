/**
 * useBookingReminder
 * يراقب الحجوزات "قيد الانتظار" كل 30 ثانية:
 *  - قبل 60 دقيقة : ينبّه المستخدم (onReminder)
 *  - قبل 30 دقيقة : يلغي الحجز تلقائياً  (onAutoCancel)
 */
import { useEffect, useRef, useCallback } from 'react';
import { Booking } from '../types';
import { backend } from '../services/backend';

export type ReminderItem = {
  booking: Booking;
  type: 'reminder' | 'autocancelled';
  minutesLeft: number;
};

/** "18:00 - 19:00" + "2026-06-01" → Date */
function parseStart(date: string, timeSlot: string): Date {
  const start = timeSlot.split('-')[0].trim();          // "18:00 "→"18:00"
  return new Date(`${date}T${start.padEnd(5, ':00')}:00`);
}

export function useBookingReminder(
  userId: string | undefined,
  onReminder: (item: ReminderItem) => void,
  onAutoCancel: (item: ReminderItem) => void,
) {
  const reminderSent  = useRef<Set<string>>(new Set());
  const cancelledSet  = useRef<Set<string>>(new Set());
  const cbReminder    = useRef(onReminder);
  const cbAutoCancel  = useRef(onAutoCancel);

  // Keep callbacks fresh without re-creating the interval
  useEffect(() => { cbReminder.current  = onReminder;  }, [onReminder]);
  useEffect(() => { cbAutoCancel.current = onAutoCancel; }, [onAutoCancel]);

  const check = useCallback(async () => {
    if (!userId) return;
    let bookings: Booking[];
    try { bookings = await backend.getBookings(); } catch { return; }

    const pending = bookings.filter(
      b => (!b.userId || b.userId === userId) && b.status === 'قيد الانتظار',
    );

    const now = Date.now();

    for (const booking of pending) {
      let bookingStart: Date;
      try { bookingStart = parseStart(booking.date, booking.timeSlot); }
      catch { continue; }

      const minsLeft = (bookingStart.getTime() - now) / 60_000;

      // ── Auto-cancel: 30 دقيقة أو أقل (ولم يُلغَ من قبل) ─────────────
      if (minsLeft <= 30 && minsLeft > -5 && !cancelledSet.current.has(booking.id)) {
        cancelledSet.current.add(booking.id);
        try { await backend.cancelBooking(booking.id); } catch { /* ignore */ }
        cbAutoCancel.current({ booking, type: 'autocancelled', minutesLeft: Math.max(0, Math.round(minsLeft)) });
      }

      // ── تذكير: بين 30 و 70 دقيقة (مرة واحدة لكل حجز) ──────────────
      else if (minsLeft > 30 && minsLeft <= 70 && !reminderSent.current.has(booking.id)) {
        reminderSent.current.add(booking.id);
        cbReminder.current({ booking, type: 'reminder', minutesLeft: Math.round(minsLeft) });
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    check();                                         // فحص فوري عند التحميل
    const id = setInterval(check, 30_000);           // كل 30 ثانية
    return () => clearInterval(id);
  }, [userId, check]);
}
