import React, { ReactElement } from "react";
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
      zIndex: "popup", // @TODO: Need to dark a "top" z-level for popups
    },
    popup: {
      transformOrigin: "var(--transform-origin)",
      borderWidth: "1px",
      borderColor: "gray.6",
      bg: "gray.2",
      paddingY: "1",
      borderRadius: 3,
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
      alignItems: "center",
      gap: 2,
      cursor: "default",
      py: 3,
      paddingRight: 14,
      paddingLeft: 4,
      fontSize: "sm",
      outline: "none",
      userSelect: "none",
      color: "gray.9",

      _motionSafe: {
        transitionProperty: "background-color, color, border-color",
        transitionTimingFunction: "ease-in-out",
        transitionDuration: "fast",
      },

      "&[data-highlighted]": {
        position: "relative",
        zIndex: 0,
        color: "gray.12",

        _before: {
          content: '""',
          position: "absolute",
          insetX: 1,
          insetY: 0,
          zIndex: -1,
          bg: "gray.4",
          borderRadius: 2,
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
  icon?: ReactElement;
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
                {item.icon} {item.title}
              </BaseMenu.Item>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
};

export default ContextMenu;
