import React from "react";
import Tracks from "./Tracks/Tracks";
import { Stack } from "../../../styled-system/jsx";

type Props = {};

const Composition = (props: Props) => {
  return (
    <Stack flexDir="row" flex={1} overflowX="auto">
      <Tracks />
    </Stack>
  );
};

export default Composition;
