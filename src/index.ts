export * from "./core/index.js";

// Repository
export { FoodRespository } from "./repository/food/FoodRespository.js";
export { MealRespository } from "./repository/meal/MealRespository.js";
export { RespositoryFactory } from "./repository/RespositoryFactory.js";
export type { UserIdProvider } from "./repository/type.js";
export { isNotFoundError } from "./repository/type.js";

// caloplan-core 单例：createCPCore() 初始化 / getCPCore() 获取
export { createCPCore, getCPCore } from "./cpcore.js";

// 日志装饰器：createLogDecorator({ enabled }) 控制是否输出
export { createLogDecorator, LogDecorator } from "./proxy/log-decorator.js";
export type { LogDecoratorOptions, LogDecoratorFn } from "./proxy/log-decorator.js";

// meta-sdk 类型契约（本库不包含 SDK 实现，仅供类型规范；SDK 实例由外部注入）
export type {
  MetaSdkLike,
  EntriesClient,
  SdkErrorLike,
} from "./sdk/meta-sdk/index.js";
