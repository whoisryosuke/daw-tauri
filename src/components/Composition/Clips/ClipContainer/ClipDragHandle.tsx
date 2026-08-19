import React from "react";
import {
  useDragHandle,
  useDragHandleCallback,
} from "../../../../hooks/useDragHandle";
import { css } from "../../../../../styled-system/css";

const clipDragHandleStyle = css({
  position: "absolute",
  top: 0,
  right: 0,
  width: "4",
  height: "100%",

  bg: {
    base: "transparent",
    _hover: "gray.4",
    _active: "blue.6",
  },
  zIndex: 999,
});

type Props = {};

const ClipDragHandle = (props: Props) => {
  const callback: useDragHandleCallback = (delta) => {
    console.log("delta", delta);
  };
  const { dragging, handleMouseDown } = useDragHandle(callback);
  return (
    <div
      className={clipDragHandleStyle}
      onMouseDown={handleMouseDown}
      onPointerDown={(e) => e.stopPropagation()}
    />
  );
};

export default ClipDragHandle;
