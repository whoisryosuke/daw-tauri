import { useAtom, useAtomValue } from "jotai";
import React from "react";
import {
  playMidiTrackAtom,
  selectedTrackAtom,
  tracksAtom,
} from "../../../store/composition";
import TrackControl from "./TrackControl";
import { Stack } from "../../../../styled-system/jsx";

type Props = {};

const TrackControls = (props: Props) => {
  const [tracks, setTracks] = useAtom(tracksAtom);
  const selectedTrackId = useAtomValue(selectedTrackAtom);
  const currentMidiTrack = useAtomValue(playMidiTrackAtom);

  const renderItems = tracks.map((track) => (
    <TrackControl
      key={track.id}
      selected={selectedTrackId == track.id}
      playMidi={currentMidiTrack == track.id}
      {...track}
    />
  ));

  return <Stack gap={0}>{renderItems}</Stack>;
};

export default TrackControls;
