import React, { useState, useEffect, useCallback } from 'react';
import { backend } from '../../services/backend';
import { Booking } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../utils/translations';

type FilterStatus = 'الكل' | 'قيد الانتظار' | 'مؤكد' | 'ملغي';
const STATUSES: FilterStatus[] = ['الكل', 'قيد الانتظار', 'مؤكد', 'ملغي'];

const statusBadge = (status: string) => {
  if (status === 'مؤكد')          return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'ملغي')          return 'bg-red-100 text-red-600 border-red-200';
  return                                  'bg-amber-100 text-amber-700 border-amber-200';
};

const OwnerBookings: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterStatus>('الكل');
  const [search, setSearch]     = useState('');
  const [busy, setBusy]         = useState<Record<string, boolean>>({});
  const [toast, setToast]       = useState('');

  const load = useCallback(() => {
    setLoading(true);
    backend.getBookings().then(data => { setBookings(data); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleConfirm = async (id: string) => {
    setBusy(p => ({ ...p, [id]: true }));
    const res = await backend.confirmBookingOwner(id);
    if (res.success) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'مؤكد' } : b));
      showToast('✅ تم تأكيد الحجز بنجاح');
    } else {
      showToast('❌ ' + (res.error || 'حدث خطأ'));
    }
    setBusy(p => ({ ...p, [id]: false }));
  };

  const handleReject = async (id: string) => {
    setBusy(p => ({ ...p, [id]: true }));
    const res = await backend.rejectBookingOwner(id);
    if (res.success) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'ملغي' } : b));
      showToast('تم رفض الحجز');
    } else {
      showToast('❌ ' + (res.error || 'حدث خطأ'));
    }
    setBusy(p => ({ ...p, [id]: false }));
  };

  const handleCancel = async (id: string) => {
    setBusy(p => ({ ...p, [id]: true }));
    const res = await backend.cancelBooking(id);
    if (res.success) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'ملغي' } : b));
      showToast('تم إلغاء الحجز');
    } else {
      showToast('❌ فشل الإلغاء');
    }
    setBusy(p => ({ ...p, [id]: false }));
  };

  const visible = bookings.filter(b => {
    const matchStatus = filter === 'الكل' || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || b.fieldName?.toLowerCase().includes(q)
      || b.userName?.toLowerCase().includes(q)
      || b.date?.includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    'الكل':           bookings.length,
    'قيد الانتظار':   bookings.filter(b => b.status === 'قيد الانتظار').length,
    'مؤكد':           bookings.filter(b => b.status === 'مؤكد').length,
    'ملغي':           bookings.filter(b => b.status === 'ملغي').length,
  };

  const statusLabel: Record<FilterStatus, string> = {
    'الكل':         t.ownerBookings.filterAll,
    'قيد الانتظار': t.ownerBookings.filterPending,
    'مؤكد':         t.ownerBookings.filterConfirmed,
    'ملغي':         t.ownerBookings.filterCancelled,
  };

  return (
    <div className="space-y-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">{t.ownerBookings.title}</p>
        <h1 className="text-2xl font-black text-slate-900">{t.ownerBookings.subtitle}</h1>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex gap-2 bg-slate-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg items-center">
          <span>{toast}</span>
        </div>
      )}

      {/* Filter tabs + search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-bold border transition-all ${
                filter === s
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-gray-50 text-slate-600 border-gray-200 hover:border-slate-300'
              }`}>
              {statusLabel[s]}
              <span className={`text-[10px] px-1.5 py-0 rounded-full font-black ${
                filter === s ? 'bg-white/20 text-white' : 'bg-gray-200 text-slate-500'
              }`}>{counts[s]}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t.ownerBookings.searchPlaceholder}
            className="w-full ps-10 pe-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none" />
          <i className="fas fa-search absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        </div>
      </div>

      {/* Bookings */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-14 text-center">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="font-black text-slate-800 mb-1">{t.ownerBookings.noBookings}</h3>
          <p className="text-slate-400 text-sm">
            {search ? t.ownerBookings.noSearchResults : t.ownerBookings.noBookingsInCategory}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className={`h-1 ${
                b.status === 'مؤكد' ? 'bg-emerald-500' : b.status === 'ملغي' ? 'bg-red-400' : 'bg-amber-400'
              }`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-slate-900">{b.fieldName || 'ملعب'}</h3>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-1.5 gap-x-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <i className="fas fa-user text-[10px] text-slate-300" />
                        {b.userName || '—'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <i className="fas fa-calendar text-[10px] text-slate-300" />
                        {b.date}
                      </span>
                      <span className="flex items-center gap-1.5" dir="ltr">
                        <i className="fas fa-clock text-[10px] text-slate-300" />
                        {b.timeSlot}
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600 font-black">
                        <i className="fas fa-money-bill text-[10px]" />
                        {b.price} د.أ
                      </span>
                    </div>
                    {b.userEmail && (
                      <p className="text-xs text-slate-400">{b.userEmail}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {b.status === 'قيد الانتظار' && (
                      <>
                        <button
                          onClick={() => handleConfirm(b.id)}
                          disabled={busy[b.id]}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60">
                          {busy[b.id]
                            ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <i className="fas fa-check text-[10px]" />
                          }
                          {t.ownerBookings.confirm}
                        </button>
                        <button
                          onClick={() => handleReject(b.id)}
                          disabled={busy[b.id]}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-100 transition-colors disabled:opacity-60">
                          <i className="fas fa-times text-[10px]" />
                          {t.ownerBookings.reject}
                        </button>
                      </>
                    )}
                    {b.status === 'مؤكد' && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={busy[b.id]}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-600 text-xs font-bold rounded-xl transition-colors disabled:opacity-60">
                        {busy[b.id]
                          ? <div className="w-3 h-3 border-2 border-gray-300 border-t-slate-500 rounded-full animate-spin" />
                          : <i className="fas fa-ban text-[10px]" />
                        }
                        {t.ownerBookings.cancel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer count */}
      {!loading && visible.length > 0 && (
        <p className="text-center text-xs text-slate-400 font-bold">{visible.length} {t.ownerBookings.footerCount} {bookings.length}</p>
      )}
    </div>
  );
};

export default OwnerBookings;
