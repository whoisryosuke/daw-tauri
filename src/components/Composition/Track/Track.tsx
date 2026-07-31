import React, { useRef } from "react";
import { DRAG_TYPES, type MediaBrowserDragData } from "../../../constants/drag";
import {
  trackClipsAtom,
  type TrackClipData,
  type TrackData,
} from "../../../store/composition";
import { useAtom } from "jotai";
import { createMediaClip, loadMedia } from "../../../services/media";
import { Flex, Heading } from "@radix-ui/themes";
import TrackClip from "../TrackClip/TrackClip";
import { generateSimpleHash } from "../../../utils/hash";
import { useDroppable } from "@dnd-kit/core";

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
    <Flex
      style={{
        // border: "1px solid blue",
        width: "100%",
        position: "relative",
        minHeight: 100,
      }}
    >
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
      <Flex
        ref={setNodeRef}
        style={{
          flex: 1,
          position: "relative",
          background: isOver ? "var(--accent-4)" : "transparent",
        }}
      >
        {localClips.map((trackClip) => (
          <TrackClip key={trackClip.id} {...trackClip} width={width} />
        ))}
      </Flex>
    </Flex>
  );
};

export default Track;
