import React from "react";
import {
  GainData,
  TrackEffect,
  trackEffectsAtom,
} from "../../../../../store/composition";
import { useSetAtom } from "jotai";
import { EFFECT_LIST } from "../../../../../constants/effects";
import Heading from "../../../../ui/Typography/Heading";
import Slider from "../../../../ui/Slider/Slider";
import EffectModuleWrapper from "../EffectModuleWrapper/EffectModuleWrapper";
import { Box, Stack } from "../../../../../../styled-system/jsx";
import Text from "../../../../ui/Typography/Text";
import EffectModuleInputText from "../shared/EffectModuleInputText";
import { invoke } from "@tauri-apps/api/core";
import { SliderRootProps } from "@base-ui/react/slider";

type Props = TrackEffect & {};

const GainModule = ({ id, effect, data }: Props) => {
  const setEffectTracks = useSetAtom(trackEffectsAtom);
  const name = EFFECT_LIST[effect].name;
  const gainData = data as GainData;

  const handleVolumeChange: SliderRootProps["onValueChange"] = (newVal) => {
    console.log("updating slider", newVal);
    const newVolume = Array.isArray(newVal) ? newVal[0] : newVal;

    // Update store
    setEffectTracks((prev) =>
      prev.map((item) => {
        if (item.id == id) {
          return {
            ...item,
            data: {
              ...item.data,
              gain: newVolume,
            } as GainData,
          } as TrackEffect;
        }
        return item;
      }),
    );

    // Update effect in backend
    invoke("update_track_effect", {
      effectId: id,
      effectData: {
        [EFFECT_LIST[effect].name]: {
          ...data,
          gain: newVolume,
        },
      },
    });
  };

  return (
    <EffectModuleWrapper title={name}>
      <Stack gap={0}>
        <EffectModuleInputText>Volume: {gainData.gain}</EffectModuleInputText>
        <Slider
          value={gainData.gain}
          min={0}
          max={2}
          step={0.01}
          onValueChange={handleVolumeChange}
        />
      </Stack>
    </EffectModuleWrapper>
  );
};

export default GainModule;
