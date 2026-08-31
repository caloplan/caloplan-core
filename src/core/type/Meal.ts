import type { Gram, KiloGram, KiloCalorie, UnitNumber } from "./Util.js";

export interface Nutrition {
  carbon: KiloGram;
  protein: KiloGram;
  fat: KiloGram;
  salt: Gram;
  energy: KiloCalorie;
}

export interface Food {
  id: string;
  user_id: string;
  name: string;
  image: string;
  unit: UnitNumber;
  nutrition: Nutrition;
  created_time: String;
}

export interface MealFood {
  food: Food;
  amount: number;
  nutrition: Nutrition;
}

export type MealType = "breakfast" | "launch" | "dinner" | "snack";

export interface Meal {
  id: String;
  user_id: string;
  tips: String;
  type: MealType;
  foods: Record<string, MealFood>;
  nutrition: Nutrition;
  created_time: String;
}
