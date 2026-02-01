
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, RecipeSuggestion } from "../types";

// Funkcja pomocnicza do pobierania klucza API z różnych możliwych źródeł środowiskowych.
// Zgodnie z wytycznymi SDK, zawsze używamy obiektu { apiKey: string } podczas inicjalizacji.
const getAIClient = () => {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_AI_KEY || process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

export const geminiService = {
  async analyzeImage(base64Image: string): Promise<AnalysisResult> {
    const ai = getAIClient();
    
    const prompt = `Analyze this food image. Identify each food item and estimate its weight/quantity, calories, and macronutrients (protein, carbs, fats). Provide a summary. Return the data in Polish language.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] || base64Image } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
        }
      }
    });

    try {
      // Wyciągamy tekst bezpośrednio z właściwości .text (nie jako metodę .text())
      const resultText = response.text || '';
      return JSON.parse(resultText) as AnalysisResult;
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      throw new Error("Nie udało się przeanalizować zdjęcia. Spróbuj ponownie.");
    }
  },

  async generateRecipe(items: string[]): Promise<RecipeSuggestion> {
    const ai = getAIClient();
    const prompt = `Based on these ingredients: ${items.join(', ')}, suggest a healthy recipe. Return as JSON in Polish.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "ingredients", "instructions"]
        }
      }
    });

    const resultText = response.text || '';
    return JSON.parse(resultText) as RecipeSuggestion;
  }
};
