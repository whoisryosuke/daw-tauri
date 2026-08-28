import React from "react";
import { BsArrowLeft, BsCircle, BsPlus } from "react-icons/bs";
import ControlIconButton from "../../../../shared/ControlButton/ControlIconButton";
import { BiArrowToRight, BiLink, BiSquareRounded } from "react-icons/bi";
import {
  TbViewfinder,
  TbViewfinderOff,
  TbViewportNarrow,
} from "react-icons/tb";
import { FaUsersViewfinder } from "react-icons/fa6";
import { FiCircle } from "react-icons/fi";
import { Stack } from "../../../../../../../styled-system/jsx";
import { css } from "../../../../../../../styled-system/css";

const middleButtonStyle = css({
  borderRadius: 0,
  borderRight: 0,
});

type Props = {};

const CaptureButtons = (props: Props) => {
  return (
    <Stack flexDir="row" gap="0">
      <ControlIconButton
        style={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          borderRight: 0,
        }}
      >
        <BsPlus />
      </ControlIconButton>
      <ControlIconButton className={middleButtonStyle}>
        <BiLink />
      </ControlIconButton>
      <ControlIconButton className={middleButtonStyle}>
        <BsArrowLeft />
      </ControlIconButton>
      <ControlIconButton className={middleButtonStyle}>
        <BiSquareRounded />
      </ControlIconButton>
      <ControlIconButton
        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
      >
        <FiCircle />
      </ControlIconButton>
    </Stack>
  );
};

export default CaptureButtons;
