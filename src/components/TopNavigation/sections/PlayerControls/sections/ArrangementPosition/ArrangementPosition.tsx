import { Flex, TextField } from "@radix-ui/themes";
import React from "react";
import styles from "./ArrangementPosition.module.css";
import buttonStyles from "../../../../shared/ControlButton/ControlButton.module.css";

type Props = {};

const ArrangementPosition = (props: Props) => {
  return (
    <Flex>
      <TextField.Root
        size="1"
        value={1}
        className={[styles.Input, buttonStyles.ControlButton]}
        radius="small"
        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
      />
      <TextField.Root
        size="1"
        value={1}
        className={[styles.Input, buttonStyles.ControlButton]}
        radius="none"
      />
      <TextField.Root
        size="1"
        value={1}
        className={[styles.Input, buttonStyles.ControlButton]}
        radius="small"
        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
      />
    </Flex>
  );
};

export default ArrangementPosition;
