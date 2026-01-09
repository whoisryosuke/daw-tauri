import { atom } from "jotai";

export type MediaBase = {
  id: string;
  name: string;
  /**
   * Path to file that was loaded.
   */
  path: string;
};

export type Sample = MediaBase & {
  // cached: boolean;
  // buffer: AudioBuffer;
};

export type MIDINote = {
  midi: number;
  velocity: number;
  time: number;
  duration: number;
};

export type MIDISequence = MediaBase & {
  notes: MIDINote[];
};

export const samplesAtom = atom<Sample[]>([]);
export const midiSequencesAtom = atom<MIDISequence[]>([]);
