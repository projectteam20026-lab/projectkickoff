import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backend } from '../services/backend';
import { Booking } from '../types';

const PlayerBookingsManage: React.FC = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<{ id: string; type: 'confirm' | 'cancel' } | null>(null);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const reload = async () => {
    const all = await backend.getBookings();
    setBookings(all.filter(b => (!b.userId || b.userId === user?.id) && b.status !== 'ملغي'));
  };

  useEffect(() => {
    reload().then(() => setLoading(false));
  }, [user?.id]);

  const handleConfirm = async (id: string) => {
    setActing({ id, type: 'confirm' });
    const res = await backend.confirmBooking(id);
    if (res.success) {
      await reload();
      showToast('✅ تم تأكيد الحجز بنجاح', true);
    } else {
      showToast('حدث خطأ، حاول مجدداً', false);
    }
    setActing(null);
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) return;
    setActing({ id, type: 'cancel' });
    const res = await backend.cancelBooking(id);
    if (res.success) {
      await reload();
      showToast('تم إلغاء الحجز', true);
    } else {
      showToast('حدث خطأ، حاول مجدداً', false);
    }
    setActing(null);
  };

  const pending   = bookings.filter(b => b.status === 'قيد الانتظار');
  const confirmed = bookings.filter(b => b.status === 'مؤكد');

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8" dir="rtl">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 inset-x-0 mx-auto w-fit z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white transition-all animate-fade-in-up ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <i className="fas fa-calendar-check text-emerald-500" />
            <span className="font-bold text-slate-600">حجوزاتي</span>
            <i className="fas fa-chevron-left text-[9px]" />
            <span>الإدارة</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900">تأكيد / إلغاء الحجز</h1>
              <p className="text-slate-500 text-xs mt-0.5">أدر حجوزاتك المعلّقة والمؤكدة</p>
            </div>
            <div className="flex gap-2 text-xs font-bold">
              {pending.length > 0 && (
                <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <i className="fas fa-clock text-[10px]" /> {pending.length} معلّق
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">

        {/* Sub-nav */}
        <div className="flex gap-2 mb-5">
          {[
            { path: '/bookings/current', label: 'الحالية', icon: 'fa-calendar-check' },
            { path: '/bookings/history', label: 'السجل',   icon: 'fa-history'        },
            { path: '/bookings/manage',  label: 'الإدارة', icon: 'fa-tasks'          },
          ].map(t => (
            <Link key={t.path} to={t.path}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                t.path === '/bookings/manage'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : 'bg-white text-slate-500 border-gray-200 hover:border-emerald-200 hover:text-emerald-600'
              }`}>
              <i className={`fas ${t.icon} text-[10px]`} /> {t.label}
            </Link>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-gray-100" />)}</div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check-double text-emerald-400 text-2xl" />
            </div>
            <h3 className="font-black text-slate-900 mb-1">لا توجد حجوزات تحتاج إجراء</h3>
            <p className="text-slate-400 text-sm mb-5">جميع حجوزاتك مكتملة أو تم إلغاؤها</p>
            <button onClick={() => navigate('/explore')}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors">
              <i className="fas fa-plus me-2" /> حجز جديد
            </button>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Pending section */}
            {pending.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <h2 className="text-sm font-black text-slate-700">بانتظار التأكيد</h2>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">{pending.length}</span>
                </div>
                <div className="space-y-3">
                  {pending.map(b => (
                    <div key={b.id}
                      className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                      <div className="h-1 bg-amber-400" />
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-futbol text-amber-600 text-lg" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-black text-slate-900">{b.fieldName}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-500">
                              <span><i className="fas fa-calendar text-amber-400 me-1" />{b.date}</span>
                              <span><i className="fas fa-clock text-amber-400 me-1" />{b.timeSlot}</span>
                              <span className="font-bold text-slate-700">{b.price} د.أ</span>
                            </div>
                          </div>
                          <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-black flex-shrink-0">
                            <i className="fas fa-clock me-1 text-[9px]" /> معلّق
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleConfirm(b.id)}
                            disabled={!!acting}
                            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                            {acting?.id === b.id && acting.type === 'confirm'
                              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري التأكيد...</>
                              : <><i className="fas fa-check" /> تأكيد الحجز</>
                            }
                          </button>
                          <button
                            onClick={() => handleCancel(b.id)}
                            disabled={!!acting}
                            className="flex-1 py-2.5 border-2 border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                            {acting?.id === b.id && acting.type === 'cancel'
                              ? <><div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" /> جاري الإلغاء...</>
                              : <><i className="fas fa-times" /> إلغاء</>
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Confirmed section — لا يمكن الإلغاء بعد التأكيد */}
            {confirmed.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <h2 className="text-sm font-black text-slate-700">مؤكدة</h2>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">{confirmed.length}</span>
                  <span className="text-[10px] text-slate-400 ms-auto flex items-center gap-1">
                    <i className="fas fa-lock text-[9px]" /> لا يمكن الإلغاء بعد التأكيد
                  </span>
                </div>
                <div className="space-y-3">
                  {confirmed.map(b => (
                    <div key={b.id}
                      className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                      <div className="h-1 bg-emerald-400" />
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-futbol text-emerald-600 text-lg" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-slate-900 truncate">{b.fieldName}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-500">
                              <span><i className="fas fa-calendar text-emerald-400 me-1" />{b.date}</span>
                              <span><i className="fas fa-clock text-emerald-400 me-1" />{b.timeSlot}</span>
                              <span className="font-bold text-slate-700">{b.price} د.أ</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1">
                              <i className="fas fa-check-circle text-[9px]" /> مؤكد
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <i className="fas fa-lock text-[9px]" /> محجوز نهائياً
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerBookingsManage;
