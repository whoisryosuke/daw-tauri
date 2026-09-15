import React from "react";
import { css } from "../../../../../styled-system/css";
import Icon from "../../../primitives/Icon/Icon";
import { DragTypes, MediaBrowserDragData } from "../../../../constants/drag";
import MediaListItem from "../../../MediaBrowser/MediaListItem/MediaListItem";
import { DraggingStoreData } from "../../../../store/drag";

const iconContainerStyle = css({
  padding: 2,
  borderWidth: "1px",
  borderStyle: "solid",

  bgLinear: "to-b",
  gradientFrom: {
    base: "blue.3",
    _hover: "blue.3",
  },
  gradientTo: {
    base: "blue.4",
    _hover: "blue.5",
  },
  color: "blue.12",

  borderColor: "blue.4",
});
const containerStyle = css({
  width: "100%",
  textAlign: "center",
  display: "flex",
  justifyContent: "center",

  padding: 2,
  borderWidth: "1px",
  borderStyle: "solid",

  bgLinear: "to-b",
  gradientFrom: {
    base: "blue.3",
    _hover: "blue.3",
  },
  gradientTo: {
    base: "blue.4",
    _hover: "blue.5",
  },
  color: "blue.12",

  borderColor: "blue.4",
  borderRadius: 4,
});
const iconStyle = css({
  margin: "auto",
});

type Props = {
  item: MediaBrowserDragData;
  offsetX: number;
};

const ClipPreview = ({ item, offsetX }: Props) => {
  const iconName = item.action == "CLIP" ? "samples" : "effects";
  // return (
  //   <div className={containerStyle}>
  //     <Icon icon={iconName} className={iconStyle} />
  //   </div>
  // );

  return (
    <MediaListItem
      title={item.name}
      selected
      icon={"samples"}
      id={item.id}
      // style={{ transform: `translateX(${offsetX}px)` }} // adds lag?
      style={{ position: "relative", left: `${offsetX}px` }}
    />
  );
};

export default ClipPreview;
