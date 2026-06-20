import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Notification, UserRole } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

interface NavbarProps {
  user: User | null;
  notifications: Notification[];
  onLogout: () => void;
  currentPage?: string;
  navigate?: (page: string) => void;
  onMarkRead: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, notifications, onLogout, onMarkRead }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showBookingsMenu, setShowBookingsMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const routerNavigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setShowNotifications(false);
    setShowProfileMenu(false);
    setShowBookingsMenu(false);
  }, [currentPath]);

  const handleLogout = () => { onLogout(); routerNavigate('/login'); };

  // "لاعب" = أي مستخدم مسجَّل ليس صاحب ملعب ولا مسؤولاً
  const isPlayer = !!user && user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN;

  // روابط النافبار
  const navLinks = isPlayer
    ? [
        { path: '/',               label: t.nav.home    },
        { path: '/explore',        label: t.nav.explore  },
        { path: '/leagues',        label: t.nav.leagues  },
        { path: '/teams',          label: 'الفرق'        },
      ]
    : [
        { path: '/',        label: t.nav.home    },
        { path: '/explore', label: t.nav.explore  },
        { path: '/leagues', label: t.nav.leagues  },
      ];

  const BOOKINGS_ITEMS = [
    { path: '/bookings/current', icon: 'fa-calendar-check', label: 'حجوزاتي الحالية',      desc: 'حجوزاتك النشطة والقادمة'     },
    { path: '/bookings/history', icon: 'fa-history',        label: 'سجل الحجوزات',          desc: 'جميع حجوزاتك السابقة'        },
    { path: '/bookings/manage',  icon: 'fa-tasks',          label: 'تأكيد / إلغاء الحجز',   desc: 'أدر وأكّد حجوزاتك المعلّقة' },
  ];

  const scrollToAbout = () => {
    if (currentPath === '/') {
      document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      routerNavigate('/');
      setTimeout(() => {
        document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-soft' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">

          {/* ── Logo + nav links ───────────────────────────────────────────── */}
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center cursor-pointer group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-xl shadow-glow transition-transform group-hover:scale-110">
                <i className="fas fa-futbol"></i>
              </div>
              <span className="font-bold text-2xl tracking-tight text-slate-900 mx-3">{t.common.kickoff}</span>
            </a>

            <div className={`hidden lg:flex ${language === 'ar' ? 'lg:space-x-8 lg:space-x-reverse' : 'lg:space-x-8'}`}>
              {navLinks.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-3 py-2 text-sm font-bold transition-colors ${currentPath === item.path ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'}`}
                >
                  {item.label}
                  {currentPath === item.path && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-full animate-fade-in"></span>
                  )}
                </Link>
              ))}

              {/* حجوزاتي dropdown — للاعب فقط */}
              {isPlayer && (
                <div className="relative">
                  <button
                    onClick={() => { setShowBookingsMenu(!showBookingsMenu); setShowProfileMenu(false); setShowNotifications(false); }}
                    className={`relative px-3 py-2 text-sm font-bold transition-colors flex items-center gap-1.5 ${
                      currentPath.startsWith('/bookings') ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'
                    }`}
                  >
                    حجوزاتي
                    <i className={`fas fa-chevron-down text-[9px] transition-transform duration-200 ${showBookingsMenu ? 'rotate-180' : ''}`} />
                    {currentPath.startsWith('/bookings') && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-full" />
                    )}
                  </button>

                  {showBookingsMenu && (
                    <div className="absolute top-full mt-2 end-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in-up">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 pb-2 pt-1">إدارة الحجوزات</p>
                      {BOOKINGS_ITEMS.map(item => (
                        <Link key={item.path} to={item.path}
                          onClick={() => setShowBookingsMenu(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl transition-colors ${
                            currentPath === item.path
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'hover:bg-gray-50 text-slate-700'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            currentPath === item.path ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            <i className={`fas ${item.icon} text-sm`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold leading-tight">{item.label}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* من نحن — فقط لغير اللاعب المسجّل */}
              {!isPlayer && (
                <button
                  onClick={scrollToAbout}
                  className="relative px-3 py-2 text-sm font-bold transition-colors text-slate-500 hover:text-emerald-500"
                >
                  من نحن
                </button>
              )}

              {user?.role === UserRole.ADMIN && (
                <Link
                  to="/admin/dashboard"
                  className={`px-3 py-2 text-sm font-bold transition-colors ${currentPath.startsWith('/admin') ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'}`}
                >
                  {t.nav.admin || 'لوحة الإدارة'}
                </Link>
              )}
            </div>
          </div>

          {/* ── Right actions ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">

            {/* Language toggle — always visible */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white/50 hover:bg-white rounded-full border border-gray-200 transition-colors"
            >
              <i className="fas fa-globe text-emerald-500"></i>
              <span className="uppercase">{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>


            {user ? (
              /* ── Authenticated ──────────────────────────────────────────── */
              <>
                {/* Notifications — all authenticated users */}
                {(
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowNotifications(!showNotifications);
                        setShowProfileMenu(false);
                        if (unreadCount > 0) onMarkRead();
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-slate-50 transition-all relative"
                    >
                      <i className="far fa-bell text-xl"></i>
                      {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
                      )}
                    </button>

                    {showNotifications && (
                      <div className={`absolute ${language === 'ar' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'} mt-4 w-80 bg-white rounded-2xl shadow-card border border-gray-100 py-2 z-50 animate-fade-in-up overflow-hidden`}>
                        <div className="px-5 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                          <span className="font-bold text-slate-800">{t.nav.notifications}</span>
                          <span className="text-xs text-gray-500">{notifications.length} {t.nav.new}</span>
                        </div>
                        <div className="max-h-72 overflow-y-auto custom-scrollbar">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                              <i className="far fa-bell-slash text-2xl mb-2 block"></i>
                              {t.common.noData}
                            </div>
                          ) : notifications.map(n => (
                            <div key={n.id} className="px-5 py-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors cursor-default">
                              <div className="flex gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'booking' ? 'bg-blue-50 text-blue-500' : n.type === 'league' ? 'bg-purple-50 text-purple-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                  <i className={`fas ${n.type === 'booking' ? 'fa-calendar-check' : n.type === 'league' ? 'fa-trophy' : 'fa-info'}`}></i>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{n.title}</p>
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                                  <span className="text-[10px] text-gray-400 mt-2 block font-medium">{n.date}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* ↑ end notifications */}

                {/* Profile menu */}
                <div className="relative">
                  <button
                    onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                    className={`flex items-center gap-3 ${language === 'ar' ? 'pl-1 pr-2' : 'pr-1 pl-2'} py-1 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-gray-200`}
                  >
                    <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200 overflow-hidden">
                      {user.avatar
                        ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        : <i className="fas fa-user text-sm"></i>
                      }
                    </div>
                    <i className="fas fa-chevron-down text-xs text-gray-400 hidden md:block"></i>
                  </button>

                  {showProfileMenu && (
                    <div className={`absolute ${language === 'ar' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'} mt-4 w-56 bg-white rounded-2xl shadow-card border border-gray-100 py-2 z-50 animate-fade-in-up`}>
                      <div className="px-5 py-4 border-b border-gray-50 mb-2">
                        <p className="font-bold text-slate-900">
                          {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5" dir="ltr">
                          {user.username ? `@${user.username}` : user.email}
                        </p>
                      </div>
                      <div className="px-2 space-y-0.5">
                        {isPlayer ? (
                          <>
                                <Link to="/profile" onClick={() => setShowProfileMenu(false)}
                              className="w-full text-start px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-colors">
                              <i className="fas fa-user-circle w-4 text-center text-emerald-500"></i> حسابي
                            </Link>
                            <Link to="/teams" onClick={() => setShowProfileMenu(false)}
                              className="w-full text-start px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-colors">
                              <i className="fas fa-shield-alt w-4 text-center text-emerald-500"></i> فريقي
                            </Link>
                            <Link to="/settings" onClick={() => setShowProfileMenu(false)}
                              className="w-full text-start px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-colors">
                              <i className="fas fa-cog w-4 text-center text-slate-400"></i> الإعدادات
                            </Link>
                            <div className="h-px bg-gray-100 my-1 mx-1"/>
                            <button onClick={() => setShowProfileMenu(false)}
                              className="w-full text-start px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-colors">
                              <i className="fas fa-shield-alt w-4 text-center text-slate-400"></i> سياسة الخصوصية
                            </button>
                            <button onClick={() => setShowProfileMenu(false)}
                              className="w-full text-start px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-colors">
                              <i className="fas fa-file-contract w-4 text-center text-slate-400"></i> الشروط والأحكام
                            </button>
                            <button onClick={() => setShowProfileMenu(false)}
                              className="w-full text-start px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-colors">
                              <i className="fas fa-question-circle w-4 text-center text-slate-400"></i> مركز المساعدة
                            </button>
                          </>
                        ) : (
                          <>
                            <Link to="/dashboard" onClick={() => setShowProfileMenu(false)}
                              className="w-full text-start px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-colors">
                              <i className="fas fa-columns w-4 text-center"></i> {t.nav.dashboard}
                            </Link>
                            <Link to="/settings" onClick={() => setShowProfileMenu(false)}
                              className="w-full text-start px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-colors">
                              <i className="fas fa-cog w-4 text-center"></i> {t.nav.settings}
                            </Link>
                          </>
                        )}
                        {user.role === UserRole.ADMIN && (
                          <Link to="/admin/dashboard" onClick={() => setShowProfileMenu(false)}
                            className="w-full text-start px-3 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-colors">
                            <i className="fas fa-user-shield w-4 text-center"></i> لوحة الإدارة
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-gray-50 mt-2 pt-2 px-2">
                        <button onClick={handleLogout}
                          className="w-full text-start px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors">
                          <i className="fas fa-sign-out-alt w-4 text-center"></i> {t.nav.logout}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ── Guest ──────────────────────────────────────────────────── */
              <>
                <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-400 transition-all shadow-glow"
                >
                  <i className="fas fa-sign-in-alt"></i>
                  دخول / تسجيل
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav ────────────────────────────────────────────── */}
      <div className="lg:hidden flex justify-around border-t border-gray-100 bg-white/95 backdrop-blur shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)] fixed bottom-0 left-0 right-0 z-40 pb-safe">
        {user ? (
          /* Authenticated mobile nav */
          isPlayer ? (
            <>
              {[
                { path: '/',                  icon: 'home',          label: 'الرئيسية' },
                { path: '/explore',           icon: 'search',        label: t.nav.explore },
                { path: '/leagues',           icon: 'trophy',        label: t.nav.leagues },
                { path: '/bookings/current',  icon: 'calendar-check',label: 'حجوزاتي'  },
                { path: '/teams',             icon: 'users',         label: 'الفرق'     },
              ].map(item => {
                const active = item.path === '/'
                  ? currentPath === '/'
                  : currentPath.startsWith(item.path);
                return (
                  <Link key={item.path} to={item.path}
                    className={`flex flex-col items-center py-2.5 px-1 w-full transition-colors relative ${active ? 'text-emerald-600' : 'text-gray-400'}`}
                  >
                    {active && <div className="absolute top-0 inset-x-0 mx-auto w-6 h-0.5 bg-emerald-500 rounded-full"/>}
                    <i className={`fas fa-${item.icon} text-base mb-0.5`}></i>
                    <span className="text-[9px] font-bold">{item.label}</span>
                  </Link>
                );
              })}
            </>
          ) : (
            [
              { path: '/',                   icon: 'home',        label: t.nav.home    },
              { path: '/explore',            icon: 'search',      label: t.nav.explore  },
              { path: '/leagues',            icon: 'trophy',      label: t.nav.leagues  },
              { path: '/dashboard',          icon: 'user',        label: t.nav.profile  },
            ].map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center p-3 w-full transition-colors ${currentPath === item.path ? 'text-emerald-600' : 'text-gray-400'}`}
              >
                <i className={`fas fa-${item.icon} text-lg mb-1`}></i>
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            ))
          )
        ) : (
          /* Guest mobile nav */
          <>
            {[
              { path: '/',        icon: 'home',   label: t.nav.home },
              { path: '/explore', icon: 'search', label: t.nav.explore },
              { path: '/leagues', icon: 'trophy', label: t.nav.leagues },
            ].map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center p-3 w-full transition-colors ${currentPath === item.path ? 'text-emerald-600' : 'text-gray-400'}`}
              >
                <i className={`fas fa-${item.icon} text-lg mb-1`}></i>
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            ))}
            <Link
              to="/login"
              className="flex flex-col items-center p-3 w-full transition-colors text-emerald-600"
            >
              <i className="fas fa-sign-in-alt text-lg mb-1"></i>
              <span className="text-[10px] font-bold">{t.auth.login}</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
