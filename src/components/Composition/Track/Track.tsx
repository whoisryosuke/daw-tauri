import React, { useRef } from "react";
import { useDrop } from "react-dnd";
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

type Props = TrackData & {};

const Track = ({ id, name }: Props) => {
  const dropTargetRef = useRef<HTMLDivElement>(null);
  const [trackClips, setTrackClips] = useAtom(trackClipsAtom);

  const localClips = trackClips.filter((trackClip) => trackClip.trackId == id);

  const addClipToTrack = async (item: MediaBrowserDragData) => {
    // Load media if needed and cache
    const media = await loadMedia(item);

    if (!media) {
      console.error("media/clip failed to load");
      return;
    }

    // Create a clip if necessary
    const clip = await createMediaClip(media, item.type);

    // Create a track clip using the ID of cache
    const newId = generateSimpleHash();
    const newTrackClip: TrackClipData = {
      id: newId,
      trackId: id,
      clipId: clip.id,
      startTime: 0,
      enabled: true,
    };
    console.log("created new clip", newTrackClip);
    setTrackClips((prev) => [...prev, newTrackClip]);
  };

  const [{ isOver }, drop] = useDrop<MediaBrowserDragData>(
    () => ({
      accept: DRAG_TYPES.CLIP,
      drop: (item, monitor) => {
        console.log("something dropped", item);

        addClipToTrack(item);

        const clientOffset = monitor.getClientOffset();
        if (clientOffset && dropTargetRef.current) {
          const dropTargetRect = dropTargetRef.current.getBoundingClientRect();

          // Calculate relative coordinates
          const relativeX = clientOffset.x - dropTargetRect.left;
          const relativeY = clientOffset.y - dropTargetRect.top;

          console.log("Dropped at relative position:", {
            x: relativeX,
            y: relativeY,
          });
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    []
  );

  const combineRef = (elem: HTMLDivElement) => {
    dropTargetRef.current = elem;
    drop(dropTargetRef);
  };

  return (
    <Flex
      ref={combineRef}
      style={{
        background: isOver ? "var(--accent-4)" : "transparent",
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
