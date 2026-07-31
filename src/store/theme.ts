import { atom } from "jotai";

export type ColorMode = "light" | "dark";
export const colorModeStore = atom<ColorMode>("dark");
