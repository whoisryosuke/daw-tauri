import React, { type HTMLProps } from "react";
import { text } from "../../../../styled-system/recipes";
import { cva, cx } from "../../../../styled-system/css";

const headingStyles = cva({
  base: {
    fontFamily: "heading",
    lineHeight: 1.1,
  },
  variants: {
    as: {
      h1: {
        fontSize: 8,
      },
      h2: {
        fontSize: 7,
      },
      h3: {
        fontSize: 6,
      },
      h4: {
        fontSize: 5,
      },
      h5: {
        fontSize: 4,
      },
      h6: {
        fontSize: 3,
      },
    },
  },
});

type Props = HTMLProps<HTMLHeadingElement> & {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

const Heading = ({ as = "h1", className, ...props }: Props) => {
  const ComponentName = as;
  return (
    <ComponentName
      className={cx(text(), headingStyles({ as }), className)}
      {...props}
    />
  );
};

export default Heading;
