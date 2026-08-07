import { invoke } from "@tauri-apps/api/core";
import { store } from "../store/store";
import {
  clipsAtom,
  compositionAtom,
  generateCompositionDefaultData,
  generateTracksDefaultData,
  selectedTrackAtom,
  trackClipsAtom,
  trackEffectsAtom,
  tracksAtom,
} from "../store/composition";

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
