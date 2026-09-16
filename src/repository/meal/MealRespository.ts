import type { MetaSdkLike } from "../../sdk/meta-sdk/index.js";
import type {
  Food,
  Meal,
  MealFood,
  MealType,
  Nutrition,
  UnitNumber,
} from "../../core/model/index.js";
import type { UserIdProvider } from "../type.js";
import { isNotFoundError } from "../type.js";

/** meta 微服务中 meal 类型的 type_name */
const MEAL_TYPE_NAME = "meal";

/**
 * Meal 中 Food 快照（存储层）。
 * 写入 Meal 时固化；读取时直接由快照还原 MealFood，不根据 foodId 反查 Food。
 */
interface MealFoodSnapshot {
  foodId: string;
  name: string;
  image: string;
  unit: UnitNumber;
  amount: number;
  /** 创建 Meal 时按 amount × 单位营养计算得到的总营养快照 */
  nutrition: Nutrition;
}

/** 存储层 Meal 数据（camelCase，落库为 snake_case） */
interface MealData {
  id: string;
  userId: string;
  tips: string;
  type: string;
  foods: Record<string, MealFoodSnapshot>;
  nutrition: Nutrition;
  createdTime: string;
}

/** core MealFood → 存储快照 */
function toSnapshot(mealFood: MealFood): MealFoodSnapshot {
  return {
    foodId: mealFood.food.id,
    name: mealFood.food.name,
    image: mealFood.food.image,
    unit: mealFood.food.unit,
    amount: mealFood.amount,
    nutrition: mealFood.nutrition,
  };
}

/** core Meal → 存储 data（camelCase） */
/** 存储层 createdTime 统一存 'yyyy-mm-dd'：便于 meta 服务端按日期精确过滤（json_extract 等值匹配）*/
function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function toMealData(meal: Meal): MealData {
  const foods: Record<string, MealFoodSnapshot> = {};
  for (const [id, mealFood] of Object.entries(meal.foods)) {
    foods[id] = toSnapshot(mealFood);
  }
  return {
    id: String(meal.id),
    userId: meal.user_id,
    // core Meal.tips / created_time 为 String 包装类型，统一转 string
    tips: String(meal.tips),
    type: meal.type,
    foods,
    nutrition: meal.nutrition,
    createdTime: toDateOnly(String(meal.created_time)),
  };
}

/** 由总营养快照反推单位营养（amount 为 0 时无法反推，值置 0） */
function divideNutrition(nutrition: Nutrition, amount: number): Nutrition {
  const result = {} as Nutrition;
  Object.entries(nutrition).forEach(([key, n]) => {
    (result as any)[key as keyof Nutrition] = {
      unit: n.unit,
      value: amount > 0 ? n.value / amount : 0,
    };
  });
  return result;
}

/**
 * 从快照直接还原 MealFood。
 * - nutrition 直接用快照（不重新计算）
 * - food 由快照字段还原，user_id / created_time 快照中无此信息，用 Meal 的兜底
 */
function toMealFood(meal: Meal, snapshot: MealFoodSnapshot): MealFood {
  return {
    food: {
      id: snapshot.foodId,
      user_id: meal.user_id,
      name: snapshot.name,
      image: snapshot.image,
      unit: snapshot.unit,
      nutrition: divideNutrition(snapshot.nutrition, snapshot.amount),
      created_time: meal.created_time,
    },
    amount: snapshot.amount,
    nutrition: snapshot.nutrition,
  };
}

/** 存储 data → core Meal（entityKey 即 Meal.id） */
function toMeal(entityKey: string, data: MealData): Meal {
  const meal: Meal = {
    id: entityKey,
    user_id: data.userId,
    tips: data.tips,
    type: data.type as MealType,
    foods: {},
    nutrition: data.nutrition,
    created_time: data.createdTime,
  };
  for (const [id, snapshot] of Object.entries(data.foods)) {
    meal.foods[id] = toMealFood(meal, snapshot);
  }
  return meal;
}

export class MealRespository {
  private readonly sdk: MetaSdkLike;
  private readonly userIdProvider: UserIdProvider;

  constructor(sdk: MetaSdkLike, userIdProvider: UserIdProvider) {
    this.sdk = sdk;
    this.userIdProvider = userIdProvider;
  }

  /** 解析当前登录用户；无有效登录态时抛错 */
  private async resolveUserId(): Promise<string> {
    const userId = await this.userIdProvider();
    if (userId == null || userId === "") {
      throw new Error("无法解析当前登录用户：userIdProvider 返回空");
    }
    return userId;
  }

  /** 创建 Meal，entityKey 使用 Meal.id；MealFood 以快照形式落库；user_id 由登录状态自动注入 */
  async create(meal: Omit<Meal, "user_id">): Promise<Meal> {
    const fullMeal = { ...meal, user_id: await this.resolveUserId() };
    await this.sdk.entries.create({
      typeName: MEAL_TYPE_NAME,
      entityKey: String(fullMeal.id),
      data: toMealData(fullMeal) as unknown as Record<string, unknown>,
    });
    return fullMeal;
  }

  /** 按 id 查询 Meal，不存在返回 null；MealFood 由快照直接还原 */
  async getById(id: string): Promise<Meal | null> {
    try {
      const entry = await this.sdk.entries.get(MEAL_TYPE_NAME, id);
      return toMeal(entry.entityKey, entry.data as unknown as MealData);
    } catch (err) {
      if (isNotFoundError(err)) return null;
      throw err;
    }
  }

  /** 整体更新 Meal（后端 deep merge，全量字段覆盖语义）；user_id 由登录状态自动注入 */
  async update(meal: Omit<Meal, "user_id">): Promise<Meal> {
    const fullMeal = { ...meal, user_id: await this.resolveUserId() };
    await this.sdk.entries.update(MEAL_TYPE_NAME, String(fullMeal.id), {
      data: toMealData(fullMeal) as unknown as Record<string, unknown>,
    });
    return fullMeal;
  }

  /** 软删除 Meal */
  async delete(id: string): Promise<void> {
    await this.sdk.entries.delete(MEAL_TYPE_NAME, id);
  }

  /** 查询当前登录用户的 Meal 列表（filters 原样透传，落库字段为 snake_case，故使用 user_id） */
  async listMine(options?: { date?: string }): Promise<Meal[]> {
    const userId = await this.resolveUserId();
    const filters: Record<string, unknown> = { user_id: userId };
    if (options?.date) {
      // 落库 created_time 为 'yyyy-mm-dd'，可直接精确过滤
      filters.created_time = options.date;
    }
    const { items } = await this.sdk.entries.query({
      typeName: MEAL_TYPE_NAME,
      filters,
    });
    return items.map((item) => toMeal(item.entityKey, item.data as unknown as MealData));
  }
}
