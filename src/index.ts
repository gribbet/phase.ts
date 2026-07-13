export * from "./dom";
export * from "./jsx";

import { root } from "signlets";
export * from "signlets";

import { mount } from "./dom";

export const render = (code: () => JSX.Element, container: HTMLElement) => {
  container.innerHTML = "";
  root(_ => (mount(code(), container), _));
};
