import { useAtomValue } from "jotai";
import React, { useEffect } from "react";
import { tracksAtom } from "../../../store/composition";
import TrackComponent from "../Track/Track";
import { Stack } from "../../../../styled-system/jsx";

type Props = {
  containerWidth: number;
};

const Tracks = ({ containerWidth }: Props) => {
  const tracks = useAtomValue(tracksAtom);

  return (
    <Stack width="100%" gap={0}>
      {tracks.map((track) => (
        <TrackComponent key={track.id} {...track} width={containerWidth} />
      ))}
    </Stack>
  );
};

export default Tracks;
