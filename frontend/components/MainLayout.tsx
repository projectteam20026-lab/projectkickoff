import React, { useEffect, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { Notification } from '../types';
import { useBookingReminder, ReminderItem } from '../hooks/useBookingReminder';
import BookingReminderBanner from './BookingReminderBanner';

// يعتبر المستخدم لاعباً إذا لم يكن مالكاً أو مسؤولاً
const isPlayerRole = (role?: string) =>
  !!role && role !== 'مالك ملعب' && role !== 'مسؤول';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ── Booking reminder state ──────────────────────────────────────────────────
  const [reminderItems, setReminderItems] = useState<ReminderItem[]>([]);

  const handleReminder = useCallback((item: ReminderItem) => {
    setReminderItems(prev => {
      // لا تضيف نفس الحجز مرتين
      if (prev.find(x => x.booking.id === item.booking.id)) return prev;
      return [item, ...prev];
    });
  }, []);

  const handleAutoCancel = useCallback((item: ReminderItem) => {
    setReminderItems(prev => {
      // استبدل التذكير بإشعار الإلغاء إن وُجد، وإلا أضفه
      const without = prev.filter(x => x.booking.id !== item.booking.id);
      return [item, ...without];
    });
  }, []);

  const handleDismiss = useCallback((bookingId: string) => {
    setReminderItems(prev => prev.filter(x => x.booking.id !== bookingId));
  }, []);

  // فعّل الـ hook فقط للاعبين
  const playerUserId = isPlayerRole(user?.role) ? user?.id : undefined;
  useBookingReminder(playerUserId, handleReminder, handleAutoCancel);

  // ── Notifications ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      backend.getNotifications().then(setNotifications);
    }
  }, [user?.id]);

  const handleMarkRead = async () => {
    const updated = await backend.markNotificationsRead();
    setNotifications(updated);
  };

  return (
    <div className="bg-gray-50 min-h-screen text-slate-800 font-sans flex flex-col">
      <Navbar
        user={user ?? null}
        notifications={notifications}
        onLogout={logout}
        onMarkRead={handleMarkRead}
      />

      {/* ── شريط تذكير الحجوزات (يظهر للاعبين فقط) ── */}
      {reminderItems.length > 0 && (
        <BookingReminderBanner
          items={reminderItems}
          onDismiss={handleDismiss}
        />
      )}

      <main className="flex-1 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
