import { atom } from "jotai";
import { DragTypes } from "../constants/drag";

export const draggingStore = atom<DragTypes | null>(null);
