/**
 * PlayerSettingsPage — /settings
 * صفحة الإعدادات الكاملة للاعب:
 *  🔔 الإشعارات     — تفعيل/إيقاف أنواع التنبيهات
 *  🌐 اللغة         — التبديل بين العربية والإنجليزية
 *  🔒 الأمان        — تغيير كلمة المرور
 *  🎨 المظهر        — (قادم قريباً)
 *  ⚠️ إدارة الحساب  — تسجيل الخروج / حذف الحساب
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { daysLeft, setLock } from '../utils/fieldLocks';

/* ── Toggle switch component ──────────────────────────────── */
const Toggle: React.FC<{ on: boolean; onChange: () => void }> = ({ on, onChange }) => (
  <button
    onClick={onChange}
    className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${on ? 'bg-emerald-500' : 'bg-gray-200'}`}
  >
    <span
      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${on ? 'end-1' : 'start-1'}`}
    />
  </button>
);

/* ── Section card wrapper ─────────────────────────────────── */
const Section: React.FC<{ icon: string; title: string; subtitle?: string; children: React.ReactNode; color?: string }> = ({
  icon, title, subtitle, children, color = 'text-emerald-600 bg-emerald-50'
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <i className={`fas ${icon} text-sm`} />
      </div>
      <div>
        <h2 className="font-black text-slate-900 text-sm">{title}</h2>
        {subtitle && <p className="text-slate-400 text-xs">{subtitle}</p>}
      </div>
    </div>
    <div className="divide-y divide-gray-50">{children}</div>
  </div>
);

/* ── Row with toggle ──────────────────────────────────────── */
const ToggleRow: React.FC<{ icon: string; iconBg: string; label: string; desc: string; on: boolean; onChange: () => void }> = ({
  icon, iconBg, label, desc, on, onChange
}) => (
  <div className="flex items-center gap-3 px-5 py-4">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <i className={`fas ${icon} text-sm`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-800">{label}</p>
      <p className="text-xs text-slate-400">{desc}</p>
    </div>
    <Toggle on={on} onChange={onChange} />
  </div>
);

const PlayerSettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  /* Notification toggles */
  const [notifs, setNotifs] = useState({
    bookingReminder: true,   // تذكير قبل ساعة من الحجز
    autoCancel:      true,   // إشعار الإلغاء التلقائي
    matchAlerts:     true,   // تنبيهات المباريات
    leagueUpdates:   false,  // أخبار البطولات
    promotions:      false,  // عروض وتخفيضات
  });

  /* Dark mode (coming soon placeholder) */
  const [darkMode] = useState(false);

  /* Password change form */
  const [pwForm, setPwForm]       = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwMsg, setPwMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showPw, setShowPw]       = useState(false);

  /* Confirm dialog state */
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!user) return null;

  const pwLockDays = daysLeft(user.id, 'password');

  const toggle = (key: keyof typeof notifs) =>
    setNotifs(p => ({ ...p, [key]: !p[key] }));

  const handlePwSave = async () => {
    if (pwLockDays > 0) {
      setPwMsg({ type: 'err', text: `لا يمكن تغيير كلمة المرور الآن، تبقى ${pwLockDays} ${pwLockDays === 1 ? 'يوم' : 'أيام'}` });
      return;
    }
    if (!pwForm.current) { setPwMsg({ type: 'err', text: 'أدخل كلمة المرور الحالية' }); return; }
    if (pwForm.next.length < 6) { setPwMsg({ type: 'err', text: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }); return; }
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ type: 'err', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقتان' }); return; }
    setPwSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setLock(user.id, 'password'); // قفل لمدة 7 أيام
    setPwSaving(false);
    setPwMsg({ type: 'ok', text: 'تم تغيير كلمة المرور بنجاح — متاح التغيير مجدداً بعد 7 أيام ✓' });
    setPwForm({ current: '', next: '', confirm: '' });
    setTimeout(() => setPwMsg(null), 4000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-10" dir="rtl">

      {/* ══ HEADER ════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <i className="fas fa-arrow-right text-sm" />
          </button>
          <div>
            <h1 className="font-black text-slate-900 text-lg leading-tight">الإعدادات</h1>
            <p className="text-slate-400 text-xs">{user.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ── 🔔 الإشعارات ────────────────────────────────────────────────── */}
        <Section icon="fa-bell" title="الإشعارات" subtitle="تحكم في التنبيهات التي تصلك"
          color="text-amber-600 bg-amber-50">
          <ToggleRow icon="fa-clock"          iconBg="bg-amber-50 text-amber-500"
            label="تذكير الحجز"       desc="تنبيه قبل ساعة من موعد الحجز"
            on={notifs.bookingReminder} onChange={() => toggle('bookingReminder')} />
          <ToggleRow icon="fa-calendar-times"  iconBg="bg-red-50 text-red-400"
            label="إشعار الإلغاء التلقائي" desc="عند إلغاء الحجز لعدم التأكيد"
            on={notifs.autoCancel}    onChange={() => toggle('autoCancel')} />
          <ToggleRow icon="fa-futbol"          iconBg="bg-blue-50 text-blue-500"
            label="تنبيهات المباريات"  desc="إشعار قبل مباراتك في البطولة"
            on={notifs.matchAlerts}   onChange={() => toggle('matchAlerts')} />
          <ToggleRow icon="fa-trophy"          iconBg="bg-purple-50 text-purple-500"
            label="أخبار البطولات"     desc="بطولات جديدة وتحديثات النتائج"
            on={notifs.leagueUpdates} onChange={() => toggle('leagueUpdates')} />
          <ToggleRow icon="fa-tag"             iconBg="bg-emerald-50 text-emerald-500"
            label="العروض والتخفيضات"  desc="احصل على أفضل الأسعار والعروض"
            on={notifs.promotions}    onChange={() => toggle('promotions')} />
        </Section>

        {/* ── 🌐 اللغة ────────────────────────────────────────────────────── */}
        <Section icon="fa-globe" title="اللغة" subtitle="لغة واجهة التطبيق"
          color="text-blue-600 bg-blue-50">
          <div className="px-5 py-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { code: 'ar', label: 'العربية', flag: '🇯🇴', sub: 'Arabic' },
                { code: 'en', label: 'English', flag: '🇺🇸', sub: 'الإنجليزية' },
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { if (language !== lang.code) toggleLanguage(); }}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${
                    language === lang.code
                      ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="text-start">
                    <p className={`text-sm font-bold ${language === lang.code ? 'text-emerald-700' : 'text-slate-700'}`}>{lang.label}</p>
                    <p className="text-xs text-slate-400">{lang.sub}</p>
                  </div>
                  {language === lang.code && (
                    <i className="fas fa-check-circle text-emerald-500 text-sm ms-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* ── 🔒 الأمان ───────────────────────────────────────────────────── */}
        <Section icon="fa-lock"
          title="الأمان والخصوصية"
          subtitle={pwLockDays > 0 ? `كلمة المرور مقفلة — تبقى ${pwLockDays} ${pwLockDays===1?'يوم':'أيام'}` : 'حافظ على أمان حسابك'}
          color="text-slate-600 bg-slate-100">
          <div className="px-5 py-4 space-y-3">
            {/* Warning */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2.5">
              <i className="fas fa-shield-alt text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-800">تأمين الحساب</p>
                <p className="text-[11px] text-amber-600 mt-0.5">استخدم كلمة مرور قوية تحتوي على أحرف وأرقام ورموز</p>
              </div>
            </div>

            {/* Password fields */}
            {[
              { key: 'current', label: 'كلمة المرور الحالية',  placeholder: '••••••••' },
              { key: 'next',    label: 'كلمة المرور الجديدة',  placeholder: '6 أحرف على الأقل' },
              { key: 'confirm', label: 'تأكيد كلمة المرور',     placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">{f.label}</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={(pwForm as any)[f.key]}
                    onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    dir="ltr"
                    className="w-full ps-11 pe-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
                  />
                  <i className="fas fa-key absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  {f.key === 'current' && (
                    <button onClick={() => setShowPw(!showPw)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Feedback */}
            {pwMsg && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
                pwMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                <i className={`fas ${pwMsg.type === 'ok' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-sm`} />
                {pwMsg.text}
              </div>
            )}

            {/* Lock badge */}
            {pwLockDays > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold">
                <i className="fas fa-lock text-sm" />
                تم تغيير كلمة المرور مؤخراً — متاح التغيير مجدداً بعد {pwLockDays} {pwLockDays === 1 ? 'يوم' : 'أيام'}
              </div>
            )}

            <button
              onClick={handlePwSave}
              disabled={pwSaving || pwLockDays > 0}
              className={`w-full py-2.5 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                pwLockDays > 0
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {pwSaving
                ? <><i className="fas fa-circle-notch fa-spin" /> جاري التغيير...</>
                : pwLockDays > 0
                ? <><i className="fas fa-lock" /> مقفل — بعد {pwLockDays} يوم</>
                : <><i className="fas fa-lock" /> تغيير كلمة المرور</>}
            </button>
          </div>
        </Section>

        {/* ── 🎨 المظهر ───────────────────────────────────────────────────── */}
        <Section icon="fa-palette" title="المظهر" subtitle="تخصيص شكل التطبيق"
          color="text-purple-600 bg-purple-50">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-800 text-slate-200">
              <i className="fas fa-moon text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">الوضع الليلي</p>
              <p className="text-xs text-slate-400">قادم قريباً — سيكون متاحاً في التحديث القادم</p>
            </div>
            <div className="relative w-12 h-6 rounded-full bg-gray-200 opacity-50 cursor-not-allowed">
              <span className="absolute top-1 start-1 w-4 h-4 bg-white rounded-full shadow" />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] text-gray-400 font-bold">قريباً</span>
            </div>
          </div>
        </Section>

        {/* ── ⚠️ إدارة الحساب ─────────────────────────────────────────────── */}
        <Section icon="fa-user-cog" title="إدارة الحساب"
          color="text-red-500 bg-red-50">
          {/* Logout */}
          <div className="px-5 py-4">
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="w-full flex items-center justify-center gap-2.5 py-3 border-2 border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900 font-bold rounded-xl text-sm transition-all"
            >
              <i className="fas fa-sign-out-alt text-sm" /> تسجيل الخروج
            </button>
          </div>

          {/* Delete account */}
          <div className="px-5 pb-4">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2.5 py-3 border-2 border-red-100 text-red-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 font-bold rounded-xl text-sm transition-all"
              >
                <i className="fas fa-trash-alt text-sm" /> حذف الحساب
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-red-700">
                  <i className="fas fa-exclamation-triangle" />
                  <p className="font-black text-sm">هل أنت متأكد؟</p>
                </div>
                <p className="text-xs text-red-600">سيتم حذف حسابك وجميع بياناتك نهائياً. هذا الإجراء لا يمكن التراجع عنه.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowDeleteConfirm(false)}
                    className="py-2.5 border border-gray-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors">
                    إلغاء
                  </button>
                  <button onClick={() => { logout(); navigate('/login'); }}
                    className="py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-colors">
                    <i className="fas fa-trash-alt me-1.5" /> حذف نهائياً
                  </button>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* App version */}
        <div className="text-center py-2">
          <p className="text-slate-300 text-xs">KickOff Jordan v1.0.0 · جميع الحقوق محفوظة © 2026</p>
        </div>

      </div>
    </div>
  );
};

export default PlayerSettingsPage;
