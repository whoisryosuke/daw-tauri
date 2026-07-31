import React from "react";
import Waveform from "../Waveform";
import DebugSynthControls from "../debug/DebugSynthControls";
import DebugPlaybackTime from "../debug/DebugPlaybackTime";
import { Box, Stack } from "../../../styled-system/jsx";
import Heading from "../ui/Typography/Heading";

type Props = {};

const ModuleArea = (props: Props) => {
  return (
    <Box minHeight="200px">
      <Heading as="h5">ModuleArea</Heading>
      <Stack flexDir="row" gap="0">
        <Waveform />
        <DebugSynthControls />
        <DebugPlaybackTime />
      </Stack>
    </Box>
  );
};

export default ModuleArea;
