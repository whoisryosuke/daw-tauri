import { Stack } from "../../../../../styled-system/jsx";
import { Note, NOTES_WHITE } from "../../../../constants/music";
import PianoKeyWhite from "./PianoKeyWhite";

type Props = {};

const PianoKeys = ({}: Props) => {
  const playSample = (note: Note) => {};

  return (
    <Stack flexDir="row" gap="1">
      {NOTES_WHITE.map((note) => (
        <PianoKeyWhite note={note} play={playSample} />
      ))}
    </Stack>
  );
};

export default PianoKeys;
