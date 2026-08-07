import SettingsGeneral from "./sections/SettingsGeneral";
import SettingsInput from "./sections/SettingsInput";

export const TABS = {
  general: SettingsGeneral,
  input: SettingsInput,
};

export type SettingsTab = keyof typeof TABS;

export const TAB_NAMES: Record<SettingsTab, string> = {
  general: "General",
  input: "Input",
};
