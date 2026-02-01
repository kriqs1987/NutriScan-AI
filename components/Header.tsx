
import React from 'react';
import { ViewType } from '../types';

interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const apiKey = process.env.API_KEY || '';
  const maskedKey = apiKey 
    ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` 
    : 'Brak klucza!';

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-600 p-2 rounded-xl shadow-sm">
          <i className="fa-solid fa-bowl-food text-white text-xl"></i>
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-800 leading-none">
            NutriScan AI
          </h1>
          <div className="flex items-center mt-1 space-x-2">
            <span className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              API: {maskedKey}
            </span>
          </div>
        </div>
      </div>

      <nav className="hidden md:flex items-center space-x-1">
        <NavButton 
          active={currentView === 'dashboard'} 
          onClick={() => onNavigate('dashboard')}
          icon="fa-chart-line"
          label="Panel"
        />
        <NavButton 
          active={currentView === 'analyze'} 
          onClick={() => onNavigate('analyze')}
          icon="fa-camera"
          label="Analizuj"
        />
        <NavButton 
          active={currentView === 'history'} 
          onClick={() => onNavigate('history')}
          icon="fa-calendar-days"
          label="Dziennik"
        />
      </nav>

      <div className="hidden md:block">
        <button className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-full text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center justify-center shadow-sm">
          <i className="fa-solid fa-user text-sm"></i>
        </button>
      </div>
    </header>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 transition-all ${
      active 
        ? 'bg-indigo-50 text-indigo-600' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
    }`}
  >
    <i className={`fa-solid ${icon}`}></i>
    <span>{label}</span>
  </button>
);

export default Header;
