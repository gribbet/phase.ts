export type NonMethodKeys<T> = {
  [K in keyof T]: T[K] extends () => unknown ? never : K;
}[keyof T];

export type CSSProperties = {
  [K in NonMethodKeys<CSSStyleDeclaration>]?: string | number | undefined;
} & {
  [key: string]: string | number | undefined;
};

export type StyleValue = string | CSSProperties | undefined;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    type VElement<T extends keyof IntrinsicElements = keyof IntrinsicElements> =
      {
        tag: T;
        attributes: Partial<IntrinsicElements[T]>;
        children: Element[];
      };

    type VComponent<
      P extends Record<string, unknown> = Record<string, unknown>,
    > = {
      component: (props: P) => Element;
      props: P;
      children: Element[];
    };

    type Element =
      | Node
      | string
      | number
      | boolean
      | undefined
      | Element[]
      | (() => Element)
      | (() => Element[])
      | VElement
      | VComponent;

    type DomProps<T> = Pick<T, NonMethodKeys<T>>;

    type CSSProperties = import("./jsx").CSSProperties;
    type StyleValue = import("./jsx").StyleValue;

    type Reactive<T> = {
      [K in keyof T]?: T[K] | (() => T[K] | undefined);
    };

    type EventHandlers<T> = {
      [K in keyof HTMLElementEventMap as `on${Capitalize<K>}`]?: (
        event: HTMLElementEventMap[K] & { currentTarget: T; target: T },
      ) => void;
    };

    type BaseAttributes<T> = {
      class?: string | (() => string | undefined);
      style?: StyleValue | StyleValue[] | (() => StyleValue | StyleValue[]);
      ref?: (_: T) => void;
      children?: Element;
      key?: unknown;
      [key: `data-${string}`]: unknown;
    };

    type ElementProps<T> = Omit<
      DomProps<T>,
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
