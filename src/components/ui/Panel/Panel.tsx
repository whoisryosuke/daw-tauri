import React from "react";
import { Stack, StackProps } from "../../../../styled-system/jsx";
import { css, cx } from "../../../../styled-system/css";
import panelStyle from "../../../theme/styles/panel.style";

type Props = StackProps & {};

const Panel = ({ className, ...props }: Props) => {
  return <Stack className={cx(panelStyle, className)} {...props} />;
};

export default Panel;
