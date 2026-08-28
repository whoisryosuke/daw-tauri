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

const trackControlContainer = cva({
  base: {
    minWidth: "150px",
    backgroundColor: "gray.3",
    minHeight: 125 + 4,
    display: "flex",
    justifyContent: "end",
    p: 2,
    borderBottomWidth: "1px",
    borderColor: "gray.5",
    color: "gray.9",
    borderStyle: "solid",
    position: "sticky",
    top: 0,
    left: 0,

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
  playMidi: boolean;
};

const TrackControl = ({ id, name, selected, trackType, playMidi }: Props) => {
  const [volume, setVolume] = useState(1.0);
  const setPlayMidiTrack = useSetAtom(playMidiTrackAtom);

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
