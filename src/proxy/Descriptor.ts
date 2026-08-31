export function LogDecorator(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
  type: string
) {
  const originalMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log(`[INFO]:${propertyKey}`);
    const result = originalMethod.apply(this, args);
    return result;
  };
  return descriptor;
}
