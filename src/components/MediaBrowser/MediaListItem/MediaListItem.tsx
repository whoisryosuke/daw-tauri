import React, {
  Dispatch,
  forwardRef,
  SetStateAction,
  type ButtonHTMLAttributes,
} from "react";
import type {
  ListItemData,
  MediaBrowserCategory,
  MediaBrowserListData,
} from "../../../constants/media-list";
import Icon from "../../primitives/Icon/Icon";
import { css, cva, cx } from "../../../../styled-system/css";

const textStyle = css({
  maxWidth: "20ch",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  alignItems: "center",
});

const buttonStyle = cva({
  base: {
    position: "relative",
    background: "transparent",
    border: 0,
    display: "flex",
    alignItems: "center",
    px: 2,
    py: 1,
    gap: 1,
    zIndex: 420,

    fontSize: 2,
    color: "gray.11",

    "& svg": {
      flexShrink: 0,
    },
  },
  variants: {
    selected: {
      true: {
        bg: "blue.4",
        color: "blue.12",
      },
    },
  },
});

export type MediaListItemProps = MediaBrowserListData &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    selected?: boolean;
    handleSelectedItem?: (newItem: MediaBrowserCategory) => void;
  };

const MediaListItem = forwardRef<HTMLButtonElement, MediaListItemProps>(
  ({ id, title, icon, selected, handleSelectedItem, ...props }, ref) => {
    const handleClick = () => {
      if (handleSelectedItem) handleSelectedItem(id);
    };
    return (
      <button
        ref={ref}
        className={buttonStyle({ selected })}
        onClick={handleClick}
        {...props}
      >
        <Icon icon={icon} />
        <span className={textStyle}>{title}</span>
      </button>
    );
  },
);

MediaListItem.displayName = "MediaListItem";

export default MediaListItem;
