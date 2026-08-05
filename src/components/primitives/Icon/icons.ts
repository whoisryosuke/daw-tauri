import { BsMusicNote, BsWrench } from "react-icons/bs";

const ICONS = {
  samples: BsMusicNote,
  effects: BsWrench,
} as const;

export type AppIcons = keyof typeof ICONS;

export default ICONS;
