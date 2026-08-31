import { nanoid } from "nanoid";
import type { Nutrition, Food, MealFood, Meal } from "../entity/Meal.js";
import type { MealType } from "../entity/Meal.js";
import { DateTime } from "luxon";
import { calTotalMealNutrition, calTotalNutrition } from "../utils/index.js";

function createNutrition(nutrition: Nutrition): Nutrition {
  return nutrition;
}

function createFood(
  user_id: string,
  food: Omit<Food, "id" | "created_time" | "user_id">,
): Food {
  return {
    id: nanoid(),
    user_id: user_id,
    created_time: DateTime.now().toISO(),
    ...food,
  };
}

function createMealFood(food: Food, amount: number): MealFood {
  return {
    food: food,
    amount: amount,
    created_time: DateTime.now().toISO(),
    nutrition: calTotalNutrition(food, amount),
  };
}

function createMeal(
  user_id: string,
  foods: MealFood[],
  tips: String,
  type: MealType,
): Meal {
  return {
    id: nanoid(),
    user_id: user_id,
    tips: tips,
    type: type,
    foods: foods,
    nutrition: calTotalMealNutrition(foods),
    created_time: DateTime.now().toISO(),
  };
}

export { createNutrition, createFood, createMealFood, createMeal };
