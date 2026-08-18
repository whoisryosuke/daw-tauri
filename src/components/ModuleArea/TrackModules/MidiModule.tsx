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
import PianoKeys from "../../features/Input/PianoKeys/PianoKeys";
import DropZone from "../../ui/DropZone/DropZone";
import { FaFileAudio } from "react-icons/fa6";

type DropZoneProps = {
  track: TrackData;
};
const MIDIDropZone = ({ track }: DropZoneProps) => {
  return (
    <DropZone
      id={`MIDI_MODULE`}
      data={{
        trackId: track.id,
      }}
      text="Drop a sample here"
      icon={<FaFileAudio size={24} />}
    />
  );
};

type Props = {
  currentTrack: TrackData;
};

const MidiModule = ({ currentTrack }: Props) => {
  const clips = useAtomValue(clipsAtom);

  const clipId = currentTrack?.clip;
  const currentClip = clips.find((item) => item.id == clipId);

  if (!currentTrack || currentTrack.trackType != "Midi") return <div></div>;

  const showDrop = !clipId || clipId == "";

  return (
    <Stack flexDir="row">
      {showDrop ? (
        <MIDIDropZone track={currentTrack} />
      ) : (
        <Box>
          <Text>Current clip</Text>
          <Text>{currentClip?.name}</Text>
        </Box>
      )}
      <Box>
        <PianoKeys />
      </Box>
    </Stack>
  );
};

export default MidiModule;
