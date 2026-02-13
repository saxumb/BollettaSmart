import React, { useState, useEffect } from 'react';
import { analyzeBill } from './geminiService.ts';
import { BillAnalysisResult, AnalysisStatus, AnalysisStatusType } from './types.ts';
import { Dashboard } from './components/Dashboard.tsx';

const PAYPAL_USERNAME = 'saxumb';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatusType>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<BillAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCoffeeModal, setShowCoffeeModal] = useState(false);
  const [hasShownExitIntent, setHasShownExitIntent] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && status === AnalysisStatus.SUCCESS && !hasShownExitIntent) {
        setShowCoffeeModal(true);
        setHasShownExitIntent(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [status, hasShownExitIntent]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus(AnalysisStatus.LOADING);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        if (!base64String) {
          setError("Errore nella lettura del file.");
          setStatus(AnalysisStatus.ERROR);
          return;
        }
        
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        try {
          const analysis = await analyzeBill(base64Data, mimeType);
          setResult(analysis);
          setStatus(AnalysisStatus.SUCCESS);
        } catch (err: any) {
          console.error("Gemini Error:", err);
          setError(err.message || "Errore durante l'analisi. Riprova con un'immagine più chiara.");
          setStatus(AnalysisStatus.ERROR);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Impossibile caricare il file.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const reset = () => {
    setStatus(AnalysisStatus.IDLE);
    setResult(null);
    setError(null);
    setShowCoffeeModal(false);
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50">
      {showCoffeeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCoffeeModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl text-center">
            <button onClick={() => setShowCoffeeModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">☕</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">Un piccolo supporto?</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              BollettaSmart ti aiuta a risparmiare. Se il servizio ti è utile, offrici un caffè per continuare a farlo crescere!
            </p>
            <div className="space-y-3">
              <a href={`https://www.paypal.com/paypalme/${PAYPAL_USERNAME}/1`} target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100">
                Offri un Caffè (€1)
              </a>
              <button onClick={() => setShowCoffeeModal(false)} className="block w-full py-3 text-slate-400 text-xs font-bold uppercase tracking-widest">
                Magari dopo
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">B</div>
            <h1 className="text-xl font-bold text-slate-900">BollettaSmart</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowCoffeeModal(true)} className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 flex items-center gap-2 hover:bg-amber-100 transition-colors">
              <span className="steam-icon">☕</span> Sostienici
            </button>
            {status === AnalysisStatus.SUCCESS && (
              <button onClick={reset} className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-all">
                Nuova Analisi
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {status === AnalysisStatus.IDLE && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight uppercase">Analizza la tua Bolletta</h2>
              <p className="text-slate-500 max-w-md mx-auto text-lg">
                Carica una foto o un PDF della tua bolletta. L'IA analizzerà i costi e ti mostrerà dove puoi risparmiare.
              </p>
            </div>
            <label className="relative group cursor-pointer">
              <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
              <div className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95">
                Seleziona Bolletta
              </div>
            </label>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Supporta JPG, PNG, PDF</p>
          </div>
        )}

        {status === AnalysisStatus.LOADING && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-blue-100 rounded-full"></div>
              <div className="w-24 h-24 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Analisi in corso...</h2>
              <p className="text-slate-500 font-medium">L'IA sta elaborando i dati della bolletta.</p>
            </div>
          </div>
        )}

        {status === AnalysisStatus.ERROR && (
          <div className="max-w-md mx-auto p-8 bg-rose-50 border border-rose-100 rounded-[2rem] text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-rose-800 font-bold mb-6">{error}</p>
            <button onClick={reset} className="px-8 py-3 bg-rose-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">
              Riprova
            </button>
          </div>
        )}

        {status === AnalysisStatus.SUCCESS && result && (
          <Dashboard data={result} paypalUser={PAYPAL_USERNAME} />
        )}
      </main>
    </div>
  );
};

export default App;