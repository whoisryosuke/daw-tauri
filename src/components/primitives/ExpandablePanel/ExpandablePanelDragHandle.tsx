import React, {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MouseEventHandler,
  type SetStateAction,
} from "react";
import type { ExpandablePanelSize } from "./types";
import { css } from "../../../../styled-system/css";
import {
  useDragHandle,
  useDragHandleCallback,
} from "../../../hooks/useDragHandle";

const handleStyle = css({
  position: "absolute",
  top: 0,
  right: 0,

  width: "10px",
  height: "100%",
  bg: {
    base: "transparent",
    _hover: "gray.4",
    _active: "blue.6",
  },
});

type Props = {
  setSize: Dispatch<SetStateAction<ExpandablePanelSize>>;
};

const ExpandablePanelDragHandle = ({ setSize }: Props) => {
  const callback: useDragHandleCallback = (delta) =>
    setSize((prev) => ({
      width: prev.width + delta.x,
      height: prev.height,
      //   height: prev.height + height,
    }));
  const { dragging, handleMouseDown } = useDragHandle(callback);

  return (
    <div
      className={handleStyle}
      onMouseDown={handleMouseDown}
      data-dragging={dragging}
    />
  );
};

export default ExpandablePanelDragHandle;
