import { invoke } from "@tauri-apps/api/core";
import { Stack } from "../../../../../styled-system/jsx";
import { Note, NOTES_WHITE } from "../../../../constants/music";
import PianoKeyWhite from "./PianoKeyWhite";
import { store } from "../../../../store/store";
import { playbackTimeAtom } from "../../../../store/composition";

type Props = {};

const PianoKeys = ({}: Props) => {
  const playSample = (note: number, pressed: boolean) => {
    const currentTime = store.get(playbackTimeAtom);
    invoke("play_midi_key", {
      note,
      command: pressed ? "NoteOn" : "NoteOff",
      velocity: 1,
      time: currentTime,
      channel: 0,
    });
  };

  return (
    <Stack flexDir="row" gap="2px" flex={1}>
      {NOTES_WHITE.map((note) => (
        <PianoKeyWhite note={note} play={playSample} />
      ))}
    </Stack>
  );
};

export default PianoKeys;
