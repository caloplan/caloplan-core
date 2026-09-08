// 领域模型（纯类型定义）
export type {
  Nutrition,
  Food,
  MealFood,
  Meal,
  MealType,
} from "./model/index.js";
export type {
  UnitNumber,
  CentiMeter,
  KiloGram,
  Gram,
  KiloCalorie,
} from "./model/index.js";

// 领域实体行为（工厂与变更操作）
export {
  createNutrition,
  createFood,
  createMealFood,
  createMeal,
  refreshMealNutrition,
  changeMealTips,
  changeMealFoods,
  changeMealFoodAmountById,
  deleteMealFoodById,
} from "./entity/index.js";

// 工具函数
export {
  calTotalNutrition,
  calTotalMealNutrition,
  convertMealFoodsToRecord,
} from "./utils/index.js";
