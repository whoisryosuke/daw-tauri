import React from "react";
import MusicControls from "./sections/MusicControls/MusicControls";
import PlayerControls from "./sections/PlayerControls/PlayerControls";
import ViewControls from "./sections/ViewControls/ViewControls";
import { Stack } from "../../../styled-system/jsx";

type Props = {};

const TopNavigation = (props: Props) => {
  return (
    <Stack flexDir="row" justify="between" pt={1}>
      <MusicControls />
      <PlayerControls />
      <ViewControls />
    </Stack>
  );
};

export default TopNavigation;
