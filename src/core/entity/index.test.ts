import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { DateTime } from "luxon";

import type { Food, Meal, MealFood, Nutrition } from "../type/Meal.js";
import {
  changeMealFoodAmountById,
  changeMealFoods,
  changeMealTips,
  createFood,
  createMeal,
  createMealFood,
  createNutrition,
  deleteMealFoodById,
  refreshMealNutrition,
} from "./index.js";
import { convertMealFoodsToRecord } from "../utils/index.js";

function makeNutrition(over: Partial<Nutrition> = {}): Nutrition {
  return {
    carbon: { unit: "kg", value: 1 },
    protein: { unit: "kg", value: 2 },
    fat: { unit: "kg", value: 3 },
    salt: { unit: "g", value: 4 },
    energy: { unit: "kcal", value: 500 },
    ...over,
  };
}

function makeFood(over: Partial<Food> = {}): Food {
  return {
    id: "food-1",
    user_id: "user-1",
    name: "rice",
    image: "",
    unit: { unit: "g", value: 100 },
    nutrition: makeNutrition(),
    created_time: "2026-01-01T00:00:00.000+08:00",
    ...over,
  };
}

function makeMeal(over: Partial<Meal> = {}): Meal {
  return {
    id: "meal-1",
    user_id: "user-1",
    tips: "",
    type: "breakfast",
    foods: convertMealFoodsToRecord([createMealFood(makeFood(), 1)]),
    nutrition: makeNutrition(),
    created_time: "2026-01-01T00:00:00.000+08:00",
    ...over,
  };
}

describe("createNutrition", () => {
  test("returns the given nutrition value as-is", () => {
    const nutrition = makeNutrition();
    assert.equal(createNutrition(nutrition), nutrition);
  });
});

describe("createFood", () => {
  test("fills in id, user_id and created_time and keeps the rest", () => {
    const food = createFood("user-1", {
      name: "milk",
      image: "milk.png",
      unit: { unit: "g", value: 250 },
      nutrition: makeNutrition({ energy: { unit: "kcal", value: 150 } }),
    });

    assert.equal(typeof food.id, "string");
    assert.ok(food.id.length > 0);
    assert.equal(food.user_id, "user-1");
    assert.equal(food.name, "milk");
    assert.equal(food.image, "milk.png");
    assert.deepEqual(food.unit, { unit: "g", value: 250 });
    assert.equal(food.nutrition.energy.value, 150);
    assert.equal(typeof food.created_time, "string");
    assert.ok(DateTime.fromISO(food.created_time as string).isValid);
  });

  test("generates a unique id for each food", () => {
    const base = {
      name: "apple",
      image: "",
      unit: { unit: "g", value: 1 },
      nutrition: makeNutrition(),
    };
    const foodA = createFood("user-1", base);
    const foodB = createFood("user-1", base);

    assert.notEqual(foodA.id, foodB.id);
  });
});

describe("createMealFood", () => {
  test("stores food and amount and computes the scaled nutrition", () => {
    const food = makeFood();
    const mealFood = createMealFood(food, 3);

    assert.equal(mealFood.food, food);
    assert.equal(mealFood.amount, 3);
    assert.deepEqual(mealFood.nutrition.energy, { unit: "kcal", value: 1500 });
  });
});

describe("createMeal", () => {
  test("builds a meal with record foods, total nutrition and ISO time", () => {
    const mealFoods: MealFood[] = [createMealFood(makeFood(), 2)];
    const meal = createMeal("user-1", mealFoods, "high protein", "dinner");

    assert.ok(meal.id.length > 0);
    assert.equal(meal.user_id, "user-1");
    assert.equal(meal.tips, "high protein");
    assert.equal(meal.type, "dinner");
    assert.ok(meal.foods["food-1"]);
    assert.equal(meal.nutrition.energy.value, 1000);
    assert.ok(DateTime.fromISO(meal.created_time as string).isValid);
  });
});

describe("refreshMealNutrition", () => {
  test("re-computes meal nutrition from the current foods", () => {
    const meal = makeMeal();
    meal.foods = convertMealFoodsToRecord([createMealFood(makeFood(), 3)]);

    refreshMealNutrition(meal);

    assert.equal(meal.nutrition.energy.value, 1500);
  });
});
describe("changeMealTips", () => {
  test("updates the meal tips", () => {
    const meal = makeMeal();
    changeMealTips(meal, "drink more water");
    assert.equal(meal.tips, "drink more water");
  });
});

describe("changeMealFoods", () => {
  test("replaces the foods and refreshes the total nutrition", () => {
    const meal = makeMeal();
    const foods: Record<string, MealFood> = {
      "food-2": createMealFood(makeFood({ id: "food-2" }), 2),
    };

    changeMealFoods(meal, foods);

    assert.deepEqual(meal.foods, foods);
    assert.equal(Object.keys(meal.foods).length, 1);
    assert.equal(meal.nutrition.energy.value, 1000);
  });
});

describe("changeMealFoodAmountById", () => {
  test("updates the matched food amount and nutrition and refreshes the meal", () => {
    const food = makeFood();
    const meal = makeMeal({
      foods: convertMealFoodsToRecord([createMealFood(food, 1)]),
    });

    changeMealFoodAmountById(meal, food.id, 4);

    const target = meal.foods[food.id]!;
    assert.equal(target.amount, 4);
    assert.equal(target.nutrition.energy.value, 2000);
    assert.equal(meal.nutrition.energy.value, 2000);
  });

  test("does nothing when the id does not exist", () => {
    const meal = makeMeal();
    const before = JSON.stringify(meal);

    changeMealFoodAmountById(meal, "missing-id", 10);

    assert.equal(JSON.stringify(meal), before);
  });
});

describe("deleteMealFoodById", () => {
  test("removes the food and refreshes the meal nutrition", () => {
    const foodA = makeFood();
    const foodB = makeFood({ id: "food-2" });
    const meal = makeMeal({
      nutrition: makeNutrition({ energy: { unit: "kcal", value: 0 } }),
      foods: convertMealFoodsToRecord([
        createMealFood(foodA, 1),
        createMealFood(foodB, 1),
      ]),
    });

    deleteMealFoodById(meal, foodA.id);

    assert.equal(meal.foods[foodA.id], undefined);
    assert.equal(Object.keys(meal.foods).length, 1);
    assert.equal(meal.nutrition.energy.value, 500);
  });

  test("is a no-op for an unknown id", () => {
    const meal = makeMeal();
    const before = JSON.stringify(meal);

    deleteMealFoodById(meal, "missing-id");

    assert.equal(JSON.stringify(meal), before);
  });
});