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
    backgroundColor: {
      base: "gray.alpha-1",
      _hover: "gray.5",
    },
    // bgLinear: "to-b",
    // gradientFrom: {
    //   base: "gray.alpha-1",
    //   _hover: "gray.4",
    // },
    // gradientTo: {
    //   base: "gray.alpha-1",
    //   _hover: "gray.6",
    // },
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "gray.alpha-1",
    display: "flex",
    alignItems: "center",
    px: 2,
    py: 1,
    gap: 1,
    zIndex: 420,
    borderRadius: 3,

    fontSize: 2,
    color: "gray.11",

    "& svg": {
      flexShrink: 0,
    },
  },
  variants: {
    selected: {
      true: {
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
