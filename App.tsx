
import React, { useState, useEffect, useCallback } from 'react';
import { ViewType, DiaryEntry } from './types';
import { apiService } from './services/apiService';
import Dashboard from './components/Dashboard';
import AnalysisPanel from './components/AnalysisPanel';
import DiaryView from './components/DiaryView';
import Header from './components/Header';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.fetchEntries();
      setEntries(data);
    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEntryAdded = async (newEntry: DiaryEntry) => {
    // Optimistic update
    setEntries(prev => [...prev, newEntry]);
    try {
      await apiService.saveEntry(newEntry);
    } catch (error) {
      console.error("Failed to save entry to database", error);
      loadData(); // Revert on failure
    }
    setCurrentView('dashboard');
  };

  const handleEntryDeleted = async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    try {
      await apiService.deleteEntry(id);
    } catch (error) {
      console.error("Failed to delete entry", error);
      loadData();
    }
  };

  const handleEntryUpdated = async (id: string, updated: Partial<DiaryEntry>) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));
    try {
      await apiService.updateEntry(id, updated);
    } catch (error) {
      console.error("Failed to update entry", error);
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-4xl mx-auto shadow-xl">
      <Header 
        currentView={currentView} 
        onNavigate={setCurrentView} 
      />

      <main className="flex-1 p-4 md:p-6 pb-24 overflow-y-auto">
        {loading && entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500 font-medium">Synchronizacja danych...</p>
          </div>
        ) : (
          <div className="fade-in">
            {currentView === 'dashboard' && (
              <Dashboard entries={entries} onAddMeal={() => setCurrentView('analyze')} />
            )}
            {currentView === 'analyze' && (
              <AnalysisPanel onSave={handleEntryAdded} />
            )}
            {currentView === 'history' && (
              <DiaryView 
                entries={entries} 
                onDelete={handleEntryDeleted}
                onUpdate={handleEntryUpdated}
              />
            )}
          </div>
        )}
      </main>

      {/* Persistent Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 flex justify-around items-center md:hidden z-50">
        <button 
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <i className="fa-solid fa-chart-line text-xl"></i>
          <span className="text-[10px] font-bold">Panel</span>
        </button>
        <button 
          onClick={() => setCurrentView('analyze')}
          className={`relative -top-6 bg-indigo-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-white border-4 border-slate-50`}
        >
          <i className="fa-solid fa-camera text-2xl"></i>
        </button>
        <button 
          onClick={() => setCurrentView('history')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'history' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <i className="fa-solid fa-calendar-days text-xl"></i>
          <span className="text-[10px] font-bold">Dziennik</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
