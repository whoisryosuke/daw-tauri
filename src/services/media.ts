import { invoke } from "@tauri-apps/api/core";
import type { MediaBrowserDragData } from "../constants/drag";
import { clipsAtom, type Clip, type ClipType } from "../store/composition";
import {
  midiSequencesAtom,
  samplesAtom,
  type MediaBase,
  type MIDISequence,
  type Sample,
} from "../store/media";
import { store } from "../store/store";
import { generateSimpleHash } from "../utils/hash";

export const loadMedia = async (item: MediaBrowserDragData) => {
  console.log("item", item);
  // Check if it exists in cache first
  let exists: Sample | MIDISequence | null | undefined;
  switch (item.data.type) {
    case "Sample":
      const allSamples = store.get(samplesAtom);
      const sampleExists = allSamples.find((sample) => sample.path == item.id);
      exists = sampleExists;

      break;
    case "Midi":
      const allMIDISequences = store.get(midiSequencesAtom);
      const midiExists = allMIDISequences.find(
        (midiSequence) => midiSequence.path == item.id,
      );
      exists = midiExists;

      break;
  }
  if (exists) return exists;

  switch (item.data.type) {
    case "Sample":
      const newSample: Sample = {
        // We currently store samples by file path - but ideally should not
        // id: generateSimpleHash(),
        id: item.id,
        name: item.name,
        path: item.id,
        duration: item.data.duration,
      };

      store.set(samplesAtom, (prev) => [...prev, newSample]);

      return newSample;

    case "Midi":
      break;
  }
};

export const createMediaClip = async (media: MediaBase, type: ClipType) => {
  // Check if clip exists
  const allClips = store.get(clipsAtom);
  const sampleExists = allClips.find((clip) => clip.clip_id == media.id);

  if (sampleExists) return sampleExists;

  // Create clip
  const newClip: Clip = {
    id: generateSimpleHash(),
    name: media.name,
    duration: media.duration,
    type,
    clip_id: media.path,
  };

  store.set(clipsAtom, (prev) => [...prev, newClip]);

  return newClip;
};

export async function getOrCreateClip(item: MediaBrowserDragData) {
  // Load media if needed and cache
  const media = await loadMedia(item);

  if (!media) {
    console.error("media/clip failed to load");
    return;
  }

  // Create a clip if necessary
  const clip = await createMediaClip(media, item.data.type);

  // Send to Rust backend
  // Rust is strict on data structure so we remove props before sending
  const { id: clipId, type: clip_type, ...clip_data } = clip;
  invoke("add_clip", { clipId, clipData: { clip_type, ...clip_data } });

  return clip;
}
