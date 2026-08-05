import React from "react";
import MediaListItemDraggable, {
  MediaListItemDraggableProps,
} from "../../MediaListItem/MediaListItemDraggable";
import { Stack } from "../../../../../styled-system/jsx";
import { EFFECT_LIST } from "../../../../constants/effects";

const EFFECT_LIST_ITEMS = Object.entries(EFFECT_LIST).map(
  ([id, newAsset]) =>
    ({
      title: newAsset.name,
      id,
      icon: "effects",
      data: {},
      dragType: "EFFECT",
    }) as MediaListItemDraggableProps,
);

type Props = {};

const MediaEffectList = (props: Props) => {
  return (
    <Stack>
      {EFFECT_LIST_ITEMS.map((listItem) => (
        <MediaListItemDraggable key={listItem.id} {...listItem} />
      ))}
    </Stack>
  );
};

export default MediaEffectList;
