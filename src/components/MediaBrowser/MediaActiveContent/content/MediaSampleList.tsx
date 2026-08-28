import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Stack } from "../../../../../styled-system/jsx";
import MediaListItemDraggable, {
  MediaListItemDraggableProps,
} from "../../MediaListItem/MediaListItemDraggable";
import { MediaBase } from "../../../../store/media";

const DEBUG_LIST: MediaListItemDraggableProps[] = [
  {
    title: "FF8 Magic",
    id: "music/ff8-magic.mp3",
    icon: "samples",
    type: "Sample",
    duration: 1.0,
    dragType: "CLIP",
  },
];

type Props = {};

const MediaSampleList = (props: Props) => {
  const [assets, setAssets] = useState<MediaListItemDraggableProps[]>([]);

  // Get assets from Rust backend
  const fetchAssets = async () => {
    const newAssets = (await invoke("get_assets")) as Omit<MediaBase, "id">[];
    console.log("new assets", newAssets);

    const newMediaList = newAssets.map(
      (newAsset) =>
        ({
          title: newAsset.name,
          id: newAsset.path,
          icon: "samples",
          data: {
            type: "Sample",
            duration: newAsset.duration,
          },
          dragType: "CLIP",
        }) as MediaListItemDraggableProps,
    );

    setAssets(newMediaList);
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return (
    <Stack gap={1}>
      {assets.map((listItem) => (
        <MediaListItemDraggable key={listItem.id} {...listItem} />
      ))}
    </Stack>
  );
};

export default MediaSampleList;
