import { atom } from "jotai";

export type TrackData = {
  id: string;
  name: string;
  muted: boolean;
};

export type TrackClipData = {
  id: string;
  trackId: string;
  clipId: string;
  startTime: number;
  enabled: boolean;
};

export type ClipType = "sample" | "midi";

export type Clip = {
  id: string;
  name: string;
  time: number;
  type: ClipType;

  /**
   * The ID of the associated clip type (e.g. id of sample in cache)
   */
  data: string;
};

export const tracksAtom = atom<TrackData[]>([]);
export const trackClipsAtom = atom<TrackClipData[]>([]);
export const clipsAtom = atom<Clip[]>([]);
