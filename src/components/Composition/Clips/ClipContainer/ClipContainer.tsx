import React, { type PropsWithChildren } from "react";
import type { Clip, TrackClipData } from "../../../../store/composition";
import { Box, Stack } from "../../../../../styled-system/jsx";
import Text from "../../../ui/Typography/Text";
import { css, cx } from "../../../../../styled-system/css";
import { ColorPalette } from "../../../../../styled-system/tokens";
import { motion } from "motion/react";
import { useDraggable } from "@dnd-kit/core";
import { TrackClipDragData } from "../../../../constants/drag";
import ClipDragHandle from "./ClipDragHandle";

const textStyle = css({
  fontSize: 1,
  width: "100%",

  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  px: 2,
  py: 1,

  color: {
    base: "colorPalette.8",
    _groupHover: "colorPalette.10",
  },
  backgroundColor: "colorPalette.2",
  userSelect: "none",
  cursor: "grab",

  _motionSafe: {
    transitionProperty: "color",
    transitionTimingFunction: "ease-in-out",
    transitionDuration: "slow",
  },
});

const containerStyle = css({
  position: "absolute",
  top: 0,
  left: 0,
  display: "flex",
  flexDirection: "column",

  backgroundColor: {
    base: "colorPalette.alpha-1",
    _hover: "colorPalette.alpha-2",
  },
  borderColor: "colorPalette.alpha-4",
  borderWidth: "1px",
  borderStyle: "solid",
  borderRadius: 2,
  overflow: "hidden",

  "&[data-selected='true']": {
    outlineWidth: "3px",
    outlineColor: "colorPalette.alpha-4",
    outlineStyle: "solid",
    // outlineOffset: "-3px",
  },

  _motionSafe: {
    transitionProperty: "background-color",
    transitionTimingFunction: "ease-in-out",
    transitionDuration: "slow",
  },
});

type Props = Clip & {
  x: number;
  width: number;
  color: ColorPalette;
  trackId: TrackClipData["track_id"];
  trackClipId: TrackClipData["id"];
  range: TrackClipData["range"];
  selected: boolean;
  onClick: () => void;
};

const ClipContainer = ({
  trackId,
  trackClipId,
  name,
  color = "blue",
  children,
  width,
  duration,
  range,
  x,
  selected,
  ...props
}: PropsWithChildren<Props>) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `TRACK_CLIP_${trackClipId}`,
      data: {
        id: trackClipId,
        action: "TRACK_CLIP",
      } as TrackClipDragData,
    });
  const colorStyle = css({
    colorPalette: color,
  });

  return (
    <motion.div
      className={cx(containerStyle, colorStyle, "group")}
      animate={{
        x: x + (transform ? transform.x : 0),
        y: transform ? 1 + transform.y : 1,
      }}
      style={{
        width: width,
      }}
      transition={{
        duration: 0,
      }}
      data-selected={selected}
      {...attributes}
      {...props}
    >
      <Text ref={setNodeRef} className={textStyle} {...listeners}>
        {name}
      </Text>
      {children}
      <ClipDragHandle
        trackId={trackId}
        trackClipId={trackClipId}
        range={range}
        duration={duration}
        left
      />
      <ClipDragHandle
        trackId={trackId}
        trackClipId={trackClipId}
        range={range}
        duration={duration}
      />
    </motion.div>
  );
};

ClipContainer.defaultProps = {
  color: "blue",
};

export default ClipContainer;
