import React from "react";
import Waveform from "../Waveform";
import DebugSynthControls from "../debug/DebugSynthControls";
import { Box, Stack } from "../../../styled-system/jsx";
import EffectModules from "./EffectModules/EffectModules";
import MidiModule from "./TrackModules/MidiModule";
import ToastButton from "../ui/Toast/ToastButton";

type Props = {};

const ModuleArea = (props: Props) => {
  return (
    <Box minHeight="200px">
      <Stack flexDir="row" gap="0" height="100%" p={2}>
        <ToastButton />
        <Waveform />
        <MidiModule />
        <EffectModules />
        {/* <DebugSynthControls /> */}
      </Stack>
    </Box>
  );
};

export default ModuleArea;
