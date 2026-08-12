import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useSetAtom } from "jotai";
import React, { useEffect, useRef } from "react";
import { inputStore } from "../../../store/input";

type MIDIInputPayload = {
  command: string;
  channel: number;
  note: number;
  velocity: number;
};

type Props = {};

const MIDISync = (props: Props) => {
  const updateStore = useSetAtom(inputStore);
  const listenerRef = useRef<UnlistenFn>(null);

  useEffect(() => {
    const attachEvents = async () => {
      listenerRef.current = await listen<MIDIInputPayload>(
        "midi-input",
        (event) => {
          console.log("got MIDI data", event.payload);
          const input = event.payload;
          updateStore((prev) => ({
            ...prev,
            [input.note]: {
              pressed: input.command == "NoteOn" ? true : false,
              velocity: input.velocity,
            },
          }));
        },
      );
    };

    attachEvents();

    return () => {
      if (listenerRef.current) listenerRef.current();
    };
  }, []);
  return <div>MIDISync</div>;
};

export default MIDISync;
