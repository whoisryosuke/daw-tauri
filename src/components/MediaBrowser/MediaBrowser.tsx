import React, { useState } from "react";
import MediaSearch from "./MediaSearch/MediaSearch";
import MediaList from "./MediaList/MediaList";
import MediaActiveContent from "./MediaActiveContent/MediaActiveContent";
import { Stack } from "../../../styled-system/jsx";
import { MediaBrowserCategory } from "../../constants/media-list";

type Props = {};

const MediaBrowser = (props: Props) => {
  const [selectedListItem, setSelectedListItem] =
    useState<MediaBrowserCategory>("samples");
  const [search, setSearch] = useState("");

  const handleSelectedItem = (newItem: MediaBrowserCategory) => {
    setSelectedListItem(newItem);
  };

  return (
    <Stack bg="gray.2">
      <MediaSearch />
      <Stack flexDir="row" flex={1}>
        <MediaList
          selectedListItem={selectedListItem}
          handleSelectedItem={handleSelectedItem}
        />
        <MediaActiveContent />
      </Stack>
    </Stack>
  );
};

export default MediaBrowser;
