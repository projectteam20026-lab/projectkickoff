import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { createPaymentIntentAPI, confirmPaymentAPI } from '../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1e293b',
      fontFamily: 'system-ui, sans-serif',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#ef4444' },
  },
};

interface InnerFormProps {
  bookingId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function InnerForm({ bookingId, amount, onSuccess, onCancel }: InnerFormProps) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    try {
      const { clientSecret } = await createPaymentIntentAPI(bookingId, amount);

      const cardEl = elements.getElement(CardElement);
      if (!cardEl) throw new Error('Card element not found');

      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardEl },
      });

      if (stripeErr) {
        setError(stripeErr.message || 'فشل الدفع');
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        await confirmPaymentAPI(bookingId, paymentIntent.id);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'حدث خطأ أثناء الدفع');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-5" dir="rtl">
      <div className="flex items-center gap-2 mb-1">
        <i className="fas fa-credit-card text-emerald-500"></i>
        <span className="font-bold text-slate-700">بيانات البطاقة</span>
        <div className="mr-auto flex gap-1.5">
          <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-5" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="MC" className="h-5" />
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all" dir="ltr">
        <CardElement options={CARD_STYLE} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-bold p-3 rounded-xl flex items-center gap-2">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm text-emerald-700 flex items-center gap-2">
        <i className="fas fa-lock"></i>
        <span>مدفوعاتك مؤمّنة بتشفير SSL من Stripe</span>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-600 font-bold hover:bg-gray-50 transition-colors"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={loading || !stripe}
          className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <i className="fas fa-lock text-sm"></i>
              ادفع {amount} دينار
            </>
          )}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">
        للاختبار استخدم: <span dir="ltr" className="font-mono">4242 4242 4242 4242</span> — أي تاريخ مستقبلي — أي CVV
      </p>
    </form>
  );
}

interface PaymentFormProps {
  bookingId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentForm({ bookingId, amount, onSuccess, onCancel }: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <InnerForm bookingId={bookingId} amount={amount} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
