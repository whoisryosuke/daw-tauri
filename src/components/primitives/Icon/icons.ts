import { BsMusicNote } from "react-icons/bs";

const ICONS = {
  samples: BsMusicNote,
} as const;

export type AppIcons = keyof typeof ICONS;

export default ICONS;
