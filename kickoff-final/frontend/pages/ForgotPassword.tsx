import React, { useState } from 'react';
import { forgotPasswordAPI } from '../services/api';

interface Props { onBack: () => void; }

const ForgotPassword: React.FC<Props> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const result = await forgotPasswordAPI(email);
    setLoading(false);
    if (result.success) { setSent(true); }
    else { setError(result.error || 'حدث خطأ'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <i className="fas fa-lock text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">نسيت كلمة المرور؟</h1>
          <p className="text-slate-500 text-sm mt-2">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-green-600 text-2xl"></i>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">تم الإرسال!</h2>
            <p className="text-slate-500 text-sm mb-6">تحقق من بريدك الإلكتروني — الرابط صالح لمدة 10 دقائق فقط.</p>
            <button onClick={onBack} className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-bold hover:bg-emerald-600 transition-colors">
              العودة لتسجيل الدخول
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl font-medium border border-red-100">
                <i className="fas fa-exclamation-circle ml-2"></i>{error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-bold hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <><i className="fas fa-spinner fa-spin ml-2"></i>جاري الإرسال...</> : 'إرسال رابط الاسترداد'}
            </button>

            <button type="button" onClick={onBack} className="w-full text-slate-500 hover:text-slate-700 text-sm py-2 transition-colors">
              <i className="fas fa-arrow-right ml-2"></i>العودة لتسجيل الدخول
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
