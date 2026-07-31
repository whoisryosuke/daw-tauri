import React from "react";
import ArrangementPosition from "./sections/ArrangementPosition/ArrangementPosition";
import PlayerControlButtons from "./sections/PlayerControlButtons/PlayerControlButtons";
import CaptureButtons from "./sections/CaptureButtons/CaptureButtons";
import { Stack } from "../../../../../styled-system/jsx";

type Props = {};

const PlayerControls = (props: Props) => {
  return (
    <Stack flexDir="row" align="center" gap="4">
      <ArrangementPosition />
      <PlayerControlButtons />
      <CaptureButtons />
    </Stack>
  );
};

export default PlayerControls;
