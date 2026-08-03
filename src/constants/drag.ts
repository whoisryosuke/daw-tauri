import type { Clip } from "../store/composition";

export const DRAG_TYPES = {
  // This could be a sample, MIDI notes, etc. Represents something that goes into Track.
  CLIP: "CLIP",
  // Something applied to a clip in a track
  EFFECT: "EFFECT",
  // An existing track clip inside a track, likely being moved
  TRACK_CLIP: "TRACK_CLIP",
} as const;

export type DragTypes = keyof typeof DRAG_TYPES;
export type MediaBrowserDragTypes = Exclude<DragTypes, "TRACK_CLIP">;

export type BaseDragData = {
  action: DragTypes;
};

/**
 * When we drag items from Media Browser, this is data that gets sent to drop zones.
 */
export type MediaBrowserDragData = BaseDragData & {
  id: string;
  name: string;
  type: Clip["type"];
  duration: number;
};

export type TrackDragEvent = {
  id: string;
};

/**
 * When we drag track clips from track to same or different track
 */
export type TrackClipDragData = BaseDragData & {
  id: string;
};
