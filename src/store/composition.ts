import { atom } from "jotai";
import { generateSimpleHash } from "../utils/hash";
import { invoke } from "@tauri-apps/api/core";

export type CompositionData = {
  // Start and end range for the composition area (and all tracks inside)
  range: [number, number];
  zoom: number;
};

export type TrackType = "Sample" | "Midi";
export type TrackData = {
  id: string;
  name: string;
  muted: boolean;
  trackType: TrackType;

  /**
   * For MIDI tracks only, the selected clip for playback.
   */
  clip?: string;
};

// Effects for tracks
export type GainData = {
  gain: number;
};
export type GainEffect = {
  effect: "gain";
  data: GainData;
};

export type PanData = {
  balance: number;
};
export type PanEffect = {
  effect: "pan";
  data: PanData;
};

export type BaseTrackEffect = {
  id: string;
  trackId: string;
};

export type TrackEffect = BaseTrackEffect & (GainEffect | PanEffect);

export type TrackClipType = "Sample" | "Synthesizer";

export type TrackClipData = {
  id: string;
  track_id: string;
  track_clip_type: TrackClipType;
  clip_id: string;
  start_time: number;
  enabled: boolean;
  range?: number[];
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

export function generateCompositionDefaultData() {
  return {
    range: [0, 100],
    zoom: 1,
  } as CompositionData;
}

export const compositionAtom = atom<CompositionData>(
  generateCompositionDefaultData(),
);

export const bpmAtom = atom(120);

/**
 * TRACKS
 */

/**
 * Payload for `add_track` backend command
 */
export type AddTrackPayload = {
  trackId: string;
  name: string;
  trackType:
    | "Sample"
    | {
        Midi: {
          clip: string | null;
        };
      };
};

export const generateTrackData = (name = "Track 1"): TrackData => ({
  id: generateSimpleHash(),
  name,
  muted: false,
  trackType: "Sample",
});

export function generateTracksDefaultData() {
  let newTracks: TrackData[] = [];
  new Array(3).fill(0).forEach((_, index) => {
    const newTrack = generateTrackData(`Track ${index + 1}`);
    newTracks.push(newTrack);

    // Update backend with new track
    invoke<AddTrackPayload>("add_track", {
      trackId: newTrack.id,
      name: newTrack.name,
      trackType: "Sample",
    });
  });

  return newTracks;
}

export const tracksAtom = atom<TrackData[]>(generateTracksDefaultData());
export const trackClipsAtom = atom<TrackClipData[]>([]);
export const trackEffectsAtom = atom<TrackEffect[]>([]);
export const selectedTrackAtom = atom<string>("");
export const selectedTrackClipAtom = atom<string>("");
/**
 * The MIDI track the backend will use to play audio when user presses keys
 * even when not recording as a preview. aka "Armed" in Ableton.
 */
export const playMidiTrackAtom = atom<string>("");

/**
 * CLIPS
 */
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
