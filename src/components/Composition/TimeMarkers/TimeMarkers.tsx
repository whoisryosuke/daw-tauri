import React from "react";
import mapRange from "../../../utils/map";
import { useAtomValue } from "jotai";
import { compositionAtom, CompositionData } from "../../../store/composition";
import TimeMarker from "./TimeMarker";
import { css } from "../../../../styled-system/css";

const containerStyle = css({
  height: "50px",
  // backgroundColor: "gray.2",
  position: "absolute",
  top: 0,
  left: 0,
  display: "flex",
  alignItems: "end",
  gap: 0,

  borderBottomWidth: "1px",
  borderColor: "gray.5",
  borderStyle: "solid",
  backgroundColor: "gray.4",
});

type Props = {
  containerWidth: number;
  precision?: number;
  duration: number;
  range: CompositionData["range"];
};

const TimeMarkers = ({
  containerWidth,
  precision = 100,
  duration,
  range,
}: Props) => {
  const blockWidth = containerWidth / duration;

  const markers = new Array(precision)
    .fill(0)
    .map((_, index) => (
      <TimeMarker style={{ width: blockWidth }}>
        {Math.round(mapRange(index + 1, 0, precision + 1, range[0], range[1]))}
      </TimeMarker>
    ));
  return (
    <div className={containerStyle} style={{ width: containerWidth }}>
      {/* We create an empty div to represent 0 since we don't render the number */}
      <div style={{ width: blockWidth, flexShrink: 0 }} />
      {markers}
      <TimeMarker>{range[1]}</TimeMarker>
    </div>
  );
};

export default TimeMarkers;
