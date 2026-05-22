export * from "./dom";
export * from "./jsx";

import { root } from "signals.ts";
export * from "signals.ts";

import { mount } from "./dom";

export const render = (code: () => JSX.Element, container: HTMLElement) => {
  container.innerHTML = "";
  root(() => mount(code(), container));
};
