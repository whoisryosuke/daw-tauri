import React, { useState } from "react";
import SettingsGeneral from "./sections/SettingsGeneral";
import SettingsInput from "./sections/SettingsInput";
import { Stack } from "../../../../styled-system/jsx";
import { SettingsTab, TABS } from "./constants";
import TabListItem from "./SettingsModalListItem";

type Props = {};

const SettingsModalContent = (props: Props) => {
  const [selectedTab, setSelectedTab] = useState<SettingsTab>("general");
  const tabList = Object.keys(TABS) as SettingsTab[];
  const CurrentTabContent = TABS[selectedTab];
  const handleTabChange = (newTab: SettingsTab) => {
    setSelectedTab(newTab);
  };
  return (
    <Stack flexDirection="row" minHeight={200}>
      <div>
        <Stack gap={0} borderRadius={4} overflow="hidden">
          {tabList.map((tabKey) => (
            <TabListItem
              key={tabKey}
              tabKey={tabKey}
              handleTabChange={handleTabChange}
              selected={tabKey == selectedTab}
            />
          ))}
        </Stack>
      </div>
      <CurrentTabContent />
    </Stack>
  );
};

export default SettingsModalContent;
