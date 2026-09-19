import { BsMusicNote, BsSoundwave, BsWrench } from "react-icons/bs";

const ICONS = {
  samples: BsMusicNote,
  effects: BsSoundwave,
  plugins: BsWrench,
} as const;

export type AppIcons = keyof typeof ICONS;

export default ICONS;
