import { atom } from "jotai";

export type MediaBase = {
  id: string;
  name: string;
  /**
   * Path to file that was loaded.
   */
  path: string;
  /**
   * Duration in seconds
   */
  duration: number;
};

export type Sample = MediaBase & {
  // cached: boolean;
  // buffer: AudioBuffer;
};

export type MIDINote = {
  midi: number;
  velocity: number;
  /**
   * Start time of note in seconds.
   */
  time: number;
  /**
   * Duration in seconds. Null if note hasn't finished.
   */
  duration: number | null;
};

export type MIDISequence = MediaBase & {
  notes: MIDINote[];
};

export const samplesAtom = atom<Sample[]>([]);
export const midiSequencesAtom = atom<MIDISequence[]>([]);
