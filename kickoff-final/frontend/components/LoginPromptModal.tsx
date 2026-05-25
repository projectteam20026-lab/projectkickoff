import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginPromptModalProps {
  message?: string;
  onClose: () => void;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  message = 'يجب تسجيل الدخول أولاً للقيام بهذه العملية. انضم إلى مجتمع كيك أوف واستمتع بتجربة رياضية متكاملة.',
  onClose,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-fade-in-up text-center"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <i className="fas fa-lock text-emerald-500 text-3xl"></i>
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-slate-900 mb-3">تسجيل الدخول مطلوب</h3>

        {/* Message */}
        <p className="text-gray-500 text-sm leading-relaxed mb-8">{message}</p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            <i className="fas fa-sign-in-alt"></i>
            تسجيل الدخول
          </button>
          <button
            onClick={() => navigate('/login', { state: { tab: 'register' } })}
            className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-user-plus"></i>
            إنشاء حساب مجاناً
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-slate-500 font-medium rounded-2xl hover:bg-gray-200 transition-colors text-sm"
          >
            ربما لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
