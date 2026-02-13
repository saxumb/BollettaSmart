
import { GoogleGenAI, Type } from "@google/genai";
import { BillAnalysisResult } from "./types";

/**
 * Analyzes a bill image or PDF using Google Gemini API.
 * Follows strict initialization guidelines for @google/genai.
 */
export const analyzeBill = async (base64Image: string, mimeType: string): Promise<BillAnalysisResult> => {
  // Initialize the Gemini API client using the environment variable directly as required.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use gemini-3-flash-preview for basic text and structured data extraction tasks.
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Analizza questa bolletta e fornisci un riassunto dettagliato in formato JSON.
    TUTTI I TESTI E IL SOMMARIO DEVONO ESSERE IN LINGUA ITALIANA.
    
    Estrai con precisione:
    1. Nome del fornitore (provider).
    2. Importo totale (totalAmount).
    3. Valuta (currency, es. 'EUR').
    4. Data di scadenza (dueDate, DD/MM/YYYY).
    5. Tipo di utenza (utilityType: Luce, Gas, Acqua, Altro).
    6. Ripartizione costi (costBreakdown: category, amount).
    7. Storico consumi (consumptions: period, value, unit).
    8. Fasce Orarie (timeSlots: slot, value, unit) se presenti (es. F1, F2, F3).
    9. Riassunto testuale professionale in italiano (summary).
    10. Dati tecnici: unitPrice (prezzo al kWh o smc), fixedFeeMonthly (quota fissa mensile), totalConsumption, consumptionUnit, billingMonths (numero di mesi fatturati).
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
      // Configure JSON response mode with a structured schema.
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
        required: ["provider", "totalAmount", "dueDate", "utilityType", "summary"]
      }
    }
  });

  // Extract the text output directly from the response object.
  const resultText = response.text;
  if (!resultText) {
    throw new Error("L'analisi del documento non ha restituito risultati validi.");
  }

  try {
    return JSON.parse(resultText) as BillAnalysisResult;
  } catch (parseError) {
    console.error("Failed to parse Gemini JSON output:", resultText);
    throw new Error("Errore nel formato dei dati ricevuti dall'intelligenza artificiale.");
  }
};
