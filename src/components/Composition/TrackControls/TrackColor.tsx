import React from "react";
import { TrackData, tracksAtom } from "../../../store/composition";
import { Box } from "../../../../styled-system/jsx";
import { Popover } from "@base-ui/react";
import TrackColorPopover from "./TrackColorPopover";
import { css } from "../../../../styled-system/css";
import { useSetAtom } from "jotai";

const triggerStyle = css({
  maxWidth: 10,
});

type Props = {
  id: TrackData["id"];
  color: TrackData["color"];
};

const TrackColor = ({ id, color }: Props) => {
  const setTracks = useSetAtom(tracksAtom);

  const handleChangeColor = (newColor: TrackData["color"]) => {
    setTracks((prev) =>
      prev.map((prevTrack) => {
        if (prevTrack.id == id) {
          return {
            ...prevTrack,
            color: newColor,
          };
        }
        return prevTrack;
      }),
    );
  };

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
      <TrackColorPopover color={color} handleChangeColor={handleChangeColor} />
    </Popover.Root>
  );
};

export default TrackColor;
