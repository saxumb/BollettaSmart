
import React, { useState, useEffect } from 'react';
import { analyzeBill } from './geminiService.ts';
import { BillAnalysisResult, AnalysisStatus } from './types.ts';
import { Dashboard } from './components/Dashboard.tsx';

// === CONFIGURAZIONE PAYPAL ===
const PAYPAL_USERNAME = 'saxumb';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
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
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        try {
          const analysis = await analyzeBill(base64Data, mimeType);
          setResult(analysis);
          setStatus(AnalysisStatus.SUCCESS);
        } catch (err) {
          console.error(err);
          setError("Errore durante l'analisi. Riprova con un'immagine più nitida.");
          setStatus(AnalysisStatus.ERROR);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Impossibile leggere il file selezionato.");
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
    <div className="min-h-screen pb-12">
      {showCoffeeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCoffeeModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl text-center">
            <button 
              onClick={() => setShowCoffeeModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl steam-icon">☕</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">Un ultimo pensiero...</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Ti abbiamo aiutato a fare chiarezza sulla tua bolletta? Se il servizio ti è piaciuto, offrici un caffè per supportare il progetto!
            </p>
            <div className="space-y-3">
              <a 
                href={`https://www.paypal.com/paypalme/${PAYPAL_USERNAME}/1`} 
                target="_blank" 
                className="block w-full py-4 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
              >
                Offri un Caffè (€1)
              </a>
              <button 
                onClick={() => setShowCoffeeModal(false)}
                className="block w-full py-3 text-slate-400 text-xs font-bold uppercase tracking-widest"
              >
                Magari la prossima volta
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
            <button 
              onClick={() => setShowCoffeeModal(true)}
              className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 flex items-center gap-2"
            >
              <span className="steam-icon">☕</span> Sostienici
            </button>
            {status === AnalysisStatus.SUCCESS && (
              <button onClick={reset} className="text-sm font-bold text-blue-600">Nuova Analisi</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {status === AnalysisStatus.IDLE && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-600">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Controlla la tua spesa</h2>
            <p className="text-slate-500 max-w-md mb-10 text-lg">
              Scansiona la tua bolletta con la fotocamera per analizzare costi e consumi istantaneamente.
            </p>
            <label className="cursor-pointer group">
              <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
              <div className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 group-hover:scale-105 transition-all flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                Inizia Scansione
              </div>
            </label>
          </div>
        )}

        {status === AnalysisStatus.LOADING && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold text-slate-900">Analisi in corso...</h3>
            <p className="text-slate-500 italic mt-2">Stiamo leggendo i dati della tua bolletta</p>
          </div>
        )}

        {status === AnalysisStatus.ERROR && (
          <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl text-center max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-rose-600 mb-2">Errore di lettura</h3>
            <p className="text-slate-600 mb-6">{error}</p>
            <button onClick={reset} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Riprova</button>
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
