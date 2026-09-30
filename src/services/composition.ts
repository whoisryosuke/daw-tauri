import { invoke } from "@tauri-apps/api/core";
import { store } from "../store/store";
import {
  AddTrackPayload,
  Clip,
  clipsAtom,
  compositionAtom,
  generateCompositionDefaultData,
  generateTracksDefaultData,
  playbackTimeAtom,
  recordingAtom,
  sampleRateAtom,
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
import {
  createMediaClip,
  createMidiSequence,
  getOrCreateClip,
  loadMedia,
} from "./media";
import { sendNotification } from "./notifications";
import {
  MediaBase,
  MIDINote,
  MIDISequence,
  midiSequencesAtom,
} from "../store/media";
import { MIDIInputPayload } from "./midi";
import { framesToSeconds } from "../utils/music";

// --- Shared ---
export type DragPositionData = {
  x: number;
  y: number;
  width: number;
};

/**
 * Takes a drag X position on timeline and converts to time (in frames)
 * @returns startTime (u64 for Rust)
 */
function calculateStartTimeFromDrag(dragPosition: DragPositionData) {
  // Get composition range
  const [start, end] = store.get(compositionAtom).range;
  const sampleRate = store.get(sampleRateAtom);

  // Convert range from seconds to frames
  const startFrame = start * sampleRate;
  const endFrame = end * sampleRate;

  const startTime = mapRange(
    dragPosition.x,
    0,
    dragPosition.width,
    startFrame,
    endFrame,
  );

  console.log("calculated start time", startTime);

  return Math.round(startTime);
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
    color: "gray",
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
  skipBackend?: boolean,
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
  if (!skipBackend)
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

  // @TODO: Delete clip in backend
}

export const addClipToTrack = async (
  trackId: string,
  trackClipType: TrackClipData["track_clip_type"],
  clip: Clip,
  /**
   * Time in frames
   */
  startTime: number,
) => {
  // Create a track clip using the ID of cache
  const newId = generateSimpleHash();
  const newTrackClip: TrackClipData = {
    id: newId,
    track_id: trackId,
    track_clip_type: trackClipType,
    clip_id: clip.id,
    start_time: startTime,
    enabled: true,
  };
  console.log("created new clip", newTrackClip);

  // Send to Rust backend
  const { track_id: _, ...track_data } = newTrackClip;
  invoke("add_track_clip", { trackId, trackData: track_data });

  // Add to store
  store.set(trackClipsAtom, (prev) => [...prev, newTrackClip]);
};

export const addMediaToTrackFromDrag = async (
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

export async function startRecording() {
  console.log("trying to start recording...");
  // Are we recording? Don't do anything
  const recordingState = store.get(recordingAtom);
  if (recordingState.recording) return;

  // Get dependencies
  const selectedTrackId = store.get(selectedTrackAtom);
  const playbackTime = store.get(playbackTimeAtom);

  const tracks = store.get(tracksAtom);
  const currentTrack = tracks.find((track) => track.id == selectedTrackId);
  if (!currentTrack) {
    sendNotification({
      title: "No track selected",
      description: "Select a track before recording",
      type: "error",
    });
    return;
  }

  // We create a media asset for each recording type
  // e.g. MIDI gets a MIDI Sequence
  const clipId = crypto.randomUUID();
  switch (currentTrack.trackType) {
    case "Midi":
      const newSequence: MIDISequence = {
        id: clipId,
        name: `New ${currentTrack.trackType} Recording`,
        path: clipId,
        duration: 1,
        notes: [],
      };
      createMidiSequence(newSequence);
      break;

    // Samples don't need anything - data is stored in backend
    case "Sample":
      break;
  }

  // Set frontend recording state
  store.set(recordingAtom, {
    recording: true,
    startTime: playbackTime,
    trackId: selectedTrackId,
    trackType: currentTrack.trackType,
    clipId,
    data: {},
  });

  // Set backend recording state + trigger playback
  // Is this a Audio or MIDI track? Start appropriate recording process for track type.
  switch (currentTrack.trackType) {
    case "Sample":
      // @TODO: Add audio recording flow
      break;
    case "Midi":
      await invoke("start_midi_recording", {
        trackId: selectedTrackId,
        time: playbackTime,
        clipId,
      });
      break;
  }

  console.log("recording started!");
}

export async function stopRecording() {
  // Have we stopped recording? Don't do anything
  const recordingState = store.get(recordingAtom);
  if (!recordingState.recording) return;

  const playbackTime = store.get(playbackTimeAtom);
  const sampleRate = store.get(sampleRateAtom);

  const clipId = recordingState.clipId;
  const trackType = recordingState.trackType;

  // Get duration of the recording (basically start time -> current time)
  // We could cut it to last note/sound, but most DAWs leave extra room. User can clip away or add more to later.
  const clipDuration = playbackTime - recordingState.startTime;

  // Stop recording in backend at exact frame time
  switch (recordingState.trackType) {
    case "Sample":
      // @TODO: Add audio recording flow
      break;
    case "Midi":
      // When we stop MIDI recording we'll get notes back
      const result = (await invoke("stop_midi_recording", {
        time: playbackTime,
      })) as MIDIInputPayload[];
      console.log("stopped recording, got notes back", result);

      // Check for errors
      if (!Array.isArray(result)) {
        console.error(result);
        return;
      }

      // Parse on/off note events into note data with duration
      let newNotes: MIDINote[] = [];
      result.forEach((midiEvent) => {
        // MIDI events come in as frames so we convert to seconds
        switch (midiEvent.command) {
          case "NoteOn":
            const newItem: MIDINote = {
              midi: midiEvent.note,
              velocity: midiEvent.velocity,
              time: midiEvent.time,
              duration: null,
            };
            newNotes.push(newItem);
            break;
          case "NoteOff":
            newNotes = newNotes.map((newNote) =>
              newNote.midi == midiEvent.note && newNote.duration == null
                ? { ...newNote, duration: midiEvent.time - newNote.time }
                : newNote,
            );
            break;
        }
      });

      console.log("new notes", newNotes);

      // Update clip with more accurate data (since sync might miss something)
      store.set(midiSequencesAtom, (prevSequences) =>
        prevSequences.map((prevSequence) =>
          prevSequence.id == clipId
            ? {
                ...prevSequence,
                notes: newNotes,
                duration: clipDuration,
              }
            : prevSequence,
        ),
      );

      break;
  }

  // End recording in the frontend now that backend is confirmed
  store.set(recordingAtom, {
    recording: false,
    startTime: 0,
    trackId: "",
    trackType: "Sample",
    clipId: "",
    data: {},
  });

  // Add the MIDI sequence as an "official" TrackClip now that's it's done
  const selectedTrackId = store.get(selectedTrackAtom);

  const tracks = store.get(tracksAtom);
  const currentTrack = tracks.find((track) => track.id == selectedTrackId);
  if (!currentTrack) {
    sendNotification({
      title: "No track selected",
      description: "Select a track before recording",
      type: "error",
    });
    return;
  }

  // Create a new MIDI Sequence + Clip to contain the MIDI data
  const newItem: MediaBrowserDragData = {
    id: clipId,
    name: `New ${currentTrack.trackType} Recording`,
    data: {
      duration: clipDuration,
      type: currentTrack.trackType,
    },
    action: "CLIP",
  };
  const newMidiClip = await getOrCreateClip(newItem);
  if (!newMidiClip) {
    console.error("Failed to create clip or media");
    return;
  }

  // Add clip to track as TrackClip
  addClipToTrack(
    selectedTrackId,
    recordingState.trackType,
    newMidiClip,
    recordingState.startTime,
  );
}
