import "./jsx";

import { type Component, Fragment, h } from "./dom";

export { Fragment };

export const jsx = (
  type: keyof JSX.IntrinsicElements | Component,
  props: Record<string, unknown>,
): JSX.Element => {
  const { children, ...attributes } = props;
  return h(type, attributes, children as JSX.Element);
};

export const jsxs = (
  type: keyof JSX.IntrinsicElements | Component,
  props: Record<string, unknown>,
): JSX.Element => {
  const { children, ...attributes } = props;
  if (Array.isArray(children))
    return h(type, attributes, ...(children as JSX.Element[]));
  return h(type, attributes, children as JSX.Element);
};
