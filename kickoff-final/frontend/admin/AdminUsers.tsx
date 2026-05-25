import React, { useEffect, useState } from 'react';
import { adminGetUsers, adminDeleteUser, adminUpdateUserRole } from '../services/api';

const ROLES = ['لاعب', 'مالك ملعب', 'مسؤول'];

const ROLE_BADGE: Record<string, string> = {
  'مسؤول':    'bg-red-100 text-red-700 border border-red-200',
  'مالك ملعب': 'bg-blue-100 text-blue-700 border border-blue-200',
  'لاعب':      'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

const AdminUsers: React.FC = () => {
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [toast, setToast]     = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    adminGetUsers().then(data => { setUsers(data); setLoading(false); });
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المستخدم "${name}"؟`)) return;
    setDeleting(id);
    const ok = await adminDeleteUser(id);
    if (ok) { setUsers(u => u.filter(x => (x._id || x.id) !== id)); showToast('✅ تم حذف المستخدم'); }
    else    { showToast('❌ فشل الحذف'); }
    setDeleting(null);
  };

  const handleRole = async (id: string, role: string) => {
    const updated = await adminUpdateUserRole(id, role);
    if (updated) {
      setUsers(u => u.map(x => (x._id || x.id) === id ? { ...x, role } : x));
      showToast('✅ تم تغيير الدور');
    } else { showToast('❌ فشل تغيير الدور'); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">المستخدمون</h2>
          <p className="text-sm text-slate-500">{users.length} مستخدم مسجّل</p>
        </div>
        <div className="relative">
          <i className="fas fa-search absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input
            type="text"
            placeholder="بحث بالاسم أو الإيميل..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 pl-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3.5 text-right font-semibold text-slate-600">#</th>
                <th className="px-5 py-3.5 text-right font-semibold text-slate-600">المستخدم</th>
                <th className="px-5 py-3.5 text-right font-semibold text-slate-600">البريد الإلكتروني</th>
                <th className="px-5 py-3.5 text-right font-semibold text-slate-600">الهاتف</th>
                <th className="px-5 py-3.5 text-right font-semibold text-slate-600">الدور</th>
                <th className="px-5 py-3.5 text-right font-semibold text-slate-600">تاريخ الانضمام</th>
                <th className="px-5 py-3.5 text-right font-semibold text-slate-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u, i) => {
                const uid = u._id || u.id;
                return (
                  <tr key={uid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=10b981&color=fff`}
                          alt={u.name}
                          className="w-9 h-9 rounded-xl object-cover flex-shrink-0 bg-slate-100"
                        />
                        <span className="font-semibold text-slate-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{u.email}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{u.phone || '—'}</td>
                    <td className="px-5 py-4">
                      <select
                        value={u.role}
                        onChange={e => handleRole(uid, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-300 ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-JO') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleDelete(uid, u.name)}
                        disabled={deleting === uid}
                        className="flex items-center gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {deleting === uid
                          ? <i className="fas fa-spinner fa-spin"></i>
                          : <i className="fas fa-trash"></i>
                        }
                        حذف
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <i className="fas fa-users text-4xl text-slate-200 mb-3"></i>
            <p className="text-slate-400 font-medium">{search ? 'لا توجد نتائج للبحث' : 'لا يوجد مستخدمون'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
