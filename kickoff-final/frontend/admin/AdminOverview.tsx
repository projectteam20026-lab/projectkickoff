import React, { useEffect, useState } from 'react';
import { adminGetStats } from '../services/api';
import { useNavigate } from 'react-router-dom';

type AdminPage = 'users' | 'bookings' | 'fields';

const AdminOverview: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetStats().then(data => { setStats(data); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!stats) return (
    <div className="bg-red-50 text-red-600 rounded-2xl p-6 text-center">
      <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
      <p className="font-bold">تعذّر تحميل الإحصائيات — تأكد من تشغيل الخادم على المنفذ 5000.</p>
    </div>
  );

  const cards: { label: string; value: number; icon: string; color: string; page: AdminPage | null }[] = [
    { label: 'المستخدمون',  value: stats.users,       icon: 'fa-users',          color: 'bg-blue-500',    page: 'users' },
    { label: 'الحجوزات',   value: stats.bookings,     icon: 'fa-calendar-check', color: 'bg-emerald-500', page: 'bookings' },
    { label: 'الملاعب',    value: stats.fields,       icon: 'fa-futbol',         color: 'bg-purple-500',  page: 'fields' },
    { label: 'الفرق',      value: stats.teams,        icon: 'fa-shield-alt',     color: 'bg-orange-500',  page: null },
    { label: 'البطولات',   value: stats.tournaments,  icon: 'fa-trophy',         color: 'bg-yellow-500',  page: null },
  ];

  const quickLinks: { label: string; page: AdminPage }[] = [
    { label: 'إدارة المستخدمين', page: 'users' },
    { label: 'إدارة الحجوزات',   page: 'bookings' },
    { label: 'إدارة الملاعب',    page: 'fields' },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map(card => (
          <div
            key={card.label}
            onClick={() => card.page && navigate('/admin/' + card.page)}
            className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 ${card.page ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
          >
            <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-3`}>
              <i className={`fas ${card.icon} text-white text-sm`}></i>
            </div>
            <p className="text-3xl font-bold text-slate-900">{card.value ?? 0}</p>
            <p className="text-sm text-slate-500 mt-1">{card.label}</p>
            {card.page && <p className="text-xs text-emerald-500 mt-1 font-medium">انقر للإدارة ←</p>}
          </div>
        ))}
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i className="fas fa-chart-bar text-emerald-500"></i> حالة الحجوزات
          </h3>
          <div className="space-y-4">
            {[
              { label: 'حجوزات مؤكدة',     value: stats.activeBookings ?? 0,    color: 'bg-emerald-500' },
              { label: 'حجوزات ملغية',     value: stats.cancelledBookings ?? 0, color: 'bg-red-500' },
              { label: 'إجمالي الحجوزات', value: stats.bookings ?? 0,           color: 'bg-slate-400' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-bold text-slate-800">{row.value}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${row.color} rounded-full transition-all duration-700`}
                    style={{ width: (stats.bookings ?? 0) > 0 ? `${(row.value / stats.bookings) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-xl mb-2">⚡ الوصول السريع</h3>
          <p className="text-emerald-100 text-sm mb-4">إدارة المنصة بالكامل من هنا</p>
          <div className="space-y-2">
            {quickLinks.map(item => (
              <button
                key={item.page}
                onClick={() => navigate('/admin/' + item.page)}
                className="w-full text-right bg-white/20 hover:bg-white/30 transition-colors rounded-xl px-4 py-2.5 text-sm font-medium flex justify-between items-center"
              >
                {item.label}
                <i className="fas fa-arrow-left text-xs opacity-70"></i>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
