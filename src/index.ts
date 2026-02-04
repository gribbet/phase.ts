import "./jsx";
export * from "./dom";
export * from "./reactive";
export type { Props } from "./types";

import { mount } from "./dom";
import { createRoot } from "./reactive";

export const render = (code: () => JSX.Element, container: HTMLElement) => {
  container.innerHTML = "";
  createRoot(() => mount(code(), container));
};
