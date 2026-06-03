
import React, { useState } from 'react';
import { User, UserRole, Booking, Team, Field } from '../types';
import TeamModal from '../components/TeamModal';
import FieldModal from '../components/FieldModal'; // Import new component
import { useLanguage } from '../contexts/LanguageContext';
import { translations, translateStatus } from '../utils/translations';
import { backend } from '../services/backend';

interface DashboardProps {
    user: User;
    bookings: Booking[];
    onCancelBooking: (id: string) => void;
    teams: Team[];
    onSaveTeam: (team: Team) => void;
    onDeleteTeam: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    user, 
    bookings, 
    onCancelBooking, 
    teams, 
    onSaveTeam, 
    onDeleteTeam 
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false); // Field Modal State
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const { language } = useLanguage();
    const t = translations[language];

    const handleEditTeam = (team: Team) => {
        setEditingTeam(team);
        setIsTeamModalOpen(true);
    };

    const handleCreateTeam = () => {
        setEditingTeam(null);
        setIsTeamModalOpen(true);
    };

    // Handle saving a field (for owners)
    const handleSaveField = async (field: Field) => {
        await backend.saveField({ ...field, ownerId: user.id });
        // In a real app we'd refresh list, but Explore page handles fetching. 
        // We could add a toast here.
        alert(language === 'ar' ? 'تم إضافة الملعب بنجاح' : 'Field added successfully');
    };

    const getTabLabel = (tab: string) => {
        if(tab === 'overview') return t.dashboard.tabs.overview;
        if(tab === 'bookings') return t.dashboard.tabs.bookings;
        if(tab === 'teams') return t.dashboard.tabs.teams;
        return tab;
    };

    // Stats Cards for Owner
    const renderStats = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 animate-fade-in-up">
            {[
                { label: t.dashboard.stats.revenue, val: '3,450', change: '+12%', icon: 'chart-line', color: 'emerald' },
                { label: t.dashboard.stats.activeBookings, val: bookings.filter(b => b.status === 'مؤكد').length, change: null, icon: 'calendar-check', color: 'blue' },
                { label: t.dashboard.stats.occupancy, val: '85%', change: '+5%', icon: 'percent', color: 'purple' }
            ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-soft flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${stat.color}-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500`}></div>
                    <div className="relative z-10">
                        <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</div>
                        <div className="text-3xl font-black text-slate-900">{stat.val} {i === 0 ? t.common.currency : ''}</div>
                    </div>
                    {stat.change && (
                        <div className="relative z-10 text-emerald-600 text-xs font-bold flex items-center gap-1 mt-auto">
                            <i className="fas fa-arrow-up"></i> {stat.change} <span className="text-gray-400 font-medium">vs last month</span>
                        </div>
                    )}
                    <i className={`fas fa-${stat.icon} absolute bottom-4 left-4 text-3xl text-${stat.color}-500 opacity-20`}></i>
                </div>
            ))}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg border-4 border-white">
                        <i className="fas fa-user"></i>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">
                            {t.dashboard.welcome.replace('{name}', user.name.split(' ')[0])}
                        </h1>
                        <p className="text-gray-500 mt-1 font-medium">{t.dashboard.subtitle} ({user.role})</p>
                    </div>
                </div>
                {user.role === UserRole.OWNER && (
                    <button 
                        onClick={() => setIsFieldModalOpen(true)}
                        className="px-5 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2"
                    >
                        <i className="fas fa-plus"></i> {t.dashboard.addField}
                    </button>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-1">
                {['overview', 'bookings', 'teams'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 rounded-t-xl text-sm font-bold transition-all relative top-1 ${activeTab === tab ? 'bg-white text-emerald-600 border border-gray-100 border-b-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                    >
                        {getTabLabel(tab)}
                    </button>
                ))}
            </div>

            {/* Content Content */}
            <div className="animate-fade-in">
                {activeTab === 'overview' && (
                    <>
                        {user.role === UserRole.OWNER && renderStats()}
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left: Recent Activity */}
                            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
                                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-slate-900">{t.dashboard.recentActivity}</h3>
                                    <button onClick={() => setActiveTab('bookings')} className="text-emerald-600 text-sm font-bold hover:underline">{t.common.viewAll}</button>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {bookings.length === 0 ? (
                                        <div className="p-10 text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                                <i className="far fa-calendar"></i>
                                            </div>
                                            <p className="text-gray-500 font-medium">{t.dashboard.noBookings}</p>
                                        </div>
                                    ) : (
                                        bookings.slice(0, 5).map(booking => (
                                            <div key={booking.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                                                        <i className="fas fa-calendar-day"></i>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">
                                                            {booking.fieldName}
                                                            <span className="text-[10px] text-gray-400 font-mono font-normal mx-2">#{booking.id}</span>
                                                        </h4>
                                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{booking.date}</span>
                                                            <span className="text-gray-400">•</span>
                                                            <span>{booking.timeSlot}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold mb-1 ${
                                                        booking.status === 'مؤكد' ? 'bg-green-100 text-green-700' : 
                                                        booking.status === 'ملغي' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {translateStatus(booking.status, language)}
                                                    </span>
                                                    <div className="text-sm font-black text-slate-700">{booking.price} {t.common.currency}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right: Quick Actions / Profile Summary */}
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg shadow-slate-900/20">
                                    <h3 className="font-bold text-lg mb-4">{t.dashboard.quickSummary}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                                            <div className="text-2xl font-black">{bookings.length}</div>
                                            <div className="text-xs text-slate-300 mt-1">{t.dashboard.bookingsCount}</div>
                                        </div>
                                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                                            <div className="text-2xl font-black">{teams.length}</div>
                                            <div className="text-xs text-slate-300 mt-1">{t.dashboard.teamsCount}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveTab('teams')} className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-bold transition-colors shadow-glow">
                                        {t.dashboard.manageTeams}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'teams' && (
                    <div>
                        <div className="flex justify-between items-center mb-8">
                             <div>
                                <h2 className="text-2xl font-bold text-slate-900">{t.dashboard.manageTeamsTitle}</h2>
                                <p className="text-sm text-gray-500">{t.dashboard.manageTeamsSubtitle}</p>
                             </div>
                             <button 
                                onClick={handleCreateTeam}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5"
                             >
                                <i className="fas fa-plus"></i> {t.dashboard.newTeam}
                             </button>
                        </div>
                        
                        {teams.length === 0 ? (
                            <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-300">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 text-3xl animate-pulse">
                                    <i className="fas fa-users"></i>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">{t.dashboard.noTeams}</h3>
                                <p className="text-gray-500 mt-2 max-w-sm mx-auto">{t.dashboard.noTeamsDesc}</p>
                                <button onClick={handleCreateTeam} className="mt-6 text-emerald-600 font-bold hover:underline">{t.dashboard.startNow}</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {teams.map(team => (
                                    <div key={team.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-card transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -mr-8 -mt-8 -z-0 transition-transform group-hover:scale-110"></div>
                                        
                                        <div className="relative z-10 flex justify-between items-start mb-6">
                                            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 p-1">
                                                <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-xl"/>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditTeam(team)} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"><i className="fas fa-pen text-xs"></i></button>
                                                <button onClick={() => onDeleteTeam(team.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"><i className="fas fa-trash text-xs"></i></button>
                                            </div>
                                        </div>

                                        <div className="relative z-10">
                                            <h3 className="font-bold text-xl text-slate-900 mb-1">{team.name}</h3>
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">{(team.players || []).length} {t.dashboard.players}</div>
                                            
                                            <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                                                <div className={`grid grid-cols-3 text-center ${language === 'ar' ? 'divide-x divide-gray-200 divide-x-reverse' : 'divide-x divide-gray-200'}`}>
                                                    <div>
                                                        <div className="text-xs text-gray-400">{t.dashboard.win}</div>
                                                        <div className="font-black text-emerald-600">{team.wins}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-400">{t.dashboard.draw}</div>
                                                        <div className="font-black text-gray-700">{team.draws}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-400">{t.dashboard.loss}</div>
                                                        <div className="font-black text-red-500">{team.losses}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button onClick={() => handleEditTeam(team)} className="w-full py-3 border-2 border-slate-100 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 rounded-xl font-bold text-sm transition-all">
                                                {t.dashboard.manageSquad}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                 {activeTab === 'bookings' && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
                        <div className="p-8 border-b border-gray-50">
                            <h2 className="font-bold text-xl text-slate-900">{t.dashboard.bookingHistory}</h2>
                        </div>
                        {bookings.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">{t.common.noData}</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-start">
                                    <thead className="bg-gray-50/50 text-gray-500 font-bold border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-start">{t.dashboard.table.field}</th>
                                            <th className="px-6 py-4 text-start">{t.dashboard.table.date}</th>
                                            <th className="px-6 py-4 text-start">{t.dashboard.table.time}</th>
                                            <th className="px-6 py-4 text-start">{t.dashboard.table.price}</th>
                                            <th className="px-6 py-4 text-start">{t.dashboard.table.status}</th>
                                            <th className="px-6 py-4 text-start"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {bookings.map(b => (
                                            <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-900">
                                                    {b.fieldName}
                                                    <div className="text-[10px] text-gray-400 font-mono font-normal mt-0.5">#{b.id}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{b.date}</td>
                                                <td className="px-6 py-4 text-slate-600 font-medium bg-gray-50 w-fit rounded-lg my-2 block text-center mx-6">{b.timeSlot}</td>
                                                <td className="px-6 py-4 text-emerald-600 font-black">{b.price} {t.common.currency}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${b.status === 'مؤكد' ? 'bg-green-100 text-green-700' : b.status === 'ملغي' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {translateStatus(b.status, language)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-end">
                                                    {b.status !== 'ملغي' && (
                                                        <button 
                                                            onClick={() => onCancelBooking(b.id)}
                                                            className="text-red-500 hover:text-white hover:bg-red-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-red-100"
                                                        >
                                                            {t.common.cancel}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isTeamModalOpen && (
                <TeamModal 
                    team={editingTeam}
                    onClose={() => setIsTeamModalOpen(false)}
                    onSave={onSaveTeam}
                />
            )}

            {isFieldModalOpen && (
                <FieldModal 
                    onClose={() => setIsFieldModalOpen(false)}
                    onSave={handleSaveField}
                />
            )}
        </div>
    );
};

export default Dashboard;
