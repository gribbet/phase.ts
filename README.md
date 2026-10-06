# phase.ts

A tiny reactive JSX renderer.

phase.ts connects fine-grained signals directly to the DOM. Components run once
to describe their DOM and reactive relationships; when a signal changes, only
the affected text, attribute, or list is updated.

There is no virtual DOM, component rerendering, or framework-specific compiler.

## Setup

```sh
npm install phase.ts
```

Use TypeScript's standard automatic JSX transform:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "phase.ts"
  }
}
```

## Counter

Signals can be rendered directly:

```tsx
import { render, signal } from "phase.ts";

const Counter = () => {
  const [count, setCount] = signal(0);

  return (
    <button onClick={() => setCount(count() + 1)}>
      Count: {count}
    </button>
  );
};

render(Counter, document.body);
```

## Lists

`map` preserves each item's DOM and reactive ownership as the list changes:

```tsx
import { map, render, signal } from "phase.ts";

const List = () => {
  const [items, setItems] = signal([1, 2, 3]);

  return (
    <section>
      <button onClick={() => setItems([...items(), items().length + 1])}>
        Add item
      </button>
      <ul>
        {map(items, item => (
          <li>{item}</li>
        ))}
      </ul>
    </section>
  );
};

render(List, document.body);
```
