import { invoke } from "@tauri-apps/api/core";
import { Stack } from "../../../../../styled-system/jsx";
import { Note, NOTES_WHITE } from "../../../../constants/music";
import PianoKeyWhite from "./PianoKeyWhite";

type Props = {};

const PianoKeys = ({}: Props) => {
  const playSample = (midi: number) => {
    invoke("play_midi_key", { midi });
  };

  return (
    <Stack flexDir="row" gap="1">
      {NOTES_WHITE.map((note) => (
        <PianoKeyWhite note={note} play={playSample} />
      ))}
    </Stack>
  );
};

export default PianoKeys;
