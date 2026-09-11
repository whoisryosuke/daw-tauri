import React from "react";
import { TrackData } from "../../../store/composition";
import { Box } from "../../../../styled-system/jsx";
import { Popover } from "@base-ui/react";
import TrackColorPopover from "./TrackColorPopover";
import { css } from "../../../../styled-system/css";

const triggerStyle = css({
  maxWidth: 10,
});

type Props = {
  color: TrackData["color"];
};

const TrackColor = ({ color }: Props) => {
  return (
    <Popover.Root>
      <Popover.Trigger className={triggerStyle}>
        <Box
          maxWidth="10"
          colorPalette={color}
          height="10px"
          bgColor="colorPalette.10"
          borderWidth="1px"
          borderStyle="solid"
          borderColor="colorPalette.11"
          borderRadius="1"
        />
      </Popover.Trigger>
      <TrackColorPopover color={color} />
    </Popover.Root>
  );
};

export default TrackColor;
