import type { MaybeSignal, SIGNAL } from "@gribbet/signal.ts";

export const VELEMENT = Symbol("velement");
export const VCOMPONENT = Symbol("vcomponent");

export type CSSProperties = {
  [K in keyof CSSStyleDeclaration]?: string | number | undefined;
} & {
  [key: string]: string | number | undefined;
};

export type StyleValue = string | CSSProperties | undefined;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    type VElement<T extends keyof IntrinsicElements = keyof IntrinsicElements> =
      {
        [VELEMENT]: true;
        tag: T;
        attributes: Partial<IntrinsicElements[T]>;
        children: Element[];
      };

    type VComponent<
      P extends Record<string, unknown> = Record<string, unknown>,
    > = {
      [VCOMPONENT]: true;
      component: (props: P) => Element;
      props: P;
      children: Element[];
    };
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface ElementSignal {
      (): Element;
      [SIGNAL]: true;
    }
    type Element =
      | Node
      | string
      | number
      | boolean
      | undefined
      | Element[]
      | VElement
      | VComponent
      | ElementSignal;

    type Reactive<T> = {
      [K in keyof T]?: MaybeSignal<T[K] | undefined>;
    };

    type EventHandlers<T> = {
      [K in keyof HTMLElementEventMap as `on${Capitalize<K>}`]?: (
        event: HTMLElementEventMap[K] & { currentTarget: T; target: T },
      ) => void;
    };

    type BaseAttributes<T> = {
      class?: MaybeSignal<string | undefined>;
      style?: MaybeSignal<StyleValue | StyleValue[] | undefined>;
      ref?: (_: T) => void;
      children?: Element;
      key?: unknown;
      [key: `data-${string}`]: unknown;
    };

    type ElementProps<T> = Omit<
      T,
      "className" | "classList" | "children" | "style"
    >;

    type HTMLAttributes<T> = Reactive<ElementProps<T>> &
      BaseAttributes<T> &
      EventHandlers<T>;

    type SVGAttributeValue = string | number | boolean | undefined;

    type SVGAttributes<T> = Reactive<{
      [K in keyof ElementProps<T>]: ElementProps<T>[K] extends SVGAttributeValue
        ? ElementProps<T>[K]
        : SVGAttributeValue;
    }> &
      BaseAttributes<T> &
      EventHandlers<T> & {
        [key: string]: unknown;
      };

    type IntrinsicElements = {
      [K in keyof HTMLElementTagNameMap]: HTMLAttributes<
        HTMLElementTagNameMap[K]
      >;
    } & {
      [K in keyof SVGElementTagNameMap]: SVGAttributes<SVGElementTagNameMap[K]>;
    };
  }
}
