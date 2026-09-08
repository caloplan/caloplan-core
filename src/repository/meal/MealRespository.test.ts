import { describe, test } from "node:test";
import assert from "node:assert/strict";

import type {
  EntriesClient,
  MetadataEntry,
} from "../../sdk/meta-sdk/index.js";
import type { Food, Meal, MealType, Nutrition } from "../../core/model/index.js";
import { createMealFood, createMeal } from "../../core/entity/index.js";
import { MealRespository } from "./MealRespository.js";

function makeNutrition(): Nutrition {
  return {
    carbon: { unit: "kg", value: 0.5 },
    protein: { unit: "kg", value: 0.1 },
    fat: { unit: "kg", value: 0.02 },
    salt: { unit: "g", value: 0.5 },
    energy: { unit: "kcal", value: 500 },
  };
}

const food: Food = {
  id: "food-1",
  user_id: "user-1",
  name: "rice",
  image: "rice.png",
  unit: { unit: "份", value: 1 },
  nutrition: makeNutrition(),
  created_time: "2026-09-07T00:00:00.000+08:00",
};

function makeMeal(): Meal {
  return createMeal(
    "user-1",
    [createMealFood(food, 2)],
    "high protein",
    "dinner",
  );
}

/** SDK 转换后的实体响应形态（camelCase），即 EntriesClient 方法的返回契约 */
function makeEntryResponse(meal: Meal): MetadataEntry {
  const snapshot = {
    foodId: "food-1",
    name: "rice",
    image: "rice.png",
    unit: { unit: "份", value: 1 },
    amount: 2,
    nutrition: meal.foods["food-1"]!.nutrition,
  };
  return {
    id: 1,
    typeName: "meal",
    entityKey: meal.id,
    data: {
      id: meal.id,
      userId: "user-1",
      tips: "high protein",
      type: "dinner",
      foods: { "food-1": snapshot },
      nutrition: meal.nutrition,
      createdTime: meal.created_time,
    },
    tags: [],
    version: 1,
    ownerUserId: 1,
    serviceName: "caloplan",
    createdAt: "2026-09-07T00:00:00.000+08:00",
    updatedAt: null,
  };
}

interface Call {
  method: string;
  args: unknown[];
}

/** 记录所有调用（含 override 行为），并按需委托给覆盖实现的 entries 契约 stub */
function makeEntries(overrides: Partial<EntriesClient> = {}): {
  entries: EntriesClient;
  calls: Call[];
} {
  const calls: Call[] = [];
  const base: EntriesClient = {
    create: async () => ({} as MetadataEntry),
    get: async () => ({} as MetadataEntry),
    update: async () => ({} as MetadataEntry),
    delete: async () => {},
    query: async () => ({ total: 0, items: [] }),
  };
  const entries = {} as EntriesClient;
  (Object.keys(base) as (keyof EntriesClient)[]).forEach((key) => {
    entries[key] = (async (...args: unknown[]) => {
      calls.push({ method: key, args });
      const impl = overrides[key] ?? base[key];
      return (impl as (...a: unknown[]) => unknown)(...args);
    }) as never;
  });
  return { entries, calls };
}

function makeRepo(
  overrides: Partial<EntriesClient> = {},
  userIdProvider: () => string | null | Promise<string | null> = () => "user-1",
): {
  repo: MealRespository;
  calls: Call[];
} {
  const { entries, calls } = makeEntries(overrides);
  return { repo: new MealRespository({ entries }, userIdProvider), calls };
}

