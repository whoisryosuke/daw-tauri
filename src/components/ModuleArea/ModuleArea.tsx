import { Box, Heading } from "@radix-ui/themes";
import React from "react";
import Waveform from "../Waveform";

type Props = {};

const ModuleArea = (props: Props) => {
  return (
    <Box minHeight="200px">
      <Heading>ModuleArea</Heading>
      <Waveform />
    </Box>
  );
};

export default ModuleArea;
