import { atom } from "jotai";
import { BaseDragData, DragTypes } from "../constants/drag";

export type DraggingStoreData = BaseDragData & {
  data: any;
  offsetX: number;
};

export const draggingStore = atom<DraggingStoreData | null>(null);
