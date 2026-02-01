
import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { AnalysisResult, DiaryEntry, FoodItem, RecipeSuggestion } from '../types';

interface AnalysisPanelProps {
  onSave: (entry: DiaryEntry) => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ onSave }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [recipe, setRecipe] = useState<RecipeSuggestion | null>(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      setShowCamera(false);
      alert("Błąd aparatu: Nie udało się uzyskać dostępu.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const analysis = await geminiService.analyzeImage(image);
      setResult(analysis);
    } catch (err) {
      alert("Analiza nie powiodła się. Spróbuj innego zdjęcia.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateRecipe = async () => {
    if (!result) return;
    setGeneratingRecipe(true);
    try {
      const recipeData = await geminiService.generateRecipe(result.items.map(i => i.name));
      setRecipe(recipeData);
    } catch (err) {
      alert("Nie udało się wygenerować przepisu.");
    } finally {
      setGeneratingRecipe(false);
    }
  };

  const saveMeal = () => {
    if (!result || !image) return;
    
    const entry: DiaryEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      mealName: result.items[0]?.name || "Nowy posiłek",
      items: result.items.map((it, idx) => ({ ...it, id: `${idx}` })),
      totalCalories: result.totalCalories,
      totalProtein: result.totalProtein,
      totalCarbs: result.totalCarbs,
      totalFats: result.totalFats,
      imageUrl: image,
      recipe: recipe?.title
    };
    
    onSave(entry);
  };

  return (
    <div className="space-y-6">
      {!image && !showCamera && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-8 min-h-[400px]">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-800">Dodaj zdjęcie posiłku</h2>
            <p className="text-slate-400">Przeanalizujemy je za pomocą sztucznej inteligencji</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <button 
              onClick={startCamera}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 shadow-lg transition-transform active:scale-95"
            >
              <i className="fa-solid fa-camera text-2xl"></i>
              <span className="font-bold">Zrób zdjęcie</span>
            </button>
            
            <label className="flex-1 bg-white border-2 border-slate-100 hover:border-indigo-100 hover:bg-slate-50 text-slate-600 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all active:scale-95">
              <i className="fa-solid fa-cloud-arrow-up text-2xl text-indigo-400"></i>
              <span className="font-bold">Wgraj plik</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
          <div className="p-8 flex justify-between items-center bg-black/50 absolute bottom-0 left-0 right-0">
            <button onClick={stopCamera} className="text-white text-3xl"><i className="fa-solid fa-xmark"></i></button>
            <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-8 border-white/30 flex items-center justify-center active:scale-90 transition-transform">
              <div className="w-14 h-14 bg-white rounded-full border-4 border-indigo-600"></div>
            </button>
            <div className="w-10"></div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {image && !result && !analyzing && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100">
            <img src={image} alt="Posiłek" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setImage(null)}
              className="flex-1 py-4 px-6 border border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-slate-50"
            >
              Anuluj
            </button>
            <button 
              onClick={runAnalysis}
              className="flex-[2] py-4 px-6 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Analizuj teraz
            </button>
          </div>
        </div>
      )}

      {analyzing && (
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-6 min-h-[400px]">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
              <i className="fa-solid fa-wand-sparkles text-2xl animate-pulse"></i>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800">Magia AI w toku...</h3>
            <p className="text-slate-400">Rozpoznajemy składniki i liczymy wartości odżywcze.</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Wynik analizy</h3>
                <p className="text-indigo-100 text-xs uppercase tracking-widest font-bold">Dokładność: {Math.round(result.confidence * 100)}%</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">{result.totalCalories}</p>
                <p className="text-[10px] opacity-70 font-bold uppercase">Łącznie kcal</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                 <div className="bg-rose-50 p-3 rounded-2xl text-center">
                   <p className="text-[10px] text-rose-400 font-bold uppercase">Białko</p>
                   <p className="text-lg font-bold text-rose-600">{result.totalProtein}g</p>
                 </div>
                 <div className="bg-amber-50 p-3 rounded-2xl text-center">
                   <p className="text-[10px] text-amber-500 font-bold uppercase">Węgle</p>
                   <p className="text-lg font-bold text-amber-600">{result.totalCarbs}g</p>
                 </div>
                 <div className="bg-orange-50 p-3 rounded-2xl text-center">
                   <p className="text-[10px] text-orange-400 font-bold uppercase">Tłuszcze</p>
                   <p className="text-lg font-bold text-orange-600">{result.totalFats}g</p>
                 </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Składniki</h4>
                {result.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 capitalize">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.quantity || '1 porcja'}</p>
                    </div>
                    <div className="text-right font-medium text-slate-600">
                      {item.calories} kcal
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col gap-3">
                 {recipe ? (
                   <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-3">
                      <div className="flex items-center space-x-2 text-emerald-700">
                        <i className="fa-solid fa-kitchen-set"></i>
                        <h5 className="font-bold">{recipe.title}</h5>
                      </div>
                      <div className="text-xs text-emerald-600 space-y-1">
                        <p className="font-bold">Instrukcja:</p>
                        <ul className="list-disc pl-4">
                          {recipe.instructions.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                   </div>
                 ) : (
                  <button 
                    disabled={generatingRecipe}
                    onClick={handleGenerateRecipe}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-sm font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    {generatingRecipe ? (
                      <i className="fa-solid fa-spinner animate-spin"></i>
                    ) : (
                      <i className="fa-solid fa-lightbulb"></i>
                    )}
                    <span>Generuj przepis z tych składników</span>
                  </button>
                 )}
                 
                 <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => {setResult(null); setRecipe(null);}}
                      className="flex-1 py-4 px-6 border border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all"
                    >
                      Ponów
                    </button>
                    <button 
                      onClick={saveMeal}
                      className="flex-[2] py-4 px-6 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                      Zapisz w dzienniku
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;
