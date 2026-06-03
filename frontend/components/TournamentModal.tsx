
import React, { useState } from 'react';
import { League } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

interface TournamentModalProps {
  onClose: () => void;
  onSave: (league: League) => void;
}

const TournamentModal: React.FC<TournamentModalProps> = ({ onClose, onSave }) => {
  const { language } = useLanguage();
  const t = translations[language];

  const [formData, setFormData] = useState<Partial<League>>({
    name: '',
    sport: 'كرة قدم',
    startDate: new Date().toISOString().split('T')[0],
    prizePool: '500 دينار',
    maxTeams: 8
  });

  const handleSubmit = () => {
    if (!formData.name) return;
    onSave({
        id: '',
        name: formData.name,
        sport: formData.sport || 'كرة قدم',
        status: 'التسجيل متاح',
        teamsCount: 0,
        maxTeams: Number(formData.maxTeams),
        startDate: formData.startDate || '',
        prizePool: formData.prizePool || '',
        registeredTeams: [],
        matchesGenerated: false
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-slate-900">إنشاء بطولة جديدة</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-6 space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">اسم البطولة</label>
                <input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="مثال: دوري رمضان 2024"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">الرياضة</label>
                <select 
                    value={formData.sport} 
                    onChange={e => setFormData({...formData, sport: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                    <option value="كرة قدم">كرة قدم</option>
                    <option value="كرة سلة">كرة سلة</option>
                </select>
            </div>
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">عدد الفرق</label>
                    <input 
                        type="number"
                        value={formData.maxTeams} 
                        onChange={e => setFormData({...formData, maxTeams: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">تاريخ البدء</label>
                    <input 
                        type="date"
                        value={formData.startDate} 
                        onChange={e => setFormData({...formData, startDate: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
            </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">الجوائز</label>
                <input 
                    value={formData.prizePool} 
                    onChange={e => setFormData({...formData, prizePool: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
            </div>
        </div>

        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">{t.common.cancel}</button>
          <button onClick={handleSubmit} className="px-8 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg transition-all">
            {t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TournamentModal;
