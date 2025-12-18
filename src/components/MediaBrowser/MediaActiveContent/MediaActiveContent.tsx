import React from "react";
import ExpandablePanel from "../../primitives/ExpandablePanel/ExpandablePanel";
import type { ListItemData } from "../../../constants/media-list";
import MediaListItem from "../MediaListItem/MediaListItem";
import MediaListItemDraggable, {
  type MediaListItemDraggableProps,
} from "../MediaListItem/MediaListItemDraggable";

const DEBUG_LIST: MediaListItemDraggableProps[] = [
  {
    title: "FF8 Magic",
    id: "music/ff8-magic.mp3",
    icon: "samples",
    type: "sample",
    dragType: "CLIP",
  },
];

type Props = {};

const MediaActiveContent = (props: Props) => {
  return (
    <ExpandablePanel>
      {DEBUG_LIST.map((listItem) => (
        <MediaListItemDraggable key={listItem.id} {...listItem} />
      ))}
    </ExpandablePanel>
  );
};

export default MediaActiveContent;
