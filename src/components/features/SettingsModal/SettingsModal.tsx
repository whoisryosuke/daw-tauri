import React from "react";
import SettingsModalContent from "./SettingsModalContent";
import Modal from "../../ui/Modal/Modal";

export const SETTINGS_MODAL_ID = "SETTINGS";

type Props = {};

const SettingsModal = (props: Props) => {
  return (
    <Modal title="Settings" modalId={SETTINGS_MODAL_ID}>
      <SettingsModalContent />
    </Modal>
  );
};

export default SettingsModal;
