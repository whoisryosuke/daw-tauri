import React from "react";
import Waveform from "../Waveform";
import DebugSynthControls from "../debug/DebugSynthControls";
import { Box, Stack } from "../../../styled-system/jsx";
import EffectModules from "./EffectModules/EffectModules";
import MidiModule from "./TrackModules/MidiModule";

type Props = {};

const ModuleArea = (props: Props) => {
  return (
    <Stack flexDir="row" gap="0" height="100%" p={2}>
      <Waveform />
      <MidiModule />
      <EffectModules />
      {/* <DebugSynthControls /> */}
    </Stack>
  );
};

export default ModuleArea;
