import { Flex, Text } from "@radix-ui/themes";
import React, { type PropsWithChildren } from "react";
import type { Clip } from "../../../../store/composition";
import styles from "./ClipContainer.module.css";

const accentColors = [
  "gray",
  "gold",
  "bronze",
  "brown",
  "yellow",
  "amber",
  "orange",
  "tomato",
  "red",
  "ruby",
  "crimson",
  "pink",
  "plum",
  "purple",
  "violet",
  "iris",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "jade",
  "green",
  "grass",
  "lime",
  "mint",
  "sky",
] as const;
type RadixColors = (typeof accentColors)[number];

type Props = Clip & {
  color: RadixColors;
};

const ClipContainer = ({
  name,
  color = "blue",
  children,
}: PropsWithChildren<Props>) => {
  return (
    <Flex direction="column" className={`${styles.Container} ${styles[color]}`}>
      <Text size="1">{name}</Text>
      {children}
    </Flex>
  );
};

ClipContainer.defaultProps = {
  color: "blue",
};

export default ClipContainer;
