import { DragOverlay } from "@dnd-kit/core";
import { useAtomValue } from "jotai";
import React from "react";
import { draggingStore } from "../../../store/drag";
import ClipPreview from "./previews/ClipPreview";

type Props = {};

const DragPreview = (props: Props) => {
  const dragType = useAtomValue(draggingStore);
  return (
    <DragOverlay>
      {dragType == "CLIP" ||
        (dragType == "EFFECT" && <ClipPreview dragType={dragType} />)}
    </DragOverlay>
  );
};

export default DragPreview;
