import type { Unit } from "./Util.js";
import type { DateTime } from "luxon";
export interface Nutrition {
  carbon: Unit;
  protein: Unit;
  fat: Unit;
  salt: Unit;
  energy: Unit;
}

export interface Food {
  id: String;
  name: String;
  unit: Unit;
  nutrition: Nutrition;
  created_time: DateTime;
}

export interface MealFood {
  food: Food;
  amount: number;
  nutrition: Nutrition;
  created_time: DateTime;
}

export type MealType = "breakfast" | "launch" | "dinner" | "snack";

export interface Meal {
  id: String;
  tips: String;
  type: MealType;
  foods: MealFood[];
  nutrition: Nutrition;
  created_time: DateTime;
}
