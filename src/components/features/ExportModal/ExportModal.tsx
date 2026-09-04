import React from "react";
import Modal from "../../ui/Modal/Modal";
import ExportModalContent from "./ExportModalContent";
import { useSetAtom } from "jotai";
import { modalVisibleStore } from "../../../store/app";

export const EXPORT_MODAL_ID = "EXPORT";

type Props = {};

const ExportModal = (props: Props) => {
  const setModalVisible = useSetAtom(modalVisibleStore);

  const handleClose = () => {
    setModalVisible("");
  };
  return (
    <Modal title="Export Audio" modalId={EXPORT_MODAL_ID}>
      <ExportModalContent close={handleClose} />
    </Modal>
  );
};

export default ExportModal;
