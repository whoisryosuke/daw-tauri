import React, { useRef } from "react";
import { DRAG_TYPES, type MediaBrowserDragData } from "../../../constants/drag";
import {
  trackClipsAtom,
  type TrackClipData,
  type TrackData,
} from "../../../store/composition";
import { useAtom } from "jotai";
import { createMediaClip, loadMedia } from "../../../services/media";
import { Flex } from "@radix-ui/themes";
import TrackClip from "../TrackClip/TrackClip";
import { generateSimpleHash } from "../../../utils/hash";
import { useDroppable } from "@dnd-kit/core";

type Props = TrackData & {};

const Track = ({ id, name }: Props) => {
  const [trackClips, setTrackClips] = useAtom(trackClipsAtom);
  const localClips = trackClips.filter((trackClip) => trackClip.trackId == id);

  const { isOver, setNodeRef } = useDroppable({
    id: `TRACK_${id}`,
    data: {
      id,
    },
  });

  return (
    <Flex
      ref={setNodeRef}
      style={{
        background: isOver ? "var(--accent-4)" : "transparent",
        // border: "1px solid blue",
        width: "100%",
      }}
    >
      <h3>{name}</h3>
      <Flex style={{ flex: 1 }}>
        {localClips.map((trackClip) => (
          <TrackClip key={trackClip.id} {...trackClip} />
        ))}
      </Flex>
    </Flex>
  );
};

export default Track;
