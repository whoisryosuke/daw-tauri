import { Flex } from "@radix-ui/themes";
import React from "react";
import ControlIconButton from "../../shared/ControlButton/ControlIconButton";
import { CgPiano } from "react-icons/cg";

type Props = {};

const ViewControls = (props: Props) => {
  return (
    <Flex align="center" gap="1">
      <ControlIconButton>
        <CgPiano />
      </ControlIconButton>
    </Flex>
  );
};

export default ViewControls;
