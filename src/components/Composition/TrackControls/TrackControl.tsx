import React, { useState } from "react";
import { Box, Stack } from "../../../../styled-system/jsx";
import Text from "../../ui/Typography/Text";
import { css, cva, cx } from "../../../../styled-system/css";
import { TrackData } from "../../../store/composition";
import Slider from "../../ui/Slider/Slider";
import { SliderRootProps } from "@base-ui/react/slider";
import { invoke } from "@tauri-apps/api/core";
import { setSelectedTrack } from "../../../services/media";

const trackControlContainer = cva({
  base: {
    backgroundColor: "gray.3",
    minHeight: 125 + 4,
    display: "flex",
    justifyContent: "end",
    p: 2,
    borderBottomWidth: "1px",
    borderColor: "gray.5",
    color: "gray.9",
    borderStyle: "solid",

    _motionSafe: {
      transitionProperty: "background-color, color, border-color",
      transitionTimingFunction: "ease-in-out",
      transitionDuration: "slow",
    },
  },
  variants: {
    selected: {
      true: {
        backgroundColor: "blue.3",
        borderColor: "blue.5",
        color: "blue.9",
      },
    },
  },
});
const headingStyle = css({
  fontSize: 1,
});

type Props = TrackData & {
  selected: boolean;
};

const TrackControl = ({ id, name, selected }: Props) => {
  const [volume, setVolume] = useState(1.0);

  const handleVolumeChange: SliderRootProps["onValueChange"] = (newVal) => {
    if (!Array.isArray(newVal)) {
      // @ts-ignore - We check dawg
      setVolume(newVal);

      invoke("update_track_gain", { trackId: id, gain: newVal });
    }
  };

  const handleSelectTrack = () => {
    setSelectedTrack(id);
  };

  return (
    <Stack
      className={trackControlContainer({ selected })}
      onClick={handleSelectTrack}
    >
      <Text className={headingStyle}>{name}</Text>
      <Box px={1} width="100%">
        <Slider
          value={volume}
          step={0.01}
          min={0}
          max={1}
          onValueChange={handleVolumeChange}
        />
      </Box>
    </Stack>
  );
};

export default TrackControl;
