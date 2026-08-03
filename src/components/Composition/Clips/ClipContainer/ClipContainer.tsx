import React, { type PropsWithChildren } from "react";
import type { Clip, TrackClipData } from "../../../../store/composition";
import { Stack } from "../../../../../styled-system/jsx";
import Text from "../../../ui/Typography/Text";
import { css, cx } from "../../../../../styled-system/css";
import { ColorPalette } from "../../../../../styled-system/tokens";
import { motion } from "motion/react";
import { useDraggable } from "@dnd-kit/core";
import { TrackClipDragData } from "../../../../constants/drag";

const containerStyle = css({
  position: "relative",
  display: "flex",
  flexDirection: "column",

  backgroundColor: "colorPalette.2",
});

type Props = Clip & {
  x: number;
  width: number;
  color: ColorPalette;
  trackId: TrackClipData["id"];
};

const ClipContainer = ({
  trackId,
  name,
  color = "blue",
  children,
  width,
  x,
}: PropsWithChildren<Props>) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `TRACK_CLIP_${trackId}`,
      data: {
        id: trackId,
        action: "TRACK_CLIP",
      } as TrackClipDragData,
    });
  const colorStyle = css({
    colorPalette: color,
  });
  return (
    <motion.div
      ref={setNodeRef}
      className={cx(containerStyle, colorStyle)}
      animate={{
        x: x + (transform ? transform.x : 0),
        y: transform ? transform.y : 0,
      }}
      style={{
        width: width,
      }}
      {...listeners}
      {...attributes}
    >
      <Text size="1">{name}</Text>
      {children}
    </motion.div>
  );
};

ClipContainer.defaultProps = {
  color: "blue",
};

export default ClipContainer;
