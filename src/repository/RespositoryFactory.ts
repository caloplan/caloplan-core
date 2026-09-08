import type { MetaSdkLike } from "../sdk/meta-sdk/index.js";
import { FoodRespository } from "./food/FoodRespository.js";
import { MealRespository } from "./meal/MealRespository.js";
import type { UserIdProvider } from "./type.js";

/**
 * Repository 工厂：统一注入 MetaSDK 实例并组装各 Repository。
 * - MetaSDK 由调用方创建并传入（含 httpClient / 认证等全部配置），本库只依赖其类型契约
 * - 认证（token / tokenProvider）与登录态（userIdProvider）均由调用方提供，Factory 与 Repository 不实现认证逻辑
 * - userIdProvider 用于写操作与按用户查询时自动注入 user_id
 */
export class RespositoryFactory {
  readonly food: FoodRespository;
  readonly meal: MealRespository;

  private readonly sdk: MetaSdkLike;

  constructor(sdk: MetaSdkLike, userIdProvider: UserIdProvider) {
    this.sdk = sdk;
    this.food = new FoodRespository(this.sdk, userIdProvider);
    this.meal = new MealRespository(this.sdk, userIdProvider);
  }
}
