import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: 'fa-chart-pie',      label: 'لوحة التحكم' },
  { path: '/admin/users',     icon: 'fa-users',          label: 'المستخدمون' },
  { path: '/admin/bookings',  icon: 'fa-calendar-check', label: 'الحجوزات' },
  { path: '/admin/fields',    icon: 'fa-futbol',         label: 'الملاعب' },
];

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'نظرة عامة',
  '/admin/users':     'إدارة المستخدمين',
  '/admin/bookings':  'إدارة الحجوزات',
  '/admin/fields':    'إدارة الملاعب',
};

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const title = PAGE_TITLES[location.pathname] || 'لوحة الإدارة';

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-slate-900 text-white flex flex-col fixed top-0 right-0 h-full z-50 transition-all duration-300 shadow-2xl`}>

        {/* Logo row */}
        <div className="h-16 flex items-center px-4 border-b border-slate-700 gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="fas fa-futbol text-white text-sm"></i>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-base leading-tight">KickOff</p>
              <p className="text-xs text-slate-400 leading-tight">لوحة الإدارة</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="mr-auto text-slate-400 hover:text-white transition-colors p-1"
          >
            <i className={`fas ${collapsed ? 'fa-chevron-left' : 'fa-chevron-right'} text-xs`}></i>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                 ${isActive
                   ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                   : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                 }`
              }
            >
              <i className={`fas ${item.icon} w-4 text-center flex-shrink-0`}></i>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: back to site + logout */}
        <div className="p-3 border-t border-slate-700 space-y-1 flex-shrink-0">
          <NavLink
            to="/"
            title={collapsed ? 'الموقع الرئيسي' : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <i className="fas fa-home w-4 text-center flex-shrink-0"></i>
            {!collapsed && <span>الموقع الرئيسي</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            title={collapsed ? 'تسجيل الخروج' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-all"
          >
            <i className="fas fa-sign-out-alt w-4 text-center flex-shrink-0"></i>
            {!collapsed && <span>تسجيل الخروج</span>}
          </button>
          {!collapsed && <p className="text-xs text-slate-600 text-center pt-1">v2.0 — Admin</p>}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className={`flex-1 ${collapsed ? 'mr-16' : 'mr-64'} transition-all duration-300 flex flex-col min-h-screen`}>

        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 sticky top-0 z-40 shadow-sm flex-shrink-0">
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">{title}</h1>
            <p className="text-xs text-slate-400">KickOff Jordan — لوحة الإدارة</p>
          </div>
          <div className="mr-auto flex items-center gap-3">
            {user?.avatar && (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            )}
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-700 leading-tight">{user?.name}</p>
              <p className="text-xs text-emerald-600 leading-tight">مسؤول النظام</p>
            </div>
          </div>
        </header>

        {/* Page content rendered by React Router */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
