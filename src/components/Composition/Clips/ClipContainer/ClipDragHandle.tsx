import React from "react";
import {
  useDragHandle,
  useDragHandleCallback,
} from "../../../../hooks/useDragHandle";
import { css } from "../../../../../styled-system/css";
import mapRange from "../../../../utils/map";
import { getTimeBasedOnTimelinePosition } from "../../../../services/media";
import { Clip, clipsAtom } from "../../../../store/composition";
import { useAtomValue, useSetAtom } from "jotai";

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

type Props = {
  id: Clip["id"];
  range: Clip["range"];
  duration: Clip["duration"];
};

const updateClipRange = (id: Clip["id"], newRange: number) => (items: Clip[]) =>
  items.map((item) => {
    if (item.id == id) {
      return {
        ...item,
        range: [0, newRange],
      };
    }
    return item;
  });

const ClipDragHandle = ({ id, range, duration }: Props) => {
  const setClips = useSetAtom(clipsAtom);

  const callback: useDragHandleCallback = (delta) => {
    // Convert distance to seconds
    const absoluteTime = getTimeBasedOnTimelinePosition(Math.abs(delta.x));
    console.log("delta", delta, absoluteTime);

    const direction = Math.sign(delta.x);
    const newTime = absoluteTime * direction;

    // No range set yet?
    if (!range) {
      // Only set if we go less than current value (since clip is clearly max)
      if (direction) return;
      // We add here because time is negative
      const newRange = Math.min(duration + newTime, duration);

      setClips(updateClipRange(id, newRange));
      return;
    }

    const [start, end] = range;
    const newRangeEnd = Math.min(end + newTime, duration);

    setClips(updateClipRange(id, newRangeEnd));
  };
  const { dragging, handlePointerDown } = useDragHandle(callback);

  return (
    <div
      className={clipDragHandleStyle}
      onPointerDownCapture={handlePointerDown}
    />
  );
};

export default ClipDragHandle;
