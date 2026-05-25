import React, { useEffect, useState } from 'react';
import { adminGetFields, adminCreateField, adminUpdateField, adminDeleteField } from '../services/api';

const EMPTY_FORM = { name: '', location: '', pricePerHour: '', type: '5v5', turfType: 'عشب صناعي', amenities: '', description: '' };

const AdminFields: React.FC = () => {
  const [fields, setFields]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<any>(null);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  useEffect(() => {
    adminGetFields().then(data => { setFields(data || []); setLoading(false); });
  }, []);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
  const openEdit   = (f: any) => {
    setEditing(f);
    setForm({
      name: f.name, location: f.location, pricePerHour: String(f.pricePerHour),
      type: f.type, turfType: f.turfType,
      amenities: (f.amenities || []).join(', '),
      description: f.description || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      pricePerHour: Number(form.pricePerHour),
      amenities: form.amenities.split(',').map((a: string) => a.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        const updated = await adminUpdateField(editing._id || editing.id, payload);
        if (updated) {
          setFields(fs => fs.map(x => (x._id || x.id) === (editing._id || editing.id) ? { ...x, ...updated } : x));
          showToast('✅ تم تحديث الملعب');
        }
      } else {
        const created = await adminCreateField(payload);
        if (created) { setFields(fs => [created, ...fs]); showToast('✅ تم إضافة الملعب'); }
      }
      setShowForm(false); setEditing(null); setForm({ ...EMPTY_FORM });
    } catch (err: any) { showToast('❌ ' + err.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف ملعب "${name}"؟`)) return;
    const ok = await adminDeleteField(id);
    if (ok) { setFields(fs => fs.filter(x => (x._id || x.id) !== id)); showToast('✅ تم حذف الملعب'); }
    else    { showToast('❌ فشل الحذف'); }
  };

  const filtered = fields.filter(f =>
    f.name?.includes(search) || f.location?.includes(search)
  );

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">الملاعب</h2>
          <p className="text-sm text-slate-500">{fields.length} ملعب مسجّل</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <i className="fas fa-search absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              placeholder="بحث..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-8 pl-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 w-44"
            />
          </div>
          <button
            onClick={openCreate}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            إضافة ملعب
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-800 text-base">
              <i className={`fas ${editing ? 'fa-edit' : 'fa-plus-circle'} text-emerald-500 ml-2`}></i>
              {editing ? 'تعديل الملعب' : 'إضافة ملعب جديد'}
            </h3>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-slate-400 hover:text-slate-600 text-lg">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">اسم الملعب *</label>
              <input
                type="text" required value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                placeholder="مثال: ملاعب تراكس"
              />
            </div>
            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">الموقع *</label>
              <input
                type="text" required value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                placeholder="مثال: عمان، خلدا"
              />
            </div>
            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">السعر بالساعة (JD) *</label>
              <input
                type="number" required min="1" value={form.pricePerHour}
                onChange={e => setForm(p => ({ ...p, pricePerHour: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                placeholder="30"
              />
            </div>
            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">نوع الملعب *</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 bg-white"
              >
                {['5v5', '6v6', '7v7'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {/* Turf Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">نوع العشب</label>
              <select
                value={form.turfType}
                onChange={e => setForm(p => ({ ...p, turfType: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 bg-white"
              >
                {['عشب صناعي', 'عشب طبيعي', 'هجين'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {/* Amenities */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">المرافق (مفصولة بفاصلة)</label>
              <input
                type="text" value={form.amenities}
                onChange={e => setForm(p => ({ ...p, amenities: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                placeholder="مواقف سيارات, إضاءة, كافتيريا"
              />
            </div>
            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">الوصف</label>
              <textarea
                rows={2} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 resize-none"
                placeholder="وصف مختصر عن الملعب..."
              ></textarea>
            </div>
            {/* Buttons */}
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit" disabled={saving}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
              >
                {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className={`fas ${editing ? 'fa-save' : 'fa-plus'}`}></i>}
                {editing ? 'حفظ التغييرات' : 'إضافة الملعب'}
              </button>
              <button
                type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(f => {
          const fid = f._id || f.id;
          return (
            <div key={fid} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center relative">
                <i className="fas fa-futbol text-5xl text-white/30"></i>
                <div className="absolute top-3 left-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${f.isActive === false ? 'bg-red-500 text-white' : 'bg-white/90 text-emerald-700'}`}>
                    {f.isActive === false ? 'محذوف' : f.type}
                  </span>
                </div>
                <div className="absolute top-3 right-3 text-white/80 text-xs font-medium bg-black/20 px-2 py-1 rounded-full">
                  {f.turfType}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-800 mb-1">{f.name}</h3>
                <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                  <i className="fas fa-map-marker-alt text-emerald-500"></i> {f.location}
                </p>
                {f.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {f.amenities.slice(0, 3).map((a: string) => (
                      <span key={a} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                    {f.amenities.length > 3 && <span className="text-xs text-slate-400">+{f.amenities.length - 3}</span>}
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-xl font-bold text-slate-900">
                    {f.pricePerHour} <span className="text-sm font-normal text-slate-500">JD/ساعة</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(f)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      <i className="fas fa-edit ml-1"></i>تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(fid, f.name)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      <i className="fas fa-trash ml-1"></i>حذف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl py-16 text-center shadow-sm border border-slate-100">
          <i className="fas fa-futbol text-4xl text-slate-200 mb-3"></i>
          <p className="text-slate-400 font-medium">{search ? 'لا توجد نتائج' : 'لا توجد ملاعب — أضف أول ملعب!'}</p>
          {!search && (
            <button onClick={openCreate} className="mt-3 text-emerald-500 hover:text-emerald-600 text-sm font-bold">
              <i className="fas fa-plus ml-1"></i>إضافة ملعب
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFields;
