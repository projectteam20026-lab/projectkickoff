import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import { backend } from '../services/backend';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

interface TeamModalProps {
  team?: Team | null;
  onClose: () => void;
  onSave: (team: Team) => void;
}

const TeamModal: React.FC<TeamModalProps> = ({ team, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    if (team) {
      setName(team.name);
      setLogo(team.logo);
      setPlayers(team.players || []);
    } else {
      setName('');
      setLogo('https://cdn-icons-png.flaticon.com/512/53/53283.png');
      setPlayers([]);
    }
  }, [team]);

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, newPlayerName.trim()]);
      setNewPlayerName('');
    }
  };

  const handleRemovePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);

    const teamData: Team = {
      id: team ? team.id : '',
      name,
      logo,
      wins: team ? team.wins : 0,
      losses: team ? team.losses : 0,
      draws: team ? team.draws : 0,
      points: team ? team.points : 0,
      players,
      isUserTeam: true
    };

    const result = await backend.saveTeam(teamData);
    setLoading(false);
    
    if (result.success) {
        onSave(result.team);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-slate-900">{team ? t.modals.team.editTitle : t.modals.team.createTitle}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex gap-4 items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/53/53283.png')} />
            </div>
            <div className="flex-1 space-y-2">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">{t.modals.team.name}</label>
                    <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                    placeholder={t.modals.team.namePlaceholder}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">{t.modals.team.logo}</label>
                    <input
                    type="text"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                    dir="ltr"
                    placeholder="https://..."
                    />
                </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t.modals.team.roster} ({players.length})</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                className="flex-1 px-4 py-2 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                placeholder={t.modals.team.addPlayer}
              />
              <button 
                onClick={handleAddPlayer}
                className="w-10 h-10 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-glow"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-2 h-40 overflow-y-auto border border-gray-100 custom-scrollbar">
              {players.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                    <i className="fas fa-user-plus mb-2 opacity-50"></i>
                    <span>{t.modals.team.emptyRoster}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {players.map((player, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm text-sm group">
                      <span className="font-medium text-slate-700">{player}</span>
                      <button onClick={() => handleRemovePlayer(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">{t.common.cancel}</button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg transition-all flex items-center gap-2"
          >
            {loading ? t.common.loading : (team ? t.modals.team.save : t.modals.team.create)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamModal;