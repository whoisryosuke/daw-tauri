import { useAtom } from "jotai";
import React, { useEffect } from "react";
import {
  CompositionData,
  tracksAtom,
  type TrackData,
} from "../../../store/composition";
import TrackComponent from "../Track/Track";
import { generateSimpleHash } from "../../../utils/hash";
import { useMeasure } from "react-use";
import { invoke } from "@tauri-apps/api/core";
import { Stack } from "../../../../styled-system/jsx";

type Props = {
  containerWidth: number;
};

const generateTrackData = (name = "Track 1"): TrackData => ({
  id: generateSimpleHash(),
  name,
  muted: false,
});

const Tracks = ({ containerWidth }: Props) => {
  const [tracks, setTracks] = useAtom(tracksAtom);

  // No track? Make sure we have at least 1 on load
  useEffect(() => {
    if (tracks.length == 0) {
      let newTracks: TrackData[] = [];
      new Array(3).fill(0).forEach((_, index) => {
        const newTrack = generateTrackData(`Track ${index + 1}`);
        newTracks.push(newTrack);

        let { id, ...trackData } = newTrack;
        invoke("add_track", { trackId: id, trackData });
      });

      setTracks(newTracks);
    }
  }, []);

  console.log("tracks", tracks);

  return (
    <Stack flex={1} gap={0}>
      {tracks.map((track) => (
        <TrackComponent key={track.id} {...track} width={containerWidth} />
      ))}
    </Stack>
  );
};

export default Tracks;
