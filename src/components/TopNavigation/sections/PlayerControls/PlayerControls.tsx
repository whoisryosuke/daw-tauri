import { Flex } from "@radix-ui/themes";
import React from "react";
import ArrangementPosition from "./sections/ArrangementPosition/ArrangementPosition";
import PlayerControlButtons from "./sections/PlayerControlButtons/PlayerControlButtons";
import CaptureButtons from "./sections/CaptureButtons/CaptureButtons";

type Props = {};

const PlayerControls = (props: Props) => {
  return (
    <Flex align="center" gap="4">
      <ArrangementPosition />
      <PlayerControlButtons />
      <CaptureButtons />
    </Flex>
  );
};

export default PlayerControls;
