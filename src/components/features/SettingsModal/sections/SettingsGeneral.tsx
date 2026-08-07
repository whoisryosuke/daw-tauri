import React, { useEffect, useState } from "react";
import { Stack } from "../../../../../styled-system/jsx";
import { SelectRootProps } from "@base-ui/react";
import Dropdown, {
  DropdownItem,
  DropdownItems,
} from "../../../ui/Dropdown/Dropdown";
import { invoke } from "@tauri-apps/api/core";
import Text from "../../../ui/Typography/Text";

type DeviceResponse = { name: string };
type OutputDeviceResponse = { devices: DeviceResponse[]; selected: string };

type Props = {};

const SettingsGeneral = (props: Props) => {
  const [outputDevices, setOutputDevices] = useState<DropdownItems>([]);
  const [selectedOutputDevice, setSelectedOutputDevice] = useState("");
  const onCategoryChange: SelectRootProps<
    string,
    false
  >["onValueChange"] = async (newValue) => {
    if (newValue) {
      setSelectedOutputDevice(newValue as string);

      await invoke("change_audio_device", { deviceName: newValue });
    }
  };

  useEffect(() => {
    const getOutputDevices = async () => {
      const response = (await invoke(
        "get_output_devices",
      )) as OutputDeviceResponse;
      console.log("get_output_devices", response);

      if (Array.isArray(response.devices)) {
        const newOutputDevices = response.devices.map(
          (device) =>
            ({
              label: device.name,
              value: device.name,
            }) as DropdownItem,
        );

        setOutputDevices(newOutputDevices);
      }

      setSelectedOutputDevice(response.selected);
    };

    getOutputDevices();
  }, []);

  return (
    <Stack p={2}>
      <Text>Output Device</Text>
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
