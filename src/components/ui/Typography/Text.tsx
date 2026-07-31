// @TODO: Make a dedicated UI pkg to share these primitives
import React, { type HTMLProps } from "react";
import { text, TextVariantProps } from "../../../../styled-system/recipes";
import { cx } from "../../../../styled-system/css";

type Props = HTMLProps<
  HTMLParagraphElement & HTMLSpanElement & HTMLLabelElement
> &
  TextVariantProps & {
    as?: "p" | "span" | "label";
  };

const Text = ({
  as: ComponentName = "p",
  fontFamily = "body",
  className,
  ...props
}: Props) => {
  return (
    <ComponentName className={cx(text({ fontFamily }), className)} {...props} />
  );
};

export default Text;
