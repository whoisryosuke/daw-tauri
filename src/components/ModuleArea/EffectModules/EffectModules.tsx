import { useAtomValue } from "jotai";
import React, { JSX } from "react";
import {
  selectedTrackAtom,
  TrackEffect,
  trackEffectsAtom,
} from "../../../store/composition";
import GainModule from "./modules/GainModule/GainModule";
import { Stack } from "../../../../styled-system/jsx";

const EFFECT_MODULE_MAP: Record<
  TrackEffect["effect"],
  (props: TrackEffect) => JSX.Element
> = {
  gain: GainModule,
  pan: GainModule,
};

type Props = {};

const EffectModules = (props: Props) => {
  const selectedTrackId = useAtomValue(selectedTrackAtom);
  const allEffectTracks = useAtomValue(trackEffectsAtom);

  const effects = allEffectTracks.filter(
    (item) => item.trackId == selectedTrackId,
  );

  const render = effects.map((effect) => {
    const EffectComponent = EFFECT_MODULE_MAP[effect.effect];

    return <EffectComponent {...effect} />;
  });

  return (
    <Stack gap={2} flexDir="row">
      {render}
    </Stack>
  );
};

export default EffectModules;
