import React, { useState } from "react";
import MediaSearch from "./MediaSearch/MediaSearch";
import MediaList from "./MediaList/MediaList";
import MediaActiveContent from "./MediaActiveContent/MediaActiveContent";
import { Stack } from "../../../styled-system/jsx";

type Props = {};

const MediaBrowser = (props: Props) => {
  const [selectedListItem, setSelectedListItem] = useState("");
  const [search, setSearch] = useState("");

  return (
    <Stack direction="column" bg="gray.2">
      <MediaSearch />
      <Stack flex={1}>
        <MediaList
          selectedListItem={selectedListItem}
          setSelectedListItem={setSelectedListItem}
        />
        <MediaActiveContent />
      </Stack>
    </Stack>
  );
};

export default MediaBrowser;
