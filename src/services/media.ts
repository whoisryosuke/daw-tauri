import type { MediaBrowserDragData } from "../constants/drag";
import {
  clipsAtom,
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

  // Load the data from disk
  // DEBUG: For now we fetch from `/public` folder.
  const response = await fetch(item.id);

  switch (item.type) {
    case "sample":
      console.log("loading sample", item.id);
      const audioCtx = new window.OfflineAudioContext(2, 44100 * 40, 44100);
      const arrayBuffer = await response.arrayBuffer();

      // Use context to decode into an audio buffer
      const newAudioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const newSample: Sample = {
        id: generateSimpleHash(),
        name: item.name,
        path: item.id,
        cached: true,
        buffer: newAudioBuffer,
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

export const addClipToTrack = async (
  id: string,
  item: MediaBrowserDragData
) => {
  // Load media if needed and cache
  const media = await loadMedia(item);

  if (!media) {
    console.error("media/clip failed to load");
    return;
  }

  // Create a clip if necessary
  const clip = await createMediaClip(media, item.type);

  // Create a track clip using the ID of cache
  const newId = generateSimpleHash();
  const newTrackClip: TrackClipData = {
    id: newId,
    trackId: id,
    clipId: clip.id,
    startTime: 0,
    enabled: true,
  };
  console.log("created new clip", newTrackClip);

  store.set(trackClipsAtom, (prev) => [...prev, newTrackClip]);
};
