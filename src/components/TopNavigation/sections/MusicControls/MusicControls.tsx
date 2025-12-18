import { Flex, IconButton } from "@radix-ui/themes";
import React from "react";
import { BiLeftIndent, BiRightIndent, BiSidebar } from "react-icons/bi";
import { IoMdArrowDropdown } from "react-icons/io";
import { PiMetronome } from "react-icons/pi";
import SelectBarControl from "./SelectBarControl";
import ControlButton from "../../shared/ControlButton/ControlButton";
import ControlIconButton from "../../shared/ControlButton/ControlIconButton";

type Props = {};

const MusicControls = (props: Props) => {
  return (
    <Flex align="center" gap="1" style={{ padding: "0 var(--space-2) " }}>
      <IconButton variant="ghost" color="gray" size="1" m="1">
        <BiSidebar />
      </IconButton>
      <ControlButton>Tap</ControlButton>
      <ControlButton>128.00</ControlButton>
      <ControlIconButton>
        <BiLeftIndent />
      </ControlIconButton>
      <ControlIconButton>
        <BiRightIndent />
      </ControlIconButton>
      <ControlButton>4 / 4</ControlButton>

      <Flex>
        <ControlIconButton
          style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
        >
          <PiMetronome />
        </ControlIconButton>
        <ControlIconButton
          style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
        >
          <IoMdArrowDropdown />
        </ControlIconButton>
      </Flex>

      <SelectBarControl />
    </Flex>
  );
};

export default MusicControls;
