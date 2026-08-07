import { css, cva } from "../../../../styled-system/css";
import { SettingsTab, TAB_NAMES } from "./constants";

const tabStyle = cva({
  base: {
    display: "flex",

    py: 2,
    pl: 3,
    pr: "16",
    bg: {
      base: "gray.2",
      _hover: "gray.3",
    },

    fontSize: 2,
  },
  variants: {
    selected: {
      true: {
        bg: "blue.3",
      },
    },
  },
});

type TabListItemProps = {
  selected?: boolean;
  tabKey: SettingsTab;
  handleTabChange: (newTab: SettingsTab) => void;
};

const TabListItem = ({
  tabKey,
  handleTabChange,
  selected,
}: TabListItemProps) => {
  return (
    <button
      className={tabStyle({ selected })}
      onClick={() => handleTabChange(tabKey)}
    >
      {TAB_NAMES[tabKey]}
    </button>
  );
};

export default TabListItem;
