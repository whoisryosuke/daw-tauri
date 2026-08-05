import React, { CSSProperties } from "react";
import type { MediaListItemProps } from "./MediaListItem";
import MediaListItem from "./MediaListItem";
import { useDrag } from "react-dnd";
import {
  DRAG_TYPES,
  type MediaBrowserDragData,
  type DragTypes,
  MediaBrowserDragTypes,
} from "../../../constants/drag";
import type { Clip } from "../../../store/composition";
import type {
  ListItemData,
  MediaBrowserCategory,
  MediaBrowserListData,
} from "../../../constants/media-list";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export type MediaListItemDraggableProps = MediaBrowserListData & {
  dragType: MediaBrowserDragTypes;
  data: any; // @TODO: Should switch based off drag type provided.
  style?: CSSProperties;
};

const MediaListItemDraggable = ({
  dragType = "CLIP",
  data,
  style,
  ...props
}: MediaListItemDraggableProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `${dragType}_${props.id}`,
    data: {
      data,
      id: props.id,
      name: props.title,
      action: dragType,
    } as MediaBrowserDragData,
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
