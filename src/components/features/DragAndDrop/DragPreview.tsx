import { DragOverlay } from "@dnd-kit/core";
import { useAtomValue } from "jotai";
import React from "react";
import { draggingStore } from "../../../store/drag";
import ClipPreview from "./previews/ClipPreview";
import { MediaBrowserDragData } from "../../../constants/drag";

type Props = {};

const DragPreview = (props: Props) => {
  const dragItem = useAtomValue(draggingStore);

  console.log("dragItem", dragItem);

  return (
    <DragOverlay>
      {dragItem &&
        (dragItem.action == "CLIP" || dragItem.action == "EFFECT") && (
          <ClipPreview
            item={dragItem as unknown as MediaBrowserDragData}
            offsetX={dragItem.offsetX}
          />
        )}
    </DragOverlay>
  );
};

export default DragPreview;
