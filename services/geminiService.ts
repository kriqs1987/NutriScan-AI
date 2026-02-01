
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, RecipeSuggestion } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

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
    const ai = getAIClient();
    const prompt = `Analyze this food image. Identify each food item and estimate its weight/quantity, calories, and macronutrients (protein, carbs, fats). Provide a summary. Return the data in Polish language.`;

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

    try {
      return JSON.parse(response.text || '') as AnalysisResult;
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      throw new Error("Nie udało się przeanalizować zdjęcia.");
    }
  },

  async estimateNutrition(productName: string) {
    const ai = getAIClient();
    const prompt = `Podaj szacunkowe wartości odżywcze dla produktu: "${productName}" (standardowa porcja 100g lub 1 sztuka). Zwróć format JSON: { "calories": number, "protein": number, "carbs": number, "fats": number, "quantity": string }. Język polski.`;
    
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
    
    return JSON.parse(response.text || '');
  },

  async analyzeText(text: string): Promise<AnalysisResult> {
    const ai = getAIClient();
    const prompt = `Przeanalizuj opis posiłku: "${text}". Wyodrębnij składniki, oszacuj ich kalorie i makroskładniki (białko, węgle, tłuszcze). Zwróć dane w formacie JSON po polsku.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA as any
      }
    });

    try {
      return JSON.parse(response.text || '') as AnalysisResult;
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      throw new Error("Nie udało się przeanalizować tekstu.");
    }
  }
};
