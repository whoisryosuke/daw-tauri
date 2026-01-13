import React from "react";
import Tracks from "./Tracks/Tracks";
import { Flex } from "@radix-ui/themes";
import { useAtomValue } from "jotai";
import { compositionAtom } from "../../store/composition";

type Props = {};

const Composition = (props: Props) => {
  return (
    <Flex style={{ flex: 1, overflowX: "auto" }}>
      <Tracks />
    </Flex>
  );
};

export default Composition;
