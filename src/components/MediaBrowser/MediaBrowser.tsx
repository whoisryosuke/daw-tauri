import { Flex } from "@radix-ui/themes";
import React, { useState } from "react";
import MediaSearch from "./MediaSearch/MediaSearch";
import MediaList from "./MediaList/MediaList";
import MediaActiveContent from "./MediaActiveContent/MediaActiveContent";

type Props = {};

const MediaBrowser = (props: Props) => {
  const [selectedListItem, setSelectedListItem] = useState("");
  const [search, setSearch] = useState("");

  return (
    <Flex direction="column" style={{ backgroundColor: "var(--color-panel)" }}>
      <MediaSearch />
      <Flex style={{ flex: 1 }}>
        <MediaList
          selectedListItem={selectedListItem}
          setSelectedListItem={setSelectedListItem}
        />
        <MediaActiveContent />
      </Flex>
    </Flex>
  );
};

export default MediaBrowser;
