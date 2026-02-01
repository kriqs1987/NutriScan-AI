
export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity?: string;
}

export interface AnalysisResult {
  items: Omit<FoodItem, 'id'>[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  confidence: number;
}

export interface DiaryEntry {
  id: string;
  date: string;
  mealName: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  imageUrl?: string;
  recipe?: string;
}

export interface RecipeSuggestion {
  title: string;
  ingredients: string[];
  instructions: string[];
}

export type ViewType = 'dashboard' | 'analyze' | 'history';
