import React from "react";
import SettingsModal from "../features/SettingsModal/SettingsModal";
import ExportModal from "../features/ExportModal/ExportModal";

type Props = {};

const Modals = (props: Props) => {
  return (
    <>
      <SettingsModal />
      <ExportModal />
    </>
  );
};

export default Modals;
