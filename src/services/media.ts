import { invoke } from "@tauri-apps/api/core";
import type {
  MediaBrowserDragData,
  TrackClipDragData,
} from "../constants/drag";
import {
  clipsAtom,
  compositionAtom,
  TrackClipData,
  trackClipsAtom,
  TrackEffect,
  trackEffectsAtom,
  tracksAtom,
  type Clip,
  type ClipType,
} from "../store/composition";
import {
  midiSequencesAtom,
  samplesAtom,
  type MediaBase,
  type MIDISequence,
  type Sample,
} from "../store/media";
import { store } from "../store/store";
import { generateSimpleHash } from "../utils/hash";
import mapRange from "../utils/map";
import { EffectName } from "../constants/effects";

export type DragPositionData = {
  x: number;
  y: number;
  width: number;
};

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

export const addClipToTrack = async (
  id: string,
  item: MediaBrowserDragData,
  dragPosition: DragPositionData,
) => {
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

  // Update Rust backendn
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

export const addEffectToTrack = (trackId: string, effect: EffectName) => {
  const newItem: TrackEffect = {
    id: generateSimpleHash(),
    trackId,
    effect,
  };

  store.set(trackEffectsAtom, (state) => [...state, newItem]);
};
