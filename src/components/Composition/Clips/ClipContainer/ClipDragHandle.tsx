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
    _hover: "gray.alpha-4",
    _active: "blue.alpha-6",
  },
  zIndex: 999,

  "&[data-left='true']": {
    right: "auto",
    left: 0,
  },
});

type Props = {
  id: Clip["id"];
  range: Clip["range"];
  duration: Clip["duration"];
  left?: boolean;
};

const updateClipRange =
  (id: Clip["id"], duration: number, newRange: number, start?: boolean) =>
  (items: Clip[]) =>
    items.map((item) => {
      if (item.id == id) {
        return {
          ...item,
          // Range is optional, we need to check or provide a default to initialize
          // Default is always `[0, duration]`
          range: start
            ? [newRange, item.range ? item.range[1] : duration]
            : [item.range ? item.range[0] : 0, newRange],
        };
      }
      return item;
    });

const ClipDragHandle = ({ id, range, duration, left }: Props) => {
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
      const newRange = Math.max(Math.min(duration + newTime, duration), 0);

      setClips(updateClipRange(id, duration, newRange, left));
      return;
    }

    // Start or end of range (aka left or right)
    const [start, end] = range;
    let rangeSide = left ? start : end;
    // Limit to min (duration) and max (0 - can't have negative clips)
    const newRangeEnd = Math.max(Math.min(rangeSide + newTime, duration), 0);

    setClips(updateClipRange(id, duration, newRangeEnd, left));
  };
  const { dragging, handlePointerDown } = useDragHandle(callback);

  return (
    <div
      className={clipDragHandleStyle}
      onPointerDownCapture={handlePointerDown}
      data-left={left}
    />
  );
};

export default ClipDragHandle;
