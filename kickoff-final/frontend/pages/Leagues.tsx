
import React, { useState, useEffect } from 'react';
import { backend } from '../services/backend';
import { League, Team, Match, UserRole } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { translations, translateStatus } from '../utils/translations';
import TournamentModal from '../components/TournamentModal';
import LoginPromptModal from '../components/LoginPromptModal';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Leagues: React.FC = () => {
    const [leagues, setLeagues] = useState<League[]>([]);
    const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [activeTab, setActiveTab] = useState<'standings' | 'fixtures' | 'stats'>('standings');
    const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [loginPromptMessage, setLoginPromptMessage] = useState('');

    const { user } = useAuth();
    const userRole = (user?.role as UserRole) || UserRole.PLAYER;
    const navigate = useNavigate();

    const requireAuth = (message: string, action: () => void) => {
        if (!user) {
            setLoginPromptMessage(message);
            setShowLoginPrompt(true);
            return;
        }
        action();
    };

    const { language } = useLanguage();
    const t = translations[language];

    const refreshLeagues = () => {
        backend.getLeagues().then(setLeagues);
    };

    useEffect(() => {
        refreshLeagues();
        backend.getUserTeams('all').then(setTeams);
    }, []);

    useEffect(() => {
        if(selectedLeague) {
            backend.getMatches(selectedLeague.id).then(setMatches);
        }
    }, [selectedLeague]);

    const handleCreateLeague = async (league: League) => {
        await backend.saveLeague(league);
        refreshLeagues();
    };

    if (!selectedLeague) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900">{t.leagues.title}</h1>
                        <p className="text-gray-500 mt-2 text-lg">{t.leagues.subtitle}</p>
                    </div>
                    <div className="flex gap-4">
                        {userRole !== UserRole.PLAYER && (
                            <button
                                onClick={() => requireAuth('سجّل الدخول لإنشاء بطولة وإدارة الفرق المشاركة.', () => setIsTournamentModalOpen(true))}
                                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all"
                            >
                                <i className="fas fa-plus mx-2"></i> إنشاء بطولة
                            </button>
                        )}
                        <button
                            onClick={() => requireAuth('سجّل الدخول لتسجيل فريقك والمنافسة في البطولات.', () => navigate('/teams'))}
                            className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-bold shadow-glow hover:bg-emerald-400 transition-all hover:-translate-y-1"
                        >
                            <i className="fas fa-users mx-2"></i> {t.leagues.registerTeam}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {leagues.map(league => (
                        <div key={league.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-card hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full" onClick={() => setSelectedLeague(league)}>
                            <div className="h-40 bg-slate-900 relative p-8 flex flex-col justify-between overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                
                                <div className="flex justify-between items-start relative z-10">
                                    <span className="px-3 py-1 bg-white/10 backdrop-blur text-white text-xs rounded-lg font-bold border border-white/10">{league.sport}</span>
                                    <span className={`px-3 py-1 text-xs rounded-lg font-bold ${league.status === 'جارية' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-amber-400 text-amber-900'}`}>
                                        {league.status === 'جارية' ? `● ${t.leagues.live}` : translateStatus(league.status, language)}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-white relative z-10 group-hover:text-emerald-400 transition-colors">{league.name}</h3>
                            </div>
                            
                            <div className="p-8 flex-1 flex flex-col justify-between">
                                <div className="grid grid-cols-3 gap-4 mb-6 border-b border-gray-50 pb-6">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-400 font-bold uppercase mb-1">{t.leagues.prizes}</div>
                                        <div className="font-black text-emerald-600">{league.prizePool}</div>
                                    </div>
                                    <div className="text-center border-r border-gray-100">
                                        <div className="text-xs text-gray-400 font-bold uppercase mb-1">{t.leagues.teams}</div>
                                        <div className="font-black text-slate-800">{league.teamsCount}/{league.maxTeams || 8}</div>
                                    </div>
                                    <div className="text-center border-r border-gray-100">
                                        <div className="text-xs text-gray-400 font-bold uppercase mb-1">{t.leagues.start}</div>
                                        <div className="font-bold text-slate-800 text-sm">{league.startDate}</div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                                        <span>{t.leagues.progress}</span>
                                        <span>65%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{width: '65%'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isTournamentModalOpen && (
                    <TournamentModal
                        onClose={() => setIsTournamentModalOpen(false)}
                        onSave={handleCreateLeague}
                    />
                )}

                {showLoginPrompt && (
                    <LoginPromptModal
                        message={loginPromptMessage}
                        onClose={() => setShowLoginPrompt(false)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
            <button onClick={() => setSelectedLeague(null)} className="mb-8 text-gray-400 hover:text-emerald-600 flex items-center gap-2 font-bold text-sm transition-colors">
                <i className={`fas ${language === 'ar' ? 'fa-arrow-right' : 'fa-arrow-left'}`}></i> {t.leagues.backToList}
            </button>

            {/* Header */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-soft mb-8 relative overflow-hidden">
                <div className="absolute -left-10 -top-10 w-64 h-64 bg-emerald-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-slate-900/20">
                            {selectedLeague.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">{selectedLeague.name}</h1>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm font-medium text-gray-500">
                                <span className="flex items-center gap-2"><i className="fas fa-calendar-alt text-emerald-500"></i> {t.leagues.started.replace('{date}', selectedLeague.startDate)}</span>
                                <span className="flex items-center gap-2"><i className="fas fa-trophy text-amber-500"></i> {selectedLeague.prizePool}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-6 py-2.5 bg-gray-50 text-slate-600 font-bold rounded-xl hover:bg-gray-100 border border-gray-200">{t.leagues.share}</button>
                        <button className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 shadow-glow">{t.leagues.follow}</button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-soft min-h-[500px]">
                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6 pt-6 gap-6">
                    {[
                        {id: 'standings', label: t.leagues.tabs.standings}, 
                        {id: 'fixtures', label: t.leagues.tabs.fixtures}, 
                        {id: 'stats', label: t.leagues.tabs.stats}
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-4 px-2 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400 hover:text-slate-600'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-0">
                    {activeTab === 'standings' && (
                        <div className="overflow-x-auto">
                             <table className="w-full text-sm text-start">
                                <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className={`px-8 py-4 text-start ${language === 'ar' ? 'rounded-tr-xl' : 'rounded-tl-xl'}`}>{t.leagues.table.rank}</th>
                                        <th className="px-8 py-4 text-start">{t.leagues.table.team}</th>
                                        <th className="px-8 py-4 text-center">{t.leagues.table.played}</th>
                                        <th className="px-8 py-4 text-center">{t.leagues.table.won}</th>
                                        <th className="px-8 py-4 text-center">{t.leagues.table.drawn}</th>
                                        <th className="px-8 py-4 text-center">{t.leagues.table.lost}</th>
                                        <th className="px-8 py-4 text-center">{t.leagues.table.points}</th>
                                        <th className={`px-8 py-4 text-start ${language === 'ar' ? 'rounded-tl-xl' : 'rounded-tr-xl'}`}>{t.leagues.table.form}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {teams.slice(0, 8).map((team, idx) => (
                                        <tr key={team.id} className={`hover:bg-slate-50/50 transition-colors ${idx < 3 ? 'bg-emerald-50/10' : ''}`}>
                                            <td className="px-8 py-5 font-bold text-gray-400 flex items-center gap-2">
                                                {idx + 1}
                                                {idx === 0 && <i className="fas fa-crown text-amber-400"></i>}
                                            </td>
                                            <td className="px-8 py-5 font-bold text-slate-900">
                                                <div className="flex items-center gap-4">
                                                    <img src={team.logo} className="w-8 h-8 rounded-lg object-contain bg-white shadow-sm border border-gray-100" alt=""/>
                                                    {team.name}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center text-slate-600 font-medium">{team.wins + team.losses + team.draws}</td>
                                            <td className="px-8 py-5 text-center text-emerald-600 font-bold">{team.wins}</td>
                                            <td className="px-8 py-5 text-center text-slate-400">{team.draws}</td>
                                            <td className="px-8 py-5 text-center text-red-500">{team.losses}</td>
                                            <td className="px-8 py-5 text-center font-black text-slate-900 text-lg">{team.points}</td>
                                            <td className="px-8 py-5">
                                                <div className="flex gap-1.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < 3 ? 'bg-emerald-500' : i === 3 ? 'bg-gray-300' : 'bg-red-400'}`}></div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'fixtures' && (
                        <div className="divide-y divide-gray-50">
                            {matches.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">{t.common.loading}</div>
                            ) : (
                                matches.map(match => (
                                    <div key={match.id} className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between hover:bg-slate-50 transition-colors group">
                                        <div className="text-sm font-bold text-gray-400 mb-4 md:mb-0 w-32 flex flex-col">
                                            <span>{match.date.split(' ')[0]}</span>
                                            <span className="text-xs font-normal opacity-70">{match.date.split(' ')[1]}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-6 md:gap-12 flex-1 justify-center">
                                            <div className="flex items-center gap-4 w-40 justify-end">
                                                <span className={`text-lg font-bold ${match.homeScore !== null && match.homeScore > (match.awayScore || 0) ? 'text-slate-900' : 'text-slate-500'}`}>{match.homeTeam}</span>
                                                <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
                                            </div>
                                            
                                            <div className="bg-slate-900 text-white px-5 py-2 rounded-xl text-lg font-black min-w-[100px] text-center shadow-lg shadow-slate-900/20 tracking-widest" dir="ltr">
                                                {match.status === 'مجدولة' ? 'VS' : `${match.awayScore} - ${match.homeScore}`}
                                            </div>
                                            
                                            <div className="flex items-center gap-4 w-40 justify-start">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
                                                <span className={`text-lg font-bold ${match.awayScore !== null && match.awayScore > (match.homeScore || 0) ? 'text-slate-900' : 'text-slate-500'}`}>{match.awayTeam}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="w-32 text-end mt-4 md:mt-0">
                                            <span className={`px-3 py-1.5 text-xs rounded-lg font-bold ${match.status === 'انتهت' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700 animate-pulse'}`}>
                                                {translateStatus(match.status, language)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'stats' && (
                         <div className="p-20 text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 text-4xl">
                                <i className="fas fa-chart-pie"></i>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{t.common.noData}</h3>
                            <p className="text-gray-500 mt-2">Statistics will be available soon.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Leagues;
