import { atom } from "jotai";
import { EffectName } from "../constants/effects";

export type CompositionData = {
  // Start and end range for the composition area (and all tracks inside)
  range: [number, number];
  zoom: number;
};

export type TrackData = {
  id: string;
  name: string;
  muted: boolean;
};

export type TrackEffect = {
  id: string;
  trackId: string;
  effect: EffectName;
};

export type TrackClipType = "Sample" | "Synthesizer";

export type TrackClipData = {
  id: string;
  track_id: string;
  track_clip_type: TrackClipType;
  clip_id: string;
  start_time: number;
  enabled: boolean;
};

export type ClipType = "Sample" | "Midi";

export type Clip = {
  id: string;
  name: string;
  duration: number;
  type: ClipType;

  /**
   * The ID of the associated clip type (e.g. id of sample in cache)
   */
  clip_id: string;
};

export const compositionAtom = atom<CompositionData>({
  range: [0, 100],
  zoom: 1,
});
export const tracksAtom = atom<TrackData[]>([]);
export const trackClipsAtom = atom<TrackClipData[]>([]);
export const trackEffectsAtom = atom<TrackEffect[]>([]);
export const clipsAtom = atom<Clip[]>([]);

/**
 * Time in frames
 */
export const playbackTimeAtom = atom(0);
/**
 * Sample rate synced from backend.
 * Used to derive time in seconds and PPQ.
 */
export const sampleRateAtom = atom(44100);
