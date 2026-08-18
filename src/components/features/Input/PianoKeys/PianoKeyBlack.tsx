import React from "react";
import { BaseNote, Note, WhiteNotes } from "../../../../constants/music";
import { css } from "../../../../../styled-system/css";
import { noteToMidi } from "../../../../utils/midi";

const blackKeyStyle = css({
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  alignItems: "center",
  top: 0,
  left: "66.6%",
  width: "75%",
  height: "60%",
  py: 2,
  zIndex: 420,
  fontSize: 1,
  bg: { base: "gray.2", _hover: "blue.3" },
  borderColor: { base: "gray.3", _hover: "blue.7" },
  color: { base: "gray.10", _hover: "blue.10" },
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: 3,

  userSelect: "none",
  cursor: "pointer",

  _motionSafe: {
    transitionProperty: "background-color, color, border-color",
    transitionTimingFunction: "ease-in-out",
    transitionDuration: "fast",
  },

  "&[data-pressed='true']": {
    bg: "blue.6",
  },
});

type Props = {
  note: WhiteNotes;
  play: (midi: number) => void;
  selected: boolean;
};

const PianoKeyBlack = ({ note, play, selected }: Props) => {
  const blackNote = `${note}#` as BaseNote;
  const midi = noteToMidi(blackNote, 4);

  const handlePlay = () => {
    play(midi);
  };

  return (
    <div className={blackKeyStyle} data-pressed={selected} onClick={handlePlay}>
      {blackNote}
    </div>
  );
};

export default PianoKeyBlack;
