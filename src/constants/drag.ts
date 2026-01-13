import type { Clip } from "../store/composition";

export const DRAG_TYPES = {
  // This could be a sample, MIDI notes, etc. Represents something that goes into Track.
  CLIP: "CLIP",
  // Something applied to a clip in a track
  EFFECT: "EFFECT",
} as const;

export type DragTypes = keyof typeof DRAG_TYPES;

/**
 * When we drag items from Media Browser, this is data that gets sent to drop zones.
 */
export type MediaBrowserDragData = {
  id: string;
  name: string;
  type: Clip["type"];
  duration: number;
};

export type TrackDragEvent = {
  id: string;
};
