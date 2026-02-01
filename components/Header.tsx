
import React from 'react';
import { ViewType } from '../types';

interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-2">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <i className="fa-solid fa-bowl-food text-white text-xl"></i>
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800">
          NutriScan AI
        </h1>
      </div>

      <nav className="hidden md:flex items-center space-x-6">
        <button 
          onClick={() => onNavigate('dashboard')}
          className={`text-sm font-semibold transition-colors ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
        >
          Dashboard
        </button>
        <button 
          onClick={() => onNavigate('analyze')}
          className={`text-sm font-semibold transition-colors ${currentView === 'analyze' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
        >
          Analizuj
        </button>
        <button 
          onClick={() => onNavigate('history')}
          className={`text-sm font-semibold transition-colors ${currentView === 'history' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
        >
          Dziennik
        </button>
      </nav>

      <div className="hidden md:block">
        <button className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
          <i className="fa-solid fa-user"></i>
        </button>
      </div>
    </header>
  );
};

export default Header;
