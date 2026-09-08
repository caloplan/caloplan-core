/** 日志装饰器配置 */
export interface LogDecoratorOptions {
  /** 是否输出日志，默认 true；设为 false 时方法照常执行但不打日志 */
  enabled?: boolean;
  /** 自定义日志输出函数，默认 console.log */
  logger?: (message: string) => void;
}

/** 方法装饰器形态：代理原方法，按配置输出调用日志 */
export type LogDecoratorFn = (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => PropertyDescriptor;

/**
 * 创建日志装饰器（工厂入口）：代理原方法并输出调用日志。
 * 通过入口参数 enabled 控制是否输出日志。
 *
 * 用法（装饰器语法或手动包装）：
 *   @createLogDecorator({ enabled: false })
 *   method() {}
 */
export function createLogDecorator(options: LogDecoratorOptions = {}): LogDecoratorFn {
  const { enabled = true, logger = (msg: string) => console.log(msg) } = options;

  return function LogDecorator(
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    descriptor.value = function (this: unknown, ...args: unknown[]) {
      if (enabled) {
        logger(`[INFO]:${propertyKey}`);
      }
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}

/** 默认日志装饰器：始终输出日志（等价于 createLogDecorator()） */
export const LogDecorator = createLogDecorator();
