import { ComponentProps, ElementType } from "react";

interface OwnProps<E extends ElementType = ElementType> {
  as?: E;
  children: string;
  primary?: boolean;
}

type PoliProps<E extends ElementType> = OwnProps<E> &
  Omit<ComponentProps<E>, keyof OwnProps>;

const defaultElement = "button";

export default function Polimorphe<
  E extends ElementType = typeof defaultElement
>({ children, primary, as, ...otherProps }: PoliProps<E>) {
  const TagName = as || "div";

  return (
    <TagName {...otherProps} primary>
      {children}
    </TagName>
  );
}
