import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { to: '/owner/dashboard', icon: 'fa-th-large',      label: 'لوحة التحكم' },
  { to: '/owner/fields',    icon: 'fa-futbol',         label: 'ملاعبي'      },
  { to: '/owner/bookings',  icon: 'fa-calendar-alt',  label: 'الحجوزات'    },
  { to: '/owner/revenue',   icon: 'fa-chart-line',    label: 'الإيرادات'   },
  { to: '/owner/reviews',   icon: 'fa-star',          label: 'التقييمات'   },
  { to: '/owner/settings',  icon: 'fa-cog',           label: 'الإعدادات'   },
];

const OwnerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sideOpen,      setSideOpen]      = useState(false);
  const [sideCollapsed, setSideCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className={`flex flex-col h-full bg-slate-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>

      {/* Brand + collapse toggle */}
      <div className={`border-b border-white/10 flex-shrink-0 ${collapsed ? 'px-3 py-4' : 'px-5 py-5'}`}>
        {collapsed ? (
          <button
            onClick={() => setSideCollapsed(false)}
            className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/50 mx-auto hover:bg-emerald-600 transition-colors"
          >
            <i className="fas fa-futbol text-white text-sm" />
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/50 flex-shrink-0">
                  <i className="fas fa-futbol text-white text-sm" />
                </div>
                <span className="font-black text-lg tracking-tight">كيك أوف</span>
              </div>
              <button
                onClick={() => setSideCollapsed(true)}
                className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
              >
                <i className="fas fa-chevron-right text-slate-400 text-[10px]" />
              </button>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-xl px-3 py-2">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">لوحة مالك الملعب</p>
              <p className="text-white text-sm font-black truncate">{user?.name || 'مالك الملعب'}</p>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSideOpen(false)}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 rounded-xl text-sm font-bold transition-all ${
                collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
              } ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <i className={`fas ${item.icon} w-4 text-center flex-shrink-0`} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + actions */}
      <div className={`border-t border-white/10 flex-shrink-0 ${collapsed ? 'p-2' : 'p-4'}`}>
        {collapsed ? (
          <div className="flex flex-col gap-2 items-center">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0">
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-emerald-400 font-black text-sm">
                    {user?.name?.charAt(0)}
                  </div>}
            </div>
            <button
              onClick={handleLogout}
              title="خروج"
              className="w-9 h-9 flex items-center justify-center bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 rounded-lg transition-all"
            >
              <i className="fas fa-sign-out-alt text-xs" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0">
                {user?.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-emerald-400 font-black">
                      {user?.name?.charAt(0)}
                    </div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{user?.name}</p>
                <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to="/"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold rounded-lg transition-all"
              >
                <i className="fas fa-home text-[10px]" /> الرئيسية
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all"
              >
                <i className="fas fa-sign-out-alt text-[10px]" /> خروج
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans" dir="rtl">

      {/* Desktop sidebar — collapsible */}
      <div
        className={`hidden lg:block fixed right-0 top-0 bottom-0 z-40 shadow-2xl transition-all duration-300 ${
          sideCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent collapsed={sideCollapsed} />
      </div>

      {/* Mobile drawer */}
      {sideOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSideOpen(false)} />
          <div className="relative w-64 h-full shadow-2xl">
            <SidebarContent collapsed={false} />
          </div>
        </div>
      )}

      {/* Main content — offset matches sidebar width */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${sideCollapsed ? 'lg:mr-16' : 'lg:mr-64'}`}>

        {/* Mobile top bar */}
        <header className="lg:hidden bg-slate-900 text-white px-4 h-14 flex items-center justify-between sticky top-0 z-30 shadow-lg flex-shrink-0">
          <button
            onClick={() => setSideOpen(true)}
            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all"
          >
            <i className="fas fa-bars text-sm" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-futbol text-white text-xs" />
            </div>
            <span className="font-black text-base">كيك أوف</span>
          </div>
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-700">
            {user?.avatar
              ? <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-emerald-400 font-black text-sm">
                  {user?.name?.charAt(0)}
                </div>}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-900 border-t border-white/10 z-40 shadow-2xl">
        <div className="grid grid-cols-6 h-16">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <i className={`fas ${item.icon} text-base`} />
                  <span className="text-[8px] font-bold">{item.label}</span>
                  {isActive && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-400" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OwnerLayout;
