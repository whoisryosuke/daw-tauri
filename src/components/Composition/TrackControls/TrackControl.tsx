import React from "react";
import { Box, Stack } from "../../../../styled-system/jsx";
import Text from "../../ui/Typography/Text";
import { css, cx } from "../../../../styled-system/css";
import { TrackData } from "../../../store/composition";

const trackControlContainer = css({
  backgroundColor: "gray.3",
  minHeight: 100,
  display: "flex",
  alignItems: "end",
  p: 2,
  borderBottomWidth: "1px",
  borderColor: "gray.5",
  borderStyle: "solid",
});
const headingStyle = css({
  fontSize: 1,
  color: "gray.9",
});

type Props = TrackData & {};

const TrackControl = ({ name }: Props) => {
  return (
    <div className={trackControlContainer}>
      <Text className={headingStyle}>{name}</Text>
    </div>
  );
};

export default TrackControl;
