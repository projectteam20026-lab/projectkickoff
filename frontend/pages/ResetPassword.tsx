import React, { useState } from 'react';
import { resetPasswordAPI } from '../services/api';

interface Props { token: string; onSuccess: () => void; }

const ResetPassword: React.FC<Props> = ({ token, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    if (password !== confirm) return setError('كلمتا المرور غير متطابقتين');
    setLoading(true);
    const result = await resetPasswordAPI(token, password);
    setLoading(false);
    if (result.success) { setDone(true); setTimeout(onSuccess, 2500); }
    else { setError(result.error || 'الرابط غير صالح أو انتهت صلاحيته'); }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColor = ['bg-gray-200', 'bg-red-400', 'bg-yellow-400', 'bg-green-500'][strength];
  const strengthLabel = ['', 'ضعيفة', 'متوسطة', 'قوية'][strength];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <i className="fas fa-key text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">إعادة تعيين كلمة المرور</h1>
          <p className="text-slate-500 text-sm mt-2">اختر كلمة مرور جديدة وقوية لحسابك</p>
        </div>

        {done ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-green-600 text-2xl"></i>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">تم التغيير بنجاح!</h2>
            <p className="text-slate-500 text-sm">جاري تحويلك لصفحة تسجيل الدخول...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 pr-12 transition-all"
                />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <i className={`fas ${show ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? strengthColor : 'bg-gray-200'} transition-colors`}></div>)}
                  </div>
                  <p className="text-xs text-slate-500">قوة كلمة المرور: <span className="font-bold">{strengthLabel}</span></p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">تأكيد كلمة المرور</label>
              <input
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${confirm && confirm !== password ? 'border-red-300 focus:border-red-400 focus:ring-red-50' : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-50'}`}
              />
              {confirm && confirm !== password && <p className="text-xs text-red-500 mt-1">كلمتا المرور غير متطابقتين</p>}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl font-medium border border-red-100">
                <i className="fas fa-exclamation-circle ml-2"></i>{error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-bold hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-2"
            >
              {loading ? <><i className="fas fa-spinner fa-spin ml-2"></i>جاري التحديث...</> : 'تعيين كلمة المرور الجديدة'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
