import { invoke } from "@tauri-apps/api/core";
import { store } from "../store/store";
import {
  AddTrackPayload,
  clipsAtom,
  compositionAtom,
  generateCompositionDefaultData,
  generateTracksDefaultData,
  selectedTrackAtom,
  selectedTrackClipAtom,
  TrackClipData,
  trackClipsAtom,
  TrackData,
  TrackEffect,
  trackEffectsAtom,
  tracksAtom,
  TrackType,
} from "../store/composition";
import { generateSimpleHash } from "../utils/hash";
import mapRange from "../utils/map";
import { TIMELINE_DEFAULT_SPACING } from "../constants/composition";
import { EFFECT_LIST } from "../constants/effects";
import { MediaBrowserDragData, TrackClipDragData } from "../constants/drag";
import { getOrCreateClip } from "./media";

// --- Shared ---
export type DragPositionData = {
  x: number;
  y: number;
  width: number;
};

function calculateStartTimeFromDrag(dragPosition: DragPositionData) {
  // Get composition range
  const [start, end] = store.get(compositionAtom).range;

  // // Convert position from size to percent (0% = left, 100% = right)
  // const percent = dragPosition.x / dragPosition.width;
  // // Figure out total time of composition so we can figure what percent we're at
  // const timeSpan = end - start;
  // // Make sure to offset by the start to keep it within range
  // const startTime = timeSpan * percent + start;

  const startTime = mapRange(dragPosition.x, 0, dragPosition.width, start, end);

  console.log("calculated start time", startTime);

  return startTime;
}

export function getTimelineWidth() {
  const { zoom, range } = store.get(compositionAtom);
  const timelineDistance = range[1] - range[0];
  const width = zoom * TIMELINE_DEFAULT_SPACING * timelineDistance;

  return width;
}

export function getTimeBasedOnTimelinePosition(x: number) {
  const [start, end] = store.get(compositionAtom).range;
  const width = getTimelineWidth();

  const startTime = mapRange(x, 0, width, start, end);
  console.log("calculated width", x, startTime);

  return startTime;
}

export const setSelectedTrack = (trackId: string) => {
  store.set(selectedTrackAtom, trackId);
};

// --- Composition ---

export const newFile = async () => {
  // Reset backend
  // We have to do this first, because the frontend store will
  // sync new updates with backend (like new placeholder tracks)
  let result = await invoke("reset_composition");
  if (result) console.error("new file error", result);

  // Reset frontend store
  resetFrontendComposition();
};

function resetFrontendComposition() {
  // Clear any "clips" or track state
  store.set(trackClipsAtom, []);
  store.set(trackEffectsAtom, []);
  store.set(selectedTrackAtom, "");
  store.set(clipsAtom, []);

  // Reset the tracks and then hydrate with placeholder ones
  store.set(tracksAtom, generateTracksDefaultData());

  // Reset composition state
  store.set(compositionAtom, generateCompositionDefaultData());
}

// --- Tracks ---

export function addTrack(name: string, trackTypeKey: TrackType) {
  const newTrack: TrackData = {
    id: generateSimpleHash(),
    name,
    muted: false,
    trackType: trackTypeKey,
  };

  // The backend uses an `enum` with the associated MIDI clip inside
  // so we setup that struct here
  const backendTrackType =
    trackTypeKey == "Midi"
      ? {
          Midi: {
            clip: null,
          },
        }
      : trackTypeKey;

  // Update backend with new track
  invoke<AddTrackPayload>("add_track", {
    trackId: newTrack.id,
    name,
    trackType: backendTrackType,
  });

  // Update client-side
  console.log("adding track to store", newTrack);
  store.set(tracksAtom, (prev) => [...prev, newTrack]);
}

export const addEffectToTrack = (
  trackId: string,
  effect: TrackEffect["effect"],
) => {
  // Mark track as selected
  setSelectedTrack(trackId);

  // Add effect to track (frontend store)
  const id = generateSimpleHash();
  const newItem = {
    id,
    trackId,
    effect,
    data: {
      ...EFFECT_LIST[effect].data,
    },
  } as TrackEffect;
  store.set(trackEffectsAtom, (state) => [...state, newItem]);

  // Add effect to backend
  invoke("add_track_effect", {
    trackId: trackId,
    effectId: id,
    effectData: {
      [EFFECT_LIST[effect].name]: {
        ...EFFECT_LIST[effect].data,
      },
    },
  });
};

export async function addClipToMidiTrack(
  trackId: string,
  item: MediaBrowserDragData,
) {
  // Create a clip if necessary
  const clip = await getOrCreateClip(item);

  if (!clip) return;

  // Update client-side
  store.set(tracksAtom, (prev) =>
    prev.map((item) => {
      // Same track? Update clip ID
      if (item.id == trackId) {
        return {
          ...item,
          clip: clip.id,
        };
      }
      return item;
    }),
  );

  // Update backend
  invoke("update_midi_track_clip", { trackId, clipId: clip.id });
}

// --- Track Clips ---

export function deleteSelectedTrackClip() {
  const id = store.get(selectedTrackClipAtom);
  if (id) deleteTrackClip(id);
}

export function deleteTrackClip(id: string) {
  store.set(trackClipsAtom, (prev) => prev.filter((item) => item.id !== id));

  // @TODO: Clear cache
  // if no other track clip uses clip, remove clip from "loaded" cache
  // and likely the media asset as well + backend syncs
}

export const addClipToTrack = async (
  id: string,
  item: MediaBrowserDragData,
  dragPosition: DragPositionData,
) => {
  // Create a clip if necessary
  const clip = await getOrCreateClip(item);
  if (!clip) return;

  // Calculate the start time based on drag placement
  const startTime = calculateStartTimeFromDrag(dragPosition);

  // Create a track clip using the ID of cache
  const newId = generateSimpleHash();
  const newTrackClip: TrackClipData = {
    id: newId,
    track_id: id,
    track_clip_type: "Sample",
    clip_id: clip.id,
    start_time: startTime,
    enabled: true,
  };
  console.log("created new clip", newTrackClip);

  // Send to Rust backend
  const { track_id: trackId, ...track_data } = newTrackClip;
  invoke("add_track_clip", { trackId: id, trackData: track_data });

  // Mark track as selected
  setSelectedTrack(trackId);

  // Add to store
  store.set(trackClipsAtom, (prev) => [...prev, newTrackClip]);
};

export const moveTrackClip = async (
  trackId: string,
  item: TrackClipDragData,
  dragPosition: DragPositionData,
) => {
  const allTrackClips = store.get(trackClipsAtom);
  const trackClip = allTrackClips.find((trackClip) => trackClip.id == item.id);

  console.log("track clips", allTrackClips, item.id);

  if (!trackClip) {
    console.error("Couldn't find that track clip", item.id);
    return;
  }

  // Calculate the start time based on drag placement
  const startTime = calculateStartTimeFromDrag(dragPosition);

  const updateData = {
    start_time: startTime,
    track_id: trackId,
  };

  // Update Rust backend
  invoke("update_track_clip_time", {
    id: trackClip.id,
    trackId: trackId,
    time: startTime,
  });

  // Update local store
  store.set(trackClipsAtom, (state) =>
    state.map((stateClip) => {
      if (stateClip.id == trackClip.id) {
        return {
          ...stateClip,
          ...updateData,
        };
      }
      return stateClip;
    }),
  );
};
