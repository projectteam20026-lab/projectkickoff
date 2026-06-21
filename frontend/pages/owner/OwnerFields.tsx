import React, { useState, useEffect, useCallback, useRef } from 'react';
import { backend } from '../../services/backend';
import { Field, Booking } from '../../types';

const CITIES = ['عمان','الزرقاء','إربد','العقبة','السلط','مادبا','جرش','عجلون','المفرق','الكرك','الطفيلة','معان'];
const FIELD_TYPES = ['5v5','6v6','7v7'] as const;
const TURF_TYPES  = ['عشب صناعي','عشب طبيعي','هجين'] as const;
const AMENITIES_LIST = ['Parking','WiFi','Changing Rooms','Showers','Lighting','Cafeteria','Security','First Aid'];

const AMENITY_ICONS: Record<string, string> = {
  'Parking':       'fa-car',
  'WiFi':          'fa-wifi',
  'Changing Rooms':'fa-door-open',
  'Showers':       'fa-shower',
  'Lighting':      'fa-lightbulb',
  'Cafeteria':     'fa-coffee',
  'Security':      'fa-shield-alt',
  'First Aid':     'fa-first-aid',
};

const EMPTY_FORM: Partial<Field> = {
  name: '', description: '', city: 'عمان', address: '', location: '',
  type: '7v7', turfType: 'عشب صناعي', pricePerHour: 40,
  phone: '', whatsapp: '', amenities: [],
  availableHours: { start: '08:00', end: '22:00' },
};

type Mode = 'list' | 'create' | 'edit' | 'detail';


