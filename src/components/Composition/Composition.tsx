import React from "react";
import Tracks from "./Tracks/Tracks";
import { Box, Stack } from "../../../styled-system/jsx";
import PlaybackHead from "./PlaybackHead/PlaybackHead";
import { useMeasure } from "react-use";
import TimeMarkers from "./TimeMarkers/TimeMarkers";
import TrackControls from "./TrackControls/TrackControls";
import { css } from "../../../styled-system/css";
import { useAtomValue } from "jotai/react";
import { compositionAtom } from "../../store/composition";
import { TIMELINE_DEFAULT_SPACING } from "../../constants/composition";

const timelineWindowStyle = css({
  "&::-webkit-scrollbar": {
    width: "10px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "gray.3",
  },
  "&::-webkit-scrollbar-thumb": {
    background: {
      base: "gray.6",
      _hover: "gray.8",
    },
    borderRadius: 1,
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "#555",
  },
});

const cornerBoxStyle = css({
  borderBottomWidth: "1px",
  borderColor: "gray.5",
  borderStyle: "solid",
});

type Props = {};

const Composition = (props: Props) => {
  const { zoom, range } = useAtomValue(compositionAtom);
  const timelineDistance = range[1] - range[0];
  const width = zoom * TIMELINE_DEFAULT_SPACING * timelineDistance;

  return (
    <Stack flexDirection="row" flex={1} gap={0} minWidth={0} style={{ width }}>
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
      <Box flex={1} overflow="hidden" position="relative" minWidth={0}>
        <Box
          minWidth="100%"
          height="100%"
          overflowX="scroll"
          position="relative"
          whiteSpace="nowrap"
          className={timelineWindowStyle}
        >
          <Stack style={{ width }} gap={0}>
            <TimeMarkers containerWidth={width} />
            <Tracks containerWidth={width} />
            <PlaybackHead containerWidth={width} />
          </Stack>
        </Box>
      </Box>
    </Stack>
  );
};

export default Composition;
