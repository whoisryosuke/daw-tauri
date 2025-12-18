import { Provider as StoreProvider } from "jotai";
import React, { type PropsWithChildren } from "react";
import { store } from "../store/store";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { addClipToTrack } from "../services/media";
import { MediaBrowserDragData, TrackDragEvent } from "../constants/drag";

type Props = {};

const Providers = ({ children }: PropsWithChildren<Props>) => {
  const handleDragEnd = (event: DragEndEvent) => {
    console.log("item dragged!!", event);

    if (event.over && event.over.id.toString().includes("TRACK_")) {
      let trackData = event.over.data.current as TrackDragEvent;
      let item = event.active.data.current as MediaBrowserDragData;

      addClipToTrack(trackData.id, item);

      // Calculate relative coordinates
      const relativeX = event.delta.x - event.over.rect.left;
      const relativeY = event.delta.y - event.over.rect.top;

      console.log("Dropped at relative position:", {
        x: relativeX,
        y: relativeY,
      });
    }
  };
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <StoreProvider store={store}>{children}</StoreProvider>
    </DndContext>
  );
};

export default Providers;
