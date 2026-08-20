import { Provider as StoreProvider } from "jotai";
import React, { useEffect, type PropsWithChildren } from "react";
import { store } from "../store/store";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  addClipToMidiTrack,
  addClipToTrack,
  addEffectToTrack,
  DragPositionData,
  moveTrackClip,
} from "../services/media";
import {
  BaseDragData,
  MediaBrowserDragData,
  MidiModuleDragEvent,
  TrackClipDragData,
  TrackDragEvent,
} from "../constants/drag";
import PlaybackTimeSync from "./Sync/PlaybackTimeSync";
import { TrackEffect } from "../store/composition";
import SettingsModal from "./features/SettingsModal/SettingsModal";
import MIDISync from "./features/Input/MIDISync";
import { newFile } from "../services/composition";
import { Toast } from "@base-ui/react";
import ToastList from "./ui/Toast/ToastList";
import Hotkeys from "./features/Hotkeys/Hotkeys";

type Props = {};

const Providers = ({ children }: PropsWithChildren<Props>) => {
  // DEBUG: on refresh, new file
  useEffect(() => {
    newFile();
  }, []);

  // Drag and drop functionality
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // The drag won't start until the pointer has moved 5px.
        // This allows a simple click to register as an onClick event.
        distance: 5,
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    console.log("item dragged!!", event);

    if (!event.over) {
      console.log("Error dragging, no target specified");
      return;
    }

    // Handle tracks
    let overId = event.over.id.toString();
    if (overId.startsWith("TRACK_")) {
      let trackData = event.over.data.current as TrackDragEvent;

      // The draggable element's "initial" position
      const activeRect = event.active.rect.current.initial;
      if (!activeRect) return;
      const containerRect = event.over.rect;

      // Get the final position of drag element after dragging
      const finalRect = event.active.rect.current.translated;
      if (!finalRect) return;
      let item = event.active.data.current as BaseDragData;
      switch (item.action) {
        // Handle moving an existing clip
        case "TRACK_CLIP": {
          // We want the clip's own top left edge, not the cursor position.
          // So we just check distance between the two corners (final drag position + container).
          const trackClipData = event.active.data.current as TrackClipDragData;

          const relativeX = finalRect.left - containerRect.left;
          const relativeY = finalRect.top - containerRect.top;

          const dragPosition: DragPositionData = {
            x: relativeX,
            y: relativeY,
            width: containerRect.width,
          };
          moveTrackClip(trackData.id, trackClipData, dragPosition);
          break;
        }

        // Handle creating a new track clip and adding to track
        case "CLIP": {
          // Clips only allowed on audio tracks
          if (trackData.trackType != "Sample") return;

          // Drop point should match the cursor position exactly
          const mediaBrowserDragData = event.active.data
            .current as MediaBrowserDragData;
          const activeRect = event.active.rect.current.initial;
          if (!activeRect) return;

          // The mouse click position
          const pointerEvent = event.activatorEvent as
            | PointerEvent
            | MouseEvent;
          const grabOffsetX = pointerEvent.clientX - activeRect.left;
          const grabOffsetY = pointerEvent.clientY - activeRect.top;

          const pointerX = finalRect.left + grabOffsetX;
          const pointerY = finalRect.top + grabOffsetY;

          const relativeX = pointerX - containerRect.left;
          const relativeY = pointerY - containerRect.top;

          const dragPosition: DragPositionData = {
            x: relativeX,
            y: relativeY,
            width: containerRect.width,
          };
          addClipToTrack(trackData.id, mediaBrowserDragData, dragPosition);
          break;
        }

        // Handle dropping an new effect on a track
        case "EFFECT": {
          console.log("[DND] User dropped an effect", item, trackData);
          const effectItem = event.active.data.current as MediaBrowserDragData;

          addEffectToTrack(
            trackData.id,
            effectItem.id as TrackEffect["effect"],
          );
        }
      }
    }

    if (overId.startsWith("MIDI_MODULE")) {
      console.log("dropped on MIDI module!");
      let moduleData = event.over.data.current as MidiModuleDragEvent;
      let dragData = event.active.data.current as MediaBrowserDragData;

      // Add to MIDI to clip
      addClipToMidiTrack(moduleData.trackId, dragData);
    }
  };
  return (
    <Toast.Provider>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <StoreProvider store={store}>
          {children}
          <SettingsModal />
          <PlaybackTimeSync />
          <MIDISync />
          <ToastList />
          <Hotkeys />
        </StoreProvider>
      </DndContext>
    </Toast.Provider>
  );
};

export default Providers;
