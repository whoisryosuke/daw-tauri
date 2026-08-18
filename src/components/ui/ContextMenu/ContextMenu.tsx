import React from "react";
import { ContextMenu as BaseMenu } from "@base-ui/react/context-menu";
import { cx, sva } from "../../../../styled-system/css";

export const contextMenuRecipe = sva({
  slots: ["trigger", "positioner", "popup", "item", "separator"],
  base: {
    trigger: {
      display: "flex",
      width: "100%",
      userSelect: "none",
      height: "150px",
    },
    positioner: {
      outline: "none",
    },
    popup: {
      transformOrigin: "var(--transform-origin)",
      borderWidth: "1px",
      borderColor: "gray.9",
      bg: "white",
      paddingY: "1",
      color: "gray.9",
      boxShadow: "0.25rem 0.25rem 0px rgba(0, 0, 0, 0.12)",
      outline: "none",
      transitionProperty: "scale, opacity",
      transitionDuration: "100ms",
      transitionTimingFunction: "ease-out",
      "&[data-starting-style], &[data-ending-style]": {
        scale: 0.98,
        opacity: 0,
      },
    },
    item: {
      display: "flex",
      cursor: "default",
      paddingY: "2",
      paddingRight: "8",
      paddingLeft: "4",
      fontSize: "sm",
      lineHeight: "4",
      outline: "none",
      userSelect: "none",
      "&[data-highlighted]": {
        position: "relative",
        zIndex: 0,
        color: "white",
        _before: {
          content: '""',
          position: "absolute",
          insetX: 1,
          insetY: 0,
          zIndex: -1,
          bg: "gray.9",
        },
      },
      "&[data-disabled]": {
        color: "gray.5",
      },
    },
    separator: {
      marginX: "1",
      marginY: "1",
      height: "1px",
      bg: "gray.9",
    },
  },
});

export type ContextMenuItem = {
  title: string;
  onClick: () => void;
};

type Props = {
  items: ContextMenuItem[];
  triggerClass?: string;
};

const ContextMenu = ({ items, triggerClass }: Props) => {
  const styles = contextMenuRecipe();
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        className={cx(styles.trigger, triggerClass)}
      ></BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner className={styles.positioner}>
          <BaseMenu.Popup className={styles.popup}>
            {items.map((item) => (
              <BaseMenu.Item className={styles.item} onClick={item.onClick}>
                {item.title}
              </BaseMenu.Item>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
};

export default ContextMenu;
