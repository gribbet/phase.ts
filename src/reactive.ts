export type Effect = {
  run: () => void;
  cleanups: (() => void)[];
  owner?: Effect;
};

let currentOwner: Effect | undefined = undefined;
let currentListener: Effect | undefined = undefined;

export const createSignal = <T>(value: T) => {
  const subscribers = new Set<Effect>();

  const getter = () => {
    const listener = currentListener;
    if (listener) {
      subscribers.add(listener);
      onCleanup(() => subscribers.delete(listener));
    }
    return value;
  };

  const setter = (newValue: T) => {
    if (value === newValue) return;
    value = newValue;
    [...subscribers].forEach(_ => _.run());
  };

  return [getter, setter] as const;
};

const cleanup = ({ cleanups }: Effect) => {
  cleanups.forEach(_ => _());
  cleanups.length = 0;
};

export const createEffect = (f: () => void | (() => void)) => {
  const run = () => {
    cleanup(effect);

    const previousOwner = currentOwner;
    const previousListener = currentListener;
    currentOwner = effect;
    currentListener = effect;

    try {
      const cleanup = f();
      if (cleanup) onCleanup(cleanup);
    } finally {
      currentOwner = previousOwner;
      currentListener = previousListener;
    }
  };

  const effect: Effect = {
    run,
    owner: currentOwner,
    cleanups: [],
  };

  onCleanup(() => cleanup(effect));

  run();
};

export const onCleanup = (f: () => void) => currentOwner?.cleanups.push(f);

export const untrack = <T>(f: () => T): T => {
  const previousListener = currentListener;
  currentListener = undefined;
  try {
    return f();
  } finally {
    currentListener = previousListener;
  }
};

export const createMemo = <T>(f: () => T) => {
  const [signal, setSignal] = createSignal<T>(undefined as T);
  createEffect(() => setSignal(f()));
  return signal;
};

export const map = <T, U>(
  list: () => T[],
  mapper: (_: T, i: () => number) => U,
): (() => U[]) => {
  type Entry = { value: U; setIndex: (i: number) => void; dispose: () => void };
  let cache = new Map<T, Entry>();

  onCleanup(() => cache.forEach(_ => _.dispose()));

  return createMemo(() => {
    const next = list().map((item, i) => {
      let entry = cache.get(item);
      if (entry) {
        entry.setIndex(i);
        cache.delete(item);
      } else {
        const [index, setIndex] = createSignal(i);
        entry = createRoot(dispose => ({
          value: mapper(item, index),
          setIndex,
          dispose,
        }));
      }
      return [item, entry] as const;
    });
    cache.forEach(_ => _.dispose());
    cache = new Map(next);
    return next.map(([, entry]) => entry.value);
  });
};

export const createRoot = <T>(f: (dispose: () => void) => T): T => {
  const root: Effect = {
    run: () => {},
    cleanups: [],
    owner: currentOwner,
  };

  const previousOwner = currentOwner;
  const previousListener = currentListener;
  currentOwner = root;
  currentListener = undefined;

  try {
    return f(() => cleanup(root));
  } finally {
    currentOwner = previousOwner;
    currentListener = previousListener;
  }
};

export const resolve = <T>(
  value: (T extends (...args: unknown[]) => unknown ? never : T) | (() => T),
): T => (typeof value === "function" ? (value as () => T)() : (value as T));
