import React from "react";
import Modal from "../../ui/Modal/Modal";
import ExportModalContent from "./ExportModalContent";

export const EXPORT_MODAL_ID = "EXPORT";

type Props = {};

const ExportModal = (props: Props) => {
  return (
    <Modal title="Export Audio" modalId={EXPORT_MODAL_ID}>
      <ExportModalContent />
    </Modal>
  );
};

export default ExportModal;
