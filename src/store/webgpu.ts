import { atom } from "jotai";
import WebGPUManager from "../modules/webgpu/WebGPUManager";
import { store } from "./store";

export const webGPUManagerStore = atom<WebGPUManager | null>(null);

export const initWebGPUManagerStore = async () => {
  const newStore = new WebGPUManager();
  try {
    await newStore.init();
    store.set(webGPUManagerStore, newStore);
  } catch (error) {
    console.error(error);
  }
};
