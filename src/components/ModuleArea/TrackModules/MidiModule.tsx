import React from "react";
import { selectedTrackAtom, tracksAtom } from "../../../store/composition";
import { useAtomValue } from "jotai";
import Text from "../../ui/Typography/Text";

type Props = {};

const MidiModule = (props: Props) => {
  const selectedTrackId = useAtomValue(selectedTrackAtom);
  const tracks = useAtomValue(tracksAtom);

  const currentTrack = tracks.find((track) => track.id == selectedTrackId);
  const trackType = currentTrack?.trackType;
  const clip = currentTrack?.clip;

  if (!currentTrack || trackType != "Midi") return <div></div>;

  return (
    <div>
      <Text>Current clip</Text>
      <Text>{clip}</Text>
    </div>
  );
};

export default MidiModule;
