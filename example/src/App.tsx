import { createSignal, map } from "phase.ts";

const Counter = () => {
  const [count, setCount] = createSignal(0);

  return (
    <section>
      <h2>Counter</h2>
      <p>Count is: {count}</p>
      <button onClick={() => setCount(count() + 1)}>Increment</button>
      <button onClick={() => setCount(count() - 1)}>Decrement</button>
    </section>
  );
};

const List = () => {
  const [items] = createSignal(["A", "B", "C", "D"]);

  return (
    <section>
      <h2>Mapped List</h2>
      <ul>
        {map(items, item => (
          <li>{item}</li>
        ))}
      </ul>
    </section>
  );
};

export const App = () => {
  return (
    <main>
      <h1>phase.ts Example</h1>
      <Counter />
      <hr />
      <List />
    </main>
  );
};
