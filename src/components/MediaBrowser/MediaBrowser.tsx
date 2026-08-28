import React, { useState } from "react";
import MediaSearch from "./MediaSearch/MediaSearch";
import MediaList from "./MediaList/MediaList";
import MediaActiveContent from "./MediaActiveContent/MediaActiveContent";
import { Box, Stack } from "../../../styled-system/jsx";
import { MediaBrowserCategory } from "../../constants/media-list";
import Panel from "../ui/Panel/Panel";
import Heading from "../ui/Typography/Heading";
import { css } from "../../../styled-system/css";

const headingStyle = css({
  color: "gray.11",
});

type Props = {};

const MediaBrowser = (props: Props) => {
  const [selectedListItem, setSelectedListItem] =
    useState<MediaBrowserCategory>("samples");
  const [search, setSearch] = useState("");

  const setSearchTerm = (newSearch: string) => {
    setSearch(newSearch);
  };

  const handleSelectedItem = (newItem: MediaBrowserCategory) => {
    setSelectedListItem(newItem);
  };

  return (
    <Stack p={1}>
      <MediaSearch search={search} setSearchTerm={setSearchTerm} />
      <Panel flex={1} gap={0}>
        <Box
          // bgColor="rgba(0,0,0,0.15)"
          bgLinear="to-b"
          gradientFrom="rgba(0,0,0,0.2)"
          gradientTo="rgba(0,0,0,0.1)"
          p={2}
        >
          <Heading as="h6" className={headingStyle}>
            Library
          </Heading>
        </Box>
        <Stack flexDir="row" flex={1} p={1}>
          <MediaList
            selectedListItem={selectedListItem}
            handleSelectedItem={handleSelectedItem}
          />
          <MediaActiveContent content={selectedListItem} />
        </Stack>
      </Panel>
    </Stack>
  );
};

export default MediaBrowser;