// ── Field Detail View ─────────────────────────────────────────────────────────
function FieldDetail({
  field, bookings, onEdit, onDelete, onBack, onPrev, onNext, hasPrev, hasNext,
}: {
  field: Field; bookings: Booking[]; onEdit: () => void; onDelete: () => void; onBack: () => void;
  onPrev: () => void; onNext: () => void; hasPrev: boolean; hasNext: boolean;
}) {
  const fieldBookings = bookings.filter(b => b.fieldId === field.id);
  const revenue       = fieldBookings.filter(b => b.status !== 'ملغي').reduce((s, b) => s + (b.price || 0), 0);
  const confirmed     = fieldBookings.filter(b => b.status === 'مؤكد').length;
  const pending       = fieldBookings.filter(b => b.status === 'معلق').length;
  const cancelled     = fieldBookings.filter(b => b.status === 'ملغي').length;

  // Hour distribution for heatmap
  const hourCounts: Record<string, number> = {};
  fieldBookings.forEach(b => {
    const h = b.timeSlot?.split(':')[0];
    if (h) hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const maxCount = Math.max(...Object.values(hourCounts), 1);
  const hours = Array.from({ length: 14 }, (_, i) => String(i + 8).padStart(2, '0'));

  // Day distribution
  const dayNames = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const dayCounts: Record<number, number> = {};
  fieldBookings.forEach(b => {
    if (b.date) {
      const d = new Date(b.date).getDay();
      dayCounts[d] = (dayCounts[d] || 0) + 1;
    }
  });
  const maxDay = Math.max(...Object.values(dayCounts), 1);

  // Cancellation rate
  const cancelRate = fieldBookings.length > 0 ? Math.round((cancelled / fieldBookings.length) * 100) : 0;

  // Fill rate (how many slots are typically booked vs available)
  const openHours = (() => {
    const [sh, sm] = (field.availableHours?.start || '08:00').split(':').map(Number);
    const [eh, em] = (field.availableHours?.end   || '22:00').split(':').map(Number);
    return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
  })();

  return (
    <div className="space-y-5" dir="rtl">

      {/* Back + actions header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-bold transition-colors">
          <i className="fas fa-arrow-right text-xs" /> ملاعبي
        </button>
        <div className="flex gap-2">
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-bold rounded-xl border border-blue-100 transition-colors">
            <i className="fas fa-edit text-xs" /> تعديل
          </button>
          <button onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 text-sm font-bold rounded-xl border border-red-100 transition-colors">
            <i className="fas fa-trash text-xs" /> حذف
          </button>
        </div>
      </div>

      {/* Field name banner — gradient seeded from name */}
      {(() => {
        const hash = field.name.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffffffff, 0);
        const palettes = [
          ['#064e3b','#065f46'],['#1e3a5f','#1e40af'],['#3b0764','#6b21a8'],
          ['#7f1d1d','#991b1b'],['#134e4a','#0f766e'],['#1c1917','#292524'],
          ['#0c4a6e','#0369a1'],['#14532d','#166534'],['#713f12','#92400e'],
          ['#1e1b4b','#312e81'],
        ];
        const [from, to] = palettes[Math.abs(hash) % palettes.length];
        return (
          <div className="relative rounded-2xl overflow-hidden h-44"
            style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}>
            <svg viewBox="0 0 400 176" className="absolute inset-0 w-full h-full opacity-[0.07]"
              fill="none" stroke="white" strokeWidth="1.5">
              <rect x="8" y="8" width="384" height="160" rx="4"/>
              <line x1="200" y1="8" x2="200" y2="168"/>
              <circle cx="200" cy="88" r="30"/>
              <rect x="8" y="52" width="44" height="72"/>
              <rect x="348" y="52" width="44" height="72"/>
              <circle cx="200" cy="88" r="2.5" fill="white"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <h1 className="font-black text-white text-xl leading-tight drop-shadow">{field.name}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                <span className="text-white/70 text-xs"><i className="fas fa-map-marker-alt me-1"/>{field.city}</span>
                <span className="text-white/40 text-xs">·</span>
                <span className="text-white/70 text-xs">{field.type}</span>
                {field.rating > 0 && (
                  <span className="bg-amber-400/90 text-slate-900 text-xs font-black px-2 py-0.5 rounded-full">
                    <i className="fas fa-star me-1"/>{field.rating}
                  </span>
                )}
              </div>
            </div>
            {hasPrev && (
              <button onClick={onPrev} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
                <i className="fas fa-chevron-right text-xs"/>
              </button>
            )}
            {hasNext && (
              <button onClick={onNext} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
                <i className="fas fa-chevron-left text-xs"/>
              </button>
            )}
          </div>
        );
      })()}

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:'الإيرادات', val:`${revenue} JD`, icon:'fa-coins',      c:'from-amber-400 to-orange-500'  },
          { label:'حجوزات',    val:confirmed,        icon:'fa-check-circle',c:'from-emerald-400 to-teal-500'  },
          { label:'معلّقة',    val:pending,           icon:'fa-clock',       c:'from-blue-400 to-blue-600'     },
          { label:'ملغاة',    val:cancelled,          icon:'fa-times-circle', c:'from-red-400 to-rose-500'    },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.c} rounded-2xl p-4 text-white text-center shadow-sm`}>
            <i className={`fas ${s.icon} text-lg mb-1.5 block opacity-80`} />
            <p className="text-xl font-black">{s.val}</p>
            <p className="text-[10px] font-bold opacity-75 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Peak hours heatmap */}
      {fieldBookings.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
            <i className="fas fa-fire text-orange-400" /> ساعات الذروة
          </h3>
          <div className="flex gap-1 items-end">
            {hours.map(h => {
              const c = hourCounts[h] || 0;
              const pct = Math.round((c / maxCount) * 100);
              const isHot = pct >= 70;
              return (
                <div key={h} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max(4, pct * 0.8)}px`,
                      background: isHot
                        ? 'linear-gradient(to top, #ef4444, #f97316)'
                        : pct > 30
                        ? 'linear-gradient(to top, #10b981, #34d399)'
                        : '#e2e8f0',
                    }} />
                  <span className="text-[8px] text-slate-400 font-bold">{h}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> متوسط
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> ذروة
            </span>
          </div>
        </div>
      )}

      {/* Day distribution */}
      {fieldBookings.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
            <i className="fas fa-calendar-week text-violet-400" /> الأيام الأكثر ازدحاماً
          </h3>
          <div className="space-y-2">
            {dayNames.map((day, di) => {
              const c = dayCounts[di] || 0;
              const pct = Math.round((c / maxDay) * 100);
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 w-16 text-end flex-shrink-0">{day}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-black text-slate-600 w-6 text-start">{c}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Field info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
            <i className="fas fa-info-circle text-blue-400" /> معلومات الملعب
          </h3>
          <div className="space-y-3">
            {[
              { icon:'fa-futbol',       label:'النوع',      val:field.type           },
              { icon:'fa-leaf',          label:'نوع العشب', val:field.turfType       },
              { icon:'fa-money-bill-wave',label:'السعر',    val:`${field.pricePerHour} د.أ / ساعة` },
              { icon:'fa-clock',         label:'ساعات العمل',val:`${field.availableHours?.start || '—'} – ${field.availableHours?.end || '—'}` },
              { icon:'fa-map-marker-alt',label:'الموقع',    val:`${field.city}، ${field.location}` },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className={`fas ${row.icon} text-slate-400 text-xs`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold">{row.label}</p>
                  <p className="text-sm font-black text-slate-800 truncate">{row.val || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact + performance */}
        <div className="space-y-4">
          {(field.phone || field.whatsapp || field.mapUrl) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2">
                <i className="fas fa-phone text-emerald-400" /> التواصل والموقع
              </h3>
              <div className="space-y-2">
                {field.phone && (
                  <a href={`tel:${field.phone}`}
                    className="flex items-center gap-2 text-sm text-slate-700 font-bold hover:text-emerald-600 transition-colors">
                    <i className="fas fa-phone text-slate-300 text-xs" /> {field.phone}
                  </a>
                )}
                {field.whatsapp && (
                  <a href={`https://wa.me/${field.whatsapp}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-slate-700 font-bold hover:text-emerald-600 transition-colors">
                    <i className="fab fa-whatsapp text-green-400 text-xs" /> {field.whatsapp}
                  </a>
                )}
                {field.mapUrl && (
                  <a href={field.mapUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 w-full mt-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-colors">
                    <i className="fas fa-map-marker-alt" /> عرض الموقع على خرائط جوجل
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Performance KPIs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2">
              <i className="fas fa-chart-pie text-blue-400" /> الأداء
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-500">معدل الإلغاء</span>
                  <span className={`font-black ${cancelRate > 30 ? 'text-red-500' : cancelRate > 10 ? 'text-amber-500' : 'text-emerald-600'}`}>{cancelRate}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cancelRate > 30 ? 'bg-red-400' : cancelRate > 10 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${cancelRate}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-500">ساعات التشغيل</span>
                  <span className="font-black text-slate-700">{openHours} ساعة/يوم</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min((openHours / 24) * 100, 100)}%` }} />
                </div>
              </div>
              {field.rating > 0 && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-500">التقييم</span>
                    <span className="font-black text-amber-500">{field.rating} / 5</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(field.rating / 5) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Amenities */}
      {field.amenities?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
            <i className="fas fa-concierge-bell text-violet-400" /> المرافق والخدمات
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {field.amenities.map(a => (
              <div key={a} className="flex items-center gap-2 bg-violet-50 rounded-xl px-3 py-2.5 border border-violet-100">
                <i className={`fas ${AMENITY_ICONS[a] || 'fa-check'} text-violet-500 text-sm flex-shrink-0`} />
                <span className="text-xs font-bold text-violet-700 truncate">{a}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {field.description && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <h3 className="font-black text-amber-800 text-sm mb-2 flex items-center gap-2">
            <i className="fas fa-align-right text-amber-400" /> الوصف
          </h3>
          <p className="text-sm text-amber-900 leading-relaxed">{field.description}</p>
        </div>
      )}

      {/* Recent bookings */}
      {fieldBookings.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <i className="fas fa-history text-slate-400" /> آخر الحجوزات
            </h3>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{fieldBookings.length} حجز</span>
          </div>
          <div className="divide-y divide-gray-50">
            {fieldBookings.slice(-5).reverse().map(b => (
              <div key={b.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  b.status === 'مؤكد' ? 'bg-emerald-400' : b.status === 'ملغي' ? 'bg-red-400' : 'bg-amber-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{b.playerName || 'لاعب'}</p>
                  <p className="text-xs text-slate-400">{b.date} · {b.timeSlot}</p>
                </div>
                <div className="text-end flex-shrink-0">
                  <p className="text-sm font-black text-emerald-600">{b.price} JD</p>
                  <p className={`text-[10px] font-bold ${b.status === 'مؤكد' ? 'text-emerald-500' : b.status === 'ملغي' ? 'text-red-400' : 'text-amber-500'}`}>{b.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const OwnerFields: React.FC = () => {
  const [fields,    setFields]    = useState<Field[]>([]);
  const [bookings,  setBookings]  = useState<Booking[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [mode,      setMode]      = useState<Mode>('list');
  const [viewField, setViewField] = useState<Field | null>(null);
  const [editTarget,setEditTarget]= useState<Field | null>(null);
  const [form,      setForm]      = useState<Partial<Field>>({ ...EMPTY_FORM });
  const [saving,    setSaving]    = useState(false);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  // If a save happened while the initial load was still in-flight,
  // skip overwriting fields — the optimistic state is already correct.
  const hasSaved = useRef(false);

  const load = useCallback(() => {
    backend.getMyFields().then(fs => {
      if (!hasSaved.current) setFields(fs);
      setLoading(false);
    });
    backend.getBookings().then(bs => setBookings(bs));
  }, []);

  useEffect(() => { load(); }, [load]);

  const setF = (k: keyof Field, v: any) => setForm(p => ({ ...p, [k]: v }));
  const toggleAmenity = (a: string) =>
    setF('amenities', form.amenities?.includes(a)
      ? form.amenities.filter(x => x !== a)
      : [...(form.amenities || []), a]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM }); setEditTarget(null); setError(''); setMode('create');
  };
  const openEdit = (f: Field) => {
    setViewField(f); setForm({ ...f }); setEditTarget(f); setError(''); setMode('edit');
  };
  const openDetail = (f: Field) => {
    setViewField(f); setMode('detail');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim())     { setError('أدخل اسم الملعب'); return; }
    if (!form.location?.trim()) { setError('أدخل موقع الملعب'); return; }
    if (!form.pricePerHour)     { setError('أدخل سعر الساعة');  return; }
    setSaving(true); setError('');
    const payload = { ...form, id: mode === 'edit' ? editTarget?.id : '' };
    const saved   = await backend.saveField(payload as Field);
    const realId  = saved?.id && String(saved.id).length > 4 ? saved.id : null;
    if (realId) {
      hasSaved.current = true;
      if (mode === 'create') {
        setFields(prev => [saved, ...prev]);
      } else {
        setFields(prev => prev.map(f => f.id === saved.id ? saved : f));
        setViewField(saved);
      }
      setSuccess(mode === 'create' ? 'تم إضافة الملعب بنجاح!' : 'تم تحديث الملعب بنجاح!');
      setMode(mode === 'edit' && viewField ? 'detail' : 'list');
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
      setMode('list'); setViewField(null);
      setSuccess('تم حذف الملعب.');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('فشل الحذف، حاول مجدداً.');
    }
    setDeleting(false);
  };

  /* ── Form ──────────────────────────────────────────────────────────────── */
  const renderForm = () => (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-bold mb-0.5">{mode === 'create' ? 'ملعب جديد' : 'تعديل الملعب'}</p>
          <h2 className="text-lg font-black">{form.name || 'اسم الملعب'}</h2>
        </div>
        <button type="button" onClick={() => setMode(viewField ? 'detail' : 'list')}
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
        {/* Basic */}
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-emerald-500 rounded-full" /> المعلومات الأساسية
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم الملعب <span className="text-red-500">*</span></label>
              <input value={form.name || ''} onChange={e => setF('name', e.target.value)} placeholder="مثال: ملعب النجوم"
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
              <input value={form.location || ''} onChange={e => setF('location', e.target.value)} placeholder="مثال: شارع المدينة المنورة"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">العنوان التفصيلي</label>
              <input value={form.address || ''} onChange={e => setF('address', e.target.value)} placeholder="العنوان الكامل"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 outline-none text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">الوصف</label>
              <textarea value={form.description || ''} onChange={e => setF('description', e.target.value)}
                rows={3} placeholder="وصف مختصر للملعب..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 outline-none text-sm resize-none" />
            </div>
          </div>
        </div>

        {/* Specs */}
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
                    className={`px-4 py-2 rounded-xl font-black text-sm border-2 transition-all ${form.type === t ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200 text-slate-600 bg-gray-50'}`}>{t}</button>
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
                <input value={form.phone || ''} onChange={e => setF('phone', e.target.value)} placeholder="07XXXXXXXX"
                  className="w-full ps-11 pe-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 outline-none text-sm" />
                <i className="fas fa-phone absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">واتساب</label>
              <div className="relative">
                <input value={form.whatsapp || ''} onChange={e => setF('whatsapp', e.target.value)} placeholder="07XXXXXXXX"
                  className="w-full ps-11 pe-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 outline-none text-sm" />
                <i className="fab fa-whatsapp absolute start-4 top-1/2 -translate-y-1/2 text-green-500 text-sm" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                رابط الموقع على خرائط جوجل
              </label>
              <div className="relative">
                <input
                  value={form.mapUrl || ''}
                  onChange={e => setF('mapUrl', e.target.value)}
                  placeholder="https://maps.google.com/..."
                  dir="ltr"
                  className="w-full ps-11 pe-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-400 outline-none text-sm font-mono" />
                <i className="fas fa-map-marker-alt absolute start-4 top-1/2 -translate-y-1/2 text-red-400 text-sm" />
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <i className="fab fa-google text-blue-400 text-[10px]" />
                افتح خرائط جوجل → ابحث عن ملعبك → انسخ الرابط من شريط العنوان أو كبسة "مشاركة"
              </p>
              {form.mapUrl && (
                <a href={form.mapUrl} target="_blank" rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-xs text-blue-600 font-bold hover:underline">
                  <i className="fas fa-external-link-alt text-[10px]" /> معاينة الرابط
                </a>
              )}
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
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  form.amenities?.includes(a) ? 'bg-violet-500 border-violet-500 text-white' : 'border-gray-200 text-slate-600 bg-gray-50 hover:border-violet-300'
                }`}>
                <i className={`fas ${AMENITY_ICONS[a] || 'fa-check'} text-xs`} /> {a}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</>
              : <><i className={`fas ${mode === 'create' ? 'fa-plus' : 'fa-save'}`} /> {mode === 'create' ? 'إضافة الملعب' : 'حفظ التعديلات'}</>}
          </button>
          <button type="button" onClick={() => { setMode(viewField ? 'detail' : 'list'); setError(''); }}
            className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold rounded-xl text-sm transition-colors">
            إلغاء
          </button>
        </div>
      </div>
    </form>
  );

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6" dir="rtl">

      {/* Header */}
      {mode === 'list' && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">إدارة الملاعب</p>
            <h1 className="text-2xl font-black text-slate-900">ملاعبي</h1>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-sm transition-all">
            <i className="fas fa-plus text-xs" /> إضافة ملعب
          </button>
        </div>
      )}

      {/* Toast */}
      {success && (
        <div className="flex gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-2xl items-center">
          <i className="fas fa-check-circle text-emerald-500 text-lg" /> {success}
        </div>
      )}

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

      {/* Content */}
      {mode === 'detail' && viewField && (() => {
        const idx = fields.findIndex(f => f.id === viewField.id);
        return (
          <FieldDetail
            field={viewField}
            bookings={bookings}
            onEdit={() => openEdit(viewField)}
            onDelete={() => setDeleteId(viewField.id)}
            onBack={() => { setMode('list'); setViewField(null); }}
            hasPrev={idx > 0}
            hasNext={idx < fields.length - 1}
            onPrev={() => idx > 0 && setViewField(fields[idx - 1])}
            onNext={() => idx < fields.length - 1 && setViewField(fields[idx + 1])}
          />
        );
      })()}

      {(mode === 'create' || mode === 'edit') && renderForm()}

      {mode === 'list' && (
        loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />)}
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
            {fields.map(f => {
              const fb = bookings.filter(b => b.fieldId === f.id);
              const rev = fb.filter(b => b.status !== 'ملغي').reduce((s, b) => s + (b.price || 0), 0);
              return (
                <button key={f.id} onClick={() => openDetail(f)}
                  className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden text-start group hover:-translate-y-0.5">
                  <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        {f.images?.[0]
                          ? <img src={f.images[0]} alt={f.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-3xl">🏟️</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-black text-slate-900 text-lg truncate group-hover:text-emerald-600 transition-colors">{f.name}</h3>
                          <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full">{f.type}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          {f.city && <span><i className="fas fa-map-marker-alt text-[9px] me-1" />{f.city}</span>}
                          <span><i className="fas fa-clock text-[9px] me-1" />{f.availableHours?.start}–{f.availableHours?.end}</span>
                          <span className="text-emerald-600 font-black">{f.pricePerHour} د.أ/ساعة</span>
                          {f.rating > 0 && <span><i className="fas fa-star text-amber-400 text-[9px] me-0.5" />{f.rating}</span>}
                        </div>
                        {fb.length > 0 && (
                          <div className="flex gap-3 mt-2 text-xs">
                            <span className="text-slate-500">{fb.length} حجز</span>
                            <span className="text-emerald-600 font-black">{rev} JD</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {f.mapUrl && (
                          <a href={f.mapUrl} target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            title="عرض على خرائط جوجل"
                            className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-500 flex items-center justify-center border border-blue-100 transition-colors flex-shrink-0">
                            <i className="fas fa-map-marker-alt text-sm" />
                          </a>
                        )}
                        <button onClick={e => { e.stopPropagation(); openEdit(f); }}
                          className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-500 flex items-center justify-center border border-blue-100 transition-colors">
                          <i className="fas fa-edit text-sm" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setDeleteId(f.id); }}
                          className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center border border-red-100 transition-colors">
                          <i className="fas fa-trash text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default OwnerFields;
