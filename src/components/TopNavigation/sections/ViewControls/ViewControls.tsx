import React from "react";
import ControlIconButton from "../../shared/ControlButton/ControlIconButton";
import { CgPiano } from "react-icons/cg";
import { Stack } from "../../../../../styled-system/jsx";

type Props = {};

const ViewControls = (props: Props) => {
  return (
    <Stack flexDir="row" align="center" gap="1">
      <ControlIconButton>
        <CgPiano />
      </ControlIconButton>
    </Stack>
  );
};

export default ViewControls;
