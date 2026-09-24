import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useRef } from "react";
import { clipsAtom, recordingAtom } from "../../../store/composition";
import {
  generateDefaultUserMap,
  inputStore,
  UserInputMap,
} from "../../../store/input";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { MIDIInputPayload } from "../../../services/midi";
import { MIDINote, midiSequencesAtom } from "../../../store/media";

type Props = {};

const MIDIRecording = (props: Props) => {
  // const localKeyCache = useRef(generateDefaultUserMap() as UserInputMap);
  const { recording, clipId } = useAtomValue(recordingAtom);
  console.log("clipId", clipId);
  const clips = useAtomValue(clipsAtom);
  const setMidiSequences = useSetAtom(midiSequencesAtom);
  const currentClip = clips.find((clip) => clip.clip_id == clipId);
  console.log("currentClip", currentClip);
  const midiSequenceId = currentClip ? currentClip.clip_id : null;
  console.log("midiSequenceId", clipId, midiSequenceId);
  // const input = useAtomValue(inputStore);

  // useEffect(() => {
  //     if(!recording) return;

  //     Object.entries(input).forEach(([key, keyState]) => {
  //         if (localKeyCache.current[key].pressed !== keyState.pressed) {
  //           // Sync
  //           localKeyCache.current[key].pressed = keyState.pressed;

  //           switch (keyState.pressed) {
  //             // Add new note
  //             case true:
  //                 addNote(key);
  //                 break;
  //             // End existing note
  //             case false:
  //                 break;
  //           }
  //         }
  //     });

  // }, [recording, input]);

  const listenerRef = useRef<UnlistenFn>(null);

  const addNoteToClip = (input: MIDIInputPayload) => {
    if (!midiSequenceId) return;

    console.log("adding note to midi sequence");

    const midiNote: MIDINote = {
      midi: input.note,
      velocity: input.velocity,
      time: input.time,
      duration: 0.1,
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
        let deltaTime = 0;
        const notes = prevSequence.notes.map((n, i) => {
          if (i === idx) {
            const newDuration = input.time - n.time;
            deltaTime = newDuration;
            return { ...n, duration: newDuration };
          } else {
            return n;
          }
        });

        // Update duration of specific note
        return {
          ...prevSequence,
          duration: prevSequence.duration + deltaTime,
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

    if (recording) attachEvents();

    return () => {
      if (listenerRef.current) listenerRef.current();
    };
  }, [recording]);

  return <></>;
};

export default MIDIRecording;
