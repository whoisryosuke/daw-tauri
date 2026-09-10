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
    },

    fontSize: 2,
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
