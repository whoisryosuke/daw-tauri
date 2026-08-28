import React from "react";
import mapRange from "../../../utils/map";
import { useAtomValue } from "jotai";
import { compositionAtom } from "../../../store/composition";
import TimeMarker from "./TimeMarker";
import { css } from "../../../../styled-system/css";

const containerStyle = css({
  width: "100%",
  height: "50px",
  // backgroundColor: "gray.2",
  position: "absolute",
  top: 0,
  left: 0,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",

  borderBottomWidth: "1px",
  borderColor: "gray.5",
  borderStyle: "solid",
});

type Props = {
  containerWidth: number;
  precision?: number;
};

const TimeMarkers = ({ containerWidth, precision = 100 }: Props) => {
  const { range } = useAtomValue(compositionAtom);

  const markers = new Array(precision)
    .fill(0)
    .map((_, index) => (
      <TimeMarker>
        {Math.round(mapRange(index + 1, 0, precision + 1, range[0], range[1]))}
      </TimeMarker>
    ));
  return (
    <div
      className={containerStyle}
      style={{ width: containerWidth, paddingLeft: 150 }}
    >
      {/* We create an empty div to represent 0 since we don't render the number */}
      <div />
      {markers}
      <TimeMarker>{range[1]}</TimeMarker>
    </div>
  );
};

export default TimeMarkers;
