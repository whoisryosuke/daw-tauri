import { toastManagerStore } from "../store/app";
import { store } from "../store/store";

export type NotificationTypes = "error";

export type NewNotificationData = {
  title: string;
  description: string;
  type?: NotificationTypes;
};

export function sendNotification({
  title,
  description,
  type,
}: NewNotificationData) {
  const toastManager = store.get(toastManagerStore);
  console.log("sending notification", toastManager);
  toastManager.add({
    title,
    description,
    data: {
      type,
    },
  });
}
