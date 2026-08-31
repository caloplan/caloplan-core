import { describe, test } from "node:test";
import assert from "node:assert/strict";

import type { Food, MealFood, Nutrition } from "../type/Meal.js";
import {
  calTotalMealNutrition,
  calTotalNutrition,
  convertMealFoodsToRecord,
} from "./index.js";

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

function makeMealFood(over: Partial<MealFood> = {}): MealFood {
  return {
    food: makeFood(),
    amount: 1,
    nutrition: makeNutrition(),
    ...over,
  };
}

describe("calTotalNutrition", () => {
  test("scales every nutrition value by amount and keeps unit", () => {
    const food = makeFood();
    const result = calTotalNutrition(food, 3);

    assert.deepEqual(result.carbon, { unit: "kg", value: 3 });
    assert.deepEqual(result.protein, { unit: "kg", value: 6 });
    assert.deepEqual(result.fat, { unit: "kg", value: 9 });
    assert.deepEqual(result.salt, { unit: "g", value: 12 });
    assert.deepEqual(result.energy, { unit: "kcal", value: 1500 });
  });

  test("amount = 0 results in all-zero values", () => {
    const food = makeFood();
    const result = calTotalNutrition(food, 0);

    assert.equal(result.energy.value, 0);
    assert.equal(result.carbon.value, 0);
  });

  test("does not mutate the original food nutrition", () => {
    const food = makeFood();
    calTotalNutrition(food, 2);

    assert.equal(food.nutrition.energy.value, 500);
    assert.equal(food.nutrition.fat.value, 3);
  });
});

describe("calTotalMealNutrition", () => {
  test("sums nutrition values across multiple meal foods", () => {
    const mealFoods: MealFood[] = [
      makeMealFood({ food: makeFood(), nutrition: makeNutrition() }),
      makeMealFood({
        food: makeFood({ id: "food-2" }),
        nutrition: makeNutrition({ protein: { unit: "kg", value: 5 } }),
      }),
    ];

    const result = calTotalMealNutrition(mealFoods);

    assert.equal(result.energy.value, 1000);
    assert.equal(result.protein.value, 7);
    assert.equal(result.carbon.value, 2);
  });

  test("returns an empty object for an empty list", () => {
    assert.deepEqual(calTotalMealNutrition([]), {});
  });

  test("keeps the unit of the first occurrence for each nutrient", () => {
    const result = calTotalMealNutrition([
      makeMealFood({ food: makeFood(), nutrition: makeNutrition() }),
    ]);

    assert.equal(result.energy.unit, "kcal");
    assert.equal(result.salt.unit, "g");
  });
});

describe("convertMealFoodsToRecord", () => {
  test("maps meal foods to a record keyed by food id", () => {
    const foodA = makeFood();
    const foodB = makeFood({ id: "food-2" });
    const mealFoodA = makeMealFood({ food: foodA });
    const mealFoodB = makeMealFood({ food: foodB });

    const record = convertMealFoodsToRecord([mealFoodA, mealFoodB]);

    assert.equal(Object.keys(record).length, 2);
    assert.equal(record["food-1"], mealFoodA);
    assert.equal(record["food-2"], mealFoodB);
  });

  test("returns an empty record for an empty list", () => {
    assert.deepEqual(convertMealFoodsToRecord([]), {});
  });
});