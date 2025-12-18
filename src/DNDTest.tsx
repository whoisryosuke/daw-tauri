import React, { useEffect, useRef } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { UnlistenFn } from "@tauri-apps/api/event";

type Props = {};

const DNDTest = (props: Props) => {
  const eventRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    const addEvent = async () => {
      eventRef.current = await getCurrentWebview().onDragDropEvent((event) => {
        if (event.payload.type === "over") {
          console.log("User hovering", event.payload.position);
        } else if (event.payload.type === "drop") {
          console.log("User dropped", event.payload.paths);
        } else {
          console.log("File drop cancelled");
        }
      });
    };

    addEvent();

    return () => {
      eventRef.current?.();
    };
  }, []);

  return <div>DNDTest</div>;
};

export default DNDTest;
