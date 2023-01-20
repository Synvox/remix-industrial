import { CSSProperties, forwardRef, ReactNode } from "react";
import { StyledObject } from "styled-components/macro";

type Direction = "row" | "row-reverse" | "column" | "column-reverse";

type FlexJustification =
  | "center"
  | "flex-start"
  | "flex-end"
  | "space-around"
  | "space-evenly"
  | "space-between"
  | "stretch";

const sizes = {
  none: 0 / 16 + "rem",
  xsmall: 5 / 16 + "rem",
  small: 10 / 16 + "rem",
  medium: 20 / 16 + "rem",
  large: 40 / 16 + "rem",
  xlarge: 80 / 16 + "rem",
  xxlarge: 160 / 16 + "rem",
};

type Size = keyof typeof sizes;

const screenSizes = {
  small: 640,
  medium: 768,
  large: 1024,
  xlarge: 1280,
  xxlarge: 1536,
};

type ScreenSize = keyof typeof screenSizes;

type StackProps = {
  children?: ReactNode;
  space?: Size;
  direction?: Direction;
  wrap?: boolean;
  justify?: FlexJustification;
  align?: FlexJustification;
  padding?: Size;
  margin?: Size;
  equalSizeChildren?: boolean;
};

type ResponsiveProps = {
  small?: StackProps;
  medium?: StackProps;
  large?: StackProps;
  xlarge?: StackProps;
  xxlarge?: StackProps;
};

function parseProps({
  space,
  direction,
  justify,
  align,
  wrap,
  padding,
  margin,
  equalSizeChildren,
}: StackProps) {
  return Object.fromEntries(
    Object.entries({
      flexDirection: direction,
      gap: space ? sizes[space] : undefined,
      flexWrap: wrap ? "wrap" : "nowrap",
      justifyContent: justify,
      alignItems: align,
      ...(equalSizeChildren
        ? {
            "& > *": {
              flex: 1,
            },
          }
        : undefined),
      padding: padding ? sizes[padding] : padding,
      margin: margin ? sizes[margin] : margin,
    }).filter(([_, v]) => v)
  ) as StyledObject<StackProps>;
}

type Props = StackProps &
  ResponsiveProps & { className?: string; style?: CSSProperties };

const Stack = forwardRef<HTMLDivElement, Props>(function Stack(
  {
    children,
    style,
    className,

    space = "medium",
    direction = "column",
    justify = "flex-start",
    align = "flex-start",
    wrap = false,
    padding,
    margin,
    equalSizeChildren,

    ...others
  },
  ref
) {
  return (
    <div
      ref={ref}
      style={style}
      className={className}
      css={`
        display: flex;
        ${parseProps({
          space,
          direction,
          wrap,
          justify,
          align,
          padding,
          margin,
          equalSizeChildren,
        })};
        ${(Object.keys(screenSizes) as ScreenSize[]).map((screenSize) => ({
          [`@media (max-width: ${screenSizes[screenSize]}px)`]: others[
            screenSize
          ]
            ? parseProps(others[screenSize]!)
            : {},
        }))}
      `}
    >
      {children}
    </div>
  );
});

export { Stack };
