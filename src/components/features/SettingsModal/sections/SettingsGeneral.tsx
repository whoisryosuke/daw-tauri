import React, { useEffect, useState } from "react";
import { Stack } from "../../../../../styled-system/jsx";
import { SelectRootProps } from "@base-ui/react";
import Dropdown, {
  DropdownItem,
  DropdownItems,
} from "../../../ui/Dropdown/Dropdown";
import { invoke } from "@tauri-apps/api/core";

type OutputDeviceResponse = { name: string }[];

type Props = {};

const SettingsGeneral = (props: Props) => {
  const [outputDevices, setOutputDevices] = useState<DropdownItems>([]);
  const [selectedOutputDevice, setSelectedOutputDevice] = useState("");
  const onCategoryChange: SelectRootProps<string, false>["onValueChange"] = (
    newValue,
  ) => {
    if (newValue) setSelectedOutputDevice(newValue as string);
  };

  useEffect(() => {
    const getOutputDevices = async () => {
      const devices = (await invoke(
        "get_output_devices",
      )) as OutputDeviceResponse;
      console.log("get_output_devices", devices);

      if (Array.isArray(devices)) {
        const newOutputDevices = devices.map(
          (device) =>
            ({
              label: device.name,
              value: device.name,
            }) as DropdownItem,
        );

        setOutputDevices(newOutputDevices);
      }
    };

    getOutputDevices();
  }, []);

  return (
    <Stack p={2}>
      <Dropdown
        name="c"
        value={selectedOutputDevice}
        onChange={onCategoryChange}
        placeholder="Output Devices"
        items={outputDevices}
      />
    </Stack>
  );
};

export default SettingsGeneral;
