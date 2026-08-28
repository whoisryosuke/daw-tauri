import {
  selectedTrackAtom,
  selectedTrackClipAtom,
  trackClipsAtom,
  type TrackData,
} from "../../../store/composition";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import TrackClip from "../TrackClip/TrackClip";
import { useDroppable } from "@dnd-kit/core";
import { Box, Stack } from "../../../../styled-system/jsx";
import Heading from "../../ui/Typography/Heading";
import { css, cx } from "../../../../styled-system/css";

const MIN_HEIGHT = 129; // 125 + 4 = gap for border clip

const highlightStyle = css({
  position: "absolute",
  inset: 0,
  bgLinear: "to-b",
  gradientFrom: {
    base: "gray.alpha-1",
    _hover: "gray.alpha-1",
  },
  gradientTo: {
    base: "gray.alpha-2",
    _hover: "gray.alpha-5",
  },

  userSelect: "none",

  _motionSafe: {
    transitionProperty: "opacity",
    transitionTimingFunction: "ease-in-out",
    transitionDuration: "slow",
  },
});
const containerStyle = css({
  position: "relative",
  borderBottomWidth: "1px",
  borderColor: "gray.5",
  borderStyle: "solid",
  minHeight: MIN_HEIGHT,
});

type Props = TrackData & {
  width: number;
};

const Track = ({ id, name, trackType, width }: Props) => {
  const selectedTrackId = useAtomValue(selectedTrackAtom);
  const setSelectedTrackClip = useSetAtom(selectedTrackClipAtom);
  const [trackClips, setTrackClips] = useAtom(trackClipsAtom);
  const localClips = trackClips.filter((trackClip) => trackClip.track_id == id);

  const isSelected = id == selectedTrackId;

  const { isOver, setNodeRef } = useDroppable({
    id: `TRACK_${id}`,
    data: {
      id,
      trackType,
    },
  });

  const handleClick = () => {
    console.log("track clicked");
    setSelectedTrackClip("");
  };

  return (
    <Stack
      width="100%"
      position="relative"
      flexDirection="row"
      className={containerStyle}
      onClick={handleClick}
    >
      <div className={highlightStyle} style={{ opacity: isSelected ? 1 : 0 }} />
      <Stack
        ref={setNodeRef}
        flex={1}
        position="relative"
        bg={isOver ? "gray.alpha-2" : "transparent"}
      >
        {localClips.map((trackClip) => (
          <TrackClip key={trackClip.id} {...trackClip} width={width} />
        ))}
      </Stack>
    </Stack>
  );
};

export default Track;
