import { invoke } from "@tauri-apps/api/core";
import React from "react";
import Button from "../ui/Button";

type Props = {};

const DebugVST = (props: Props) => {
  const handleClick = async () => {
    const result = await invoke("test_vst");
    console.log("tested VST", result);
  };
  return (
    <div>
      <Button variant="default" size="small" onClick={handleClick}>
        VST Time
      </Button>
    </div>
  );
};

export default DebugVST;
