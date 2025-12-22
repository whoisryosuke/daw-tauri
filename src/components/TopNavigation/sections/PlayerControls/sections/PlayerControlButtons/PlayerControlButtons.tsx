import { Flex, IconButton } from "@radix-ui/themes";
import { invoke } from "@tauri-apps/api/core";
import React from "react";
import { BsPlay, BsRecord, BsStop } from "react-icons/bs";

const PlayerControlButton = (props) => (
  <IconButton
    variant="ghost"
    color="gray"
    size="1"
    style={{ margin: 0 }}
    {...props}
  />
);

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
    <Flex gap="1">
      <PlayerControlButton onClick={handlePlay}>
        <BsPlay style={sharedStyles} />
      </PlayerControlButton>
      <PlayerControlButton onClick={handleStop}>
        <BsStop style={sharedStyles} />
      </PlayerControlButton>
      <PlayerControlButton>
        <BsRecord style={sharedStyles} />
      </PlayerControlButton>
    </Flex>
  );
};

export default PlayerControlButtons;
