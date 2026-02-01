
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { geminiService } from '../services/geminiService';
import { productService } from '../services/productService';
import { AnalysisResult, DiaryEntry, FoodItem } from '../types';

interface AnalysisPanelProps {
  onSave: (entry: DiaryEntry) => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ onSave }) => {
  const [mode, setMode] = useState<'selection' | 'camera' | 'text' | 'database' | 'productForm'>('selection');
  const [image, setImage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [dbSearch, setDbSearch] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [products, setProducts] = useState<Omit<FoodItem, 'id'>[]>([]);
  
  const [editingProduct, setEditingProduct] = useState<Omit<FoodItem, 'id'>>({
    name: '', calories: 0, protein: 0, carbs: 0, fats: 0, quantity: '100g'
  });
  const [aiLoading, setAiLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setProducts(productService.getProducts());
  }, [mode]);

  const filteredProducts = useMemo(() => {
    if (!dbSearch) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(dbSearch.toLowerCase())
    );
  }, [dbSearch, products]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      let analysis;
      if (image) {
        analysis = await geminiService.analyzeImage(image);
      } else {
        analysis = await geminiService.analyzeText(textInput);
      }
      setResult(analysis);
    } catch (err) {
      alert("Analiza nie powiodła się.");
    } finally {
      setAnalyzing(false);
    }
  };

  const addProductFromDB = (product: any) => {
    if (result) {
      setResult({ ...result, items: [...result.items, { ...product }] });
    } else {
      setResult({
        items: [{ ...product }],
        totalCalories: product.calories,
        totalProtein: product.protein,
        totalCarbs: product.carbs,
        totalFats: product.fats,
        confidence: 1.0
      });
    }
    setMode('selection');
  };

  const handleMagicAi = async () => {
    if (!editingProduct.name) return;
    setAiLoading(true);
    try {
      const data = await geminiService.estimateNutrition(editingProduct.name);
      setEditingProduct(prev => ({ ...prev, ...data }));
    } catch (err) {
      alert("AI nie mogło oszacować tego produktu.");
    } finally {
      setAiLoading(false);
    }
  };

  const saveToDatabase = () => {
    if (!editingProduct.name) return;
    productService.saveProduct(editingProduct);
    setMode('database');
  };

  const handleDeleteFromDb = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (confirm(`Czy na pewno usunąć "${name}" z bazy?`)) {
      productService.deleteProduct(name);
      setProducts(productService.getProducts());
    }
  };

  const updateItem = (index: number, field: keyof Omit<FoodItem, 'id'>, value: string | number) => {
    if (!result) return;
    const newItems = [...result.items];
    newItems[index] = { 
      ...newItems[index], 
      [field]: (field === 'name' || field === 'quantity') ? value : Number(value) 
    };
    
    // Recalculate totals
    const totalCalories = newItems.reduce((s, i) => s + Number(i.calories || 0), 0);
    const totalProtein = newItems.reduce((s, i) => s + Number(i.protein || 0), 0);
    const totalCarbs = newItems.reduce((s, i) => s + Number(i.carbs || 0), 0);
    const totalFats = newItems.reduce((s, i) => s + Number(i.fats || 0), 0);

    setResult({ ...result, items: newItems, totalCalories, totalProtein, totalCarbs, totalFats });
  };

  const saveMeal = () => {
    if (!result) return;
    onSave({
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      mealName: result.items[0]?.name || "Posiłek",
      items: result.items.map((it, idx) => ({ ...it, id: `${idx}`, quantity: it.quantity || '100g' })),
      totalCalories: result.totalCalories,
      totalProtein: result.totalProtein,
      totalCarbs: result.totalCarbs,
      totalFats: result.totalFats,
      imageUrl: image || undefined
    });
  };

  return (
    <div className="space-y-6">
      {mode === 'selection' && !image && !result && !analyzing && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-8 min-h-[400px]">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-800">Co dziś jemy?</h2>
            <p className="text-slate-400">Dodaj posiłek jednym z poniższych sposobów</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
            <button onClick={() => setMode('camera')} className="bg-indigo-600 text-white p-6 rounded-2xl flex flex-col items-center space-y-2 shadow-lg active:scale-95 transition-all">
              <i className="fa-solid fa-camera text-2xl"></i>
              <span className="font-bold text-sm">Zrób zdjęcie</span>
            </button>
            <button onClick={() => setMode('text')} className="bg-white border-2 border-slate-100 text-slate-600 p-6 rounded-2xl flex flex-col items-center space-y-2 active:scale-95 transition-all hover:border-indigo-100">
              <i className="fa-solid fa-keyboard text-2xl text-indigo-500"></i>
              <span className="font-bold text-sm">Wpisz tekst</span>
            </button>
            <button onClick={() => setMode('database')} className="bg-white border-2 border-slate-100 text-slate-600 p-6 rounded-2xl flex flex-col items-center space-y-2 active:scale-95 transition-all hover:border-emerald-100">
              <i className="fa-solid fa-magnifying-glass text-2xl text-emerald-500"></i>
              <span className="font-bold text-sm">Baza produktów</span>
            </button>
            <label className="bg-white border-2 border-slate-100 text-slate-600 p-6 rounded-2xl flex flex-col items-center space-y-2 cursor-pointer active:scale-95 transition-all hover:border-indigo-100">
              <i className="fa-solid fa-cloud-arrow-up text-2xl text-indigo-400"></i>
              <span className="font-bold text-sm">Wgraj plik</span>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => { setImage(reader.result as string); setMode('selection'); };
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
          </div>
        </div>
      )}

      {mode === 'database' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6 min-h-[500px] flex flex-col fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
               <button onClick={() => setMode('selection')} className="text-slate-400 hover:text-slate-600 p-2"><i className="fa-solid fa-chevron-left text-xl"></i></button>
               <h3 className="text-xl font-bold text-slate-800">Moja baza</h3>
            </div>
            <button 
              onClick={() => { setEditingProduct({ name: '', calories: 0, protein: 0, carbs: 0, fats: 0, quantity: '100g' }); setMode('productForm'); }}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-sm"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Nowy produkt</span>
            </button>
          </div>
          
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input 
              autoFocus
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 font-medium"
              placeholder="Szukaj produktu..."
              value={dbSearch}
              onChange={(e) => setDbSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredProducts.map((p, idx) => (
              <div key={idx} className="flex space-x-2 group">
                <button 
                  onClick={() => addProductFromDB(p)}
                  className="flex-1 flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left"
                >
                  <div>
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{p.quantity} • {p.protein}B {p.carbs}W {p.fats}T</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-indigo-600">{p.calories} kcal</p>
                  </div>
                </button>
                <div className="flex flex-col space-y-1">
                  <button 
                    onClick={() => { setEditingProduct(p); setMode('productForm'); }}
                    className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    <i className="fa-solid fa-pen text-sm"></i>
                  </button>
                  <button 
                    onClick={(e) => handleDeleteFromDb(e, p.name)}
                    className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <i className="fa-solid fa-trash text-sm"></i>
                  </button>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-slate-400">Brak wyników dla "{dbSearch}"</div>
            )}
          </div>
        </div>
      )}

      {mode === 'productForm' && (
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 space-y-8 fade-in">
           <div className="flex items-center space-x-4">
              <button onClick={() => setMode('database')} className="text-slate-400 p-2"><i className="fa-solid fa-chevron-left text-xl"></i></button>
              <h3 className="text-xl font-bold text-slate-800">Karta produktu</h3>
           </div>

           <div className="space-y-6">
              <div className="relative">
                <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Nazwa</label>
                <div className="flex space-x-2 mt-1">
                  <input 
                    className="flex-1 bg-white border border-slate-200 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 px-4 py-3.5 rounded-2xl transition-all"
                    placeholder="Wpisz nazwę produktu..."
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  />
                  <button 
                    disabled={aiLoading || !editingProduct.name}
                    onClick={handleMagicAi}
                    className="bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {aiLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles text-lg"></i>}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 <MacroEdit label="kcal" value={editingProduct.calories} onChange={(v) => setEditingProduct({...editingProduct, calories: Number(v)})} />
                 <MacroEdit label="Białko (g)" value={editingProduct.protein} onChange={(v) => setEditingProduct({...editingProduct, protein: Number(v)})} />
                 <MacroEdit label="Węgle (g)" value={editingProduct.carbs} onChange={(v) => setEditingProduct({...editingProduct, carbs: Number(v)})} />
                 <MacroEdit label="Tłuszcz (g)" value={editingProduct.fats} onChange={(v) => setEditingProduct({...editingProduct, fats: Number(v)})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Porcja bazowa</label>
                <input 
                  className="w-full bg-white border border-slate-200 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3.5 rounded-2xl"
                  placeholder="np. 100g, 1 sztuka"
                  value={editingProduct.quantity || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, quantity: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                 <button onClick={() => setMode('database')} className="flex-1 py-4 border border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-slate-50">Anuluj</button>
                 <button onClick={saveToDatabase} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-700">Zapisz produkt</button>
              </div>
           </div>
        </div>
      )}

      {mode === 'text' && !result && !analyzing && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6 fade-in">
          <h3 className="text-xl font-bold text-slate-800">Wpisz co zjadłeś</h3>
          <textarea 
            className="w-full h-40 p-5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 leading-relaxed font-medium" 
            placeholder="Opisz swój posiłek, np. '2 kromki chleba razowego z awokado i jajkiem sadzonym'..." 
            value={textInput} 
            onChange={(e) => setTextInput(e.target.value)} 
          />
          <div className="flex gap-4">
            <button onClick={() => setMode('selection')} className="flex-1 py-4 border border-slate-200 rounded-2xl text-slate-500 font-bold">Wróć</button>
            <button onClick={runAnalysis} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">Analizuj posiłek</button>
          </div>
        </div>
      )}

      {analyzing && (
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-8 min-h-[400px]">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fa-solid fa-brain text-indigo-600 animate-pulse text-xl"></i>
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-slate-800">NutriScan AI analizuje...</h3>
            <p className="text-slate-400 text-sm">Szacujemy wartości odżywcze Twojego posiłku</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6 fade-in">
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Twój posiłek</h3>
                <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Kliknij pole, aby poprawić dane</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black">{result.totalCalories}</p>
                <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Łącznie kcal</p>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-3 gap-4">
                <MacroDisplay label="Białko" value={result.totalProtein} color="text-rose-600" />
                <MacroDisplay label="Węgle" value={result.totalCarbs} color="text-amber-600" />
                <MacroDisplay label="Tłuszcze" value={result.totalFats} color="text-orange-600" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Składniki</h4>
                  <button onClick={() => setMode('database')} className="text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                    <i className="fa-solid fa-plus-circle mr-1"></i> Dodaj produkt
                  </button>
                </div>
                
                <div className="space-y-3">
                  {result.items.map((item, idx) => (
                    <div key={idx} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-4 relative group hover:bg-white hover:shadow-md transition-all">
                      <button onClick={() => setResult({...result, items: result.items.filter((_, i) => i !== idx)})} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors">
                        <i className="fa-solid fa-circle-xmark text-xl"></i>
                      </button>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">Produkt</label>
                        <input 
                          className="bg-white border border-slate-200 font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-500/20 px-3 py-2 rounded-xl transition-all" 
                          value={item.name} 
                          onChange={(e) => updateItem(idx, 'name', e.target.value)} 
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <MacroEdit label="kcal" value={item.calories} onChange={(v) => updateItem(idx, 'calories', v)} />
                        <MacroEdit label="B(g)" value={item.protein} onChange={(v) => updateItem(idx, 'protein', v)} />
                        <MacroEdit label="W(g)" value={item.carbs} onChange={(v) => updateItem(idx, 'carbs', v)} />
                        <MacroEdit label="T(g)" value={item.fats} onChange={(v) => updateItem(idx, 'fats', v)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button onClick={() => {setResult(null); setImage(null); setMode('selection'); setTextInput('');}} className="flex-1 py-4 border border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-slate-50">Porzuć</button>
                <button onClick={saveMeal} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Zapisz w Dzienniku</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MacroDisplay: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="bg-white p-4 rounded-2xl text-center border border-slate-100 shadow-sm">
    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">{label}</p>
    <p className={`text-xl font-black ${color}`}>{Math.round(value)}g</p>
  </div>
);

const MacroEdit: React.FC<{ label: string; value: number; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="text-[9px] text-slate-400 font-bold uppercase ml-1">{label}</label>
    <input 
      type="number" 
      className="w-full text-xs font-bold p-2 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
    />
  </div>
);

export default AnalysisPanel;
