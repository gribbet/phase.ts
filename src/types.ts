export type Props<T> = {
  [K in keyof T]: T[K] extends () => unknown ? T[K] : T[K] | (() => T[K]);
};
