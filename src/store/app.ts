import { Toast } from "@base-ui/react";
import { atom } from "jotai";

export const modalVisibleStore = atom<string>("");

export const toastManagerStore = atom(Toast.createToastManager());
