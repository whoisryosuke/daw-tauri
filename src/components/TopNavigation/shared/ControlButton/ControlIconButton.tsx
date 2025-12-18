import { IconButton, type IconButtonProps } from "@radix-ui/themes";
import React from "react";
import styles from "./ControlButton.module.css";

type Props = IconButtonProps & {};

const ControlIconButton = (props: Props) => {
  return (
    <IconButton
      size="1"
      color="gray"
      radius="small"
      className={styles.ControlButton}
      {...props}
    />
  );
};

export default ControlIconButton;
