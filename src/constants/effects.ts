import {
  GainData,
  GainEffect,
  PanEffect,
  TrackEffect,
} from "../store/composition";

type GainEffectList = Omit<GainEffect, "effect">;
type PanEffectList = Omit<PanEffect, "effect">;

type BaseEffectData = {
  name: string;
};
type EffectData = BaseEffectData & (GainEffectList | PanEffectList);

export const EFFECT_LIST: Record<TrackEffect["effect"], EffectData> = {
  gain: {
    name: "Gain",
    data: {
      gain: 1.0,
    },
  },
  pan: {
    name: "Pan",
    data: {
      balance: 1.0,
    },
  },
};
