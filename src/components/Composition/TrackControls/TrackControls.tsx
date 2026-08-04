import { useAtom } from "jotai";
import React from "react";
import { tracksAtom } from "../../../store/composition";
import TrackControl from "./TrackControl";
import { Stack } from "../../../../styled-system/jsx";

type Props = {};

const TrackControls = (props: Props) => {
  const [tracks, setTracks] = useAtom(tracksAtom);

  const renderItems = tracks.map((track) => (
    <TrackControl key={track.id} {...track} />
  ));

  return <Stack gap={0}>{renderItems}</Stack>;
};

export default TrackControls;
