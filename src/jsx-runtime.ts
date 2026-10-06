import "./jsx";
import { createElement, type Component, Fragment } from "./dom";

export { Fragment };

export const jsx = (
  type: keyof JSX.IntrinsicElements | Component,
  props: Record<string, unknown>,
): JSX.Element => {
  const { children, ...attributes } = props;
  return createElement(type, attributes, children as JSX.Element);
};

export const jsxs = (
  type: keyof JSX.IntrinsicElements | Component,
  props: Record<string, unknown>,
): JSX.Element => {
  const { children, ...attributes } = props;
  if (Array.isArray(children))
    return createElement(type, attributes, ...(children as JSX.Element[]));
  return createElement(type, attributes, children as JSX.Element);
};
