import React from "react";
import { Note, NOTES_BLACK, WhiteNotes } from "../../../../constants/music";
import PianoKeyBlack from "./PianoKeyBlack";
import { sva } from "../../../../../styled-system/css";

const pianoWhiteKeyRecipe = sva({
  slots: ["container", "whiteKey"],
  base: {
    container: {
      position: "relative",
      flex: 1,
    },
    whiteKey: {
      minHeight: 100,
      p: 4,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      fontSize: 1,
      bg: { base: "gray.9", _hover: "blue.6" },
      borderColor: "gray.10",
      color: "gray.2",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 3,
    },
  },
  variants: {
    pressed: {
      true: {
        whiteKey: {
          bg: "blue.6",
        },
      },
    },
  },
});

type Props = {
  note: WhiteNotes;
  play: (note: Note) => void;
};

const PianoKeyWhite = ({ note, play }: Props) => {
  const styles = pianoWhiteKeyRecipe({ pressed: false });
  // We also render a black key if needed
  const showBlackKey = NOTES_BLACK.find((blackNote) =>
    blackNote.includes(note),
  );
  return (
    <div className={styles.container}>
      <div className={styles.whiteKey}>{note}</div>
      {showBlackKey && <PianoKeyBlack note={note} play={play} />}
    </div>
  );
};

export default PianoKeyWhite;
