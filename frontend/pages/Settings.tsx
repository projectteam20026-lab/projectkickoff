
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { translations, translateRole } from '../utils/translations';

interface SettingsProps {
    user: User;
    onUpdateUser: (updatedUser: Partial<User>) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState('general');
    const { language, setLanguage } = useLanguage();
    const t = translations[language];

    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        phone: user.phone,
        language: language,
        notifications: {
            email: true,
            push: true,
            sms: false
        }
    });

    const handleSave = () => {
        onUpdateUser({ name: formData.name, email: formData.email, phone: formData.phone });
        setLanguage(formData.language as 'ar' | 'en');
        alert(language === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
    };

    const renderGeneral = () => (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
                    <i className="fas fa-user"></i>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{translateRole(user.role, language)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.form.fullName}</label>
                    <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.form.phone}</label>
                    <input 
                        type="text" 
                        value={formData.phone} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                        dir="ltr"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.form.email}</label>
                    <input 
                        type="email" 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                        dir="ltr"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.form.language}</label>
                    <select 
                        value={formData.language} 
                        onChange={(e) => setFormData({...formData, language: e.target.value as 'ar' | 'en'})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t.settings.notif.title}</h3>
            <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <i className="fas fa-envelope"></i>
                        </div>
                        <div>
                            <div className="font-bold text-gray-900">{t.settings.notif.email}</div>
                            <div className="text-xs text-gray-500">{t.settings.notif.emailDesc}</div>
                        </div>
                    </div>
                    <input 
                        type="checkbox" 
                        checked={formData.notifications.email} 
                        onChange={() => setFormData({...formData, notifications: {...formData.notifications, email: !formData.notifications.email}})}
                        className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500" 
                    />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                            <i className="fas fa-bell"></i>
                        </div>
                        <div>
                            <div className="font-bold text-gray-900">{t.settings.notif.push}</div>
                            <div className="text-xs text-gray-500">{t.settings.notif.pushDesc}</div>
                        </div>
                    </div>
                    <input 
                        type="checkbox" 
                        checked={formData.notifications.push} 
                        onChange={() => setFormData({...formData, notifications: {...formData.notifications, push: !formData.notifications.push}})}
                        className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500" 
                    />
                </label>
            </div>
        </div>
    );

    const renderSecurity = () => (
        <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t.settings.sec.title}</h3>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6">
                 <div className="flex gap-3">
                    <i className="fas fa-shield-alt text-yellow-600 mt-1"></i>
                    <div>
                        <h4 className="font-bold text-yellow-800 text-sm">{language === 'ar' ? 'تأمين الحساب' : 'Account Security'}</h4>
                        <p className="text-xs text-yellow-700 mt-1">{language === 'ar' ? 'ننصح بتفعيل المصادقة الثنائية لحماية حسابك من الوصول غير المصرح به.' : 'We recommend enabling two-factor authentication to protect your account.'}</p>
                    </div>
                 </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.sec.current}</label>
                <input type="password" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.sec.new}</label>
                    <input type="password" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="••••••••" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.sec.confirm}</label>
                    <input type="password" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="••••••••" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.settings.title}</h1>
            <p className="text-gray-500 mb-8">{t.settings.subtitle}</p>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <nav className="flex flex-col p-2">
                            {[
                                { id: 'general', label: t.settings.tabs.general, icon: 'user' },
                                { id: 'notifications', label: t.settings.tabs.notifications, icon: 'bell' },
                                { id: 'security', label: t.settings.tabs.security, icon: 'lock' },
                                ...(user.role === UserRole.OWNER ? [{ id: 'facility', label: t.settings.tabs.facility, icon: 'building' }] : []),
                                ...(user.role === UserRole.ADMIN ? [{ id: 'logs', label: t.settings.tabs.logs, icon: 'file-alt' }] : [])
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <i className={`fas fa-${item.icon} w-5 text-center`}></i>
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                    {activeTab === 'general' && renderGeneral()}
                    {activeTab === 'notifications' && renderNotifications()}
                    {activeTab === 'security' && renderSecurity()}
                    {activeTab === 'facility' && (
                        <div className="animate-fade-in-up text-center py-10">
                            <i className="fas fa-tools text-4xl text-gray-300 mb-4"></i>
                            <h3 className="font-bold text-gray-900">Facility Settings</h3>
                            <p className="text-gray-500 mt-2 text-sm">Manage working hours and pricing via the main dashboard.</p>
                        </div>
                    )}
                    {activeTab === 'logs' && (
                         <div className="animate-fade-in-up">
                            <h3 className="font-bold text-gray-900 mb-4">{t.settings.tabs.logs}</h3>
                            <div className="bg-gray-900 text-gray-300 p-4 rounded-xl text-xs font-mono h-64 overflow-y-auto" dir="ltr">
                                <div>[2024-05-20 14:30:01] INFO: User login success (ID: u1)</div>
                                <div>[2024-05-20 14:32:15] INFO: Booking created (ID: b992)</div>
                                <div>[2024-05-20 15:00:00] SYSTEM: Database backup completed</div>
                                <div>[2024-05-20 15:45:22] WARN: High latency detected in payment gateway</div>
                            </div>
                         </div>
                    )}

                    <div className="mt-8 pt-8 border-t border-gray-100 flex justify-end">
                        <button onClick={handleSave} className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all">
                            {t.settings.form.save}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
