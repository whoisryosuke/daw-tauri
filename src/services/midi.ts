import { invoke } from "@tauri-apps/api/core";

export const startMIDIConnection = async () => {
  let result = await invoke("start_midi_connection");
  if (result) console.error("new file error", result);
};
