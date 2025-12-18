import React from "react";
import MusicControls from "./sections/MusicControls/MusicControls";
import PlayerControls from "./sections/PlayerControls/PlayerControls";
import ViewControls from "./sections/ViewControls/ViewControls";
import { Flex } from "@radix-ui/themes";

type Props = {};

const TopNavigation = (props: Props) => {
  return (
    <Flex justify="between">
      <MusicControls />
      <PlayerControls />
      <ViewControls />
    </Flex>
  );
};

export default TopNavigation;
