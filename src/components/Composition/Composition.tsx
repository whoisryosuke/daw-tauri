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
import Panel from "../ui/Panel/Panel";
import MusicalGrid, { generateMusicalGrid } from "./MusicalGrid/MusicalGrid";
import MIDIRecording from "./Recording/MIDIRecording";

const timelineWindowStyle = css({
  "&::-webkit-scrollbar": {
    width: "10px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "gray.3",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: {
      base: "gray.6",
      _hover: "gray.8",
    },
    borderRadius: 1,
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "#555",
  },
  "&::-webkit-scrollbar-corner": {
    backgroundColor: "gray.3",
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
  const timelineDistance = range[1] - range[0] + 1;
  const width = zoom * TIMELINE_DEFAULT_SPACING * timelineDistance;

  const subdivisionLevel = 4;
  const { totalBlocks, blockWidth } = generateMusicalGrid(
    timelineDistance,
    subdivisionLevel,
    width,
  );

  console.log("blockWidth", blockWidth);

  return (
    <Panel flex={1} gap={0} minWidth={0} mr={1} style={{ width }}>
      <Stack
        flexDirection="row"
        minWidth="100%"
        height="100%"
        overflowX="scroll"
        overflowY="visible"
        position="relative"
        whiteSpace="nowrap"
        className={timelineWindowStyle}
        gap={0}
      >
        {/* Left Side */}
        <Box width="150px" gap={0} position="sticky" left="0" zIndex={999}>
          <Box width="100%" height="50px" className={cornerBoxStyle} />
          <TrackControls />
        </Box>

        {/* Timeline */}
        <Box flex={1} position="relative" minWidth={0}>
          <TimeMarkers
            containerWidth={width}
            range={range}
            duration={timelineDistance}
          />
          <Stack
            position="relative"
            style={{ width }}
            mt={"50px"}
            gap={0}
            // Musical grid
            backgroundImage={`
    repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0px, transparent 1px, transparent ${blockWidth * subdivisionLevel}px),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, transparent 1px, transparent ${blockWidth}px)
  `}
            backgroundSize={"100px 100%"}
          >
            <PlaybackHead containerWidth={width} />
            <Tracks containerWidth={width} />
          </Stack>
        </Box>
      </Stack>
    </Panel>
  );
};

export default Composition;
