import { GoogleGenAI, Type } from "@google/genai";
import { BillAnalysisResult } from "./types";

const getApiKey = () => {
  // @ts-ignore
  const envKey = (typeof process !== 'undefined' && process.env?.API_KEY) || (window.process?.env?.API_KEY);
  return envKey || "";
};

export const analyzeBill = async (base64Image: string, mimeType: string): Promise<BillAnalysisResult> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Chiave API mancante.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Analizza questa bolletta e fornisci un riassunto dettagliato in formato JSON.
    TUTTI I TESTI E IL SOMMARIO DEVONO ESSERE IN LINGUA ITALIANA.
    
    Estrai:
    1. Nome del fornitore.
    2. Importo totale.
    3. Valuta (es. 'EUR').
    4. Data di scadenza (DD/MM/YYYY).
    5. Tipo di utenza (Luce, Gas, Acqua).
    6. Ripartizione costi (Spesa materia, trasporto, oneri, tasse).
    7. Storico consumi.
    8. Fasce Orarie (F1, F2, F3) per elettricità.
    9. Riassunto testuale professionale.
    10. Dati tecnici: unitPrice, fixedFeeMonthly, totalConsumption, consumptionUnit, billingMonths.
  `;

  const response = await ai.models.generateContent({
    model,
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