import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Inicjalizacja klienta zgodnie z dokumentacją SDK
const getAIClient = () => new GoogleGenAI(import.meta.env.VITE_GOOGLE_AI_KEY || '');


const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fats: { type: Type.NUMBER },
          quantity: { type: Type.STRING }
        },
        required: ["name", "calories", "protein", "carbs", "fats"]
      }
    },
    totalCalories: { type: Type.NUMBER },
    totalProtein: { type: Type.NUMBER },
    totalCarbs: { type: Type.NUMBER },
    totalFats: { type: Type.NUMBER },
    confidence: { type: Type.NUMBER }
  },
  required: ["items", "totalCalories", "totalProtein", "totalCarbs", "totalFats", "confidence"]
};

export const geminiService = {
  async analyzeImage(base64Image: string): Promise<AnalysisResult> {
    const prompt = `Przeanalizuj to zdjęcie jedzenia. Zidentyfikuj każdy składnik i oszacuj jego masę, kalorie oraz makroskładniki (białko, węgle, tłuszcze). Zwróć dane po polsku.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] || base64Image } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA as any
      }
    });

    return JSON.parse(response.text || '{}');
  },

  async estimateNutrition(productName: string) {
    const prompt = `Podaj szacunkowe wartości odżywcze dla produktu: "${productName}" (standardowa porcja 100g lub 1 sztuka). Zwróć format JSON po polsku.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fats: { type: Type.NUMBER },
            quantity: { type: Type.STRING }
          },
          required: ["calories", "protein", "carbs", "fats", "quantity"]
        } as any
      }
    });
    
    return JSON.parse(response.text || '{}');
  },

  async analyzeText(text: string): Promise<AnalysisResult> {
    const prompt = `Przeanalizuj opis posiłku: "${text}". Wyodrębnij składniki i ich wartości odżywcze. Zwróć dane po polsku.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA as any
      }
    });

    return JSON.parse(response.text || '{}');
  }
};