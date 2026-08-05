import { useAtomValue } from "jotai";
import { css } from "../../../../../../../styled-system/css";
import { Stack } from "../../../../../../../styled-system/jsx";
import {
  playbackTimeAtom,
  sampleRateAtom,
} from "../../../../../../store/composition";
import { DEFAULT_PPQ, getMusicalTime } from "../../../../../../utils/music";

const inputStyle = css({
  width: "5ch",
  bg: {
    base: "gray.4",
    _hover: "gray.5",
    _active: "gray.3",
  },
  color: {
    base: "gray.11",
    _hover: "gray.12",
    _focus: "gray.12",
  },
  borderRadius: "4",
  py: 1,
  px: 2,
  textAlign: "right",
});

type Props = {};

const ArrangementPosition = (props: Props) => {
  const sampleRate = useAtomValue(sampleRateAtom);
  const playbackTime = useAtomValue(playbackTimeAtom);

  // Convert frame-based time to a musical notation (aka "PPQ"-based)
  const [bars, beats, ticks] = getMusicalTime(
    playbackTime,
    sampleRate,
    120,
    DEFAULT_PPQ,
    4,
  );

  return (
    <Stack flexDir="row" gap="0">
      <input
        className={inputStyle}
        value={bars}
        style={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }}
      />
      <input
        className={inputStyle}
        value={beats}
        style={{
          borderRadius: 0,
        }}
      />
      <input
        className={inputStyle}
        value={ticks}
        style={{
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        }}
      />
    </Stack>
  );
};

export default ArrangementPosition;
