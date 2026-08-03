import { Provider as StoreProvider } from "jotai";
import React, { type PropsWithChildren } from "react";
import { store } from "../store/store";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  addClipToTrack,
  DragPositionData,
  moveTrackClip,
} from "../services/media";
import {
  BaseDragData,
  MediaBrowserDragData,
  TrackClipDragData,
  TrackDragEvent,
} from "../constants/drag";

type Props = {};

const Providers = ({ children }: PropsWithChildren<Props>) => {
  const handleDragEnd = (event: DragEndEvent) => {
    console.log("item dragged!!", event);

    if (!event.over) {
      console.log("Error dragging, no target specified");
      return;
    }

    // Handle tracks
    let overId = event.over.id.toString();
    if (overId.includes("TRACK_")) {
      let trackData = event.over.data.current as TrackDragEvent;

      // The mouse click position
      const pointerEvent = event.activatorEvent as PointerEvent | MouseEvent;
      // The draggable element's "initial" position
      const activeRect = event.active.rect.current.initial;
      if (!activeRect) return;

      // Get the initial grab position relative to the dragged element
      const grabOffsetX = pointerEvent.clientX - activeRect.left;
      const grabOffsetY = pointerEvent.clientY - activeRect.top;

      // Get the final position of drag element after dragging
      const finalRect = event.active.rect.current.translated;
      if (!finalRect) return;

      // Calculate where the pointer is now (accounting for the grab offset)
      const pointerX = finalRect.left + grabOffsetX;
      const pointerY = finalRect.top + grabOffsetY;

      // Calculate relative coordinates to drop container
      const containerRect = event.over.rect;
      const relativeX = pointerX - containerRect.left;
      const relativeY = pointerY - containerRect.top;

      const dragPosition: DragPositionData = {
        x: relativeX,
        y: relativeY,
        width: containerRect.width,
      };

      let item = event.active.data.current as BaseDragData;
      switch (item.action) {
        // Handle moving an existing clip
        case "TRACK_CLIP":
          const trackClipData = event.active.data.current as TrackClipDragData;
          console.log("moving track clip...", trackClipData);
          moveTrackClip(trackData.id, trackClipData, dragPosition);
          break;

        // Handle creating a new track clip and adding to track
        case "CLIP":
          const mediaBrowserDragData = event.active.data
            .current as MediaBrowserDragData;

          addClipToTrack(trackData.id, mediaBrowserDragData, dragPosition);
          break;
      }
    }
  };
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <StoreProvider store={store}>{children}</StoreProvider>
    </DndContext>
  );
};

export default Providers;
