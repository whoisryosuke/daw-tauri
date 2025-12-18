import React from "react";
import { BsArrowLeft, BsCircle, BsPlus } from "react-icons/bs";
import ControlIconButton from "../../../../shared/ControlButton/ControlIconButton";
import { Flex } from "@radix-ui/themes";
import { BiArrowToRight, BiLink, BiSquareRounded } from "react-icons/bi";
import {
  TbViewfinder,
  TbViewfinderOff,
  TbViewportNarrow,
} from "react-icons/tb";
import { FaUsersViewfinder } from "react-icons/fa6";
import { FiCircle } from "react-icons/fi";

type Props = {};

const CaptureButtons = (props: Props) => {
  return (
    <Flex>
      <ControlIconButton
        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
      >
        <BsPlus />
      </ControlIconButton>
      <ControlIconButton radius="none">
        <BiLink />
      </ControlIconButton>
      <ControlIconButton radius="none">
        <BsArrowLeft />
      </ControlIconButton>
      <ControlIconButton radius="none">
        <BiSquareRounded />
      </ControlIconButton>
      <ControlIconButton
        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
      >
        <FiCircle />
      </ControlIconButton>
    </Flex>
  );
};

export default CaptureButtons;
