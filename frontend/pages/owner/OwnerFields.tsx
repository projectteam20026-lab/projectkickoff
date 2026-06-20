import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { backend } from '../../services/backend';
import { Field } from '../../types';

const CITIES = ['عمان','الزرقاء','إربد','العقبة','السلط','مادبا','جرش','عجلون','المفرق','الكرك','الطفيلة','معان'];
const FIELD_TYPES = ['5v5','6v6','7v7'] as const;
const TURF_TYPES  = ['عشب صناعي','عشب طبيعي','هجين'] as const;
const AMENITIES_LIST = ['Parking','WiFi','Changing Rooms','Showers','Lighting','Cafeteria','Security','First Aid'];

const EMPTY_FORM: Partial<Field> = {
  name: '', description: '', city: 'عمان', address: '', location: '',
  type: '7v7', turfType: 'عشب صناعي', pricePerHour: 40,
  phone: '', whatsapp: '', amenities: [],
  availableHours: { start: '08:00', end: '22:00' },
  images: [],
};

type Mode = 'list' | 'create' | 'edit';

const OwnerFields: React.FC = () => {
  const { user } = useAuth();
  const [fields, setFields]   = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode]       = useState<Mode>('list');
  const [editTarget, setEditTarget] = useState<Field | null>(null);
  const [form, setForm]       = useState<Partial<Field>>({ ...EMPTY_FORM });
  const [saving, setSaving]   = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(() => {
    backend.getMyFields().then(data => {
      if (data.length > 0) setFields(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const setF = (k: keyof Field, v: any) => setForm(p => ({ ...p, [k]: v }));
  const toggleAmenity = (a: string) =>
    setF('amenities', form.amenities?.includes(a)
      ? form.amenities.filter(x => x !== a)
      : [...(form.amenities || []), a]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditTarget(null);
    setError('');
    setMode('create');
  };

  const openEdit = (f: Field) => {
    setForm({ ...f });
    setEditTarget(f);
    setError('');
    setMode('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim())     { setError('أدخل اسم الملعب'); return; }
    if (!form.location?.trim()) { setError('أدخل موقع الملعب'); return; }
    if (!form.pricePerHour)     { setError('أدخل سعر الساعة');   return; }
    setSaving(true); setError('');
    const payload = { ...form, id: mode === 'edit' ? editTarget?.id : '' };
    const saved = await backend.saveField(payload as Field);
    const realId = saved?.id && String(saved.id).length > 4 ? saved.id : null;
    if (realId) {
      // Immediately update local state — don't wait for reload
      if (mode === 'create') {
        setFields(prev => [saved, ...prev]);
      } else {
        setFields(prev => prev.map(f => f.id === saved.id ? saved : f));
      }
      setSuccess(mode === 'create' ? 'تم إضافة الملعب بنجاح!' : 'تم تحديث الملعب بنجاح!');
      setMode('list');
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError('فشل حفظ الملعب — تأكد من تشغيل السيرفر وإدخال جميع الحقول المطلوبة');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    const ok = await backend.deleteField(id);
    if (ok) {
      setFields(prev => prev.filter(f => f.id !== id));
      setDeleteId(null);
      setSuccess('تم حذف الملعب.');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('فشل الحذف، حاول مجدداً.');
    }
    setDeleting(false);
  };

  /* ── Form ──────────────────────────────────────────────────────────── */
  const renderForm = () => (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Form header */}
      <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-bold mb-0.5">
            {mode === 'create' ? 'ملعب جديد' : 'تعديل الملعب'}
          </p>
          <h2 className="text-lg font-black">{form.name || 'اسم الملعب'}</h2>
        </div>
        <button type="button" onClick={() => setMode('list')}
          className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center">
          <i className="fas fa-times" />
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl">
          <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="p-6 space-y-6">

        {/* Basic info */}
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-emerald-500 rounded-full" /> المعلومات الأساسية
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم الملعب <span className="text-red-500">*</span></label>
              <input value={form.name || ''} onChange={e => setF('name', e.target.value)}
                placeholder="مثال: ملعب النجوم"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-bold" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">المدينة</label>
              <select value={form.city || 'عمان'} onChange={e => setF('city', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 outline-none text-sm appearance-none">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">الموقع / الحي <span className="text-red-500">*</span></label>
              <input value={form.location || ''} onChange={e => setF('location', e.target.value)}
                placeholder="مثال: شارع المدينة المنورة"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">العنوان التفصيلي</label>
              <input value={form.address || ''} onChange={e => setF('address', e.target.value)}
                placeholder="العنوان الكامل"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">الوصف</label>
              <textarea value={form.description || ''} onChange={e => setF('description', e.target.value)}
                rows={3} placeholder="وصف مختصر للملعب..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 outline-none text-sm resize-none" />
            </div>
          </div>
        </div>

        {/* Field specs */}
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-500 rounded-full" /> مواصفات الملعب
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نوع الملعب</label>
              <div className="flex gap-2 flex-wrap">
                {FIELD_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => setF('type', t)}
                    className={`px-4 py-2 rounded-xl font-black text-sm border-2 transition-all ${
                      form.type === t ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200 text-slate-600 bg-gray-50'
                    }`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نوع العشب</label>
              <select value={form.turfType || 'عشب صناعي'} onChange={e => setF('turfType', e.target.value as any)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 outline-none text-sm appearance-none">
                {TURF_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">سعر الساعة (د.أ) <span className="text-red-500">*</span></label>
              <input type="number" min="1" value={form.pricePerHour || ''} onChange={e => setF('pricePerHour', Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 outline-none text-sm font-bold" />
            </div>
          </div>
        </div>

        {/* Hours */}
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-amber-500 rounded-full" /> ساعات العمل
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">الافتتاح</label>
              <input type="time" value={form.availableHours?.start || '08:00'}
                onChange={e => setF('availableHours', { ...form.availableHours, start: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">الإغلاق</label>
              <input type="time" value={form.availableHours?.end || '22:00'}
                onChange={e => setF('availableHours', { ...form.availableHours, end: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 outline-none text-sm" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-pink-500 rounded-full" /> معلومات التواصل
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">رقم الهاتف</label>
              <div className="relative">
                <input value={form.phone || ''} onChange={e => setF('phone', e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full ps-11 pe-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 outline-none text-sm" />
                <i className="fas fa-phone absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">واتساب</label>
              <div className="relative">
                <input value={form.whatsapp || ''} onChange={e => setF('whatsapp', e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full ps-11 pe-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 outline-none text-sm" />
                <i className="fab fa-whatsapp absolute start-4 top-1/2 -translate-y-1/2 text-green-500 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-violet-500 rounded-full" /> المرافق والخدمات
          </h3>
          <div className="flex flex-wrap gap-2">
            {AMENITIES_LIST.map(a => (
              <button key={a} type="button" onClick={() => toggleAmenity(a)}
                className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  form.amenities?.includes(a)
                    ? 'bg-violet-500 border-violet-500 text-white'
                    : 'border-gray-200 text-slate-600 bg-gray-50 hover:border-violet-300'
                }`}>{a}</button>
            ))}
          </div>
        </div>

        {/* Image URLs */}
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-teal-500 rounded-full" /> صور الملعب
          </h3>
          <textarea
            value={(form.images || []).join('\n')}
            onChange={e => setF('images', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
            rows={3}
            placeholder="ضع رابط كل صورة في سطر منفصل&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 outline-none text-sm resize-none" dir="ltr"
          />
          <p className="text-xs text-slate-400 mt-1">رابط URL لكل صورة في سطر منفصل</p>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</>
              : <><i className={`fas ${mode === 'create' ? 'fa-plus' : 'fa-save'}`} /> {mode === 'create' ? 'إضافة الملعب' : 'حفظ التعديلات'}</>
            }
          </button>
          <button type="button" onClick={() => { setMode('list'); setError(''); }}
            className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold rounded-xl text-sm transition-colors">
            إلغاء
          </button>
        </div>
      </div>
    </form>
  );

  /* ── Main ──────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">إدارة الملاعب</p>
          <h1 className="text-2xl font-black text-slate-900">ملاعبي</h1>
        </div>
        {mode === 'list' && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5">
            <i className="fas fa-plus text-xs" /> إضافة ملعب
          </button>
        )}
      </div>

      {/* Toasts */}
      {success && (
        <div className="flex gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-2xl items-center">
          <i className="fas fa-check-circle text-emerald-500 text-lg" /> {success}
        </div>
      )}

      {/* Form */}
      {(mode === 'create' || mode === 'edit') && renderForm()}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-500">
                <i className="fas fa-trash text-xl" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">حذف الملعب؟</h3>
                <p className="text-sm text-slate-500">سيتم حذف الملعب نهائياً ولا يمكن التراجع</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <i className="fas fa-trash" />}
                نعم، احذف
              </button>
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-sm">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fields list */}
      {mode === 'list' && (
        loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : fields.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-emerald-200 p-14 text-center">
            <div className="text-5xl mb-3">🏟️</div>
            <h3 className="text-lg font-black text-slate-900 mb-1">لا يوجد ملاعب بعد</h3>
            <p className="text-slate-400 text-sm mb-5">أضف ملعبك الأول وابدأ باستقبال الحجوزات</p>
            <button onClick={openCreate}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-sm">
              <i className="fas fa-plus me-2" /> إضافة ملعب
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map(f => (
              <div key={f.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Image or placeholder */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                      {f.images?.[0]
                        ? <img src={f.images[0]} alt={f.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl">🏟️</div>
                      }
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-black text-slate-900 text-lg truncate">{f.name}</h3>
                        <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full">{f.type}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {f.city && <span className="flex items-center gap-1"><i className="fas fa-map-marker-alt text-[9px]" />{f.city}</span>}
                        <span className="flex items-center gap-1"><i className="fas fa-clock text-[9px]" />{f.availableHours?.start}–{f.availableHours?.end}</span>
                        <span className="text-emerald-600 font-black">{f.pricePerHour} د.أ/ساعة</span>
                        {f.rating > 0 && <span className="flex items-center gap-0.5"><i className="fas fa-star text-amber-400 text-[9px]" />{f.rating}</span>}
                      </div>
                      {f.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {f.amenities.slice(0, 4).map(a => (
                            <span key={a} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{a}</span>
                          ))}
                          {f.amenities.length > 4 && <span className="text-slate-400 text-[10px]">+{f.amenities.length - 4}</span>}
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => openEdit(f)}
                        className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-500 flex items-center justify-center border border-blue-100 transition-colors">
                        <i className="fas fa-edit text-sm" />
                      </button>
                      <button onClick={() => setDeleteId(f.id)}
                        className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center border border-red-100 transition-colors">
                        <i className="fas fa-trash text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default OwnerFields;
