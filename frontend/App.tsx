import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Guards
import PrivateRoute from './components/guards/PrivateRoute';
import AdminRoute from './components/guards/AdminRoute';

// Layouts
import MainLayout from './components/MainLayout';
import AdminLayout from './admin/AdminLayout';
import ScrollToTop from './components/ScrollToTop';

// Public pages
import LoginPage from './pages/LoginPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// User pages
import Home from './pages/Home';
import ExplorePage from './pages/ExplorePage';
import DashboardPage from './pages/DashboardPage';
import Leagues from './pages/Leagues';
import CreateTournament from './pages/CreateTournament';
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerBookings from './pages/PlayerBookings';
import PlayerBookingsCurrent from './pages/PlayerBookingsCurrent';
import PlayerBookingsHistory from './pages/PlayerBookingsHistory';
import PlayerBookingsManage from './pages/PlayerBookingsManage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import MyTournaments from './pages/MyTournaments';
import PlayerProfilePage from './pages/PlayerProfilePage';
import PlayerSettingsPage from './pages/PlayerSettingsPage';
// Owner dashboard pages
import FieldDetailPage from './pages/FieldDetailPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import OwnerRoute from './components/guards/OwnerRoute';
import OwnerLayout from './pages/owner/OwnerLayout';
import OwnerHome from './pages/owner/OwnerHome';
import OwnerFields from './pages/owner/OwnerFields';
import OwnerBookings from './pages/owner/OwnerBookings';
import OwnerRevenuePage from './pages/owner/OwnerRevenue';
import OwnerReviews from './pages/owner/OwnerReviews';
import OwnerSettings from './pages/owner/OwnerSettings';
import OwnerCalendar from './pages/owner/OwnerCalendar';
import OwnerTournaments, { TournamentRegisterForm } from './pages/owner/OwnerTournaments';
import PublicCreateTournament from './pages/PublicCreateTournament';
import ManageTournament from './pages/ManageTournament';
import OwnerAnalytics from './pages/owner/OwnerAnalytics';

// Admin pages
import AdminOverview from './admin/AdminOverview';
import AdminUsers from './admin/AdminUsers';
import AdminBookings from './admin/AdminBookings';
import AdminFields from './admin/AdminFields';

// Home needs navigate prop — wrap it
const HomeWrapper: React.FC = () => {
  const routerNav = useNavigate();
  const nav = (page: string) => {
    if (page === 'home' || page === '') routerNav('/');
    else routerNav('/' + page);
  };
  return <Home navigate={nav} />;
};

// ResetPassword needs token from URL
const ResetPasswordPage: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const nav = useNavigate();
  return <ResetPassword token={token} onSuccess={() => nav('/login', { replace: true })} />;
};

// ForgotPassword with router navigation
const ForgotPasswordPage: React.FC = () => {
  const routerNav = useNavigate();
  return <ForgotPassword onBack={() => routerNav('/login')} />;
};

const TournamentRegisterFormPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  return <TournamentRegisterForm tournamentId={id} />;
};

const AppRoutes: React.FC = () => {
    return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────────────────── */}
      <Route path="/login"                   element={<LoginPage />} />
      <Route path="/forgot-password"         element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token"   element={<ResetPasswordPage />} />

      {/* ── Admin (protected, مسؤول only) ──────────────────────────────── */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index                    element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard"         element={<AdminOverview />} />
        <Route path="users"             element={<AdminUsers />} />
        <Route path="bookings"          element={<AdminBookings />} />
        <Route path="fields"            element={<AdminFields />} />
      </Route>

      {/* ── Self-contained dashboards (no Navbar wrapper) ─────────────────── */}
      <Route path="/player" element={<PrivateRoute><PlayerDashboard /></PrivateRoute>} />

      {/* ── Owner dashboard (nested, owner/admin only) ─────────────────────── */}
      <Route path="/owner" element={<OwnerRoute><OwnerLayout /></OwnerRoute>}>
        <Route index                element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="dashboard"     element={<OwnerHome />} />
        <Route path="analytics"     element={<OwnerAnalytics />} />
        <Route path="fields"        element={<OwnerFields />} />
        <Route path="bookings"      element={<OwnerBookings />} />
        <Route path="calendar"      element={<OwnerCalendar />} />
        <Route path="tournaments"   element={<OwnerTournaments />} />
        <Route path="revenue"       element={<OwnerRevenuePage />} />
        <Route path="reviews"       element={<OwnerReviews />} />
        <Route path="settings"      element={<OwnerSettings />} />
      </Route>

      {/* ── Public tournament registration form (no login) ────────────────── */}
      <Route path="/register-tournament/:id"    element={<TournamentRegisterFormPage />} />

      {/* ── Public tournament creation + management (no login) ───────────── */}
      <Route path="/new-tournament"             element={<PublicCreateTournament />} />
      <Route path="/manage-tournament/:token"   element={<ManageTournament />} />

      {/* ── Public pages (no login required) ──────────────────────────────── */}
      <Route element={<MainLayout />}>
        <Route path="/"           element={<HomeWrapper />} />
        <Route path="/home"       element={<Navigate to="/" replace />} />
        <Route path="/explore"    element={<ExplorePage />} />
        <Route path="/field/:id"        element={<FieldDetailPage />} />
        <Route path="/tournament/:id"   element={<TournamentDetailPage />} />
        <Route path="/leagues"          element={<Leagues />} />

        {/* ── Protected pages (login required) ─────────────────────────── */}
        <Route path="/dashboard"           element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/settings"            element={<PrivateRoute><PlayerSettingsPage /></PrivateRoute>} />
        <Route path="/profile"             element={<PrivateRoute><PlayerProfilePage /></PrivateRoute>} />
        <Route path="/bookings"            element={<PrivateRoute><PlayerBookings /></PrivateRoute>} />
        <Route path="/bookings/current"    element={<PrivateRoute><PlayerBookingsCurrent /></PrivateRoute>} />
        <Route path="/bookings/history"    element={<PrivateRoute><PlayerBookingsHistory /></PrivateRoute>} />
        <Route path="/bookings/manage"     element={<PrivateRoute><PlayerBookingsManage /></PrivateRoute>} />
        <Route path="/teams"               element={<PrivateRoute><TeamsPage /></PrivateRoute>} />
        <Route path="/teams/:id"           element={<PrivateRoute><TeamDetailPage /></PrivateRoute>} />
        <Route path="/my-tournaments"      element={<PrivateRoute><MyTournaments /></PrivateRoute>} />
        <Route path="/create-tournament"   element={<PrivateRoute><CreateTournament /></PrivateRoute>} />
      </Route>

      {/* ── Catch-all ───────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <ScrollToTop />
    <LanguageProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </LanguageProvider>
  </BrowserRouter>
);

export default App;
