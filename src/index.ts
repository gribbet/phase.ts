export * from "./dom";
export * from "./jsx";

import { root } from "signaloits";
export * from "signaloits";

import { mount } from "./dom";

export const render = (code: () => JSX.Element, container: HTMLElement) => {
  container.innerHTML = "";
  root(_ => (mount(code(), container), _));
};
