import { createRoot, effect, onCleanup, untrack } from "signals.ts";

export type Component<
  P extends Record<string, unknown> = Record<string, unknown>,
> = (props: P) => JSX.Element;

export const h = (
  type: keyof JSX.IntrinsicElements | Component,
  props: unknown,
  ...children: JSX.Element[]
): JSX.Element => {
  if (typeof type === "string") {
    const tag = type;
    return {
      tag,
      attributes: props ?? {},
      children,
    } satisfies JSX.VElement;
  } else {
    const component = type;
    return {
      component,
      props: props as Record<string, unknown>,
      children,
    } satisfies JSX.VComponent;
  }
};

export const Fragment = ({ children }: { children?: JSX.Element }) => children;

export const mount = (
  child: JSX.Element,
  container: Element | DocumentFragment,
  anchor: Node | undefined = undefined,
): Node[] => {
  if (child === undefined || typeof child === "boolean") return [];

  if (typeof child === "string" || typeof child === "number") {
    const node = document.createTextNode(String(child));
    container.insertBefore(node, anchor ?? null);
    return [node];
  }

  if (Array.isArray(child))
    return child.flatMap(_ => mount(_, container, anchor));

  if (typeof child === "function") {
    const marker = document.createTextNode("");
    container.insertBefore(marker, anchor ?? null);

    let nodeMap = new Map<unknown, Reconciled>();
    let currentNodes: Node[] = [];

    effect(() => {
      const nextValue = child();

      if (Array.isArray(nextValue)) {
        nodeMap = reconcile(container, nextValue, nodeMap, marker);
        currentNodes = [...nodeMap.values()].flatMap(_ => _.nodes);
      } else {
        currentNodes.forEach(_ => _.parentNode?.removeChild(_));
        nodeMap.forEach(_ => _.dispose());
        nodeMap.clear();

        currentNodes = mount(nextValue, container, marker);
      }
    });

    onCleanup(() => nodeMap.forEach(_ => _.dispose()));

    return [...currentNodes, marker];
  }

  if (isVElement(child)) {
    const { tag, attributes, children } = child;
    const element = isSvg(tag)
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

type Reconciled = { nodes: Node[]; dispose: () => void };

const reconcile = (
  parent: Element | DocumentFragment,
  items: JSX.Element[],
  cache: Map<unknown, Reconciled>,
  anchor: Node | undefined,
): Map<unknown, Reconciled> => {
  const next = new Map<unknown, Reconciled>();
  let cursor = anchor;

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    let entry = cache.get(item);
    if (entry) cache.delete(item);
    else
      createRoot(dispose => {
        const nodes = mount(item, parent, cursor);
        entry = { nodes, dispose };
      });

    if (!entry) continue;
    const { nodes } = entry;

    for (let k = nodes.length - 1; k >= 0; k--) {
      const node = nodes[k];
      if (!node) continue;
      parent.insertBefore(node, cursor ?? null);
      cursor = node;
    }

    next.set(item, entry);
  }

  cache.forEach(({ nodes, dispose }) => {
    nodes.forEach(_ => _.parentNode?.removeChild(_));
    dispose();
  });

  return next;
};

const isVElement = (_: JSX.Element): _ is JSX.VElement =>
  typeof _ === "object" && "tag" in _ && "attributes" in _;

const isVComponent = (_: JSX.Element): _ is JSX.VComponent =>
  typeof _ === "object" && "component" in _ && "props" in _;

const isSvg = (tag: string) => svgTags.has(tag);

const applyAttributes = (
  element: Element,
  attributes: Record<string, unknown>,
) => {
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "children") continue;

    if (key === "ref" && typeof value === "function") {
      (value as (_: Element) => void)(element);
      continue;
    }

    if (key.startsWith("on") && key[2]) {
      const eventName = key.slice(2).toLowerCase();
      const listener = value as EventListener;
      element.addEventListener(eventName, listener);
      onCleanup(() => element.removeEventListener(eventName, listener));
    } else if (typeof value === "function")
      effect(() => setAttribute(element, key, (value as () => unknown)()));
    else setAttribute(element, key, value);
  }
};

const setAttribute = (element: Element, key: string, value: unknown) => {
  if (key === "style" && "style" in element)
    updateStyle(element as HTMLElement, value);
  else if (element instanceof HTMLElement && key in element)
    (element as unknown as Record<string, unknown>)[key] = value;
  else if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "undefined"
  )
    element.setAttribute(key, String(value ?? ""));
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
      for (const [k, val] of Object.entries(v))
        if (val === undefined || val === null) element.style.removeProperty(k);
        else if (k.startsWith("--")) element.style.setProperty(k, String(val));
        else (element.style as any)[k] = val;
    } else if (clear) element.style.cssText = "";
  };
  apply(value, true);
};

const svgNamespace = "http://www.w3.org/2000/svg";
const svgTags = new Set([
  "svg",
  "animate",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "foreignObject",
  "g",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "set",
  "stop",
  "switch",
  "symbol",
  "text",
  "textPath",
  "tspan",
  "use",
  "view",
]);
