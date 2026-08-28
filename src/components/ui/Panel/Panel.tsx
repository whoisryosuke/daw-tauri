import React from "react";
import { Stack, StackProps } from "../../../../styled-system/jsx";
import { css, cx } from "../../../../styled-system/css";

const panelStyle = css({
  bgLinear: "to-b",
  gradientFrom: "gray.4",
  gradientTo: "gray.3",

  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "gray.6",

  borderRadius: 4,

  color: "gray.12",
  overflow: "hidden",
});

type Props = StackProps & {};

const Panel = ({ className, ...props }: Props) => {
  return <Stack className={cx(panelStyle, className)} {...props} />;
};

export default Panel;
