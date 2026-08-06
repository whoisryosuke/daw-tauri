import React from "react";
import {
  TrackEffect,
  trackEffectsAtom,
} from "../../../../../store/composition";
import { useAtom } from "jotai";
import { EFFECT_LIST } from "../../../../../constants/effects";

type Props = Pick<TrackEffect, "id" | "effect"> & {};

const EffectModule = ({ id, effect }: Props) => {
  const [allEffectTracks, setEffectTracks] = useAtom(trackEffectsAtom);
  const effectData = allEffectTracks.find((allEffect) => allEffect.id == id);

  return <div>GainModule</div>;
};

export default EffectModule;
