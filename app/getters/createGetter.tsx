import { AppLoadContext, DataFunctionArgs } from "@remix-run/node";

type GetterFn<T> = (args: DataFunctionArgs) => T;

export function createGetter<T>(fn: GetterFn<T>) {
  let weakMap = new WeakMap<AppLoadContext, T>();

  return Object.assign(
    function (args: DataFunctionArgs) {
      const key = args.context;
      if (weakMap.has(key)) {
        return weakMap.get(key)!;
      }

      let result = fn(args);
      weakMap.set(key, result);

      return result;
    },
    {
      revoke(args: DataFunctionArgs) {
        const key = args.context;
        return weakMap.delete(key);
      },
    }
  );
}
