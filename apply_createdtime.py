# -*- coding: utf-8 -*-
"""caloplan-core: createdTime 存储 yyyy-mm-dd + listMine 精确匹配 + 测试更新"""
import io

REPO = r"D:\Xia_Project\RNProject\caloplan-core\src\repository\meal\MealRespository.ts"
TEST = r"D:\Xia_Project\RNProject\caloplan-core\src\repository\meal\MealRespository.test.ts"

# ---------- 1. MealRespository.ts ----------
with io.open(REPO, "r", encoding="utf-8") as f:
    c = f.read()

# 1a. toMealData: createdTime 存日期
old_tmd = "    createdTime: String(meal.created_time),"
new_tmd = (
    "    // 初期约定：createdTime 存储 yyyy-mm-dd，便于按日期精确过滤查询\n"
    "    createdTime: String(meal.created_time).slice(0, 10),"
)
assert old_tmd in c, "toMealData pattern missing"
c = c.replace(old_tmd, new_tmd)

# 1b. listMine: date 参数改为 filters.createdTime 精确匹配
old_lm = """    const userId = await this.resolveUserId();
    const query: {
      typeName: string;
      filters: Record<string, unknown>;
      createdAfter?: string;
      createdBefore?: string;
    } = {
      typeName: MEAL_TYPE_NAME,
      filters: { user_id: userId },
    };
    if (options?.date) {
      query.createdAfter = `${options.date}T00:00:00.000`;
      query.createdBefore = `${options.date}T23:59:59.999`;
    }
    const { items } = await this.sdk.entries.query(query);
    return items.map((item) => toMeal(item.entityKey, item.data as unknown as MealData));
  }"""
new_lm = """    const userId = await this.resolveUserId();
    const filters: Record<string, unknown> = { user_id: userId };
    if (options?.date) {
      // createdTime 存储 yyyy-mm-dd，可直接精确匹配当天
      filters.createdTime = options.date;
    }
    const { items } = await this.sdk.entries.query({
      typeName: MEAL_TYPE_NAME,
      filters,
    });
    return items.map((item) => toMeal(item.entityKey, item.data as unknown as MealData));
  }"""
assert old_lm in c, "listMine pattern missing"
c = c.replace(old_lm, new_lm)

with io.open(REPO, "w", encoding="utf-8", newline="") as f:
    f.write(c)
print("MealRespository.ts updated")

# ---------- 2. 测试更新 ----------
with io.open(TEST, "r", encoding="utf-8") as f:
    t = f.read()

# 2a. mock entry data: createdTime 用日期
old_mock = "      createdTime: meal.created_time,"
new_mock = "      createdTime: meal.created_time.slice(0, 10),"
assert old_mock in t, "mock pattern missing"
t = t.replace(old_mock, new_mock)

# 2b. create 断言
old_ca = '    assert.equal(data.createdTime, meal.created_time);'
new_ca = '    assert.equal(data.createdTime, meal.created_time.slice(0, 10));'
assert old_ca in t, "create assert pattern missing"
t = t.replace(old_ca, new_ca)

# 2c. getById 断言
old_ga = '    assert.equal(result.created_time, meal.created_time);'
new_ga = '    assert.equal(result.created_time, meal.created_time.slice(0, 10));'
assert old_ga in t, "getById assert pattern missing"
t = t.replace(old_ga, new_ga)

# 2d. 新增 date 过滤测试（加在 listMine 测试后）
anchor = """    assert.deepEqual(params.filters, { user_id: "user-1" });
  });"""
new_test = """    assert.deepEqual(params.filters, { user_id: "user-1" });
  });

  test("listMine with date filters createdTime exactly", async () => {
    const meal = makeMeal();
    const { repo, calls } = makeRepo({
      query: async () => ({ total: 1, items: [makeEntryResponse(meal)] }),
    });

    const result = await repo.listMine({ date: "2026-09-16" });

    assert.equal(result.length, 1);
    const [params] = calls[0]!.args as [Record<string, unknown>];
    assert.deepEqual(params.filters, { user_id: "user-1", createdTime: "2026-09-16" });
  });"""
assert anchor in t, "listMine test anchor missing"
t = t.replace(anchor, new_test)

with io.open(TEST, "w", encoding="utf-8", newline="") as f:
    f.write(t)
print("MealRespository.test.ts updated")
