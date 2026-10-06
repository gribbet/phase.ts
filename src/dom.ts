import { defer, derived, effect, map, resolve, untrack } from "signaloits";

import { VCOMPONENT, VELEMENT } from "./jsx";

export type Component<
  P extends Record<string, unknown> = Record<string, unknown>,
> = (props: P) => JSX.Element;

export function h<T extends keyof JSX.IntrinsicElements>(
  type: T,
  props: JSX.IntrinsicElements[T] | null,
  ...children: JSX.Element[]
): JSX.VElement<T>;
export function h<P extends Record<string, unknown>>(
  type: Component<P>,
  props: P | null,
  ...children: JSX.Element[]
): JSX.VComponent<P>;
export function h(
  type: keyof JSX.IntrinsicElements | Component,
  props: Record<string, unknown> | null,
  ...children: JSX.Element[]
): JSX.Element;
export function h(
  type: keyof JSX.IntrinsicElements | Component,
  props: Record<string, unknown> | null,
  ...children: JSX.Element[]
): JSX.Element {
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
}

export const Fragment = ({ children }: { children?: JSX.Element }) => children;

export const mount = (
  child: JSX.Element,
  container: Element | DocumentFragment,
  anchor: Node | undefined = undefined,
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
    const marker = document.createTextNode("");
    container.insertBefore(marker, anchor ?? null);

    const items = derived<readonly JSX.Element[]>(() => {
      const next = resolve(signal);
      return isElementArray(next) ? next : [next];
    });
    const entries = map(items, item => {
      const nodes = mount(untrack(item), container, marker);
      defer(() => remove(nodes));
      return nodes;
    });

    effect(() => {
      let cursor: Node = marker;

      for (const nodes of entries().toReversed())
        for (const node of nodes.toReversed()) {
          if (node.parentNode !== container || node.nextSibling !== cursor)
            container.insertBefore(node, cursor);
          cursor = node;
        }
    });

    defer(() => remove([marker]));

    return [...entries().flat(), marker];
  }

  if (isVElement(child)) {
    const { tag, attributes, children } = child;
    const element = isSvg(tag, container)
      ? document.createElementNS(svgNamespace, tag)
      : document.createElement(tag);
    applyAttributes(element, attributes);
    children.forEach(_ => mount(_, element, undefined));
    container.insertBefore(element, anchor ?? null);
    return [element];
  }

  if (isVComponent(child)) {
    const { component, props, children } = child;
    const element = untrack(() => component({ ...props, children }));
    return mount(element, container, anchor);
  }

  if (child instanceof Node) {
    container.insertBefore(child, anchor ?? null);
    return [child];
  }

  return [];
};

const remove = (nodes: Node[]) =>
  nodes.forEach(_ => _.parentNode?.removeChild(_));

const isVElement = (_: JSX.Element): _ is JSX.VElement =>
  _ !== null && typeof _ === "object" && VELEMENT in _;

const isVComponent = (_: JSX.Element): _ is JSX.VComponent =>
  _ !== null && typeof _ === "object" && VCOMPONENT in _;

const isElementArray = (value: JSX.Element): value is readonly JSX.Element[] =>
  Array.isArray(value);

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
  else if (element instanceof HTMLElement && key in element)
    Reflect.set(element, key, value);
  else if (value === true) element.setAttribute(key, "");
  else if (typeof value === "string" || typeof value === "number")
    element.setAttribute(key, String(value));
};

const updateStyle = (element: HTMLElement | SVGElement, value: unknown) => {
  const apply = (v: unknown, clear: boolean) => {
    if (typeof v === "string")
      if (clear) element.style.cssText = v;
      else element.style.cssText += ";" + v;
    else if (Array.isArray(v)) {
      if (clear) element.style.cssText = "";
      for (const item of v) apply(item, false);
    } else if (typeof v === "object" && v !== null) {
      if (clear) element.style.cssText = "";
      for (const [k, val] of Object.entries(v) as [string, unknown][])
        if (val === undefined || val === null) element.style.removeProperty(k);
        else if (k.startsWith("--"))
          element.style.setProperty(
            k,
            typeof val === "number" ? String(val) : (val as string),
          );
        else Reflect.set(element.style, k, val);
    } else if (clear) element.style.cssText = "";
  };
  apply(value, true);
};

const svgNamespace = "http://www.w3.org/2000/svg";
