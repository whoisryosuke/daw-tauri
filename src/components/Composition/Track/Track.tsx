import { trackClipsAtom, type TrackData } from "../../../store/composition";
import { useAtom } from "jotai";
import TrackClip from "../TrackClip/TrackClip";
import { useDroppable } from "@dnd-kit/core";
import { Box, Stack } from "../../../../styled-system/jsx";
import Heading from "../../ui/Typography/Heading";
import { css, cx } from "../../../../styled-system/css";

const containerStyle = css({
  borderBottomWidth: "1px",
  borderColor: "gray.5",
  borderStyle: "solid",
});

type Props = TrackData & {
  width: number;
};

const Track = ({ id, name, width }: Props) => {
  const [trackClips, setTrackClips] = useAtom(trackClipsAtom);
  const localClips = trackClips.filter((trackClip) => trackClip.track_id == id);

  const { isOver, setNodeRef } = useDroppable({
    id: `TRACK_${id}`,
    data: {
      id,
    },
  });

  return (
    <Stack
      width="100%"
      position="relative"
      flexDirection="row"
      minHeight={100}
      className={containerStyle}
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
