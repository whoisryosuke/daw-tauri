import { invoke } from "@tauri-apps/api/core";
import React from "react";
import { BsPlay, BsRecord, BsStop } from "react-icons/bs";
import { Stack } from "../../../../../../../styled-system/jsx";
import Button, { ButtonProps } from "../../../../../ui/Button";
import { useAtomValue } from "jotai";
import { recordingAtom } from "../../../../../../store/composition";
import {
  startRecording,
  stopRecording,
} from "../../../../../../services/composition";

type PlayerControlButtonProps = ButtonProps & {
  selected?: boolean;
};
const PlayerControlButton = ({
  selected,
  ...props
}: PlayerControlButtonProps) => (
  <Button
    variant="ghost"
    colorPalette={selected ? "blue" : "gray"}
    {...props}
  />
);

type Props = {};

const PlayerControlButtons = (props: Props) => {
  const { recording } = useAtomValue(recordingAtom);

  const sharedStyles = { width: "var(--space-6)", height: "var(--space-6)" };

  const handlePlay = async () => {
    console.log("playing audio");
    await invoke("play_audio", {});
  };

  const handleStop = async () => {
    console.log("stopping audio");
    await invoke("stop_audio");
    stopRecording();
  };

  return (
    <Stack gap="1" flexDir="row">
      <PlayerControlButton onClick={handlePlay}>
        <BsPlay style={sharedStyles} />
      </PlayerControlButton>
      <PlayerControlButton onClick={handleStop}>
        <BsStop style={sharedStyles} />
      </PlayerControlButton>
      <PlayerControlButton selected={recording}>
        <BsRecord
          style={sharedStyles}
          onClick={recording ? stopRecording : startRecording}
        />
      </PlayerControlButton>
    </Stack>
  );
};

export default PlayerControlButtons;
