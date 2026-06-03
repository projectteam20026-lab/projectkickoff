import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { Booking } from '../types';

const PlayerBookingsCurrent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    backend.getBookings().then(all => {
      const mine = all.filter(b => !b.userId || b.userId === user?.id);
      // "حالية" = مؤكد أو قيد الانتظار (لا منتهي ولا ملغي)
      setBookings(mine.filter(b => b.status === 'مؤكد' || b.status === 'قيد الانتظار'));
      setLoading(false);
    });
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-5">
          {/* breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <i className="fas fa-calendar-check text-emerald-500" />
            <span className="font-bold text-slate-600">حجوزاتي</span>
            <i className="fas fa-chevron-left text-[9px]" />
            <span>الحالية</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900">حجوزاتي الحالية</h1>
              <p className="text-slate-500 text-xs mt-0.5">الحجوزات النشطة والقادمة</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/bookings/manage"
                className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:text-emerald-700">
                <i className="fas fa-tasks text-[10px]" /> إدارة الحجوزات
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">

        {/* Sub-nav tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { path: '/bookings/current', label: 'الحالية',    icon: 'fa-calendar-check' },
            { path: '/bookings/history', label: 'السجل',      icon: 'fa-history'        },
            { path: '/bookings/manage',  label: 'الإدارة',    icon: 'fa-tasks'          },
          ].map(t => (
            <Link key={t.path} to={t.path}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                t.path === '/bookings/current'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : 'bg-white text-slate-500 border-gray-200 hover:border-emerald-200 hover:text-emerald-600'
              }`}>
              <i className={`fas ${t.icon} text-[10px]`} /> {t.label}
            </Link>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-calendar-check text-emerald-400 text-2xl" />
            </div>
            <h3 className="font-black text-slate-900 mb-1">لا توجد حجوزات نشطة</h3>
            <p className="text-slate-400 text-sm mb-5">احجز ملعبك المفضل الآن</p>
            <button onClick={() => navigate('/explore')}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors">
              <i className="fas fa-search me-2" /> تصفح الملاعب
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map(b => (
              <div key={b.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className={`h-1 ${b.status === 'مؤكد' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${b.status === 'مؤكد' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      <i className={`fas fa-futbol text-xl ${b.status === 'مؤكد' ? 'text-emerald-600' : 'text-amber-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-900 truncate">{b.fieldName}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><i className="fas fa-calendar text-emerald-400" /> {b.date}</span>
                        <span className="flex items-center gap-1"><i className="fas fa-clock text-emerald-400" /> {b.timeSlot}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black ${b.status === 'مؤكد' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        <i className={`fas ${b.status === 'مؤكد' ? 'fa-check-circle' : 'fa-clock'} me-1 text-[9px]`} />
                        {b.status}
                      </span>
                      <span className="text-slate-900 font-black">{b.price}<span className="text-emerald-600 text-xs font-bold"> د.أ</span></span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50 flex justify-end">
                    <Link to="/bookings/manage"
                      className="text-xs font-bold text-slate-400 hover:text-emerald-600 flex items-center gap-1 transition-colors">
                      إدارة هذا الحجز <i className="fas fa-arrow-left text-[9px]" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <button onClick={() => navigate('/explore')}
                className="w-full py-3 border-2 border-dashed border-emerald-200 hover:border-emerald-400 text-emerald-600 font-bold text-sm rounded-2xl transition-colors flex items-center justify-center gap-2 hover:bg-emerald-50">
                <i className="fas fa-plus" /> إضافة حجز جديد
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerBookingsCurrent;
