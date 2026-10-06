import "./jsx";
import { createElement, type Component, Fragment } from "./dom";

export { Fragment };

export const jsxDEV = (
  type: keyof JSX.IntrinsicElements | Component,
  props: Record<string, unknown>,
  _key?: string,
  isStaticChildren?: boolean,
  _source?: unknown,
  _self?: unknown,
): JSX.Element => {
  const { children, ...attributes } = props;
  if (isStaticChildren && Array.isArray(children))
    return createElement(
      type,
      attributes,
      ...(children as JSX.ReactiveElement[]),
    );
  return createElement(type, attributes, children as JSX.ReactiveElement);
};
