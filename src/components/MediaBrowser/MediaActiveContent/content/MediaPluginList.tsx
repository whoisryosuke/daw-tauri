import React, { useEffect, useState } from "react";
import MediaListItemDraggable, {
  MediaListItemDraggableProps,
} from "../../MediaListItem/MediaListItemDraggable";
import { Stack } from "../../../../../styled-system/jsx";
import { invoke } from "@tauri-apps/api/core";

type VstPluginMetadata = {
  path: string;
  name: string;
  vendor: string;
  version: string;
  category: string;
  uid: string;
  audio_inputs: number;
  audio_outputs: number;
  has_midi_input: boolean;
  has_midi_output: boolean;
  has_gui: boolean;
};

type Props = {};

const MediaPluginList = (props: Props) => {
  const [items, setItems] = useState<MediaListItemDraggableProps[]>([]);

  useEffect(() => {
    const discoverPlugins = async () => {
      const result = await invoke("discover_vst_plugins");

      console.log("discovered VST plugins", result);

      if (Array.isArray(result)) {
        const newItems = (result as VstPluginMetadata[]).map((item) => {
          const mediaPluginItem: MediaListItemDraggableProps = {
            title: item.name,
            id: item.uid,
            icon: "plugins",
            data: {},
            dragType: "PLUGIN",
          };
          return mediaPluginItem;
        });
        setItems(newItems);
      }
    };
    discoverPlugins();
  }, []);

  return (
    <Stack gap={1}>
      {items.map((listItem) => (
        <MediaListItemDraggable key={listItem.id} {...listItem} />
      ))}
    </Stack>
  );
};

export default MediaPluginList;
