import { Button, type ButtonProps } from "@radix-ui/themes";
import React from "react";
import styles from "./ControlButton.module.css";

type Props = ButtonProps & {};

const ControlButton = (props: Props) => {
  return (
    <Button
      size="1"
      color="gray"
      radius="small"
      className={styles.ControlButton}
      {...props}
    />
  );
};

export default ControlButton;
