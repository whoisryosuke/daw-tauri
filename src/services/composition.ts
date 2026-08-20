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
  trackClipsAtom,
  TrackData,
  trackEffectsAtom,
  tracksAtom,
  TrackType,
} from "../store/composition";
import { generateSimpleHash } from "../utils/hash";

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
