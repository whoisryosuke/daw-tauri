import React from "react";
import Tracks from "./Tracks/Tracks";
import { Stack } from "../../../styled-system/jsx";
import PlaybackHead from "./PlaybackHead/PlaybackHead";
import { useMeasure } from "react-use";

type Props = {};

const Composition = (props: Props) => {
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  return (
    <Stack
      ref={ref}
      flexDir="row"
      flex={1}
      overflowX="auto"
      position="relative"
    >
      <Tracks containerWidth={width} />
      <PlaybackHead containerWidth={width} />
    </Stack>
  );
};

export default Composition;
