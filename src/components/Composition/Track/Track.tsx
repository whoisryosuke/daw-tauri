import { trackClipsAtom, type TrackData } from "../../../store/composition";
import { useAtom } from "jotai";
import TrackClip from "../TrackClip/TrackClip";
import { useDroppable } from "@dnd-kit/core";
import { Stack } from "../../../../styled-system/jsx";
import Heading from "../../ui/Typography/Heading";

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
    <Stack width="100%" position="relative" minHeight={100}>
      <Heading
        as="h3"
        style={{
          position: "absolute",
          top: "var(--space-2)",
          left: "var(--space-2)",
        }}
      >
        {name}
      </Heading>
      <Stack
        ref={setNodeRef}
        flex={1}
        position="relative"
        bg={isOver ? "colorPalette.4" : "transparent"}
      >
        {localClips.map((trackClip) => (
          <TrackClip key={trackClip.id} {...trackClip} width={width} />
        ))}
      </Stack>
    </Stack>
  );
};

export default Track;
