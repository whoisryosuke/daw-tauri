import { useAtom, useAtomValue } from "jotai";
import React from "react";
import {
  playMidiTrackAtom,
  selectedTrackAtom,
  TrackData,
  tracksAtom,
} from "../../../store/composition";
import TrackControl from "./TrackControl";
import { Stack } from "../../../../styled-system/jsx";
import ContextMenu, { ContextMenuItem } from "../../ui/ContextMenu/ContextMenu";
import { addTrack } from "../../../services/composition";

type Props = {};

const TrackControls = (props: Props) => {
  const [tracks, setTracks] = useAtom(tracksAtom);
  const selectedTrackId = useAtomValue(selectedTrackAtom);
  const currentMidiTrack = useAtomValue(playMidiTrackAtom);
  console.log("tracks", tracks);

  const handleAddAudioTrack = () => {
    addTrack("Audio", "Sample");
  };

  const handleAddMIDITrack = () => {
    addTrack("MIDI", "Midi");
  };

  const renderItems = tracks.map((track) => (
    <TrackControl
      key={track.id}
      selected={selectedTrackId == track.id}
      playMidi={currentMidiTrack == track.id}
      {...track}
    />
  ));

  const contextMenuItems: ContextMenuItem[] = [
    { title: "Add Audio Track", onClick: handleAddAudioTrack },
    { title: "Add MIDI Track", onClick: handleAddMIDITrack },
  ];

  return (
    <Stack gap={0}>
      {renderItems}
      <ContextMenu items={contextMenuItems} />
    </Stack>
  );
};

export default TrackControls;
