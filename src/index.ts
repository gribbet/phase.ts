export { Fragment, h, mount } from "./dom";
export type { Component } from "./dom";
export * from "./jsx";

import { root } from "signaloits";
export * from "signaloits";

import { mount } from "./dom";

export const render = (code: () => JSX.Element, container: HTMLElement) => {
  container.innerHTML = "";
  return root(_ => (mount(code(), container), _));
};
