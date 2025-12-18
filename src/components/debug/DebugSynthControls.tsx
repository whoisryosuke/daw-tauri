import { Button, Heading } from "@radix-ui/themes";
import { invoke } from "@tauri-apps/api/core";
import React from "react";

type Props = {};

const DebugSynthControls = (props: Props) => {
  const handleAddSynth = async () => {
    await invoke("add_synth");
  };

  return (
    <div>
      <Heading>DebugSynthControls</Heading>
      <Button onClick={handleAddSynth}>Add synth</Button>
    </div>
  );
};

export default DebugSynthControls;
