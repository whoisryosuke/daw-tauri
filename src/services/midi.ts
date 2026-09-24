import { invoke } from "@tauri-apps/api/core";

export type MIDIInputPayload = {
  command: "NoteOn" | "NoteOff" | "Unknown";
  channel: number;
  note: number;
  velocity: number;
  time: number;
};

export const startMIDIConnection = async () => {
  let result = await invoke("start_midi_connection");
  if (result) console.error("new file error", result);
};
