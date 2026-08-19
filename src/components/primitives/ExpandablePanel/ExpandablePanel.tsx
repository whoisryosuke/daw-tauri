import React, { CSSProperties, useState, type PropsWithChildren } from "react";
import ExpandablePanelDragHandle from "./ExpandablePanelDragHandle";
import type { ExpandablePanelSize } from "./types";
import { Box, BoxProps } from "../../../../styled-system/jsx";
import { css } from "../../../../styled-system/css";

const panelStyle = css({
  position: "relative",
  width: "var(--width)",
  minWidth: " 200px",
});

const MIN_WIDTH = 200;

type Props = BoxProps & {};

const ExpandablePanel = ({
  children,
  style,
  ...props
}: PropsWithChildren<Props>) => {
  const [size, setSize] = useState<ExpandablePanelSize>({
    width: MIN_WIDTH,
    height: 0,
  });
  const widthVar = size.width > MIN_WIDTH ? size.width : "auto";
  const heightVar = size.height > 0 ? size.height : "auto";

  console.log("size", size);

  return (
    <Box
      className={panelStyle}
      style={{ "--width": `${widthVar}px`, ...style } as CSSProperties}
      {...props}
    >
      {children}
      <ExpandablePanelDragHandle setSize={setSize} />
    </Box>
  );
};

export default ExpandablePanel;
