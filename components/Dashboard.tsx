import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BillAnalysisResult } from '../types';

interface DashboardProps {
  data: BillAnalysisResult;
  paypalUser: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const SLOT_COLORS: Record<string, string> = {
  'F1': '#3b82f6',
  'F2': '#f59e0b',
  'F3': '#10b981',
};

const SLOT_HOURS: Record<string, string> = {
  'F1': 'Lun-Ven 8:00-19:00',
  'F2': 'Lun-Ven 7:00-8:00/19:00-23:00, Sab 7:00-23:00',
  'F3': 'Lun-Sab 23:00-7:00, Dom e festivi',
};

const getValidCurrencyCode = (code: string | undefined): string => {
  if (!code || code === '€' || code === '$') return 'EUR';
  return code.length === 3 ? code.toUpperCase() : 'EUR';
};

export const Dashboard: React.FC<DashboardProps> = ({ data, paypalUser }) => {
  const isLuceWithSlots = data.utilityType === 'Luce' && data.timeSlots && data.timeSlots.length > 0;
  const currencyCode = getValidCurrencyCode(data.currency);
  
  const [priceMode, setPriceMode] = useState<'single' | 'slots' | 'variable'>(isLuceWithSlots ? 'slots' : 'single');
  const [simUnitPrice, setSimUnitPrice] = useState<number>(data.unitPrice || 0.15);
  const [slotPrices, setSlotPrices] = useState<Record<string, number>>({});
  const [simFixedFee, setSimFixedFee] = useState<number>(data.fixedFeeMonthly || 10);
  
  const [marketIndex, setMarketIndex] = useState<number>(0.12);
  const [spread, setSpread] = useState<number>(0.02);
  
  useEffect(() => {
    if (data.unitPrice) {
      setSimUnitPrice(data.unitPrice);
      setMarketIndex(data.unitPrice * 0.8);
      setSpread(data.unitPrice * 0.2);
    }
    if (data.fixedFeeMonthly) setSimFixedFee(data.fixedFeeMonthly);
    
    if (isLuceWithSlots) {
      const initialSlots: Record<string, number> = {};
      data.timeSlots?.forEach(slot => {
        initialSlots[slot.slot] = data.unitPrice || 0.15;
      });
      setSlotPrices(initialSlots);
    }
  }, [data, isLuceWithSlots]);

  const billingMonths = data.billingMonths || 2;
  const currentTotalConsumption = data.totalConsumption || 0;
  const vatRate = 0.10;

  let simMateriaVar = 0;
  if (priceMode === 'slots' && isLuceWithSlots) {
    simMateriaVar = data.timeSlots!.reduce((acc, slot) => {
      const price = slotPrices[slot.slot] ?? simUnitPrice;
      return acc + (slot.value * price);
    }, 0);
  } else if (priceMode === 'variable') {
    simMateriaVar = (marketIndex + spread) * currentTotalConsumption;
  } else {
    simMateriaVar = simUnitPrice * currentTotalConsumption;
  }

  const currentTaxableMateria = ((data.unitPrice || 0) * currentTotalConsumption) + ((data.fixedFeeMonthly || 0) * billingMonths);
  const simTaxableMateria = simMateriaVar + (simFixedFee * billingMonths);
  const taxableDelta = simTaxableMateria - currentTaxableMateria;
  const vatDelta = taxableDelta * vatRate;

  const simulatedTotal = data.totalAmount + taxableDelta + vatDelta;
  const savings = data.totalAmount - simulatedTotal;
  const totalSlotConsumption = data.timeSlots?.reduce((acc, curr) => acc + curr.value, 0) || 1;

  const supportAmounts = [0.5, 1, 5];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8">
           <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
             {data.utilityType}
           </span>
        </div>
        <div className="p-8 md:p-12">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{data.provider}</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-4">
                {data.totalAmount.toLocaleString('it-IT', { style: 'currency', currency: currencyCode })}
              </h2>
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scadenza</span>
                  <span className="text-lg font-bold text-rose-600">{data.dueDate}</span>
                </div>
                <div className="flex flex-col border-l border-slate-100 pl-8">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consumo</span>
                  <span className="text-lg font-bold text-slate-900">{data.totalConsumption || 0} {data.consumptionUnit}</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center min-w-[160px]">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Periodo Fattura</p>
               <p className="text-sm font-bold text-slate-800">{data.billingPeriod || 'N/D'}</p>
            </div>
          </div>
        </div>
      </div>

      {isLuceWithSlots && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Distribuzione Consumi</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fasce Orarie</span>
          </div>
          <div className="space-y-8">
            <div className="h-6 w-full bg-slate-100 rounded-full flex overflow-hidden shadow-inner">
              {data.timeSlots!.map((slot, idx) => (
                <div 
                  key={slot.slot} 
                  style={{ width: `${(slot.value / totalSlotConsumption) * 100}%`, backgroundColor: SLOT_COLORS[slot.slot] || COLORS[idx % COLORS.length] }}
                  className="h-full transition-all duration-1000"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.timeSlots!.map((slot, idx) => (
                <div key={slot.slot} className="flex flex-col p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SLOT_COLORS[slot.slot] || COLORS[idx % COLORS.length] }}></div>
                      <span className="font-black text-slate-700 text-xs uppercase tracking-widest">Fascia {slot.slot}</span>
                    </div>
                    <span className="text-2xl font-black text-slate-900">{((slot.value / totalSlotConsumption) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="mb-4">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Dettaglio Orari</p>
                     <p className="text-[11px] leading-tight text-slate-600 font-medium">{SLOT_HOURS[slot.slot] || 'N/D'}</p>
                  </div>
                  <div className="mt-auto pt-3 border-t border-slate-200/50">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valore</p>
                     <p className="text-lg font-bold text-slate-800">{slot.value} <span className="text-xs text-slate-400">{slot.unit}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-blue-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 rounded-full -mr-40 -mt-40 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
            <div>
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Simulator di Risparmio</h3>
              <p className="text-slate-500 mt-1 font-medium">Confronta la tua bolletta con altre tariffe.</p>
            </div>
            <div className={`px-12 py-6 rounded-3xl font-black text-center border-2 shadow-sm transition-all duration-500 ${savings >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700 scale-105' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 mb-1">Risparmio Stimato</p>
              <p className="text-5xl tracking-tighter">{savings.toLocaleString('it-IT', { style: 'currency', currency: currencyCode })}</p>
            </div>
          </div>

          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-10">
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Modalità Prezzo</label>
                  </div>
                  <div className="flex p-1.5 bg-slate-100 rounded-2xl overflow-x-auto custom-scrollbar">
                    <button onClick={() => setPriceMode('single')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${priceMode === 'single' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>Monoraria</button>
                    {isLuceWithSlots && <button onClick={() => setPriceMode('slots')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${priceMode === 'slots' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>Fasce</button>}
                    <button onClick={() => setPriceMode('variable')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${priceMode === 'variable' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>Variabile</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Prezzo Materia (€/{data.consumptionUnit})</label>
                  {priceMode === 'slots' ? (
                    <div className="grid grid-cols-3 gap-4">
                      {data.timeSlots!.map((slot) => (
                        <input key={slot.slot} type="number" step="0.0001" value={slotPrices[slot.slot] || 0} onChange={(e) => setSlotPrices({...slotPrices, [slot.slot]: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-center font-bold" />
                      ))}
                    </div>
                  ) : priceMode === 'variable' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" step="0.0001" value={marketIndex} onChange={(e) => setMarketIndex(parseFloat(e.target.value))} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-center font-bold" />
                      <input type="number" step="0.0001" value={spread} onChange={(e) => setSpread(parseFloat(e.target.value))} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-center font-bold" />
                    </div>
                  ) : (
                    <input type="number" step="0.0001" value={simUnitPrice} onChange={(e) => setSimUnitPrice(parseFloat(e.target.value))} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-xl font-bold" />
                  )}
                </div>
              </div>
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quota Fissa Mensile (€/mese)</label>
                  <input type="number" step="0.5" value={simFixedFee} onChange={(e) => setSimFixedFee(parseFloat(e.target.value))} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-xl font-bold" />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex gap-8">
                <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Costo Materia</p><p className="text-xl font-bold">€ {simMateriaVar.toFixed(2)}</p></div>
                <div className="border-l border-slate-200 pl-8"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Quote Fisse</p><p className="text-xl font-bold">€ {(simFixedFee * billingMonths).toFixed(2)}</p></div>
              </div>
              <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Nuovo Totale Stimato (IVA incl.)</p><p className="text-4xl font-black text-blue-600 tracking-tighter">€ {simulatedTotal.toFixed(2)}</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 h-[480px] flex flex-col">
          <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">Suddivisione Costi</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart style={{ outline: 'none' }}>
              <Pie data={data.costBreakdown} cx="50%" cy="42%" innerRadius={70} outerRadius={100} paddingAngle={10} dataKey="amount" nameKey="category" stroke="none">
                {data.costBreakdown.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => v.toLocaleString('it-IT', { style: 'currency', currency: currencyCode })} />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 h-[480px] flex flex-col">
          <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">Storico Consumi</h3>
          {data.consumptions?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.consumptions}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex-1 flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest">Dati non disponibili</div>}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 md:p-10 rounded-[2.5rem] border border-blue-100 flex flex-col lg:flex-row items-center gap-8 shadow-sm">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-all">
           <span className="text-4xl steam-icon">☕</span>
        </div>
        <div className="text-center lg:text-left flex-1">
          <h4 className="text-xl font-black text-blue-900 uppercase tracking-tight mb-2">Ti piace BollettaSmart?</h4>
          <p className="text-blue-800/70 font-medium">L'app è gratuita. Se ti abbiamo aiutato, considera di offrirci un caffè!</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {supportAmounts.map(amount => (
            <a key={amount} href={`https://www.paypal.com/paypalme/${paypalUser}/${amount}`} target="_blank" rel="noopener noreferrer" className="px-6 py-4 bg-white border-2 border-blue-100 text-blue-600 rounded-2xl font-black text-sm uppercase hover:bg-blue-600 hover:text-white transition-all min-w-[100px] text-center">€ {amount.toFixed(2)}</a>
          ))}
          <a href={`https://www.paypal.com/paypalme/${paypalUser}`} target="_blank" rel="noopener noreferrer" className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase shadow-xl hover:bg-blue-700 hover:scale-105 transition-all">Sostienici</a>
        </div>
      </div>
    </div>
  );
};