import { defer, derived, effect, map, resolve, untrack } from "signaloits";

import { VCOMPONENT, VELEMENT } from "./jsx";

export type Component<
  P extends Record<string, unknown> = Record<string, unknown>,
> = (props: P) => JSX.ReactiveElement;

export const createElement = (
  type: keyof JSX.IntrinsicElements | Component,
  props: Record<string, unknown> | null,
  ...children: JSX.ReactiveElement[]
): JSX.Element => {
  if (typeof type === "string")
    return {
      [VELEMENT]: true,
      tag: type,
      attributes: props ?? {},
      children,
    };
  return {
    [VCOMPONENT]: true,
    component: type,
    props: props ?? {},
    children,
  };
};

type H = {
  <T extends keyof JSX.IntrinsicElements>(
    type: T,
    props: JSX.IntrinsicElements[T] | null,
    ...children: JSX.ReactiveElement[]
  ): JSX.Element;
  <P extends Record<string, unknown>>(
    type: Component<P>,
    props: P | null,
    ...children: JSX.ReactiveElement[]
  ): JSX.Element;
};

export const h: H = (
  type: keyof JSX.IntrinsicElements | Component,
  props: Record<string, unknown> | null,
  ...children: JSX.ReactiveElement[]
): JSX.Element => createElement(type, props, ...children);

export const Fragment = ({ children }: { children?: JSX.ReactiveElement }) =>
  children;

export const mount = (
  child: JSX.ReactiveElement,
  container: Element | DocumentFragment,
  anchor?: Node,
): Node[] => {
  if (child === null || child === undefined || typeof child === "boolean")
    return [];

  if (typeof child === "string" || typeof child === "number") {
    const node = document.createTextNode(String(child));
    container.insertBefore(node, anchor ?? null);
    return [node];
  }

  if (isElementArray(child))
    return child.flatMap(_ => mount(_, container, anchor));

  if (typeof child === "function") {
    const signal = child;
    const text = document.createTextNode("");
    container.insertBefore(text, anchor ?? null);

    const items = derived<readonly JSX.ReactiveElement[]>(() => {
      const next = resolve(signal);
      return isText(next) ? [] : isElementArray(next) ? next : [next];
    });
    const entries = map(items, item => {
      const value = untrack(item);
      const nodes = mount(value, container, text);
      defer(() => remove(nodes));
      return nodes;
    });

    effect(() => {
      const value = resolve(signal);
      text.data = isText(value) ? String(value) : "";
      const nodes = entries().flat();

      let cursor: Node = text;

      for (const node of nodes.toReversed()) {
        if (node.parentNode !== container || node.nextSibling !== cursor)
          container.insertBefore(node, cursor);
        cursor = node;
      }
    });

    defer(() => remove([text]));

    return [...entries().flat(), text];
  }

  if (isVElement(child)) {
    const { tag, attributes, children } = child;
    const element = isSvg(tag, container)
      ? document.createElementNS("http://www.w3.org/2000/svg", tag)
      : document.createElement(tag);
    applyAttributes(element, attributes);
    children.forEach(_ => mount(_, element, undefined));
    container.insertBefore(element, anchor ?? null);
    return [element];
  }

  if (isVComponent(child)) {
    const { component, props, children } = child;
    const element = component({ ...props, children });
    return mount(element, container, anchor);
  }

  if (child instanceof DocumentFragment) {
    const nodes = Array.from(child.childNodes);
    container.insertBefore(child, anchor ?? null);
    return nodes;
  }

  if (child instanceof Node) {
    container.insertBefore(child, anchor ?? null);
    return [child];
  }

  return [];
};

const remove = (nodes: Node[]) =>
  nodes.forEach(_ => _.parentNode?.removeChild(_));

const isVElement = (_: JSX.ReactiveElement): _ is JSX.VElement =>
  _ !== null && typeof _ === "object" && VELEMENT in _;

const isVComponent = (_: JSX.ReactiveElement): _ is JSX.VComponent =>
  _ !== null && typeof _ === "object" && VCOMPONENT in _;

const isElementArray = (
  value: JSX.ReactiveElement,
): value is readonly JSX.ReactiveElement[] => Array.isArray(value);

const isText = (value: JSX.ReactiveElement): value is string | number =>
  typeof value === "string" || typeof value === "number";

const isSvg = (tag: string, parent: Element | DocumentFragment) =>
  tag === "svg" ||
  (parent instanceof SVGElement && parent.localName !== "foreignObject");

const applyAttributes = (
  element: Element,
  attributes: Record<string, unknown>,
) => {
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "children") continue;

    if (key === "ref" && typeof value === "function") {
      const ref = value as (_: Element) => void;
      ref(element);
      continue;
    }

    if (key.startsWith("on") && key[2] && typeof value === "function") {
      const eventName = key.slice(2).toLowerCase();
      const listener = value as EventListener;
      element.addEventListener(eventName, listener);
      defer(() => element.removeEventListener(eventName, listener));
    } else if (typeof value === "function")
      effect(() => setAttribute(element, key, resolve(value)));
    else setAttribute(element, key, value);
  }
};

const setAttribute = (element: Element, key: string, value: unknown) => {
  if (
    key === "style" &&
    (element instanceof HTMLElement || element instanceof SVGElement)
  )
    updateStyle(element, value);
  else if (value === undefined || value === null) element.removeAttribute(key);
  else if (key.startsWith("aria-") || key.startsWith("data-")) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    )
      element.setAttribute(key, String(value));
  } else if (element instanceof HTMLElement && key in element)
    Reflect.set(element, key, value);
  else if (value === true) element.setAttribute(key, "");
  else if (value === false) element.removeAttribute(key);
  else if (typeof value === "string" || typeof value === "number")
    element.setAttribute(key, String(value));
};

const updateStyle = (element: HTMLElement | SVGElement, value: unknown) => {
  element.style.cssText = "";

  const apply = (style: unknown) => {
    if (typeof style === "string")
      element.style.cssText += `${element.style.cssText ? ";" : ""}${style}`;
    else if (Array.isArray(style)) style.forEach(apply);
    else if (typeof style === "object" && style !== null)
      for (const [key, value] of Object.entries(style) as [string, unknown][])
        if (value === undefined || value === null)
          element.style.removeProperty(key);
        else if (key.startsWith("--"))
          element.style.setProperty(
            key,
            typeof value === "number" ? String(value) : (value as string),
          );
        else Reflect.set(element.style, key, value);
  };

  apply(value);
};
