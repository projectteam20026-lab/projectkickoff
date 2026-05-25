import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Login from './Login';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, User } from '../types';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Already logged in — وجّه كل دور لصفحته مباشرة
  if (!isLoading && isAuthenticated && user) {
    if (user.role === UserRole.ADMIN) return <Navigate to="/admin/dashboard" replace />;
    if (user.role === UserRole.OWNER) return <Navigate to="/owner"           replace />;
    return <Navigate to="/" replace />; // PLAYER → الرئيسية
  }

  const handleLogin = (_email: string, role: UserRole, user?: User, token?: string) => {
    if (user && token) {
      login(user, token);
      if      (role === UserRole.ADMIN)  navigate('/admin/dashboard', { replace: true });
      else if (role === UserRole.OWNER)  navigate('/owner',           { replace: true });
      else                               navigate('/',                { replace: true }); // اللاعب يفوت الرئيسية
    }
  };

  return (
    <Login
      onLogin={handleLogin}
      onForgotPassword={() => navigate('/forgot-password')}
    />
  );
};

export default LoginPage;
