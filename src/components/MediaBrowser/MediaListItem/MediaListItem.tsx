import React, { forwardRef, type ButtonHTMLAttributes } from "react";
import styles from "./MediaListItem.module.css";
import type { ListItemData } from "../../../constants/media-list";
import Icon from "../../primitives/Icon/Icon";

export type MediaListItemProps = ListItemData &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    selected?: boolean;
  };

const MediaListItem = forwardRef<HTMLButtonElement, MediaListItemProps>(
  ({ id, title, icon, selected, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${styles.MediaListItem}${selected ? "selected" : ""}`}
        {...props}
      >
        <Icon icon={icon} />
        {title}
      </button>
    );
  }
);

MediaListItem.displayName = "MediaListItem";

export default MediaListItem;
