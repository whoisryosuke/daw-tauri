import { useAtom, useAtomValue } from "jotai";
import React from "react";
import {
  playMidiTrackAtom,
  selectedTrackAtom,
  tracksAtom,
} from "../../../store/composition";
import TrackControl from "./TrackControl";
import { Stack } from "../../../../styled-system/jsx";
import ContextMenu, { ContextMenuItem } from "../../ui/ContextMenu/ContextMenu";
import { addTrack } from "../../../services/composition";
import { PiPianoKeys } from "react-icons/pi";
import { FaFileAudio } from "react-icons/fa6";
import { css } from "../../../../styled-system/css";

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
    {
      icon: <FaFileAudio />,
      title: "Add Audio Track",
      onClick: handleAddAudioTrack,
    },
    {
      icon: <PiPianoKeys />,
      title: "Add MIDI Track",
      onClick: handleAddMIDITrack,
    },
  ];

  return (
    <Stack gap={0}>
      {renderItems}
      <ContextMenu
        items={contextMenuItems}
        triggerClass={css({ bg: "gray.2" })}
      />
    </Stack>
  );
};

export default TrackControls;
