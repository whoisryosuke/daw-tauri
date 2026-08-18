import React from "react";
import { Note, NOTES_BLACK, WhiteNotes } from "../../../../constants/music";
import PianoKeyBlack from "./PianoKeyBlack";
import { sva } from "../../../../../styled-system/css";
import { useAtomValue } from "jotai";
import { inputStore } from "../../../../store/input";
import { noteToMidi } from "../../../../utils/midi";

const pianoWhiteKeyRecipe = sva({
  slots: ["container", "whiteKey"],
  base: {
    container: {
      position: "relative",
      flex: 1,
    },
    whiteKey: {
      minHeight: 100,
      height: "100%",
      p: 4,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      fontSize: 1,
      bg: { base: "gray.9", _hover: "blue.6" },
      borderColor: { base: "gray.10", _hover: "blue.7" },
      color: { base: "gray.2", _hover: "blue.2" },
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 3,

      _motionSafe: {
        transitionProperty: "background-color, color, border-color",
        transitionTimingFunction: "ease-in-out",
        transitionDuration: "fast",
      },

      userSelect: "none",
      cursor: "pointer",
    },
  },
  variants: {
    pressed: {
      true: {
        whiteKey: {
          bg: "blue.6",
          color: "blue.2",
          borderColor: "blue.7",
        },
      },
    },
  },
});

type Props = {
  note: WhiteNotes;
  play: (midi: number) => void;
};

const PianoKeyWhite = ({ note, play }: Props) => {
  const input = useAtomValue(inputStore);
  const midi = noteToMidi(note, 4);
  const blackMidi = midi + 1;
  const isSelected = input[midi].pressed;
  const isBlackSelected = input[blackMidi].pressed;
  const styles = pianoWhiteKeyRecipe({ pressed: isSelected });
  // We also render a black key if needed
  const showBlackKey = NOTES_BLACK.find((blackNote) =>
    blackNote.includes(note),
  );

  const handlePlay = () => {
    play(midi);
  };

  return (
    <div className={styles.container}>
      <div className={styles.whiteKey} onClick={handlePlay}>
        {note}
      </div>
      {showBlackKey && (
        <PianoKeyBlack note={note} play={play} selected={isBlackSelected} />
      )}
    </div>
  );
};

export default PianoKeyWhite;
