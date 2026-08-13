import React from "react";
import {
  clipsAtom,
  selectedTrackAtom,
  TrackData,
  tracksAtom,
} from "../../../store/composition";
import { useAtomValue } from "jotai";
import Text from "../../ui/Typography/Text";
import { useDroppable } from "@dnd-kit/core";
import { Box, Stack } from "../../../../styled-system/jsx";

type DropZoneProps = {
  track: TrackData;
};
const DropZone = ({ track }: DropZoneProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `MIDI_MODULE`,
    data: {
      trackId: track.id,
    },
  });
  return <div ref={setNodeRef}>Drop zone</div>;
};

type Props = {};

const MidiModule = (props: Props) => {
  const selectedTrackId = useAtomValue(selectedTrackAtom);
  const tracks = useAtomValue(tracksAtom);
  const clips = useAtomValue(clipsAtom);

  const currentTrack = tracks.find((track) => track.id == selectedTrackId);
  const trackType = currentTrack?.trackType;
  const clipId = currentTrack?.clip;
  const currentClip = clips.find((item) => item.id == clipId);

  if (!currentTrack || trackType != "Midi") return <div></div>;

  const showDrop = !clipId || clipId == "";

  return (
    <Stack flexDir="row">
      {showDrop ? (
        <DropZone track={currentTrack} />
      ) : (
        <Box>
          <Text>Current clip</Text>
          <Text>{currentClip?.name}</Text>
        </Box>
      )}
      <Box>Sampler piano</Box>
    </Stack>
  );
};

export default MidiModule;
