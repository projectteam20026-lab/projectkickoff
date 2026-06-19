import React, { useState, useEffect } from 'react';
import { UserRole, User } from '../types';
import { backend } from '../services/backend';

type View = 'login' | 'player-signup' | 'owner-signup';

const withDotCom = (v: string) => {
  if (!v.includes('@')) return v;
  const d = v.split('@')[1] ?? '';
  return d.includes('.') ? v : v + '.com';
};

interface LoginProps {
  onLogin: (email: string, role: UserRole, user?: User, token?: string) => void;
  onForgotPassword?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onForgotPassword }) => {
  const [view, setView]           = useState<View>('login');
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [showPass, setShowPass]   = useState(false);

  // login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass,  setLoginPass]  = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [failCount,  setFailCount]  = useState(0);
  const [lockUntil,  setLockUntil]  = useState<number|null>(null);

  // كشف الدور من الإيميل: إذا كان الجزء قبل @ يحتوي على "owner" → مالك ملعب
  const localPart     = loginEmail.split('@')[0].toLowerCase();
  const hasAt         = loginEmail.includes('@');
  const emailDetectedOwner = localPart.includes('owner');
  const detectedRole  = hasAt
    ? (emailDetectedOwner ? UserRole.OWNER : UserRole.PLAYER)
    : null;

  // player signup
  const [pl, setPl] = useState({ firstName:'', lastName:'', username:'', email:'', phone:'', pass:'', confirm:'' });

  // owner signup
  const [ow, setOw] = useState({ name:'', phone:'', email:'', pass:'', confirm:'' });

  useEffect(() => {
    const s = localStorage.getItem('remembered_email');
    if (s) { setLoginEmail(s); setRememberMe(true); }
  }, []);

  const goTo = (v: View) => {
    setAnimating(true);
    setTimeout(() => { setView(v); setError(''); setSuccess(''); setAnimating(false); }, 150);
  };

  const upOw = (k: string, v: string) => setOw(p => ({ ...p, [k]: v }));

  /* ── Login ─────────────────────────────────────────────────────────── */
  const doLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (lockUntil && Date.now() < lockUntil) {
      setError(`محاولات خاطئة. جرّب بعد ${Math.ceil((lockUntil-Date.now())/1000)} ثانية.`);
      return;
    }
    setError(''); setLoading(true);
    try {
      if (!loginEmail.trim() || !loginPass.trim()) throw new Error('يرجى ملء جميع الحقول');
      const r = await backend.authenticate(withDotCom(loginEmail), loginPass);
      if (r.success && r.user) {
        if (rememberMe) localStorage.setItem('remembered_email', loginEmail);
        else            localStorage.removeItem('remembered_email');
        onLogin(r.user.email, r.user.role, r.user, r.token);
      } else {
        const n = failCount+1; setFailCount(n);
        if (n >= 5) setLockUntil(Date.now()+30000);
        throw new Error('البريد أو كلمة المرور غير صحيحة');
      }
    } catch(err:any) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* ── Player signup ──────────────────────────────────────────────────── */
  const doPlayerSignup = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (!pl.firstName||!pl.lastName||!pl.username||!pl.email||!pl.pass||!pl.confirm) throw new Error('يرجى ملء الحقول الإلزامية');
      if (pl.pass.length<6) throw new Error('كلمة المرور 6 أحرف على الأقل');
      if (pl.pass!==pl.confirm) throw new Error('كلمتا المرور غير متطابقتين');
      const fullName = `${pl.firstName.trim()} ${pl.lastName.trim()}`;
      const r = await backend.register({ name:fullName, firstName:pl.firstName.trim(), lastName:pl.lastName.trim(), username:pl.username.trim(), email:withDotCom(pl.email), password:pl.pass, role:UserRole.PLAYER as string });
      if (r.success) { setSuccess('تم إنشاء حسابك! يمكنك الدخول الآن 🎉'); setTimeout(()=>goTo('login'),2000); }
      else throw new Error(r.error||'حدث خطأ');
    } catch(err:any) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* ── Owner signup ───────────────────────────────────────────────────── */
  const doOwnerSignup = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (!ow.name.trim()||!ow.email.trim()||!ow.pass||!ow.confirm) throw new Error('يرجى ملء الحقول الإلزامية');
      if (ow.pass.length<6) throw new Error('كلمة المرور 6 أحرف على الأقل');
      if (ow.pass!==ow.confirm) throw new Error('كلمتا المرور غير متطابقتين');
      const r = await backend.register({ name:ow.name.trim(), phone:ow.phone, email:withDotCom(ow.email), password:ow.pass, role:UserRole.OWNER as string });
      if (r.success && r.user && r.token) {
        setSuccess('تم إنشاء حساب المالك! جاري الدخول... 🎉');
        setTimeout(() => { onLogin(r.user!.email, r.user!.role, r.user, r.token); }, 1200);
      } else throw new Error(r.error||'حدث خطأ');
    } catch(err:any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const heroImg =
    view==='player-signup' ? 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80' :
    view==='owner-signup'  ? 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=900&q=80' :
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=900&q=80';

  const inputCls = 'w-full py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white outline-none transition-all';
  const inputOwnerCls = 'w-full py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 focus:bg-white outline-none transition-all';

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden flex-shrink-0">
        <img key={view} src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/60 to-slate-800/20" />
        <div className="relative z-10 p-12 flex flex-col justify-between h-full w-full text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <i className="fas fa-futbol text-white text-lg" />
            </div>
            <span className="text-2xl font-black tracking-tight">كيك أوف</span>
          </div>
          <div className="mb-6">
            <h2 className="text-5xl font-black leading-tight mb-4">
              {view==='owner-signup' ? <>ملعبك.<br /><span className="text-emerald-400">إدارتك. أرباحك.</span></> :
               view==='player-signup' ? <>العب. احجز.<br /><span className="text-emerald-400">تنافس.</span></> :
               <>ملعبك. بطولتك.<br /><span className="text-emerald-400">مجدك.</span></>}
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed max-w-sm">
              {view==='owner-signup'
                ? 'أضف ملعبك وأدر الحجوزات والبطولات من لوحة تحكم احترافية'
                : 'المنصة الرياضية الأولى للاعبين وأصحاب الملاعب في الأردن'}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-1.5 bg-emerald-500 rounded-full" />
            <div className="w-2 h-1.5 bg-white/20 rounded-full" />
            <div className="w-2 h-1.5 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>

      {/* ── Form ────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-7/12 xl:w-1/2 flex flex-col overflow-y-auto">
        <div className="lg:hidden flex items-center px-6 pt-6 pb-2">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center me-2">
            <i className="fas fa-futbol text-white text-sm" />
          </div>
          <span className="text-lg font-black text-slate-900">كيك أوف</span>
        </div>

        <div className={`flex-1 flex items-center justify-center p-6 lg:p-12 transition-opacity duration-150 ${animating?'opacity-0':'opacity-100'}`}>
          <div className="w-full max-w-md">

            {/* ══════════════ LOGIN ══════════════════════════════════════ */}
            {view==='login' && (
              <div>
                <h1 className="text-3xl font-black text-slate-900 mb-1">أهلاً بك</h1>
                <p className="text-slate-500 text-sm mb-8">سجّل دخولك لمتابعة حجوزاتك ومبارياتك</p>

                {error && <div className="flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3.5 rounded-xl mb-5"><i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0"/><span>{error}</span></div>}

                <form onSubmit={doLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
                    <div className="relative">
                      <input type="text" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="ادخل بريدك الإلكتروني" dir="ltr" disabled={loading||!!lockUntil}
                        className={`${inputCls} pl-11 pr-4 transition-all ${detectedRole===UserRole.OWNER?'border-slate-400 focus:ring-slate-500':detectedRole===UserRole.PLAYER?'border-emerald-300 focus:ring-emerald-500':''}`} />
                      <i className={`fas absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-colors ${detectedRole===UserRole.OWNER?'fa-store text-slate-500':detectedRole===UserRole.PLAYER?'fa-running text-emerald-500':'fa-envelope text-slate-400'}`} />
                    </div>

                    {/* شارة الدور المكتشف */}
                    <div className={`mt-2 overflow-hidden transition-all duration-300 ${detectedRole ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                      {detectedRole === UserRole.OWNER && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-xl w-fit">
                          <i className="fas fa-store text-slate-600 text-xs" />
                          <span className="text-xs font-black text-slate-700">دخول كـ مالك ملعب</span>
                          <span className="text-[10px] text-slate-400">· تأكد أن إيميلك يحتوي على <span dir="ltr" className="font-mono">owner</span></span>
                        </div>
                      )}
                      {detectedRole === UserRole.PLAYER && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl w-fit">
                          <i className="fas fa-running text-emerald-600 text-xs" />
                          <span className="text-xs font-black text-emerald-700">دخول كـ لاعب</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">كلمة المرور</label>
                    <div className="relative">
                      <input type={showPass?'text':'password'} value={loginPass} onChange={e=>setLoginPass(e.target.value)} placeholder="••••••••" dir="ltr" disabled={loading||!!lockUntil} className={`${inputCls} ps-11 pe-11`} />
                      <i className="fas fa-lock absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"><i className={`far ${showPass?'fa-eye-slash':'fa-eye'}`}/></button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer" onClick={()=>setRememberMe(!rememberMe)}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${rememberMe?'bg-emerald-500 border-emerald-500':'border-slate-300'}`}>{rememberMe&&<i className="fas fa-check text-white text-[9px]"/>}</div>
                      <span className="text-sm text-slate-600">تذكرني</span>
                    </label>
                    <button type="button" onClick={()=>onForgotPassword?.()} className="text-sm font-bold text-emerald-600 hover:underline">نسيت كلمة المرور؟</button>
                  </div>
                  <button type="submit" disabled={loading||!!lockUntil}
                    className={`w-full py-4 text-white font-black rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2
                      ${detectedRole===UserRole.OWNER
                        ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'
                        : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100'}`}>
                    {loading
                      ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>جاري الدخول...</span></>
                      : detectedRole===UserRole.OWNER
                        ? <><i className="fas fa-store"/><span>دخول لوحة المالك</span></>
                        : <><i className="fas fa-sign-in-alt"/><span>تسجيل الدخول</span></>}
                  </button>
                </form>

                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-slate-200"/>
                  <span className="text-xs text-slate-400 font-bold whitespace-nowrap">ليس لديك حساب؟</span>
                  <div className="flex-1 h-px bg-slate-200"/>
                </div>

                <div className="space-y-3">
                  <button onClick={()=>goTo('player-signup')} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform"><i className="fas fa-running"/></div>
                    <div className="flex-1 text-start">
                      <div className="font-black text-slate-900">سجّل كلاعب</div>
                      <div className="text-xs text-slate-500 mt-0.5">احجز ملاعب وانضم للبطولات مجاناً</div>
                    </div>
                    <i className="fas fa-chevron-left text-slate-300 group-hover:text-emerald-500 transition-colors"/>
                  </button>
                  <button onClick={()=>goTo('owner-signup')} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50/40 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform"><i className="fas fa-store"/></div>
                    <div className="flex-1 text-start">
                      <div className="font-black text-slate-900">سجّل كمالك ملعب</div>
                      <div className="text-xs text-slate-500 mt-0.5">أدر ملاعبك وحجوزاتك من لوحة تحكم احترافية</div>
                    </div>
                    <i className="fas fa-chevron-left text-slate-300 group-hover:text-slate-500 transition-colors"/>
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════ PLAYER SIGNUP ══════════════════════════════ */}
            {view==='player-signup' && (
              <div>
                <button onClick={()=>goTo('login')} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-bold mb-6 transition-colors"><i className="fas fa-arrow-right text-xs"/> رجوع</button>
                <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><i className="fas fa-running"/></div>
                  <div><div className="font-black text-sm text-emerald-800">إنشاء حساب لاعب</div><div className="text-xs text-emerald-600">احجز ملاعبك المفضلة وانضم للبطولات</div></div>
                </div>
                {error && <div className="flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3.5 rounded-xl mb-4"><i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0"/><span>{error}</span></div>}
                {success && <div className="flex gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm p-3.5 rounded-xl mb-4"><i className="fas fa-check-circle mt-0.5 flex-shrink-0"/><span>{success}</span></div>}
                <form onSubmit={doPlayerSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">الاسم الأول <span className="text-red-500">*</span></label>
                      <div className="relative"><input type="text" value={pl.firstName} onChange={e=>setPl(p=>({...p,firstName:e.target.value}))} placeholder="الاسم الأول" disabled={loading} className={`${inputCls} ps-10 pe-3`}/><i className="fas fa-user absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"/></div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">الاسم الأخير <span className="text-red-500">*</span></label>
                      <div className="relative"><input type="text" value={pl.lastName} onChange={e=>setPl(p=>({...p,lastName:e.target.value}))} placeholder="الاسم الأخير" disabled={loading} className={`${inputCls} ps-10 pe-3`}/><i className="fas fa-user absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"/></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم المستخدم <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type="text" value={pl.username} onChange={e=>setPl(p=>({...p,username:e.target.value.replace(/\s/g,'')}))} placeholder="مثال: ahmed_99" dir="ltr" disabled={loading} className={`${inputCls} pl-11 pr-4`}/>
                      <i className="fas fa-at absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"/>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 me-1">يُستخدم لتمييزك في المنصة (بدون مسافات)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">رقم الهاتف <span className="text-slate-400 font-normal text-xs">(اختياري)</span></label>
                    <div className="relative"><input type="tel" value={pl.phone} onChange={e=>setPl(p=>({...p,phone:e.target.value}))} placeholder="07X-XXX-XXXX" dir="ltr" disabled={loading} className={`${inputCls} pl-11 pr-4`}/><i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"/></div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">البريد الإلكتروني <span className="text-red-500">*</span></label>
                    <div className="relative"><input type="text" value={pl.email} onChange={e=>setPl(p=>({...p,email:e.target.value}))} placeholder="example@gmail.com" dir="ltr" disabled={loading} className={`${inputCls} pl-11 pr-4`}/><i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"/></div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">كلمة المرور <span className="text-red-500">*</span></label>
                    <div className="relative"><input type={showPass?'text':'password'} value={pl.pass} onChange={e=>setPl(p=>({...p,pass:e.target.value}))} placeholder="6 أحرف على الأقل" dir="ltr" disabled={loading} className={`${inputCls} ps-11 pe-11`}/><i className="fas fa-lock absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"/><button type="button" onClick={()=>setShowPass(!showPass)} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"><i className={`far ${showPass?'fa-eye-slash':'fa-eye'}`}/></button></div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">تأكيد كلمة المرور <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type={showPass?'text':'password'} value={pl.confirm} onChange={e=>setPl(p=>({...p,confirm:e.target.value}))} placeholder="••••••••" dir="ltr" disabled={loading} className={`${inputCls} ps-11 pe-4 ${pl.confirm&&pl.confirm!==pl.pass?'border-red-300 focus:ring-red-400':''}`}/>
                      <i className={`fas absolute start-4 top-1/2 -translate-y-1/2 text-sm ${pl.confirm&&pl.confirm!==pl.pass?'fa-times text-red-400':pl.confirm&&pl.confirm===pl.pass?'fa-check text-emerald-500':'fa-shield-alt text-slate-400'}`}/>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-100 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                    {loading?<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>جاري التسجيل...</span></>:<><i className="fas fa-running"/><span>إنشاء حساب لاعب</span></>}
                  </button>
                </form>
                <p className="mt-6 text-center text-sm text-slate-500">لديك حساب؟ <button onClick={()=>goTo('login')} className="text-emerald-600 font-bold hover:underline">سجّل الدخول</button></p>
              </div>
            )}

            {/* ══════════════ OWNER SIGNUP ═══════════════════════════════ */}
            {view==='owner-signup' && (
              <div>
                <button onClick={()=>goTo('login')} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-bold mb-6 transition-colors">
                  <i className="fas fa-arrow-right text-xs"/> رجوع
                </button>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center"><i className="fas fa-store"/></div>
                  <div>
                    <div className="font-black text-sm text-slate-800">إنشاء حساب مالك ملعب</div>
                    <div className="text-xs text-slate-500">ستُوجَّه إلى لوحة التحكم بعد التسجيل مباشرة</div>
                  </div>
                </div>

                {error   && <div className="flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3.5 rounded-xl mb-4"><i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0"/><span>{error}</span></div>}
                {success && <div className="flex gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm p-3.5 rounded-xl mb-4"><i className="fas fa-check-circle mt-0.5 flex-shrink-0"/><span>{success}</span></div>}

                <form onSubmit={doOwnerSignup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">الاسم الكامل <span className="text-red-500">*</span></label>
                    <div className="relative"><input type="text" value={ow.name} onChange={e=>upOw('name',e.target.value)} placeholder="اسمك الكامل" disabled={loading} className={`${inputOwnerCls} ps-11 pe-4`}/><i className="fas fa-user absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"/></div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">رقم الهاتف <span className="text-slate-400 font-normal text-xs">(اختياري)</span></label>
                    <div className="relative"><input type="tel" value={ow.phone} onChange={e=>upOw('phone',e.target.value)} placeholder="07X-XXX-XXXX" dir="ltr" disabled={loading} className={`${inputOwnerCls} pl-11 pr-4`}/><i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"/></div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">البريد الإلكتروني <span className="text-red-500">*</span></label>
                    <div className="relative"><input type="text" value={ow.email} onChange={e=>upOw('email',e.target.value)} placeholder="example@gmail.com" dir="ltr" disabled={loading} className={`${inputOwnerCls} pl-11 pr-4`}/><i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"/></div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">كلمة المرور <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type={showPass?'text':'password'} value={ow.pass} onChange={e=>upOw('pass',e.target.value)} placeholder="6 أحرف على الأقل" dir="ltr" disabled={loading} className={`${inputOwnerCls} ps-11 pe-11`}/>
                      <i className="fas fa-lock absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"/>
                      <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"><i className={`far ${showPass?'fa-eye-slash':'fa-eye'}`}/></button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">تأكيد كلمة المرور <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type={showPass?'text':'password'} value={ow.confirm} onChange={e=>upOw('confirm',e.target.value)} placeholder="••••••••" dir="ltr" disabled={loading} className={`${inputOwnerCls} ps-11 pe-4 ${ow.confirm&&ow.confirm!==ow.pass?'border-red-300':''}`}/>
                      <i className={`fas absolute start-4 top-1/2 -translate-y-1/2 text-sm ${ow.confirm&&ow.confirm!==ow.pass?'fa-times text-red-400':ow.confirm&&ow.confirm===ow.pass?'fa-check text-emerald-500':'fa-shield-alt text-slate-400'}`}/>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                    {loading
                      ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>جاري إنشاء الحساب...</span></>
                      : <><i className="fas fa-store"/><span>إنشاء حساب مالك ملعب</span></>}
                  </button>
                </form>
                <p className="mt-5 text-center text-sm text-slate-500">لديك حساب؟ <button onClick={()=>goTo('login')} className="text-emerald-600 font-bold hover:underline">سجّل الدخول</button></p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
