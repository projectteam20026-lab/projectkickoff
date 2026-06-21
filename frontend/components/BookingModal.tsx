
import React, { useState, useEffect } from 'react';
import { Field, User } from '../types';
import { backend } from '../services/backend';
import { getAvailableSlotsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import PaymentForm from './PaymentForm';

interface BookingModalProps {
    field: Field | null;
    user: User;
    onClose: () => void;
    onConfirm: (bookingDetails: any) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ field, user, onClose, onConfirm }) => {
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [error, setError] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [payNow, setPayNow] = useState(true);
    const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
    
    const { language } = useLanguage();
    const t = translations[language];

    const ALL_SLOTS = [
        "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00", 
        "19:00 - 20:00", "20:00 - 21:00", "21:00 - 22:00"
    ];

    // Fetch availability whenever field or date changes
    useEffect(() => {
        if (!field?.id || !selectedDate) return;
        setSlotsLoading(true);
        setSelectedSlot(null);
        getAvailableSlotsAPI(field.id, selectedDate).then(data => {
            setAvailableSlots(data.available);
            setBookedSlots(data.booked);
            setSlotsLoading(false);
        });
    }, [field?.id, selectedDate]);

    if (!field) return null;

    const handleConfirm = async () => {
        setIsLoading(true);
        setError('');

        const details = {
            fieldId: field.id,
            fieldName: field.name,
            date: selectedDate,
            timeSlot: selectedSlot,
            price: field.pricePerHour,
            status: 'مؤكد',
            userId: user.id,
            paymentMethod: payNow ? 'فيزا' : 'كاش',
            paymentStatus: payNow ? 'pending' : 'unpaid',
        };

        const result = await backend.createBooking(details as any);

        setIsLoading(false);
        if (result.success) {
            if (payNow && result.data?.id) {
                setCreatedBookingId(result.data.id);
                setStep(3); // payment step
            } else {
                setStep(4); // success step
                onConfirm(details);
            }
        } else {
            setError(result.error || 'حدث خطأ غير متوقع');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-white/20">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-6 flex justify-between items-center text-white">
                    <div>
                        <h3 className="font-bold text-xl">{t.modals.booking.title}</h3>
                        <p className="text-xs text-emerald-100 mt-1 opacity-90">{field.name}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                        <i className="fas fa-times text-sm"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">{t.modals.booking.selectDate}</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={selectedDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                                    />
                                    <i className={`fas fa-calendar absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}></i>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">
                                    {t.modals.booking.availableSlots}
                                    {slotsLoading && <i className="fas fa-spinner fa-spin mr-2 text-emerald-500 text-xs"></i>}
                                </label>
                                {slotsLoading ? (
                                    <div className="flex justify-center py-6">
                                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3" dir="ltr">
                                        {ALL_SLOTS.map(slot => {
                                            const isBooked = bookedSlots.includes(slot);
                                            const isSelected = selectedSlot === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    onClick={() => !isBooked && setSelectedSlot(slot)}
                                                    disabled={isBooked}
                                                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                                                        isBooked
                                                        ? 'border-red-100 bg-red-50 text-red-300 cursor-not-allowed line-through'
                                                        : isSelected
                                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30 scale-105'
                                                        : 'border-gray-200 text-gray-500 hover:border-emerald-300 hover:bg-emerald-50'
                                                    }`}
                                                >
                                                    {slot}
                                                    {isBooked && <span className="block text-[10px] mt-0.5">محجوز</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mt-4">
                                <span className="text-sm font-bold text-emerald-800">{t.modals.booking.total}</span>
                                <span className="text-2xl font-black text-emerald-600">{field.pricePerHour} <span className="text-xs">{t.common.currency}</span></span>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5" dir="rtl">
                            <h4 className="font-bold text-xl text-slate-900 text-center">{t.modals.booking.confirmTitle}</h4>
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t.modals.booking.stadium}</span>
                                    <span className="font-bold text-slate-900">{field.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t.modals.booking.time}</span>
                                    <span className="font-bold text-slate-900" dir="ltr">{selectedDate}, {selectedSlot}</span>
                                </div>
                                <div className="h-px bg-gray-200"></div>
                                <div className="flex justify-between text-lg font-bold">
                                    <span className="text-slate-900">{t.modals.booking.total}</span>
                                    <span className="text-emerald-600">{field.pricePerHour} {t.common.currency}</span>
                                </div>
                            </div>

                            {/* Payment method choice */}
                            <div>
                                <p className="text-sm font-bold text-slate-700 mb-3">طريقة الدفع</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPayNow(true)}
                                        className={`p-4 rounded-xl border-2 text-sm font-bold flex flex-col items-center gap-2 transition-all ${
                                            payNow
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        <i className={`fas fa-credit-card text-xl ${payNow ? 'text-emerald-500' : 'text-gray-400'}`}></i>
                                        <span>ادفع الآن</span>
                                        <span className="text-xs font-normal opacity-70">فيزا / ماستركارد</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPayNow(false)}
                                        className={`p-4 rounded-xl border-2 text-sm font-bold flex flex-col items-center gap-2 transition-all ${
                                            !payNow
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        <i className={`fas fa-money-bill text-xl ${!payNow ? 'text-blue-500' : 'text-gray-400'}`}></i>
                                        <span>ادفع لاحقاً</span>
                                        <span className="text-xs font-normal opacity-70">كاش عند الملعب</span>
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold flex items-center gap-2">
                                    <i className="fas fa-exclamation-circle"></i> {error}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && createdBookingId && (
                        <div dir="rtl">
                            <div className="flex items-center gap-2 mb-5">
                                <button onClick={() => setStep(2)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <i className="fas fa-arrow-right"></i>
                                </button>
                                <h4 className="font-bold text-lg text-slate-900">الدفع بالبطاقة</h4>
                                <div className="mr-auto bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100">
                                    {field.pricePerHour} دينار
                                </div>
                            </div>
                            <PaymentForm
                                bookingId={createdBookingId}
                                amount={field.pricePerHour}
                                onSuccess={() => { setStep(4); onConfirm({}); }}
                                onCancel={() => { setStep(4); onConfirm({}); }}
                            />
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center py-6">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 text-3xl animate-[bounce_1s_infinite]">
                                <i className="fas fa-check"></i>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">{t.modals.booking.successTitle}</h3>
                            <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                                {t.modals.booking.successDesc}
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full px-6 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors shadow-lg"
                            >
                                {t.modals.booking.homeBtn}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer — only shown on steps 1 and 2 */}
                {(step === 1 || step === 2) && (
                    <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        {step === 1 ? (
                            <>
                                <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">{t.common.cancel}</button>
                                <button
                                    disabled={!selectedSlot || slotsLoading}
                                    onClick={() => setStep(2)}
                                    className="px-8 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow"
                                >
                                    {t.modals.booking.continue}
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setStep(1)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">{t.common.edit}</button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className="px-8 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-glow flex items-center gap-2"
                                >
                                    {isLoading
                                        ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                        : payNow ? 'التالي — الدفع' : t.modals.booking.confirmBtn}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingModal;
