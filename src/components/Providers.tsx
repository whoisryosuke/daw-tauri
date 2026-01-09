import { Provider as StoreProvider } from "jotai";
import React, { type PropsWithChildren } from "react";
import { store } from "../store/store";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { addClipToTrack, DragPositionData } from "../services/media";
import { MediaBrowserDragData, TrackDragEvent } from "../constants/drag";

type Props = {};

const Providers = ({ children }: PropsWithChildren<Props>) => {
  const handleDragEnd = (event: DragEndEvent) => {
    console.log("item dragged!!", event);

    // Handle tracks
    if (event.over && event.over.id.toString().includes("TRACK_")) {
      let trackData = event.over.data.current as TrackDragEvent;
      let item = event.active.data.current as MediaBrowserDragData;

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

      addClipToTrack(trackData.id, item, dragPosition);
    }
  };
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <StoreProvider store={store}>{children}</StoreProvider>
    </DndContext>
  );
};

export default Providers;
