import React, { forwardRef, type ButtonHTMLAttributes } from "react";
import type { ListItemData } from "../../../constants/media-list";
import Icon from "../../primitives/Icon/Icon";
import { css, cx } from "../../../../styled-system/css";

const textStyle = css({
  maxWidth: "20ch",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  alignItems: "center",
});

const buttonStyle = css({
  position: "relative",
  background: "transparent",
  border: 0,
  display: "flex",
  px: 2,
  py: 1,
  gap: 1,
  zIndex: 420,

  "& selected": {
    bg: "blue.4",
  },

  "& svg": {
    flexShrink: 0,
  },
});

export type MediaListItemProps = ListItemData &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    selected?: boolean;
  };

const MediaListItem = forwardRef<HTMLButtonElement, MediaListItemProps>(
  ({ id, title, icon, selected, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cx(buttonStyle, selected && "selected")}
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
