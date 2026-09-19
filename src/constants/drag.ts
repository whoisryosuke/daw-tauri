import type { Clip, TrackType } from "../store/composition";

export const DRAG_TYPES = {
  // This could be a sample, MIDI notes, etc. Represents something that goes into Track.
  CLIP: "CLIP",
  // An effect node dropped on a specific track
  EFFECT: "EFFECT",
  // A VST plugin dropped on a specific track
  PLUGIN: "PLUGIN",
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
  data: any;
};

export type TrackDragEvent = {
  id: string;
  trackType: TrackType;
};

export type MidiModuleDragEvent = {
  trackId: string;
};

/**
 * When we drag track clips from track to same or different track
 */
export type TrackClipDragData = BaseDragData & {
  id: string;
};
