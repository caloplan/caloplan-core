import { describe, test } from "node:test";
import assert from "node:assert/strict";

import type {
  EntriesClient,
  MetadataEntry,
} from "../../sdk/meta-sdk/index.js";
import type { Food, Nutrition } from "../../core/model/index.js";
import { FoodRespository } from "./FoodRespository.js";

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

/** SDK 转换后的实体响应形态（camelCase），即 EntriesClient 方法的返回契约 */
function makeEntryResponse(): MetadataEntry {
  return {
    id: 1,
    typeName: "food",
    entityKey: "food-1",
    data: {
      id: "food-1",
      userId: "user-1",
      name: "rice",
      image: "rice.png",
      unit: { unit: "份", value: 1 },
      nutrition: makeNutrition(),
      createdTime: "2026-09-07T00:00:00.000+08:00",
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
  repo: FoodRespository;
  calls: Call[];
} {
  const { entries, calls } = makeEntries(overrides);
  return { repo: new FoodRespository({ entries }, userIdProvider), calls };
}

describe("FoodRespository", () => {
  test("create injects user_id from the login state and sends camelCase data", async () => {
    const { repo, calls } = makeRepo();
    const { user_id, ...foodInput } = food;

    const result = await repo.create(foodInput);

    assert.equal(result.user_id, "user-1");
    assert.notEqual(result, food);
    assert.equal(calls.length, 1);
    const [params] = calls[0]!.args as [Record<string, unknown>];
    assert.equal(params.typeName, "food");
    assert.equal(params.entityKey, "food-1");
    const data = params.data as Record<string, unknown>;
    assert.equal(data.id, "food-1");
    assert.equal(data.userId, "user-1");
    assert.equal(data.createdTime, "2026-09-07T00:00:00.000+08:00");
    assert.equal(data.name, "rice");
  });

  test("getById restores the food from the entry data", async () => {
    const { repo } = makeRepo({ get: async () => makeEntryResponse() });

    const result = await repo.getById("food-1");

    assert.deepEqual(result, food);
  });

  test("getById returns null when the food is missing (statusCode 404)", async () => {
    const { repo } = makeRepo({
      get: async () => {
        throw Object.assign(new Error("Not Found"), { statusCode: 404 });
      },
    });

    assert.equal(await repo.getById("food-1"), null);
  });

  test("getById rethrows non-404 errors", async () => {
    const { repo } = makeRepo({
      get: async () => {
        throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
      },
    });

    await assert.rejects(() => repo.getById("food-1"), /Forbidden/);
  });

  test("update injects user_id and sends the full food data to the entity key", async () => {
    const { repo, calls } = makeRepo();
    const { user_id, ...foodInput } = food;

    const result = await repo.update(foodInput);

    assert.equal(result.user_id, "user-1");
    const [typeName, entityKey, params] = calls[0]!.args as [
      string,
      string,
      Record<string, unknown>,
    ];
    assert.equal(typeName, "food");
    assert.equal(entityKey, "food-1");
    const data = params.data as Record<string, unknown>;
    assert.equal(data.userId, "user-1");
  });

  test("delete sends a DELETE request to the entity key", async () => {
    const { repo, calls } = makeRepo();

    await repo.delete("food-1");

    assert.deepEqual(calls[0]!.args, ["food", "food-1"]);
  });

  test("listMine queries with the injected user_id filter", async () => {
    const { repo, calls } = makeRepo({
      query: async () => ({ total: 1, items: [makeEntryResponse()] }),
    });

    const result = await repo.listMine();

    assert.equal(result.length, 1);
    assert.deepEqual(result[0], food);
    const [params] = calls[0]!.args as [Record<string, unknown>];
    assert.equal(params.typeName, "food");
    assert.deepEqual(params.filters, { user_id: "user-1" });
  });

  test("create throws when there is no valid login state and does not call the SDK", async () => {
    const { repo, calls } = makeRepo({}, () => null);
    const { user_id, ...foodInput } = food;

    await assert.rejects(() => repo.create(foodInput), /无法解析当前登录用户/);
    assert.equal(calls.length, 0);
  });
});
