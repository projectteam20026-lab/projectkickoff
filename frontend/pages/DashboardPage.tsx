import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { Booking, Team, UserRole } from '../types';
import { Navigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const refresh = async () => {
    if (!user) return;
    const [b, t] = await Promise.all([
      backend.getBookings(),
      backend.getUserTeams(user.id),
    ]);
    setBookings(b);
    setTeams(t);
  };

  useEffect(() => { refresh(); }, [user?.id]);

  const handleCancelBooking = async (id: string) => {
    if (window.confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) {
      await backend.cancelBooking(id);
      refresh();
    }
  };

  // onSaveTeam receives a Team but we just need to refresh
  const handleSaveTeam = (_team: Team) => { refresh(); };

  const handleDeleteTeam = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفريق؟')) {
      await backend.deleteTeam(id);
      refresh();
    }
  };

  if (!user) return null;

  // كل دور يُحوَّل لصفحته المستقلة
  if (user.role === UserRole.PLAYER) return <Navigate to="/player" replace />;
  if (user.role === UserRole.OWNER)  return <Navigate to="/owner"  replace />;

  const visible = bookings.filter(b => b.userId === user.id);

  return (
    <Dashboard
      user={user}
      bookings={visible}
      onCancelBooking={handleCancelBooking}
      teams={teams}
      onSaveTeam={handleSaveTeam}
      onDeleteTeam={handleDeleteTeam}
    />
  );
};

export default DashboardPage;
