import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole } from './types';
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
import PlayerTeams from './pages/PlayerTeams';
import PlayerProfilePage from './pages/PlayerProfilePage';
import PlayerSettingsPage from './pages/PlayerSettingsPage';
import FieldDetailPage from './pages/FieldDetailPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import OwnerDashboard        from './pages/OwnerDashboard';
import OwnerBookingDetail    from './pages/OwnerBookingDetail';
import OwnerTournamentDetail from './pages/OwnerTournamentDetail';
import OwnerReviewDetail     from './pages/OwnerReviewDetail';
import OwnerComplaintDetail  from './pages/OwnerComplaintDetail';
import TournamentManagePage  from './pages/TournamentManagePage';

// Admin pages
import AdminOverview from './admin/AdminOverview';
import AdminUsers from './admin/AdminUsers';
import AdminBookings from './admin/AdminBookings';
import AdminFields from './admin/AdminFields';

// Redirect owners away from all public/player pages — they only use /owner and /manage-tournament/:id
const OwnerGuard: React.FC<{children: React.ReactNode}> = ({children}) => {
  const { user } = useAuth();
  if (user?.role === UserRole.OWNER) return <Navigate to="/owner" replace />;
  return <>{children}</>;
};

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
      <Route path="/owner"  element={<PrivateRoute><OwnerDashboard /></PrivateRoute>} />
      <Route path="/owner/booking/:id"    element={<PrivateRoute><OwnerBookingDetail /></PrivateRoute>} />
      <Route path="/owner/tournament/:id" element={<PrivateRoute><OwnerTournamentDetail /></PrivateRoute>} />
      <Route path="/owner/review/:id"     element={<PrivateRoute><OwnerReviewDetail /></PrivateRoute>} />
      <Route path="/owner/complaint/:id"  element={<PrivateRoute><OwnerComplaintDetail /></PrivateRoute>} />
      <Route path="/manage-tournament/:id" element={<PrivateRoute><TournamentManagePage /></PrivateRoute>} />

      {/* ── Public pages (no login required) ──────────────────────────────── */}
      <Route element={<OwnerGuard><MainLayout /></OwnerGuard>}>
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
        <Route path="/teams"               element={<PrivateRoute><PlayerTeams /></PrivateRoute>} />
        <Route path="/create-tournament"   element={<CreateTournament />} />
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
