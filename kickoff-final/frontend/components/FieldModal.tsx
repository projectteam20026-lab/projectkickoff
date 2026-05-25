
import React, { useState } from 'react';
import { Field } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

interface FieldModalProps {
  field?: Field | null;
  onClose: () => void;
  onSave: (field: Field) => void;
}

const FieldModal: React.FC<FieldModalProps> = ({ field, onClose, onSave }) => {
  const { language } = useLanguage();
  const t = translations[language];

  const [formData, setFormData] = useState<Partial<Field>>(field || {
    name: '',
    location: '',
    pricePerHour: 30,
    type: '5v5',
    turfType: 'عشب صناعي',
    rating: 5.0,
    images: [''],
    amenities: [],
    description: ''
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.location) return;
    
    // تأكد من وجود صورة واحدة على الأقل، إذا كان الحقل فارغاً نضع صورة افتراضية
    const fieldImages = (formData.images && formData.images[0]) 
        ? formData.images 
        : ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80'];

    onSave({
        id: field?.id || `f_${Date.now()}`,
        name: formData.name!,
        location: formData.location!,
        pricePerHour: Number(formData.pricePerHour),
        type: formData.type as any,
        turfType: formData.turfType as any,
        rating: formData.rating || 5,
        images: fieldImages,
        amenities: formData.amenities?.length ? formData.amenities : ['مواقف', 'إضاءة'],
        description: formData.description || 'ملعب ممتاز جاهز للحجز'
    });
    onClose();
  };

  const handleImageChange = (val: string) => {
    setFormData({ ...formData, images: [val] });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-slate-900">
            {language === 'ar' ? (field ? 'تعديل بيانات الملعب' : 'إضافة ملعب جديد') : (field ? 'Edit Field' : 'Add New Field')}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* عرض مسبق للصورة */}
            <div className="w-full h-32 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 mb-2">
                <img 
                    src={formData.images?.[0] || 'https://via.placeholder.com/400x200?text=No+Image'} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80')}
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{language === 'ar' ? 'رابط صورة الملعب' : 'Field Image URL'}</label>
                <input 
                    type="text"
                    value={formData.images?.[0] || ''} 
                    onChange={e => handleImageChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    placeholder="prinhashem-stad.jpg"
                    dir="ltr"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{language === 'ar' ? 'اسم الملعب' : 'Field Name'}</label>
                <input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{language === 'ar' ? 'الموقع' : 'Location'}</label>
                <input 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
            </div>
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">{language === 'ar' ? 'السعر/ساعة' : 'Price/Hour'}</label>
                    <input 
                        type="number"
                        value={formData.pricePerHour} 
                        onChange={e => setFormData({...formData, pricePerHour: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">{language === 'ar' ? 'النوع' : 'Type'}</label>
                    <select 
                        value={formData.type} 
                        onChange={e => setFormData({...formData, type: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    >
                        <option value="5v5">5v5</option>
                        <option value="6v6">6v6</option>
                        <option value="7v7">7v7</option>
                    </select>
                </div>
            </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{language === 'ar' ? 'الأرضية' : 'Turf Type'}</label>
                <select 
                    value={formData.turfType} 
                    onChange={e => setFormData({...formData, turfType: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                >
                    <option value="عشب صناعي">{translations[language].explore.turfTypes.artificial}</option>
                    <option value="عشب طبيعي">{translations[language].explore.turfTypes.natural}</option>
                    <option value="هجين">{translations[language].explore.turfTypes.hybrid}</option>
                </select>
            </div>
        </div>

        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">{t.common.cancel}</button>
          <button onClick={handleSubmit} className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg transition-all">
            {t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldModal;
