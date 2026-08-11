import React, { useEffect, useState } from "react";
import { Stack } from "../../../../../styled-system/jsx";
import { SelectRootProps } from "@base-ui/react";
import Dropdown, {
  DropdownItem,
  DropdownItems,
} from "../../../ui/Dropdown/Dropdown";
import { invoke } from "@tauri-apps/api/core";
import Text from "../../../ui/Typography/Text";

type MIDIInputDeviceResponse = { name: string; id: string };
type OutputDeviceResponse = {
  devices: MIDIInputDeviceResponse[];
  selected: string;
};

type Props = {};

const SettingsInput = (props: Props) => {
  const [midiInputDevices, setMidiInputDevices] = useState<DropdownItems>([]);
  const [selectedMidiInputDevice, setSelectedMidiInputDevice] = useState("");
  const onCategoryChange: SelectRootProps<
    string,
    false
  >["onValueChange"] = async (newValue) => {
    if (newValue) {
      setSelectedMidiInputDevice(newValue as string);

      await invoke("connect_to_midi_input_device", { device: newValue });
    }
  };

  useEffect(() => {
    const getOutputDevices = async () => {
      const response = (await invoke(
        "get_midi_input_devices",
      )) as OutputDeviceResponse;
      console.log("get_midi_input_devices", response);

      if (Array.isArray(response.devices)) {
        const newOutputDevices = response.devices.map(
          (device) =>
            ({
              label: device.name,
              value: device.id,
            }) as DropdownItem,
        );

        setMidiInputDevices(newOutputDevices);
      }

      setSelectedMidiInputDevice(response.selected);
    };

    getOutputDevices();
  }, []);

  return (
    <Stack p={2}>
      <Text>MIDI Input Device</Text>
      <Dropdown
        name="c"
        value={selectedMidiInputDevice}
        onChange={onCategoryChange}
        placeholder="MIDI Input Devices"
        items={midiInputDevices}
      />
    </Stack>
  );
};

export default SettingsInput;
