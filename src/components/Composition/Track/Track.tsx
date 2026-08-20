import {
  selectedTrackClipAtom,
  trackClipsAtom,
  type TrackData,
} from "../../../store/composition";
import { useAtom, useSetAtom } from "jotai";
import TrackClip from "../TrackClip/TrackClip";
import { useDroppable } from "@dnd-kit/core";
import { Box, Stack } from "../../../../styled-system/jsx";
import Heading from "../../ui/Typography/Heading";
import { css, cx } from "../../../../styled-system/css";

const MIN_HEIGHT = 129; // 125 + 4 = gap for border clip

const containerStyle = css({
  borderBottomWidth: "1px",
  borderColor: "gray.5",
  borderStyle: "solid",
  minHeight: MIN_HEIGHT,
});

type Props = TrackData & {
  width: number;
};

const Track = ({ id, name, trackType, width }: Props) => {
  const setSelectedTrackClip = useSetAtom(selectedTrackClipAtom);
  const [trackClips, setTrackClips] = useAtom(trackClipsAtom);
  const localClips = trackClips.filter((trackClip) => trackClip.track_id == id);

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
      <Stack
        ref={setNodeRef}
        flex={1}
        position="relative"
        bg={isOver ? "gray.2" : "transparent"}
      >
        {localClips.map((trackClip) => (
          <TrackClip key={trackClip.id} {...trackClip} width={width} />
        ))}
      </Stack>
    </Stack>
  );
};

export default Track;
