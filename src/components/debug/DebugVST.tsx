import { invoke } from "@tauri-apps/api/core";
import React from "react";
import Button from "../ui/Button";

type Props = {};

const DebugVST = (props: Props) => {
  const handleCreate = async () => {
    const result = await invoke("create_vst");
    console.log("tested VST", result);
  };
  const handlePlay = async () => {
    const result = await invoke("test_vst");
    console.log("tested VST", result);
  };
  return (
    <div>
      <Button variant="default" size="small" onClick={handleCreate}>
        Create VST
      </Button>
      <Button variant="default" size="small" onClick={handlePlay}>
        Play note
      </Button>
    </div>
  );
};

export default DebugVST;
