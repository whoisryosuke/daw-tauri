import { Box, Flex, Heading } from "@radix-ui/themes";
import React from "react";
import Waveform from "../Waveform";
import DebugSynthControls from "../debug/DebugSynthControls";

type Props = {};

const ModuleArea = (props: Props) => {
  return (
    <Box minHeight="200px">
      <Heading>ModuleArea</Heading>
      <Flex>
        <Waveform />
        <DebugSynthControls />
      </Flex>
    </Box>
  );
};

export default ModuleArea;