describe("MealRespository", () => {
  test("create injects user_id and persists MealFood as a flattened snapshot", async () => {
    const meal = makeMeal();
    const { repo, calls } = makeRepo();
    const { user_id, ...mealInput } = meal;

    const result = await repo.create(mealInput);

    assert.equal(result.user_id, "user-1");
    assert.notEqual(result, meal);
    assert.equal(calls.length, 1);
    const [params] = calls[0]!.args as [Record<string, unknown>];
    assert.equal(params.typeName, "meal");
    assert.equal(params.entityKey, meal.id);
    const data = params.data as Record<string, unknown>;
    assert.equal(data.id, meal.id);
    assert.equal(data.userId, "user-1");
    assert.equal(data.tips, "high protein");
    assert.equal(data.createdTime, meal.created_time);

    const snapshot = (data.foods as Record<string, unknown>)["food-1"] as Record<
      string,
      unknown
    >;
    assert.equal(snapshot.foodId, "food-1");
    assert.equal(snapshot.name, "rice");
    assert.equal(snapshot.image, "rice.png");
    assert.deepEqual(snapshot.unit, { unit: "份", value: 1 });
    assert.equal(snapshot.amount, 2);
    // 快照 nutrition 是创建时算好的总营养（500 × 2）
    assert.deepEqual(snapshot.nutrition, meal.foods["food-1"]!.nutrition);
    // 快照中没有多余的 food 整体对象
    assert.equal("food" in snapshot, false);
  });

  test("getById restores MealFood directly from the snapshot", async () => {
    const meal = makeMeal();
    const { repo } = makeRepo({ get: async () => makeEntryResponse(meal) });

    const result = await repo.getById(String(meal.id));

    assert.ok(result);
    assert.equal(result.id, meal.id);
    assert.equal(result.user_id, "user-1");
    assert.equal(result.tips, "high protein");
    assert.equal(result.type as MealType, "dinner");
    assert.deepEqual(result.nutrition, meal.nutrition);

    const mf = result.foods["food-1"];
    assert.ok(mf);
    assert.equal(mf.amount, 2);
    // 总营养直接使用快照，不重新计算
    assert.deepEqual(mf.nutrition, meal.foods["food-1"]!.nutrition);
    // food 由快照还原：单位营养 = 快照 / amount（1000 / 2 = 500，即原单位营养）
    assert.equal(mf.food.id, "food-1");
    assert.equal(mf.food.name, "rice");
    assert.equal(mf.food.image, "rice.png");
    assert.deepEqual(mf.food.unit, { unit: "份", value: 1 });
    assert.equal(mf.food.nutrition.energy.value, 500);
    // 快照无 user_id / created_time，用 meal 兜底
    assert.equal(mf.food.user_id, "user-1");
    assert.equal(mf.food.created_time, meal.created_time);
  });

  test("getById returns null when the meal is missing (statusCode 404)", async () => {
    const { repo } = makeRepo({
      get: async () => {
        throw Object.assign(new Error("Not Found"), { statusCode: 404 });
      },
    });

    assert.equal(await repo.getById("meal-1"), null);
  });

  test("update injects user_id and sends the full meal data to the entity key", async () => {
    const meal = makeMeal();
    const { repo, calls } = makeRepo();
    const { user_id, ...mealInput } = meal;

    const result = await repo.update(mealInput);

    assert.equal(result.user_id, "user-1");
    const [typeName, entityKey, params] = calls[0]!.args as [
      string,
      string,
      Record<string, unknown>,
    ];
    assert.equal(typeName, "meal");
    assert.equal(entityKey, meal.id);
    const data = params.data as Record<string, unknown>;
    assert.equal(data.userId, "user-1");
    assert.ok((data.foods as Record<string, unknown>)["food-1"]);
  });

  test("listMine queries with the injected user_id filter", async () => {
    const meal = makeMeal();
    const { repo, calls } = makeRepo({
      query: async () => ({ total: 1, items: [makeEntryResponse(meal)] }),
    });

    const result = await repo.listMine();

    assert.equal(result.length, 1);
    const [params] = calls[0]!.args as [Record<string, unknown>];
    assert.equal(params.typeName, "meal");
    assert.deepEqual(params.filters, { user_id: "user-1" });
  });

  test("create throws when there is no valid login state and does not call the SDK", async () => {
    const { repo, calls } = makeRepo({}, () => null);
    const meal = makeMeal();
    const { user_id, ...mealInput } = meal;

    await assert.rejects(() => repo.create(mealInput), /无法解析当前登录用户/);
    assert.equal(calls.length, 0);
  });
});
