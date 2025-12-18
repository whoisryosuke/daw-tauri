import React from "react";
import Tracks from "./Tracks/Tracks";
import { Flex } from "@radix-ui/themes";

type Props = {};

const Composition = (props: Props) => {
  return (
    <Flex style={{ flex: 1 }}>
      <Tracks />
    </Flex>
  );
};

export default Composition;
