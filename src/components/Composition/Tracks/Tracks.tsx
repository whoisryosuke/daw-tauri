import { useAtom } from "jotai";
import React, { useEffect } from "react";
import {
  CompositionData,
  tracksAtom,
  type TrackData,
} from "../../../store/composition";
import TrackComponent from "../Track/Track";
import { generateSimpleHash } from "../../../utils/hash";
import { Flex } from "@radix-ui/themes";
import { useMeasure } from "react-use";

type Props = {};

const generateTrackData = (name = "Track 1"): TrackData => ({
  id: generateSimpleHash(),
  name,
  muted: false,
});

const Tracks = (props: Props) => {
  const [tracks, setTracks] = useAtom(tracksAtom);
  const [ref, { width }] = useMeasure<HTMLDivElement>();

  // No track? Make sure we have at least 1 on load
  useEffect(() => {
    if (tracks.length == 0) {
      const newTrack = generateTrackData();
      const newTrack2 = generateTrackData("Track 2");
      const newTrack3 = generateTrackData("Track 3");
      setTracks([newTrack, newTrack2, newTrack3]);
    }
  }, []);

  console.log("tracks", tracks);

  return (
    <Flex ref={ref} direction="column" style={{ flex: 1 }}>
      {tracks.map((track) => (
        <TrackComponent key={track.id} {...track} width={width} />
      ))}
    </Flex>
  );
};

export default Tracks;
