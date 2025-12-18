import React from "react";
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

export type MediaListItemDraggableProps = ListItemData & {
  dragType: DragTypes;
  type: Clip["type"];
};

const MediaListItemDraggable = ({
  dragType = "CLIP",
  type,
  ...props
}: MediaListItemDraggableProps) => {
  const [{ isDragging }, drag] = useDrag<MediaBrowserDragData>(() => ({
    type: DRAG_TYPES[dragType],
    item: {
      id: props.id,
      name: props.title,
      type,
    },
    // end: (item, monitor) => {
    //   const dropResult = monitor.getDropResult<TrackDropResult>();
    //   if (item && dropResult) {
    //     alert(`You dropped ${item.id} into ${dropResult.id}!`);
    //   }
    // },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return <MediaListItem ref={drag} {...props} />;
};

export default MediaListItemDraggable;
