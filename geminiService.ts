import { GoogleGenAI, Type } from "@google/genai";
import { BillAnalysisResult } from "./types.ts";

const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // @ts-ignore
  if (window.process && window.process.env && window.process.env.API_KEY) {
    // @ts-ignore
    return window.process.env.API_KEY;
  }
  return "";
};

export const analyzeBill = async (base64Image: string, mimeType: string): Promise<BillAnalysisResult> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key non configurata nell'ambiente.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Analizza questa bolletta e fornisci un riassunto dettagliato in formato JSON.
    TUTTI I TESTI E IL SOMMARIO DEVONO ESSERE IN LINGUA ITALIANA.
    
    Estrai con precisione:
    1. Nome del fornitore.
    2. Importo totale da pagare.
    3. Valuta: UTILIZZA SEMPRE IL CODICE ISO 4217 (es. 'EUR' invece di '€').
    4. Data di scadenza (formato DD/MM/YYYY).
    5. Tipo di utenza (Luce, Gas, Acqua).
    6. Ripartizione dei costi (Spesa materia, trasporto, oneri, tasse) - TRADUCI IN ITALIANO.
    7. Storico consumi se presente.
    8. Consumo per Fasce Orarie (F1, F2, F3) se si tratta di una bolletta elettrica (Luce).
    9. Un breve riassunto testuale professionale in ITALIANO (summary).
    10. DATI PER SIMULATORE:
       - unitPrice: il costo unitario della materia energia/gas.
       - fixedFeeMonthly: la quota fissa mensile.
       - totalConsumption: il consumo totale fatturato.
       - consumptionUnit: l'unità di misura (kWh, Smc).
       - billingMonths: il numero di mesi a cui si riferisce la bolletta.
    
    IMPORTANTE: Tutte le date nel JSON devono essere nel formato italiano DD/MM/YYYY.
    NON estrarre il codice utenza, POD o PDR.
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          provider: { type: Type.STRING },
          totalAmount: { type: Type.NUMBER },
          currency: { type: Type.STRING },
          dueDate: { type: Type.STRING },
          billingPeriod: { type: Type.STRING },
          utilityType: { type: Type.STRING },
          costBreakdown: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                amount: { type: Type.NUMBER }
              },
              required: ["category", "amount"]
            }
          },
          consumptions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                period: { type: Type.STRING },
                value: { type: Type.NUMBER },
                unit: { type: Type.STRING }
              },
              required: ["period", "value", "unit"]
            }
          },
          timeSlots: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                slot: { type: Type.STRING },
                value: { type: Type.NUMBER },
                unit: { type: Type.STRING }
              },
              required: ["slot", "value", "unit"]
            }
          },
          summary: { type: Type.STRING },
          unitPrice: { type: Type.NUMBER },
          fixedFeeMonthly: { type: Type.NUMBER },
          totalConsumption: { type: Type.NUMBER },
          consumptionUnit: { type: Type.STRING },
          billingMonths: { type: Type.NUMBER }
        },
        required: ["provider", "totalAmount", "dueDate", "utilityType"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Impossibile analizzare il documento.");
  }

  return JSON.parse(response.text) as BillAnalysisResult;
};