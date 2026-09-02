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
import MusicalGrid from "./MusicalGrid/MusicalGrid";

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
  const timelineDistance = range[1] - range[0];
  const width = zoom * TIMELINE_DEFAULT_SPACING * timelineDistance;

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
          <MusicalGrid width={width} duration={timelineDistance} />
          <TimeMarkers
            containerWidth={width}
            range={range}
            duration={timelineDistance}
          />
          <Stack position="relative" style={{ width }} mt={"50px"} gap={0}>
            <PlaybackHead containerWidth={width} />
            <Tracks containerWidth={width} />
          </Stack>
        </Box>
      </Stack>
    </Panel>
  );
};

export default Composition;
