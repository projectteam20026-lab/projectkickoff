import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  getTournamentByTokenAPI,
  approveByTokenAPI,
  rejectByTokenAPI,
  updateStatusByTokenAPI,
  PublicManagedTournament,
} from '../services/api';

type Reg = PublicManagedTournament['pendingRegistrations'][number];
type TournStatus = 'التسجيل متاح' | 'جارية' | 'مكتملة';

const STATUS_OPTS: { value: TournStatus; label: string; color: string }[] = [
  { value: 'التسجيل متاح', label: 'التسجيل متاح', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'جارية',        label: 'جارية',         color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'مكتملة',       label: 'مكتملة',        color: 'bg-gray-100 text-gray-700 border-gray-300' },
];

const ManageTournament: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();

  const [t, setT]             = useState<PublicManagedTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations'>('registrations');
  const [actionId, setActionId]   = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [toast, setToast]   = useState('');
  const [copied, setCopied] = useState<'manage' | 'reg' | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getTournamentByTokenAPI(token);
    setLoading(false);
    if (res) setT(res);
    else setNotFound(true);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const copyLink = (type: 'manage' | 'reg') => {
    const link = type === 'manage'
      ? window.location.href
      : `${window.location.origin}/register-tournament/${t?.id}`;
    navigator.clipboard.writeText(link);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleApprove = async (regId: string) => {
    setActionId(regId);
    const res = await approveByTokenAPI(token, regId);
    setActionId(null);
    if (res.success) { showToast('تم قبول التسجيل ✅'); load(); }
    else showToast('فشل القبول');
  };

  const handleReject = async (regId: string) => {
    setActionId(regId);
    const res = await rejectByTokenAPI(token, regId);
    setActionId(null);
    if (res.success) { showToast('تم رفض التسجيل'); load(); }
    else showToast('فشل الرفض');
  };

  const handleStatus = async (s: TournStatus) => {
    setStatusBusy(true);
    const res = await updateStatusByTokenAPI(token, s);
    setStatusBusy(false);
    if (res.success) { showToast(`تم تغيير الحالة إلى "${s}"`); load(); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-bold">جاري تحميل لوحة الإدارة...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-lock text-red-400 text-2xl" />
        </div>
        <h2 className="font-black text-slate-900 text-xl mb-2">رابط غير صالح</h2>
        <p className="text-slate-500 text-sm">الرابط الذي أدخلته غير صحيح أو لم يعد متاحاً</p>
      </div>
    </div>
  );

  const regs       = t?.pendingRegistrations ?? [];
  const pending    = regs.filter(r => r.status === 'pending');
  const approved   = regs.filter(r => r.status === 'approved');
  const rejected   = regs.filter(r => r.status === 'rejected');
  const regLink    = `${window.location.origin}/register-tournament/${t?.id}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-16" dir="rtl">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm animate-bounce">
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 px-4 py-5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <i className="fas fa-trophy text-white text-lg" />
            </div>
            <div>
              <h1 className="font-black text-white text-lg leading-tight">{t?.name}</h1>
              <p className="text-slate-400 text-xs">لوحة إدارة البطولة</p>
            </div>
          </div>

          {/* Status badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {(() => {
              const cur = STATUS_OPTS.find(s => s.value === t?.status) ?? STATUS_OPTS[0];
              return (
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${cur.color}`}>
                  {cur.label}
                </span>
              );
            })()}
            <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-700 text-slate-300 border border-slate-600">
              {t?.format === 'cup' ? 'كأس' : 'دوري'} · {t?.fieldType}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-700 text-slate-300 border border-slate-600">
              {t?.maxTeams} فريق
            </span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2 flex-wrap">
          <button onClick={() => copyLink('reg')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all ${copied === 'reg' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}>
            <i className={`fas fa-${copied === 'reg' ? 'check' : 'link'}`} />
            {copied === 'reg' ? 'تم النسخ!' : 'نسخ رابط التسجيل'}
          </button>
          <button onClick={() => copyLink('manage')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all ${copied === 'manage' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}>
            <i className={`fas fa-${copied === 'manage' ? 'check' : 'key'}`} />
            {copied === 'manage' ? 'تم النسخ!' : 'نسخ رابط الإدارة'}
          </button>
          <a href={regLink} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border bg-gray-50 text-slate-600 border-gray-200 hover:bg-gray-100 transition-all">
            <i className="fas fa-external-link-alt" /> معاينة نموذج التسجيل
          </a>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="max-w-3xl mx-auto flex">
          {(['registrations', 'overview'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-sm font-black border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === tab ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              {tab === 'registrations'
                ? <><i className="fas fa-users" /> التسجيلات {pending.length > 0 && <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full">{pending.length}</span>}</>
                : <><i className="fas fa-cog" /> الإعدادات والمعلومات</>
              }
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {/* ── Registrations tab ─────────────────────────────────────────────── */}
        {activeTab === 'registrations' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'قيد الانتظار', count: pending.length,  icon: 'fa-clock',  bg: 'bg-amber-50',   ic: 'text-amber-500' },
                { label: 'مقبول',         count: approved.length, icon: 'fa-check',  bg: 'bg-emerald-50', ic: 'text-emerald-500' },
                { label: 'مرفوض',         count: rejected.length, icon: 'fa-times',  bg: 'bg-red-50',     ic: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
                  <i className={`fas ${s.icon} ${s.ic} text-lg mb-1`} />
                  <p className="font-black text-slate-900 text-xl">{s.count}</p>
                  <p className="text-xs text-slate-500 font-bold">{s.label}</p>
                </div>
              ))}
            </div>

            <button onClick={load}
              className="w-full py-2.5 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl text-sm font-black text-slate-600 flex items-center justify-center gap-2 transition-colors">
              <i className="fas fa-sync-alt" /> تحديث القائمة
            </button>

            {regs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <i className="fas fa-inbox text-gray-200 text-5xl mb-3" />
                <p className="text-slate-400 font-bold">لا توجد طلبات تسجيل بعد</p>
                <p className="text-slate-400 text-xs mt-1">شارك رابط التسجيل مع الفرق</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(['pending', 'approved', 'rejected'] as const).map(section => {
                  const sectionRegs = regs.filter(r => r.status === section);
                  if (sectionRegs.length === 0) return null;
                  const sectionLabel = section === 'pending' ? 'قيد الانتظار' : section === 'approved' ? 'مقبول' : 'مرفوض';
                  const sectionColor = section === 'pending' ? 'text-amber-600' : section === 'approved' ? 'text-emerald-600' : 'text-red-500';
                  return (
                    <div key={section}>
                      <h3 className={`text-xs font-black mb-2 ${sectionColor} flex items-center gap-1.5`}>
                        <span className={`inline-block w-2 h-2 rounded-full ${section === 'pending' ? 'bg-amber-400' : section === 'approved' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {sectionLabel} ({sectionRegs.length})
                      </h3>
                      {sectionRegs.map((reg: Reg) => (
                        <RegistrationCard
                          key={reg._id}
                          reg={reg}
                          busy={actionId === reg._id}
                          onApprove={() => handleApprove(reg._id)}
                          onReject={() => handleReject(reg._id)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Overview / Settings tab ────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Tournament details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                <i className="fas fa-info-circle text-emerald-500" /> تفاصيل البطولة
              </h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                {[
                  ['الاسم',       t?.name],
                  ['النوع',       t?.format === 'cup' ? 'كأس (خروج المغلوب)' : 'دوري'],
                  ['نوع الملعب',  t?.fieldType],
                  ['عدد الفرق',   `${t?.maxTeams} فريق`],
                  ['تاريخ البدء', t?.startDate],
                  ['تاريخ الانتهاء', t?.endDate || '—'],
                  ['رسوم المشاركة', t?.entryFee ? `${t.entryFee} JD` : 'مجاني'],
                  ['وقت المباريات', t?.preferredTime || '—'],
                ].map(([k, v]) => (
                  <React.Fragment key={k}>
                    <span className="text-slate-500 text-xs font-bold">{k}</span>
                    <span className="font-black text-slate-800 text-xs">{v || '—'}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Prizes */}
            {(t?.prize1 || t?.prize2 || t?.prize3) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2">
                  <i className="fas fa-medal text-amber-500" /> الجوائز
                </h3>
                <div className="space-y-2">
                  {[['🥇 الأول', t?.prize1], ['🥈 الثاني', t?.prize2], ['🥉 الثالث', t?.prize3]].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-sm bg-amber-50 rounded-xl px-3 py-2">
                      <span className="font-bold text-slate-600">{k}</span>
                      <span className="font-black text-amber-700">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Organizer info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2">
                <i className="fas fa-user-tie text-blue-500" /> بيانات المنظِّم
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <i className="fas fa-user text-blue-400 text-sm" />
                  </div>
                  <span className="font-black text-slate-800">{t?.organizerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <i className="fas fa-phone text-green-400 text-sm" />
                  </div>
                  <a href={`tel:${t?.organizerPhone}`} className="font-black text-slate-800 hover:text-blue-600" dir="ltr">
                    {t?.organizerPhone}
                  </a>
                </div>
                {t?.organizerEmail && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <i className="fas fa-envelope text-purple-400 text-sm" />
                    </div>
                    <a href={`mailto:${t.organizerEmail}`} className="font-black text-slate-800 hover:text-blue-600 text-sm" dir="ltr">
                      {t.organizerEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Status change */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2">
                <i className="fas fa-toggle-on text-slate-500" /> تغيير حالة البطولة
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTS.map(s => (
                  <button key={s.value} disabled={statusBusy || t?.status === s.value}
                    onClick={() => handleStatus(s.value)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-black border transition-all ${t?.status === s.value ? s.color + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-50 text-slate-500 border-gray-200 hover:border-gray-400 disabled:opacity-50'}`}>
                    {statusBusy && t?.status !== s.value ? <i className="fas fa-spinner fa-spin" /> : s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            {t?.notes && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-xs font-black text-blue-700 mb-1 flex items-center gap-1.5">
                  <i className="fas fa-sticky-note" /> ملاحظات
                </p>
                <p className="text-sm text-blue-800 font-bold leading-relaxed">{t.notes}</p>
              </div>
            )}

            {/* Save link reminder */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <i className="fas fa-exclamation-triangle text-amber-500 mt-0.5" />
                <div>
                  <p className="font-black text-amber-900 text-sm mb-1">تذكير: احفظ رابط الإدارة</p>
                  <p className="text-amber-700 text-xs mb-2">
                    هذا الرابط هو طريقتك الوحيدة للعودة إلى هذه الصفحة. لا يمكن استرجاعه لاحقاً.
                  </p>
                  <button onClick={() => copyLink('manage')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${copied === 'manage' ? 'bg-emerald-500 text-white' : 'bg-amber-400 hover:bg-amber-500 text-white'}`}>
                    <i className={`fas fa-${copied === 'manage' ? 'check' : 'copy'}`} />
                    {copied === 'manage' ? 'تم النسخ!' : 'نسخ رابط الإدارة'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Registration Card ──────────────────────────────────────────────────────────
const RegistrationCard: React.FC<{
  reg: Reg;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}> = ({ reg, busy, onApprove, onReject }) => {
  const [expanded, setExpanded] = useState(false);
  const statusColor = reg.status === 'approved'
    ? 'bg-emerald-100 text-emerald-700'
    : reg.status === 'rejected'
      ? 'bg-red-100 text-red-600'
      : 'bg-amber-100 text-amber-700';

  return (
    <div className={`bg-white rounded-2xl border ${reg.status === 'pending' ? 'border-amber-200' : 'border-gray-100'} shadow-sm overflow-hidden mb-3`}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(e => !e)}>
        <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center flex-shrink-0">
          <i className="fas fa-users text-white text-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 text-sm truncate">{reg.teamName}</p>
          {reg.captainName && <p className="text-xs text-slate-500 font-bold truncate">{reg.captainName}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${statusColor}`}>
            {reg.status === 'approved' ? 'مقبول' : reg.status === 'rejected' ? 'مرفوض' : 'معلّق'}
          </span>
          <i className={`fas fa-chevron-${expanded ? 'up' : 'down'} text-slate-300 text-xs`} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-y-2 text-xs">
            {[
              ['عدد اللاعبين', reg.playerCount ? `${reg.playerCount} لاعب` : null],
              ['تاريخ التقديم', reg.appliedAt ? new Date(reg.appliedAt).toLocaleDateString('ar-JO') : null],
            ].filter(([, v]) => v).map(([k, v]) => (
              <React.Fragment key={k as string}>
                <span className="text-slate-500 font-bold">{k}</span>
                <span className="font-black text-slate-700">{v}</span>
              </React.Fragment>
            ))}
          </div>

          {/* Contact info */}
          <div className="space-y-1.5">
            {reg.phone && (
              <a href={`tel:${reg.phone}`} className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl text-xs font-black text-green-700 hover:bg-green-100 transition-colors">
                <i className="fas fa-phone" /> {reg.phone}
              </a>
            )}
            {reg.email && (
              <a href={`mailto:${reg.email}`} className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl text-xs font-black text-blue-700 hover:bg-blue-100 transition-colors" dir="ltr">
                <i className="fas fa-envelope" /> {reg.email}
              </a>
            )}
          </div>

          {reg.note && (
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-xs text-slate-500 font-bold mb-0.5">ملاحظة:</p>
              <p className="text-xs text-slate-700 font-bold">{reg.note}</p>
            </div>
          )}

          {reg.status === 'pending' && (
            <div className="flex gap-2 pt-1">
              <button disabled={busy} onClick={onApprove}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                {busy ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <i className="fas fa-check" />}
                قبول
              </button>
              <button disabled={busy} onClick={onReject}
                className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-black text-xs rounded-xl border border-red-200 flex items-center justify-center gap-1.5 transition-colors">
                {busy ? <div className="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" /> : <i className="fas fa-times" />}
                رفض
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageTournament;
