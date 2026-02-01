
import React, { useMemo } from 'react';
import { DiaryEntry } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  entries: DiaryEntry[];
  onAddMeal: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ entries, onAddMeal }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const todayStats = useMemo(() => {
    const daily = entries.filter(e => e.date === today);
    return {
      kcal: daily.reduce((sum, e) => sum + e.totalCalories, 0),
      protein: daily.reduce((sum, e) => sum + e.totalProtein, 0),
      carbs: daily.reduce((sum, e) => sum + e.totalCarbs, 0),
      fats: daily.reduce((sum, e) => sum + e.totalFats, 0),
    };
  }, [entries, today]);

  const last7DaysData = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return dates.map(date => {
      const dailyEntries = entries.filter(e => e.date === date);
      return {
        name: new Date(date).toLocaleDateString('pl-PL', { weekday: 'short' }),
        calories: dailyEntries.reduce((sum, e) => sum + e.totalCalories, 0)
      };
    });
  }, [entries]);

  const dailyGoal = 2200;
  const progressPercent = Math.min(100, Math.round((todayStats.kcal / dailyGoal) * 100));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Dziś</h2>
            <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}</p>
          </div>
          <button 
            onClick={onAddMeal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95"
          >
            + Dodaj Posiłek
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="relative flex justify-center items-center">
             {/* Simple Ring Progress */}
            <div className="w-48 h-48 rounded-full border-[12px] border-slate-100 relative flex items-center justify-center">
              <div 
                className="absolute inset-0 rounded-full border-[12px] border-indigo-600" 
                style={{ 
                  clipPath: `polygon(50% 50%, 50% 0%, ${progressPercent > 25 ? '100% 0%' : '100% 0%'}, ${progressPercent > 50 ? '100% 100%' : '100% 0%'}, ${progressPercent > 75 ? '0% 100%' : '100% 0%'}, 0% 0%, 50% 0%)`,
                  transform: `rotate(${progressPercent * 3.6}deg)`
                }} 
              />
              <div className="text-center">
                <p className="text-3xl font-black text-slate-800">{todayStats.kcal}</p>
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">kcal / {dailyGoal}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MacroCard label="Białko" value={todayStats.protein} unit="g" color="bg-rose-500" icon="fa-fish" />
            <MacroCard label="Węgle" value={todayStats.carbs} unit="g" color="bg-amber-400" icon="fa-bread-slice" />
            <MacroCard label="Tłuszcze" value={todayStats.fats} unit="g" color="bg-orange-500" icon="fa-droplet" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Ostatnie 7 dni</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7DaysData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                {last7DaysData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 6 ? '#4f46e5' : '#e2e8f0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Ostatnie posiłki</h3>
        {entries.slice(-3).reverse().map(entry => (
          <div key={entry.id} className="bg-white p-4 rounded-2xl flex items-center space-x-4 shadow-sm border border-slate-100">
            <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
              {entry.imageUrl ? (
                <img src={entry.imageUrl} alt={entry.mealName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <i className="fa-solid fa-image text-xl"></i>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800">{entry.mealName}</h4>
              <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-indigo-600">{entry.totalCalories} kcal</p>
              <div className="flex space-x-2 text-[10px] font-bold">
                <span className="text-rose-500">{entry.totalProtein}g</span>
                <span className="text-amber-500">{entry.totalCarbs}g</span>
                <span className="text-orange-500">{entry.totalFats}g</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MacroCard: React.FC<{ label: string; value: number; unit: string; color: string; icon: string }> = ({ label, value, unit, color, icon }) => (
  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
    <div className={`${color} w-8 h-8 rounded-lg flex items-center justify-center text-white mb-2 shadow-sm`}>
      <i className={`fa-solid ${icon} text-xs`}></i>
    </div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</p>
    <p className="text-lg font-black text-slate-800 leading-tight">{value}<span className="text-sm font-normal text-slate-400 ml-0.5">{unit}</span></p>
  </div>
);

export default Dashboard;
