import React from "react";
import Tracks from "./Tracks/Tracks";
import { Box, Stack } from "../../../styled-system/jsx";
import PlaybackHead from "./PlaybackHead/PlaybackHead";
import { useMeasure } from "react-use";
import TimeMarkers from "./TimeMarkers/TimeMarkers";

type Props = {};

const Composition = (props: Props) => {
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  return (
    <Stack flex={1} px={2} position="relative">
      <Box
        width="100%"
        height="50px"
        bg="gray.2"
        position="absolute"
        top="0"
        left="0"
      />
      <Stack ref={ref} flex={1} overflowX="none" position="relative">
        <TimeMarkers containerWidth={width} />
        <Tracks containerWidth={width} />
        <PlaybackHead containerWidth={width} />
      </Stack>
    </Stack>
  );
};

export default Composition;
