import type { MediaBrowserDragData } from "../constants/drag";
import {
  clipsAtom,
  compositionAtom,
  TrackClipData,
  trackClipsAtom,
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

export type DragPositionData = {
  x: number;
  y: number;
  width: number;
};

export const loadMedia = async (item: MediaBrowserDragData) => {
  // Check if it exists in cache first
  let exists: Sample | MIDISequence | null | undefined;
  switch (item.type) {
    case "sample":
      const allSamples = store.get(samplesAtom);
      const sampleExists = allSamples.find((sample) => sample.path == item.id);
      exists = sampleExists;

      break;
    case "midi":
      const allMIDISequences = store.get(midiSequencesAtom);
      const midiExists = allMIDISequences.find(
        (midiSequence) => midiSequence.path == item.id
      );
      exists = midiExists;

      break;
  }
  if (exists) return exists;

  switch (item.type) {
    case "sample":
      const newSample: Sample = {
        id: generateSimpleHash(),
        name: item.name,
        path: item.id,
      };

      store.set(samplesAtom, (prev) => [...prev, newSample]);

      return newSample;

    case "midi":
      break;
  }
};

export const createMediaClip = async (media: MediaBase, type: ClipType) => {
  // Check if clip exists
  const allClips = store.get(clipsAtom);
  const sampleExists = allClips.find((clip) => clip.data == media.id);

  if (sampleExists) return sampleExists;

  // Create clip
  const newClip: Clip = {
    id: generateSimpleHash(),
    name: media.name,
    time: 0,
    type,
    data: media.id,
  };

  store.set(clipsAtom, (prev) => [...prev, newClip]);

  return newClip;
};

function calculateStartTimeFromDrag(dragPosition: DragPositionData) {
  // Get composition range
  const [start, end] = store.get(compositionAtom).range;

  // Convert position from size to percent (0% = left, 100% = right)
  const percent = dragPosition.x / dragPosition.width;
  // Figure out total time of composition so we can figure what percent we're at
  const timeSpan = end - start;
  // Make sure to offset by the start to keep it within range
  const startTime = timeSpan * percent + start;

  return startTime;
}

export const addClipToTrack = async (
  id: string,
  item: MediaBrowserDragData,
  dragPosition: DragPositionData
) => {
  // Load media if needed and cache
  const media = await loadMedia(item);

  if (!media) {
    console.error("media/clip failed to load");
    return;
  }

  // Create a clip if necessary
  const clip = await createMediaClip(media, item.type);

  // Calculate the start time based on drag placement
  const startTime = calculateStartTimeFromDrag(dragPosition);

  // Create a track clip using the ID of cache
  const newId = generateSimpleHash();
  const newTrackClip: TrackClipData = {
    id: newId,
    trackId: id,
    clipId: clip.id,
    startTime,
    enabled: true,
  };
  console.log("created new clip", newTrackClip);

  store.set(trackClipsAtom, (prev) => [...prev, newTrackClip]);
};
