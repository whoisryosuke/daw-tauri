import React, { CSSProperties } from "react";
import type { MediaListItemProps } from "./MediaListItem";
import MediaListItem from "./MediaListItem";
import { useDrag } from "react-dnd";
import {
  DRAG_TYPES,
  type MediaBrowserDragData,
  type DragTypes,
} from "../../../constants/drag";
import type { Clip } from "../../../store/composition";
import type { ListItemData } from "../../../constants/media-list";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export type MediaListItemDraggableProps = ListItemData & {
  dragType: DragTypes;
  type: Clip["type"];
  style: CSSProperties;
};

const MediaListItemDraggable = ({
  dragType = "CLIP",
  type,
  style,
  ...props
}: MediaListItemDraggableProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: dragType,
    data: {
      id: props.id,
      name: props.title,
      type,
    },
  });
  const transformStyle = {
    transform: CSS.Translate.toString(transform),
  };
  const combinedStyled = {
    ...transformStyle,
    ...style,
  };

  return (
    <MediaListItem
      ref={setNodeRef}
      style={combinedStyled}
      {...listeners}
      {...attributes}
      {...props}
    />
  );
};

export default MediaListItemDraggable;
