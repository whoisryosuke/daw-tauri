import { useAtom } from "jotai";
import React, { useEffect } from "react";
import { tracksAtom, type TrackData } from "../../../store/composition";
import TrackComponent from "../Track/Track";
import { generateSimpleHash } from "../../../utils/hash";
import { Flex } from "@radix-ui/themes";

type Props = {};

const generateTrackData = (name = "Track 1"): TrackData => ({
  id: generateSimpleHash(),
  name,
  muted: false,
});

const Tracks = (props: Props) => {
  const [tracks, setTracks] = useAtom(tracksAtom);

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
    <Flex direction="column" style={{ flex: 1 }}>
      {tracks.map((track) => (
        <TrackComponent key={track.id} {...track} />
      ))}
    </Flex>
  );
};

export default Tracks;
