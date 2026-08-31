import { nanoid } from "nanoid";
import type { Nutrition, Food, MealFood, Meal } from "../type/Meal.js";
import type { MealType } from "../type/Meal.js";
import { DateTime } from "luxon";
import {
  calTotalMealNutrition,
  calTotalNutrition,
  convertMealFoodsToRecord,
} from "../utils/index.js";

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
    nutrition: calTotalNutrition(food, amount),
  };
}

function createMeal(
  user_id: string,
  foods: MealFood[],
  tips: string,
  type: MealType,
): Meal {
  return {
    id: nanoid(),
    user_id: user_id,
    tips: tips,
    type: type,
    foods: convertMealFoodsToRecord(foods),
    nutrition: calTotalMealNutrition(foods),
    created_time: DateTime.now().toISO(),
  };
}

function refreshMealNutrition(meal: Meal): void {
  meal.nutrition = calTotalMealNutrition(Object.values(meal.foods));
}

function changeMealTips(meal: Meal, tips: string): void {
  meal.tips = tips;
}

function changeMealFoods(meal: Meal, foods: Record<string, MealFood>): void {
  meal.foods = { ...foods };
  refreshMealNutrition(meal);
}

function changeMealFoodAmountById(
  meal: Meal,
  id: string,
  amount: number,
): void {
  const target_meal_food = meal.foods[id];
  if (target_meal_food == null) return;
  const new_meal_food = {
    ...target_meal_food,
    amount: amount,
    nutrition: calTotalNutrition(target_meal_food.food, amount),
  };
  meal.foods[id] = new_meal_food;
  refreshMealNutrition(meal);
}

function deleteMealFoodById(meal: Meal, id: string): void {
  delete meal.foods[id];
  refreshMealNutrition(meal);
}

export { createNutrition, createFood, createMealFood, createMeal };
export { refreshMealNutrition };
export { changeMealTips, changeMealFoods, changeMealFoodAmountById };
export { deleteMealFoodById };
