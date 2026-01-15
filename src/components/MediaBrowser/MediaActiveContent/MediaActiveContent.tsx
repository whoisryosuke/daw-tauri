import React, { useEffect, useState } from "react";
import ExpandablePanel from "../../primitives/ExpandablePanel/ExpandablePanel";
import type { ListItemData } from "../../../constants/media-list";
import MediaListItem from "../MediaListItem/MediaListItem";
import MediaListItemDraggable, {
  type MediaListItemDraggableProps,
} from "../MediaListItem/MediaListItemDraggable";
import { invoke } from "@tauri-apps/api/core";

const DEBUG_LIST: MediaListItemDraggableProps[] = [
  {
    title: "FF8 Magic",
    id: "music/ff8-magic.mp3",
    icon: "samples",
    type: "sample",
    dragType: "CLIP",
  },
];

type MediaAsset = {
  name: string;
  path: string;
  duration: number;
};

type Props = {};

const MediaActiveContent = (props: Props) => {
  const [assets, setAssets] = useState<MediaListItemDraggableProps[]>([]);

  // Get assets from Rust backend
  const fetchAssets = async () => {
    const newAssets = (await invoke("get_assets")) as MediaAsset[];
    console.log("new assets", newAssets);

    const newMediaList = newAssets.map(
      (newAsset) =>
        ({
          title: newAsset.name,
          id: newAsset.path,
          icon: "samples",
          type: "sample",
          duration: newAsset.duration,
          dragType: "CLIP",
        } as MediaListItemDraggableProps)
    );

    setAssets(newMediaList);
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return (
    <ExpandablePanel>
      {assets.map((listItem) => (
        <MediaListItemDraggable key={listItem.id} {...listItem} />
      ))}
    </ExpandablePanel>
  );
};

export default MediaActiveContent;
