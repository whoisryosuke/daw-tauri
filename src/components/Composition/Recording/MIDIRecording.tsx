import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useRef } from "react";
import {
  clipsAtom,
  playbackTimeAtom,
  recordingAtom,
  sampleRateAtom,
} from "../../../store/composition";
import {
  generateDefaultUserMap,
  inputStore,
  UserInputMap,
} from "../../../store/input";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { MIDIInputPayload } from "../../../services/midi";
import { MIDINote, midiSequencesAtom } from "../../../store/media";
import { store } from "../../../store/store";
import { framesToSeconds } from "../../../utils/music";

type Props = {};

const MIDIRecording = (props: Props) => {
  // const localKeyCache = useRef(generateDefaultUserMap() as UserInputMap);
  const { recording, clipId, startTime } = useAtomValue(recordingAtom);
  const clips = useAtomValue(clipsAtom);
  const setMidiSequences = useSetAtom(midiSequencesAtom);
  const currentClip = clips.find((clip) => clip.clip_id == clipId);
  const midiSequenceId = currentClip ? currentClip.clip_id : null;
  const listenerRef = useRef<UnlistenFn>(null);
  const timerRef = useRef<ReturnType<typeof requestAnimationFrame>>(0);

  const addNoteToClip = (input: MIDIInputPayload) => {
    if (!midiSequenceId) return;

    const midiNote: MIDINote = {
      midi: input.note,
      velocity: input.velocity,
      time: input.time,
      duration: null,
    };
    setMidiSequences((prevSequences) =>
      prevSequences.map((prevSequence) => {
        if (prevSequence.id == midiSequenceId) {
          return {
            ...prevSequence,
            notes: [...prevSequence.notes, midiNote],
          };
        }
        return prevSequence;
      }),
    );
  };

  const stopNoteInClip = (input: MIDIInputPayload) => {
    if (!midiSequenceId) return;

    setMidiSequences((prevSequences) =>
      prevSequences.map((prevSequence) => {
        if (prevSequence.id !== midiSequenceId) return prevSequence;

        // Last note that matches and is still "open" (no duration yet)
        const idx = prevSequence.notes.findLastIndex(
          (n) => n.midi === input.note && n.duration == null,
        );
        if (idx === -1) return prevSequence; // stray NoteOff, nothing to close

        // Find the last note and update its duration
        const notes = prevSequence.notes.map((n, i) => {
          if (i === idx) {
            const newDuration = input.time - n.time;
            return { ...n, duration: newDuration };
          } else {
            return n;
          }
        });

        return {
          ...prevSequence,
          notes,
        };
      }),
    );
  };

  const syncDuration = () => {
    if (!currentClip) {
      console.error("No clip, can't sync duration");
      return;
    }
    // We grab stores here to ensure latest data
    const sampleRate = store.get(sampleRateAtom);
    const currentTime = store.get(playbackTimeAtom);
    const localRecordingState = store.get(recordingAtom);

    // Increment duration
    const durationInFrames = currentTime - localRecordingState.startTime;

    // Update MIDI sequence
    store.set(midiSequencesAtom, (prevSequences) =>
      prevSequences.map((prevSequence) =>
        prevSequence.id == midiSequenceId
          ? {
              ...prevSequence,
              duration: durationInFrames,
            }
          : prevSequence,
      ),
    );

    // Update clip (the primary source of duration)
    store.set(clipsAtom, (prevClips) =>
      prevClips.map((prevClip) =>
        prevClip.id == currentClip.id
          ? { ...prevClip, duration: durationInFrames }
          : prevClip,
      ),
    );

    timerRef.current = requestAnimationFrame(syncDuration);
  };

  const startDurationSync = () => {
    timerRef.current = requestAnimationFrame(syncDuration);
  };

  useEffect(() => {
    const attachEvents = async () => {
      listenerRef.current = await listen<MIDIInputPayload>(
        "midi-input",
        (event) => {
          const input = event.payload;

          switch (input.command) {
            case "NoteOn":
              addNoteToClip(input);
              break;
            case "NoteOff":
              stopNoteInClip(input);
              break;
          }
        },
      );
    };

    if (recording) {
      attachEvents();
      startDurationSync();
    }

    return () => {
      if (listenerRef.current) listenerRef.current();
      cancelAnimationFrame(timerRef.current);
    };
  }, [recording]);

  return <></>;
};

export default MIDIRecording;
