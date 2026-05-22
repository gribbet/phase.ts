# phase.ts

A lightweight reactive UI library.

## Examples

### Counter
```tsx
import { signal, render } from "phase.ts";

const Counter = () => {
  const [count, setCount] = signal(0);

  return (
    <>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count() + 1)}>Increment</button>
      <button onClick={() => setCount(count() - 1)}>Decrement</button>
    </>
  );
};

render(() => <Counter />, document.body);
```

### Mapped List
```tsx
import { signal, map, render } from "phase.ts";

const List = () => {
  const [items, setItems] = signal(["A", "B", "C"]);

  return (
    <ul>
      {map(items, (item) => (
        <li>{item}</li>
      ))}
    </ul>
  );
};
```

## Features
- **No Compiler**: Standard TypeScript/JSX without build-time transforms.
- **Run-Once Components**: Component logic executes only once to build the reactive graph.
- **Fine-Grained**: Only the specific parts of the DOM that change are updated.
- **TypeScript First**: Full type safety for reactivity and components.
