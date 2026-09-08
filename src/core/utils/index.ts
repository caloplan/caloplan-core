import type { Nutrition, Food, Meal, MealFood } from "../model/index.js";

export function calTotalNutrition(food: Food, amount: number): Nutrition {
  const result = {} as Nutrition;
  Object.entries(food.nutrition).forEach(([key, unitNutrition]) => {
    (result as any)[key as keyof Nutrition] = {
      unit: unitNutrition.unit,
      value: unitNutrition.value * amount,
    };
  });
  return result;
}

export function calTotalMealNutrition(meal_foods: MealFood[]): Nutrition {
  const result = {} as Nutrition;
  meal_foods.forEach((meal_food: MealFood) => {
    Object.entries(meal_food.nutrition).forEach(([key, totalNutrition]) => {
      const nutritionKey = key as keyof Nutrition;
      (result as any)[nutritionKey] ??= {
        unit: totalNutrition.unit,
        value: 0,
      };
      result[nutritionKey].value += totalNutrition.value;
    });
  });
  return result;
}

export function convertMealFoodsToRecord(
  meal_foods: MealFood[],
): Record<string, MealFood> {
  const result = {} as Record<string, MealFood>;
  meal_foods.forEach((meal_food) => {
    result[meal_food.food.id] = meal_food;
  });
  return result;
}
