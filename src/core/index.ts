import {
  calTotalNutrition,
  calTotalMealNutrition,
  convertMealFoodsToRecord,
} from "./utils/index.js";

import type { Nutrition, Food, MealFood, Meal, MealType } from "./type/Meal.js";

import type {
  UnitNumber,
  CentiMeter,
  KiloGram,
  Gram,
  KiloCalorie,
} from "./type/Util.js";

import {
  createNutrition,
  createFood,
  createMeal,
  createMealFood,
} from "./entity/index.js";

import { refreshMealNutrition } from "./entity/index.js";

import {
  changeMealTips,
  changeMealFoods,
  changeMealFoodAmountById,
} from "./entity/index.js";

import { deleteMealFoodById } from "./entity/index.js";

//工具方法
export { calTotalNutrition, calTotalMealNutrition, convertMealFoodsToRecord };
//核心类型
export type { Nutrition, Food, MealFood, Meal, MealType };
export type { UnitNumber, CentiMeter, KiloGram, Gram, KiloCalorie };
//实体方法
export { createNutrition, createFood, createMeal, createMealFood };
export { refreshMealNutrition };
export { changeMealTips, changeMealFoods, changeMealFoodAmountById };
export { deleteMealFoodById };
