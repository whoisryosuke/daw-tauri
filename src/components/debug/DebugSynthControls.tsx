import { Box, Button, Heading } from "@radix-ui/themes";
import { invoke } from "@tauri-apps/api/core";
import React from "react";

type Props = {};

const DebugSynthControls = (props: Props) => {
  const handleAddSynth = async () => {
    await invoke("add_synth");
  };

  return (
    <Box m="2">
      <Heading as="h3">DebugSynthControls</Heading>
      <Button onClick={handleAddSynth}>Add synth</Button>
    </Box>
  );
};

export default DebugSynthControls;
