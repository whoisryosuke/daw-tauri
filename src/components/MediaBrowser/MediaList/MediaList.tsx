import React, { type Dispatch, type SetStateAction } from "react";
import {
  MEDIA_BROWSER_CATEGORIES_LIST,
  MediaBrowserCategory,
} from "../../../constants/media-list";
import MediaListItem from "../MediaListItem/MediaListItem";
import ExpandablePanel from "../../primitives/ExpandablePanel/ExpandablePanel";
import { Stack } from "../../../../styled-system/jsx";

type Props = {
  selectedListItem: string;
  handleSelectedItem: (newItem: MediaBrowserCategory) => void;
};

const MediaList = ({ selectedListItem, handleSelectedItem }: Props) => {
  const renderList = Object.entries(MEDIA_BROWSER_CATEGORIES_LIST).map(
    ([id, listItemData]) => (
      <MediaListItem
        selected={selectedListItem == id}
        id={id}
        handleSelectedItem={handleSelectedItem}
        {...listItemData}
      />
    ),
  );

  return (
    <ExpandablePanel>
      <Stack m="1">{renderList}</Stack>
    </ExpandablePanel>
  );
};

export default MediaList;
