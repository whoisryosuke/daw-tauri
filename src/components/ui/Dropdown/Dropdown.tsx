import * as React from "react";
import { Select, type SelectRootProps } from "@base-ui/react/select";
import {
  BiCaretDown,
  BiCaretUp,
  BiCheck,
  BiChevronDown,
  BiChevronDownCircle,
} from "react-icons/bi";
import { sva } from "../../../../styled-system/css";
import { Stack } from "../../../../styled-system/jsx";

const dropdownPattern = sva({
  className: "dropdown",
  slots: [
    "field",
    "label",
    "value",
    "select",
    "positioner",
    "popup",
    "list",
    "item",
    "itemIndicator",
    "itemText",
    "scrollArrow",
  ],
  base: {
    field: {
      display: "flex",
      flexDirection: "column",
      alignItems: "start",
      gap: "2",
    },
    label: {
      fontSize: "2",
      lineHeight: "1.25rem",
      fontWeight: "700",
      color: "gray.11",
    },
    value: {
      "&[data-placeholder]": {
        color: "gray.11",
      },
    },
    select: {
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "2",
      paddingBlock: "2",
      paddingLeft: "3",
      paddingRight: "3",
      margin: 0,
      outline: "0",
      borderWidth: "1.5px",
      borderStyle: "solid",
      borderColor: "gray.11",
      borderRadius: "3",
      backgroundColor: "gray.1",
      fontFamily: "mono",
      fontWeight: "500",
      fontSize: {
        base: "2",
        xl: "4",
      },
      lineHeight: "1",
      whiteSpace: "nowrap",
      color: "gray.11",
      userSelect: "none",
      minWidth: "10rem",
      "@media (hover: hover)": {
        "&:hover:not([data-disabled])": {
          backgroundColor: "gray.3",
        },
      },
      "&[data-popup-open]": {
        backgroundColor: "gray.3",
      },
      "&:active:not([data-disabled])": {
        backgroundColor: "gray.2",
      },
      "&[data-disabled]": {
        color: "gray.4",
        borderColor: "gray.4",
      },
      "&:focus-visible": {
        outlineWidth: "2px",
        outlineStyle: "solid",
        outlineColor: "blue.4",
        outlineOffset: "-1px",
      },
    },
    positioner: {
      outline: "none",
      zIndex: 999,
      userSelect: "none",
    },
    popup: {
      boxSizing: "border-box",
      outline: "0",
      borderWidth: "1.5px",
      borderStyle: "solid",
      borderColor: "gray.11",
      borderRadius: "3",
      backgroundColor: "gray.1",
      backgroundClip: "padding-box",
      color: "gray.11",
      minWidth: "var(--anchor-width)",
      transformOrigin: "var(--transform-origin)",
      // boxShadow: "0.25rem 0.25rem 0 rgb(0 0 0 / 12%)",
      transition: "transform 100ms ease-out, opacity 100ms ease-out",
      "&[data-starting-style], &[data-ending-style]": {
        opacity: 0,
        transform: "scale(0.98) translateY(-20px)",
      },
      "&[data-side='none']": {
        transition: "none",
        transform: "translateY(1px)",
        opacity: 1,
        minWidth: "calc(var(--anchor-width) + 1.75rem)",
      },
    },
    list: {
      boxSizing: "border-box",
      position: "relative",
      paddingBlock: "0.25rem",
      overflowY: "auto",
      maxHeight: "var(--available-height)",
      scrollPaddingBlock: "1.5rem",
    },
    item: {
      boxSizing: "border-box",
      outline: "0",
      fontFamily: "mono",
      fontSize: {
        base: "2",
        xl: "4",
      },
      lineHeight: "150%",
      paddingBlock: "2",
      paddingLeft: "3",
      paddingRight: "3",
      display: "flex",
      gap: "2",
      alignItems: "center",
      cursor: "default",
      userSelect: "none",
      "&[data-highlighted]": {
        backgroundColor: "gray.4",
        color: "gray.12",
      },
    },
    itemIndicator: {
      display: "flex",
      alignItems: "center",
    },
    itemText: {},
    scrollArrow: {
      width: "100%",
      backgroundColor: "white",
      zIndex: 1,
      textAlign: "center",
      cursor: "default",
      height: "1rem",
      fontSize: "0.75rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      "@media (prefers-color-scheme: dark)": {
        backgroundColor: "oklch(14.5% 0 0deg)",
      },
      "&::before": {
        content: '""',
        position: "absolute",
        width: "100%",
        height: "100%",
        left: 0,
      },
      "&[data-direction='up']": {
        top: 0,
        "&[data-side='none']::before": {
          top: "-100%",
        },
      },
      "&[data-direction='down']": {
        bottom: 0,
        "&[data-side='none']::before": {
          bottom: "-100%",
        },
      },
    },
  },
});
export type DropdownItem = {
  label: string;
  value: string;
  icon?: React.ReactElement;
};
export type DropdownItems = DropdownItem[];

type Props = {
  value: SelectRootProps<string, false>["value"];
  name?: string;
  placeholder: string;
  items: DropdownItems;
  onChange: SelectRootProps<string, false>["onValueChange"];
};

const Dropdown = ({ placeholder, name, items, value, onChange }: Props) => {
  const currentItem = items.find((item) => item.value == value);
  const styles = dropdownPattern();
  return (
    <div className={styles.field}>
      <Select.Root
        name={name}
        items={items}
        value={value}
        onValueChange={onChange}
      >
        {/* <Select.Label className={styles.label}>{value}</Select.Label> */}
        <Select.Trigger className={styles.select}>
          <Stack flexDirection="row" alignItems="center">
            {currentItem && currentItem.icon}
            <Select.Value className={styles.value} placeholder={placeholder} />
          </Stack>
          <Select.Icon>
            <BiChevronDown />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className={styles.positioner}
            sideOffset={4}
            side="bottom"
          >
            <Select.Popup className={styles.popup} data-side="bottom">
              <Select.ScrollUpArrow className={styles.scrollArrow}>
                <BiCaretUp />
              </Select.ScrollUpArrow>
              <Select.List className={styles.list}>
                {items.map(({ label, value, icon }) => (
                  <Select.Item
                    key={label}
                    value={value}
                    className={styles.item}
                  >
                    {icon && icon}
                    <Select.ItemText className={styles.itemText}>
                      {label}
                    </Select.ItemText>
                    <Select.ItemIndicator className={styles.itemIndicator}>
                      <BiCheck size={16} />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className={styles.scrollArrow}>
                <BiCaretDown />
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
};

export default Dropdown;
