import React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { cx, sva } from "../../../../styled-system/css";
import { colorModeStore } from "../../../store/theme";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { BiX } from "react-icons/bi";
import { settingsModalVisibleStore } from "../../../store/app";
import SettingsModalContent from "./SettingsModalContent";

export const dialogRecipe = sva({
  slots: [
    "trigger",
    "backdrop",
    "popup",
    "title",
    "description",
    "close",
    "contentWrapper",
    "footerWrapper",
  ],
  base: {
    backdrop: {
      position: "fixed",
      inset: 0,
      minHeight: "100dvh",
      bg: "black",
      opacity: 0.5,
      _motionSafe: {
        transition: "opacity 150ms",
      },
    },
    popup: {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      marginTop: "-2rem",
      display: "flex",
      flexDirection: "column",
      gap: "4",
      overflow: "hidden",
      width: "500px",
      maxWidth: "calc(100vw - 3rem)",
      bg: "gray.1",
      color: "gray.11",
      borderWidth: "1px",
      borderColor: "gray.4",
      borderRadius: "4",
      boxShadow: "0.25rem 0.25rem 0 rgba(0,0,0,0.12)",
      _motionSafe: {
        transition: "scale 100ms ease-out, opacity 100ms ease-out",
      },
    },
    title: {
      fontSize: "4",
      p: 2,
      fontWeight: "bold",
    },
    description: {
      fontSize: "sm",
      color: "gray.6",
    },
    close: {
      position: "absolute",
      top: 1,
      right: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "2",
      borderWidth: "1px",
      borderColor: "gray.4",
      borderRadius: "3",
      bg: "transparent",
      p: "1",
      fontSize: "sm",
      lineHeight: "none",
      whiteSpace: "nowrap",
      fontWeight: "normal",
      color: "gray.11",
      userSelect: "none",
      _hover: {
        bg: "gray.3",
      },
    },
    contentWrapper: { display: "flex", flexDirection: "column", gap: "1" },
    footerWrapper: { display: "flex", justifyContent: "flex-end", gap: "3" },
  },
});

type Props = {};

const SettingsModal = (props: Props) => {
  const [open, setModalVisible] = useAtom(settingsModalVisibleStore);
  const styles = dialogRecipe();

  const handleClose = () => {
    setModalVisible(false);
  };

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} onClick={handleClose} />

        <Dialog.Popup className={styles.popup}>
          {/* Content Wrapper */}
          <div className={styles.contentWrapper}>
            <Dialog.Title className={styles.title}>Settings</Dialog.Title>
            {/* <Dialog.Description className={styles.description}>
              You are all caught up. Good job!
            </Dialog.Description> */}

            <SettingsModalContent />
          </div>

          <Dialog.Close className={styles.close} onClick={handleClose}>
            <BiX />
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SettingsModal;
