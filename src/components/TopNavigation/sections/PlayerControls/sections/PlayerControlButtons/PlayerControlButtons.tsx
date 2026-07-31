import { invoke } from "@tauri-apps/api/core";
import React from "react";
import { BsPlay, BsRecord, BsStop } from "react-icons/bs";
import { Stack } from "../../../../../../../styled-system/jsx";
import Button from "../../../../../ui/Button";

const PlayerControlButton = (props) => <Button variant="ghost" {...props} />;

type Props = {};

const PlayerControlButtons = (props: Props) => {
  const sharedStyles = { width: "var(--space-6)", height: "var(--space-6)" };

  const handlePlay = async () => {
    console.log("playing audio");
    await invoke("play_audio", {});
  };

  const handleStop = async () => {
    console.log("stopping audio");
    await invoke("stop_audio");
  };

  return (
    <Stack gap="1" flexDir="row">
      <PlayerControlButton onClick={handlePlay}>
        <BsPlay style={sharedStyles} />
      </PlayerControlButton>
      <PlayerControlButton onClick={handleStop}>
        <BsStop style={sharedStyles} />
      </PlayerControlButton>
      <PlayerControlButton>
        <BsRecord style={sharedStyles} />
      </PlayerControlButton>
    </Stack>
  );
};

export default PlayerControlButtons;
