
import React, { useState } from 'react';
import { DiaryEntry } from '../types';

interface DiaryViewProps {
  entries: DiaryEntry[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updated: Partial<DiaryEntry>) => void;
}

const DiaryView: React.FC<DiaryViewProps> = ({ entries, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{name: string, kcal: number} | null>(null);

  // Group by date
  const groupedEntries = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, DiaryEntry[]>);

  const dates = Object.keys(groupedEntries).sort().reverse();

  const handleEdit = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setEditForm({ name: entry.mealName, kcal: entry.totalCalories });
  };

  const handleSaveEdit = () => {
    if (editingId && editForm) {
      onUpdate(editingId, { mealName: editForm.name, totalCalories: editForm.kcal });
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {dates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
            <i className="fa-solid fa-calendar-xmark text-3xl"></i>
          </div>
          <p className="text-slate-500 font-medium">Twój dziennik jest jeszcze pusty.</p>
        </div>
      ) : (
        dates.map(date => {
          const dayEntries = groupedEntries[date];
          const totalKcal = dayEntries.reduce((sum, e) => sum + e.totalCalories, 0);
          
          return (
            <div key={date} className="space-y-4">
              <div className="flex justify-between items-end px-2">
                <h3 className="text-lg font-black text-slate-800">
                  {new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <p className="text-indigo-600 font-bold">{totalKcal} kcal</p>
              </div>

              <div className="grid gap-4">
                {dayEntries.map(entry => (
                  <div key={entry.id} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-start space-x-4">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden">
                      {entry.imageUrl ? (
                        <img src={entry.imageUrl} alt={entry.mealName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <i className="fa-solid fa-image text-2xl"></i>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 py-1">
                      {editingId === entry.id ? (
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            className="w-full text-sm font-bold border rounded-lg px-2 py-1"
                            value={editForm?.name}
                            onChange={(e) => setEditForm(prev => prev ? {...prev, name: e.target.value} : null)}
                          />
                          <input 
                            type="number" 
                            className="w-24 text-sm border rounded-lg px-2 py-1"
                            value={editForm?.kcal}
                            onChange={(e) => setEditForm(prev => prev ? {...prev, kcal: parseInt(e.target.value)} : null)}
                          />
                          <div className="flex space-x-2">
                            <button onClick={handleSaveEdit} className="text-[10px] font-bold text-indigo-600 uppercase">Zapisz</button>
                            <button onClick={() => setEditingId(null)} className="text-[10px] font-bold text-slate-400 uppercase">Anuluj</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-bold text-slate-800 truncate pr-6 relative">
                            {entry.mealName}
                            {entry.recipe && (
                              <i className="fa-solid fa-lightbulb text-amber-400 text-[10px] absolute top-1 -right-4"></i>
                            )}
                          </h4>
                          <p className="text-xs text-slate-400 mb-2">
                            {entry.items.length} składniki • {entry.totalCalories} kcal
                          </p>
                          <div className="flex space-x-3">
                            <MacroBadge value={entry.totalProtein} color="text-rose-500" />
                            <MacroBadge value={entry.totalCarbs} color="text-amber-500" />
                            <MacroBadge value={entry.totalFats} color="text-orange-500" />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2">
                      <button 
                        onClick={() => handleEdit(entry)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button 
                        onClick={() => { if(confirm('Czy na pewno usunąć ten posiłek?')) onDelete(entry.id); }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

const MacroBadge: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <span className={`text-[10px] font-bold ${color}`}>{value}g</span>
);

export default DiaryView;
