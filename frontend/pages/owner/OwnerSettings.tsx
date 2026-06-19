import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { backend } from '../../services/backend';

const OwnerSettings: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name:      user?.name      || '',
    email:     user?.email     || '',
    phone:     user?.phone     || '',
    whatsapp:  user?.whatsapp  || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]       = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]       = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showPw, setShowPw]     = useState(false);

  const setP = (k: keyof typeof profileForm, v: string) => setProfileForm(p => ({ ...p, [k]: v }));
  const setPw = (k: keyof typeof pwForm, v: string)      => setPwForm(p => ({ ...p, [k]: v }));

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim())  { setProfileMsg({ type: 'err', text: 'الاسم مطلوب' }); return; }
    if (!profileForm.email.trim()) { setProfileMsg({ type: 'err', text: 'البريد الإلكتروني مطلوب' }); return; }
    setProfileSaving(true); setProfileMsg(null);
    const res = await backend.updateMeResult(profileForm);
    if (res.success) {
      updateUser(profileForm);
      setProfileMsg({ type: 'ok', text: 'تم حفظ المعلومات بنجاح ✅' });
    } else {
      setProfileMsg({ type: 'err', text: res.error || 'حدث خطأ، حاول مجدداً' });
    }
    setProfileSaving(false);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.currentPassword)   { setPwMsg({ type: 'err', text: 'أدخل كلمة المرور الحالية' }); return; }
    if (pwForm.newPassword.length < 6) { setPwMsg({ type: 'err', text: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg({ type: 'err', text: 'كلمتا المرور غير متطابقتين' }); return; }
    setPwSaving(true); setPwMsg(null);
    const res = await backend.updateMeResult({ password: pwForm.newPassword, currentPassword: pwForm.currentPassword } as any);
    if (res.success) {
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwMsg({ type: 'ok', text: 'تم تغيير كلمة المرور بنجاح ✅' });
    } else {
      setPwMsg({ type: 'err', text: res.error || 'كلمة المرور الحالية غير صحيحة' });
    }
    setPwSaving(false);
  };

  const Field = ({
    label, value, onChange, type = 'text', placeholder = '', icon,
  }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; icon?: string }) => (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        {icon && <i className={`fas ${icon} absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none`} />}
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? 'ps-11' : 'ps-4'} pe-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm`}
        />
      </div>
    </div>
  );

  const Msg = ({ msg }: { msg: { type: 'ok' | 'err'; text: string } | null }) => msg ? (
    <div className={`flex gap-2 items-center text-sm p-3.5 rounded-xl ${
      msg.type === 'ok'
        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        : 'bg-red-50 border border-red-100 text-red-600'
    }`}>
      <i className={`fas ${msg.type === 'ok' ? 'fa-check-circle text-emerald-500' : 'fa-exclamation-circle text-red-400'} flex-shrink-0`} />
      {msg.text}
    </div>
  ) : null;

  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">

      {/* Header */}
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">إعدادات الحساب</p>
        <h1 className="text-2xl font-black text-slate-900">الإعدادات</h1>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-5 text-white">
          <p className="text-slate-400 text-xs font-bold mb-0.5">تعديل الملف الشخصي</p>
          <h2 className="font-black text-lg">المعلومات الشخصية</h2>
        </div>
        <form onSubmit={handleProfileSave} className="p-6 space-y-4">
          <Msg msg={profileMsg} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="الاسم الكامل" value={profileForm.name}
              onChange={v => setP('name', v)} placeholder="اسمك" icon="fa-user" />
            <Field
              label="البريد الإلكتروني" value={profileForm.email}
              onChange={v => setP('email', v)} type="email" placeholder="name@example.com" icon="fa-envelope" />
            <Field
              label="رقم الهاتف" value={profileForm.phone}
              onChange={v => setP('phone', v)} placeholder="07XXXXXXXX" icon="fa-phone" />
            <Field
              label="واتساب" value={profileForm.whatsapp}
              onChange={v => setP('whatsapp', v)} placeholder="07XXXXXXXX" icon="fa-whatsapp" />
          </div>
          <button type="submit" disabled={profileSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-60">
            {profileSaving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</>
              : <><i className="fas fa-save" /> حفظ التغييرات</>
            }
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-5 text-white">
          <p className="text-slate-400 text-xs font-bold mb-0.5">الأمان</p>
          <h2 className="font-black text-lg">تغيير كلمة المرور</h2>
        </div>
        <form onSubmit={handlePasswordSave} className="p-6 space-y-4">
          <Msg msg={pwMsg} />
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">كلمة المرور الحالية</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.currentPassword} onChange={e => setPw('currentPassword', e.target.value)}
                placeholder="••••••••"
                className="w-full ps-4 pe-11 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm" />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-600 text-sm">
                <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">كلمة المرور الجديدة</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.newPassword} onChange={e => setPw('newPassword', e.target.value)}
                placeholder="6 أحرف على الأقل"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">تأكيد كلمة المرور</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.confirmPassword} onChange={e => setPw('confirmPassword', e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 outline-none text-sm ${
                  pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-100'
                }`} />
            </div>
          </div>
          {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
            <p className="text-xs text-red-500 font-bold flex items-center gap-1.5">
              <i className="fas fa-times-circle" /> كلمتا المرور غير متطابقتين
            </p>
          )}
          {pwForm.newPassword && pwForm.newPassword === pwForm.confirmPassword && (
            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
              <i className="fas fa-check-circle" /> كلمتا المرور متطابقتان
            </p>
          )}
          <button type="submit" disabled={pwSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60">
            {pwSaving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري التحديث...</>
              : <><i className="fas fa-lock" /> تحديث كلمة المرور</>
            }
          </button>
        </form>
      </div>

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
        <i className="fas fa-shield-alt text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-blue-800 mb-0.5">نصيحة أمان</p>
          <p className="text-xs text-blue-600">استخدم كلمة مرور قوية تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز لحماية حسابك.</p>
        </div>
      </div>
    </div>
  );
};

export default OwnerSettings;
