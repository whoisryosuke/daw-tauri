import React from "react";
import Tracks from "./Tracks/Tracks";
import { Box, Stack } from "../../../styled-system/jsx";
import PlaybackHead from "./PlaybackHead/PlaybackHead";
import { useMeasure } from "react-use";
import TimeMarkers from "./TimeMarkers/TimeMarkers";
import TrackControls from "./TrackControls/TrackControls";
import { css } from "../../../styled-system/css";

const cornerBoxStyle = css({
  borderBottomWidth: "1px",
  borderColor: "gray.5",
  borderStyle: "solid",
});

type Props = {};

const Composition = (props: Props) => {
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  return (
    <Stack flexDirection="row" flex={1} gap={0}>
      {/* Left Side */}
      <Stack width="150px" gap={0}>
        <Box
          width="100%"
          height="50px"
          bg="gray.2"
          className={cornerBoxStyle}
        />
        <TrackControls />
      </Stack>

      {/* Timeline */}
      <Stack ref={ref} flex={1} overflowX="none" position="relative" gap={0}>
        <TimeMarkers containerWidth={width} />
        <Tracks containerWidth={width} />
        <PlaybackHead containerWidth={width} />
      </Stack>
    </Stack>
  );
};

export default Composition;
