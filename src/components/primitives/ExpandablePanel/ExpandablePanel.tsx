import React, { CSSProperties, useState, type PropsWithChildren } from "react";
import styles from "./ExpandablePanel.module.css";
import ExpandablePanelDragHandle from "./ExpandablePanelDragHandle";
import type { ExpandablePanelSize } from "./types";
import { Box, BoxProps } from "../../../../styled-system/jsx";

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
      className={styles.ExpandablePanel}
      style={{ "--width": `${widthVar}px`, ...style } as CSSProperties}
      {...props}
    >
      {children}
      <ExpandablePanelDragHandle setSize={setSize} />
    </Box>
  );
};

export default ExpandablePanel;
