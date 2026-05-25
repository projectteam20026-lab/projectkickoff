import React from 'react';
import Settings from './Settings';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  if (!user) return null;
  return <Settings user={user} onUpdateUser={updateUser} />;
};

export default SettingsPage;
