import React from "react";
import {
  useDragHandle,
  useDragHandleCallback,
} from "../../../../hooks/useDragHandle";
import { css } from "../../../../../styled-system/css";
import mapRange from "../../../../utils/map";
import { getTimeBasedOnTimelinePosition } from "../../../../services/composition";
import {
  Clip,
  clipsAtom,
  TrackClipData,
  trackClipsAtom,
} from "../../../../store/composition";
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
  trackId: TrackClipData["id"];
  range: TrackClipData["range"];
  duration: Clip["duration"];
  left?: boolean;
};

const updateClipRange =
  (
    id: TrackClipData["id"],
    duration: number,
    newRange: number,
    start?: boolean,
  ) =>
  (items: TrackClipData[]) =>
    items.map((item) => {
      if (item.id == id) {
        const defaultStartRange = item.range ? item.range[0] : 0;

        return {
          ...item,
          // Range is optional, we need to check or provide a default to initialize
          // Default is always `[0, duration]`
          range: start
            ? [newRange, item.range ? item.range[1] : duration]
            : [defaultStartRange, newRange],
          start_time: start
            ? Math.max(item.start_time + (defaultStartRange - newRange) * -1, 0)
            : item.start_time,
        };
      }
      return item;
    });

const ClipDragHandle = ({ trackId: id, range, duration, left }: Props) => {
  const setClips = useSetAtom(trackClipsAtom);

  const callback: useDragHandleCallback = (delta) => {
    // Convert distance to seconds
    const absoluteTime = getTimeBasedOnTimelinePosition(Math.abs(delta.x));
    console.log("delta", delta, absoluteTime);

    const direction = Math.sign(delta.x);
    const newTime = absoluteTime * direction;

    // No range set yet?
    if (!range) {
      let [start, end] = [0, duration];
      let prevRange = left ? start : end;
      // Only set if we go less than current value (since clip is clearly max)
      if (left && !direction) return;
      if (!left && direction) return;

      let newRange = Math.max(Math.min(prevRange + newTime, duration), 0.1);
      // Limit clips to be 0.1 long minimum
      if (left && end - newRange < 0.1) newRange = 0.1;
      if (!left && newRange - start < 0.1) newRange = duration - 0.1;

      setClips(updateClipRange(id, duration, newRange, left));
      return;
    }

    // Start or end of range (aka left or right)
    const [start, end] = range;
    let rangeSide = left ? start : end;
    // Limit to min (duration) and max (0 - can't have negative clips)
    const newRangeEnd = Math.max(Math.min(rangeSide + newTime, duration), 0.1);

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
