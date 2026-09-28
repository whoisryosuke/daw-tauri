import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useRef } from "react";
import {
  clipsAtom,
  playbackTimeAtom,
  recordingAtom,
  sampleRateAtom,
} from "../../../store/composition";
import TrackClip from "../TrackClip/TrackClip";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { MIDIInputPayload } from "../../../services/midi";
import { store } from "../../../store/store";
import { MIDINote, midiSequencesAtom } from "../../../store/media";
import { framesToSeconds } from "../../../utils/music";

type Props = {
  width: number;
  trackId: string;
};

const RecordingTrackClip = ({ width, trackId }: Props) => {
  const {
    recording,
    clipId,
    startTime,
    trackId: currentTrackId,
    trackType,
  } = useAtomValue(recordingAtom);
  const setMidiSequences = useSetAtom(midiSequencesAtom);
  const listenerRef = useRef<UnlistenFn>(null);
  const timerRef = useRef<ReturnType<typeof requestAnimationFrame>>(0);
  const sampleRate = useAtomValue(sampleRateAtom);
  const playbackTime = useAtomValue(playbackTimeAtom);
  const duration = framesToSeconds(playbackTime - startTime, sampleRate);
  const shouldRender = recording && currentTrackId == trackId;

  const addNoteToClip = (input: MIDIInputPayload) => {
    if (!clipId) return;
    console.log("adding note to clip");

    const time = framesToSeconds(input.time, sampleRate);

    const midiNote: MIDINote = {
      midi: input.note,
      velocity: input.velocity,
      time,
      duration: null,
    };
    setMidiSequences((prevSequences) =>
      prevSequences.map((prevSequence) => {
        if (prevSequence.id == clipId) {
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
    if (!clipId) return;

    setMidiSequences((prevSequences) =>
      prevSequences.map((prevSequence) => {
        if (prevSequence.id !== clipId) return prevSequence;

        // Last note that matches and is still "open" (no duration yet)
        const idx = prevSequence.notes.findLastIndex(
          (n) => n.midi === input.note && n.duration == null,
        );
        if (idx === -1) return prevSequence; // stray NoteOff, nothing to close

        // Find the last note and update its duration
        const notes = prevSequence.notes.map((n, i) => {
          if (i === idx) {
            const endTime = framesToSeconds(input.time, sampleRate);
            const newDuration = endTime - n.time;
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
    }

    return () => {
      if (listenerRef.current) listenerRef.current();
      cancelAnimationFrame(timerRef.current);
    };
  }, [recording, sampleRate]);

  const render = shouldRender && (
    <TrackClip
      id={clipId}
      track_id={trackId}
      track_clip_type={trackType}
      clip_id={clipId}
      start_time={framesToSeconds(startTime, sampleRate)}
      enabled={true}
      width={width}
      color={"gray"}
      clip={{
        id: clipId,
        name: "New Recording",
        duration,
        type: trackType,
        clip_id: clipId,
      }}
    />
  );

  return <div>{render}</div>;
};

export default RecordingTrackClip;
