import React, { type Dispatch, type SetStateAction } from "react";
import { MEDIA_LIST } from "../../../constants/media-list";
import MediaListItem from "../MediaListItem/MediaListItem";
import ExpandablePanel from "../../primitives/ExpandablePanel/ExpandablePanel";
import { Stack } from "../../../../styled-system/jsx";

type Props = {
  selectedListItem: string;
  setSelectedListItem: Dispatch<SetStateAction<string>>;
};

const MediaList = ({ selectedListItem, setSelectedListItem }: Props) => {
  const renderList = MEDIA_LIST.map((listItemData) => (
    <MediaListItem
      selected={selectedListItem == listItemData.id}
      {...listItemData}
    />
  ));

  return (
    <ExpandablePanel>
      <Stack m="1">{renderList}</Stack>
    </ExpandablePanel>
  );
};

export default MediaList;
