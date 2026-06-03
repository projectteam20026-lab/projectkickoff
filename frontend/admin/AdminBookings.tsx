import React, { useEffect, useState } from 'react';
import { adminGetBookings, adminUpdateBooking, adminDeleteBooking } from '../services/api';

const STATUS_BADGE: Record<string, string> = {
  'مؤكد':          'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'قيد الانتظار':  'bg-yellow-100 text-yellow-700 border border-yellow-200',
  'ملغي':          'bg-red-100 text-red-700 border border-red-200',
};

const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState('');
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    adminGetBookings().then(data => { setBookings(data || []); setLoading(false); });
  }, []);

  const handleStatus = async (id: string, status: string) => {
    const updated = await adminUpdateBooking(id, status);
    if (updated) {
      setBookings(b => b.map(x => (x._id || x.id) === id ? { ...x, status } : x));
      showToast(`✅ تم تغيير الحالة إلى "${status}"`);
    } else { showToast('❌ فشل تحديث الحجز'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الحجز نهائياً؟')) return;
    const ok = await adminDeleteBooking(id);
    if (ok) { setBookings(b => b.filter(x => (x._id || x.id) !== id)); showToast('✅ تم حذف الحجز'); }
    else    { showToast('❌ فشل الحذف'); }
  };

  const filtered = bookings.filter(b => {
    const matchFilter = filter === 'all' || b.status === filter;
    const matchSearch = !search ||
      b.fieldName?.includes(search) ||
      b.userId?.name?.includes(search) ||
      b.date?.includes(search);
    return matchFilter && matchSearch;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium">{toast}</div>
      )}

      {/* Header + filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-800">الحجوزات</h2>
          <p className="text-sm text-slate-500">{bookings.length} حجز إجمالاً</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Status filter */}
          <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1">
            {[
              { value: 'all',          label: 'الكل' },
              { value: 'مؤكد',         label: 'مؤكد' },
              { value: 'قيد الانتظار', label: 'انتظار' },
              { value: 'ملغي',         label: 'ملغي' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === opt.value ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <i className="fas fa-search absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              placeholder="بحث..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-8 pl-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-400 w-44"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['المستخدم', 'الملعب', 'التاريخ', 'الوقت', 'السعر', 'الحالة', 'الإجراءات'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-right font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(b => {
                const bid = b._id || b.id;
                return (
                  <tr key={bid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-800">{b.userId?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{b.userId?.email || ''}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-700">{b.fieldName || b.fieldId?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{b.fieldId?.location || ''}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{b.date}</td>
                    <td className="px-4 py-4 text-slate-500 text-xs whitespace-nowrap">{b.timeSlot}</td>
                    <td className="px-4 py-4 font-bold text-emerald-600 whitespace-nowrap">{b.price} JD</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[b.status] || 'bg-gray-100 text-gray-600'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleStatus(bid, 'مؤكد')}
                          disabled={b.status === 'مؤكد'}
                          className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >
                          <i className="fas fa-check ml-1"></i>قبول
                        </button>
                        <button
                          onClick={() => handleStatus(bid, 'ملغي')}
                          disabled={b.status === 'ملغي'}
                          className="text-xs bg-red-50 text-red-600 font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >
                          <i className="fas fa-times ml-1"></i>رفض
                        </button>
                        <button
                          onClick={() => handleDelete(bid)}
                          className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <i className="fas fa-calendar-times text-4xl text-slate-200 mb-3"></i>
            <p className="text-slate-400 font-medium">لا توجد حجوزات</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
