import React, { useState, useEffect } from 'react';
import { analyzeBill } from './geminiService';
import { BillAnalysisResult, AnalysisStatus, AnalysisStatusType } from './types';
import { Dashboard } from './components/Dashboard';

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
          if (!analysis) throw new Error("Risposta vuota dall'IA");
          setResult(analysis);
          setStatus(AnalysisStatus.SUCCESS);
        } catch (err: any) {
          console.error("Gemini Error:", err);
          setError(err.message || "Impossibile analizzare la bolletta. Assicurati che l'immagine sia leggibile.");
          setStatus(AnalysisStatus.ERROR);
        }
      };
      reader.onerror = () => {
        setError("Errore durante il caricamento del file.");
        setStatus(AnalysisStatus.ERROR);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Impossibile elaborare il file selezionato.");
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
    <div className="min-h-screen pb-12 bg-slate-50 selection:bg-blue-100">
      {showCoffeeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCoffeeModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl text-center border border-white/20">
            <button onClick={() => setShowCoffeeModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">☕</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">Ti è stato utile?</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              BollettaSmart è un progetto gratuito. Se l'app ti ha aiutato a capire meglio i tuoi costi, offrici un caffè!
            </p>
            <div className="space-y-3">
              <a href={`https://www.paypal.com/paypalme/${PAYPAL_USERNAME}/1`} target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 active:scale-95">
                Offri un Caffè (€1)
              </a>
              <button onClick={() => setShowCoffeeModal(false)} className="block w-full py-3 text-slate-400 text-xs font-bold uppercase tracking-widest">
                Continua senza donare
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">B</div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">BollettaSmart</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowCoffeeModal(true)} className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-4 py-2 rounded-full border border-amber-200 flex items-center gap-2 hover:bg-amber-100 transition-all">
              <span className="steam-icon">☕</span> Sostienici
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {status === AnalysisStatus.IDLE && (
          <div className="flex flex-col items-center justify-center py-12 md:py-24 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-28 h-28 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-[2.5rem] flex items-center justify-center text-blue-600 shadow-inner">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter uppercase leading-tight">Analizza la tua<br/><span className="text-blue-600">Bolletta</span></h2>
              <p className="text-slate-500 max-w-sm mx-auto text-base md:text-lg font-medium leading-relaxed">
                Carica una foto o un PDF. L'intelligenza artificiale estrarrà costi e consumi per te.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4 w-full">
              <label className="relative group cursor-pointer w-full max-w-xs">
                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                <div className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Inizia ora
                </div>
              </label>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">JPG • PNG • PDF</p>
            </div>
          </div>
        )}

        {status === AnalysisStatus.LOADING && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-10">
            <div className="relative">
              <div className="w-24 h-24 border-[6px] border-slate-100 rounded-full"></div>
              <div className="w-24 h-24 border-[6px] border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
              <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                <svg className="w-8 h-8 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Analisi IA in corso</h2>
              <p className="text-slate-500 font-medium animate-pulse">Estraendo dati dal documento...</p>
            </div>
          </div>
        )}

        {status === AnalysisStatus.ERROR && (
          <div className="max-w-md mx-auto p-10 bg-white border border-rose-100 rounded-[3rem] shadow-xl text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase">Ops! Qualcosa è andato storto</h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">{error}</p>
            <button onClick={reset} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">
              Riprova ora
            </button>
          </div>
        )}

        {status === AnalysisStatus.SUCCESS && result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Il tuo report</h2>
                <button onClick={reset} className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-5 py-2.5 rounded-2xl hover:bg-blue-100 transition-all border border-blue-100">
                  Nuova Analisi
                </button>
             </div>
             <Dashboard data={result} paypalUser={PAYPAL_USERNAME} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;