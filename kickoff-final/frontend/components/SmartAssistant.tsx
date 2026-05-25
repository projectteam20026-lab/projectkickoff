import React, { useState } from 'react';
import { generateLeagueAdvice } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

const SmartAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { language } = useLanguage();
  const t = translations[language];
  
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    {role: 'ai', text: t.ai.welcome}
  ]);
  const [loading, setLoading] = useState(false);

  // Update welcome message when language changes
  React.useEffect(() => {
      setMessages(prev => {
          // If the only message is a welcome message (either AR or EN), replace it
          if (prev.length === 1 && prev[0].role === 'ai') {
              return [{role: 'ai', text: t.ai.welcome}];
          }
          return prev;
      });
  }, [language, t.ai.welcome]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setInput('');
    setLoading(true);

    const response = await generateLeagueAdvice(userMsg, language);
    setMessages(prev => [...prev, {role: 'ai', text: response}]);
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} h-14 w-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform z-50`}
      >
        {isOpen ? <i className="fas fa-times text-xl"></i> : <i className="fas fa-robot text-xl"></i>}
      </button>

      {isOpen && (
        <div className={`fixed bottom-24 ${language === 'ar' ? 'left-6' : 'right-6'} w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-fade-in-up`} style={{maxHeight: '500px'}}>
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white font-medium flex items-center gap-2">
            <i className="fas fa-sparkles"></i> {t.ai.title}
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 h-80">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-emerald-500 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
               <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.ai.placeholder}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-emerald-500 text-white rounded-xl w-10 h-10 flex items-center justify-center hover:bg-emerald-600 disabled:opacity-50"
            >
              <i className={`fas fa-paper-plane ${language === 'ar' ? 'pl-1' : 'pr-1'}`}></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SmartAssistant;