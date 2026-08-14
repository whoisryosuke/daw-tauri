import React from "react";
import { Note, WhiteNotes } from "../../../../constants/music";
import { css } from "../../../../../styled-system/css";

const blackKeyStyle = css({
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  alignItems: "center",
  color: "gray.11",
  top: 0,
  left: "66.6%",
  width: "75%",
  height: "60%",
  zIndex: 420,
  fontSize: 1,
  bg: { base: "gray.2", _hover: "blue.6" },
  borderColor: "gray.3",
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: 3,
});

type Props = {
  note: WhiteNotes;
  play: (note: Note) => void;
};

const PianoKeyBlack = ({ note, play }: Props) => {
  const blackNote = `${note}#`;
  return <div className={blackKeyStyle}>{blackNote}</div>;
};

export default PianoKeyBlack;
