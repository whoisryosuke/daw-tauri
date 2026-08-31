import React from "react";
import { BiLeftIndent, BiRightIndent, BiSidebar } from "react-icons/bi";
import { IoMdArrowDropdown } from "react-icons/io";
import { PiMetronome } from "react-icons/pi";
import SelectBarControl from "./SelectBarControl";
import ControlButton from "../../shared/ControlButton/ControlButton";
import { Stack } from "../../../../../styled-system/jsx";
import Button from "../../../ui/Button";
import TapButton from "./controls/TapButton/TapButton";

type Props = {};

const MusicControls = (props: Props) => {
  return (
    <Stack flexDir="row" alignItems="stretch" gap="1">
      <Button variant="ghost">
        <BiSidebar />
      </Button>
      <TapButton />
      <ControlButton>
        <BiLeftIndent />
      </ControlButton>
      <ControlButton>
        <BiRightIndent />
      </ControlButton>
      <ControlButton>4 / 4</ControlButton>

      <Stack flexDir="row" gap="0">
        <ControlButton
          style={{
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderRight: 0,
          }}
        >
          <PiMetronome />
        </ControlButton>
        <ControlButton
          style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
        >
          <IoMdArrowDropdown />
        </ControlButton>
      </Stack>

      <SelectBarControl />
    </Stack>
  );
};

export default MusicControls;
