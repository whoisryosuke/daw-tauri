import { modalVisibleStore } from "../store/app";
import { store } from "../store/store";

export function openModal(id: string) {
  store.set(modalVisibleStore, id);
}
