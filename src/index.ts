export * from "./dom";
export * from "./jsx";

import { createRoot } from "signals.ts";

import { mount } from "./dom";

export const render = (code: () => JSX.Element, container: HTMLElement) => {
  container.innerHTML = "";
  createRoot(() => mount(code(), container));
};
