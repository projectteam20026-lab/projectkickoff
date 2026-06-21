'use strict';

const Booking = require('../models/Booking');

let stripe;
try {
  const Stripe = require('stripe');
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  }
} catch (e) {
  console.warn('[payment] Stripe not available:', e.message);
}

// POST /api/payments/create-intent
exports.createIntent = async (req, res) => {
  if (!stripe) return res.status(503).json({ success: false, error: 'خدمة الدفع غير متاحة' });
  try {
    const { bookingId, amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'مبلغ غير صالح' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert JD to fils
      currency: 'jod',
      metadata: { bookingId: bookingId || '' },
    });

    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: 'pending',
        paymentMethod: 'فيزا',
      });
    }

    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/payments/confirm
exports.confirmPayment = async (req, res) => {
  if (!stripe) return res.status(503).json({ success: false, error: 'خدمة الدفع غير متاحة' });
  try {
    const { bookingId, paymentIntentId } = req.body;

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== 'succeeded') {
      return res.status(400).json({ success: false, error: 'الدفع لم يكتمل بعد' });
    }

    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'paid' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
