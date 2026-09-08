import { RespositoryFactory } from "./repository/RespositoryFactory.js";
import type { MetaSdkLike } from "./sdk/meta-sdk/index.js";
import type { UserIdProvider } from "./repository/type.js";

let instance: RespositoryFactory | null = null;

/**
 * 初始化 caloplan-core 单例：注入外部 MetaSDK 实例与登录态提供器。
 * - sdk: 由调用方创建并传入（本库只依赖其类型契约，不包含 SDK 实现）
 * - userIdProvider: 提供当前登录用户 ID（写操作与按用户查询时自动注入 user_id）
 */
export function createCPCore(
  sdk: MetaSdkLike,
  userIdProvider: UserIdProvider,
): RespositoryFactory {
  instance = new RespositoryFactory(sdk, userIdProvider);
  return instance;
}

/** 获取 caloplan-core 单例：cpCore.food / cpCore.meal 即 Repository 入口 */
export function getCPCore(): RespositoryFactory {
  if (instance == null) {
    throw new Error(
      "CPCore 未初始化：请先调用 createCPCore() 注入 SDK 与 userIdProvider",
    );
  }
  return instance;
}
