import React, { type Dispatch, type SetStateAction } from "react";
import { MEDIA_LIST } from "../../../constants/media-list";
import MediaListItem from "../MediaListItem/MediaListItem";
import { Flex } from "@radix-ui/themes";
import ExpandablePanel from "../../primitives/ExpandablePanel/ExpandablePanel";

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
      <Flex direction="column" m="1">
        {renderList}
      </Flex>
    </ExpandablePanel>
  );
};

export default MediaList;
