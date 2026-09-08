import type { Food, Nutrition } from "./food.js";

export interface MealFood {
  food: Food;
  amount: number;
  nutrition: Nutrition;
}

export type MealType = "breakfast" | "launch" | "dinner" | "snack";

export interface Meal {
  id: string;
  user_id: string;
  tips: string;
  type: MealType;
  foods: Record<string, MealFood>;
  nutrition: Nutrition;
  created_time: string;
}
