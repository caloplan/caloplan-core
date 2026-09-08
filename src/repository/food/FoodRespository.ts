import type { MetaSdkLike } from "../../sdk/meta-sdk/index.js";
import type { Food, Nutrition } from "../../core/model/index.js";
import type { UnitNumber } from "../../core/model/index.js";
import type { UserIdProvider } from "../type.js";
import { isNotFoundError } from "../type.js";

/** meta 微服务中 food 类型的 type_name */
const FOOD_TYPE_NAME = "food";

/**
 * 存储层 Food 数据（camelCase，与 MetaSDK 契约一致）。
 * SDK 发送时对请求体递归 camelToSnake，落库字段为 snake_case（user_id / created_time）。
 */
interface FoodData {
  id: string;
  userId: string;
  name: string;
  image: string;
  unit: UnitNumber;
  nutrition: Nutrition;
  createdTime: string;
}

/** core Food → 存储 data（camelCase） */
function toFoodData(food: Food): FoodData {
  return {
    id: food.id,
    userId: food.user_id,
    name: food.name,
    image: food.image,
    unit: food.unit,
    nutrition: food.nutrition,
    // core Food.created_time 为 String 包装类型，统一转 string
    createdTime: String(food.created_time),
  };
}

/** 存储 data → core Food（entityKey 即 Food.id） */
function toFood(entityKey: string, data: FoodData): Food {
  return {
    id: entityKey,
    user_id: data.userId,
    name: data.name,
    image: data.image,
    unit: data.unit,
    nutrition: data.nutrition,
    created_time: data.createdTime,
  };
}

export class FoodRespository {
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

  /** 创建 Food，entityKey 使用 Food.id；user_id 由登录状态自动注入 */
  async create(food: Omit<Food, "user_id">): Promise<Food> {
    const fullFood = { ...food, user_id: await this.resolveUserId() };
    await this.sdk.entries.create({
      typeName: FOOD_TYPE_NAME,
      entityKey: fullFood.id,
      data: toFoodData(fullFood) as unknown as Record<string, unknown>,
    });
    return fullFood;
  }

  /** 按 id 查询 Food，不存在返回 null */
  async getById(id: string): Promise<Food | null> {
    try {
      const entry = await this.sdk.entries.get(FOOD_TYPE_NAME, id);
      return toFood(entry.entityKey, entry.data as unknown as FoodData);
    } catch (err) {
      if (isNotFoundError(err)) return null;
      throw err;
    }
  }

  /** 整体更新 Food（后端 deep merge，全量字段覆盖语义）；user_id 由登录状态自动注入 */
  async update(food: Omit<Food, "user_id">): Promise<Food> {
    const fullFood = { ...food, user_id: await this.resolveUserId() };
    await this.sdk.entries.update(FOOD_TYPE_NAME, fullFood.id, {
      data: toFoodData(fullFood) as unknown as Record<string, unknown>,
    });
    return fullFood;
  }

  /** 软删除 Food */
  async delete(id: string): Promise<void> {
    await this.sdk.entries.delete(FOOD_TYPE_NAME, id);
  }

  /** 查询当前登录用户的 Food 列表（filters 原样透传，落库字段为 snake_case，故使用 user_id） */
  async listMine(): Promise<Food[]> {
    const userId = await this.resolveUserId();
    const { items } = await this.sdk.entries.query({
      typeName: FOOD_TYPE_NAME,
      filters: { user_id: userId },
    });
    return items.map((item) => toFood(item.entityKey, item.data as unknown as FoodData));
  }
}
