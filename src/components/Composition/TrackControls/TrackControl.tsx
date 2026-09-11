import React, { useState } from "react";
import { Box, Stack } from "../../../../styled-system/jsx";
import Text from "../../ui/Typography/Text";
import { css, cva, cx } from "../../../../styled-system/css";
import { playMidiTrackAtom, TrackData } from "../../../store/composition";
import Slider from "../../ui/Slider/Slider";
import { SliderRootProps } from "@base-ui/react/slider";
import { invoke } from "@tauri-apps/api/core";
import { useSetAtom } from "jotai";
import { setSelectedTrack } from "../../../services/composition";
import TrackColor from "./TrackColor";

const trackControlContainer = cva({
  base: {
    minHeight: 125 + 4,
    display: "flex",
    justifyContent: "end",
    p: 2,

    bgLinear: "to-b",
    gradientFrom: {
      base: "colorPalette.alpha-1",
      _hover: "colorPalette.alpha-2",
    },
    gradientTo: {
      base: "colorPalette.alpha-3",
      _hover: "colorPalette.alpha-4",
    },
    borderWidth: "1px",
    borderColor: "rgba(0,0,0,0)",
    color: "colorPalette.11",
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
        gradientFrom: {
          base: "colorPalette.alpha-1",
          _hover: "colorPalette.alpha-2",
        },
        gradientTo: {
          base: "colorPalette.alpha-4",
          _hover: "colorPalette.alpha-5",
        },
        borderColor: "colorPalette.7",
        color: "colorPalette.12",
      },
    },
  },
});
const headingStyle = css({
  fontSize: 1,

  userSelect: "none",
});

type Props = TrackData & {
  selected: boolean;
  playMidi: boolean;
};

const TrackControl = ({
  id,
  name,
  selected,
  trackType,
  playMidi,
  color,
}: Props) => {
  const [volume, setVolume] = useState(1.0);
  const setPlayMidiTrack = useSetAtom(playMidiTrackAtom);

  const colorStyle = color && css({ colorPalette: color });

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

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setPlayMidiTrack(e.currentTarget.checked ? id : "");

    // Sync with backend
    invoke("set_midi_track_as_playable", {
      // Rust uses `Option` so pass `null` for `None`
      trackId: e.currentTarget.checked ? id : null,
    });
  };

  return (
    <Stack
      className={cx(colorStyle, trackControlContainer({ selected }))}
      onClick={handleSelectTrack}
    >
      <Text className={headingStyle}>{name}</Text>
      <TrackColor id={id} color={color} />
      <Box px={1} width="100%">
        <Slider
          value={volume}
          step={0.01}
          min={0}
          max={1}
          onValueChange={handleVolumeChange}
          alpha
          color={color}
        />
      </Box>
      {trackType == "Midi" && (
        <Box>
          <input
            type="checkbox"
            title="Enable Playback"
            checked={playMidi}
            onChange={handleChange}
          />
        </Box>
      )}
    </Stack>
  );
};

export default TrackControl;
