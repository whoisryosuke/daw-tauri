import { Flex, IconButton } from "@radix-ui/themes";
import React from "react";
import { BsPlay, BsRecord, BsStop } from "react-icons/bs";

const PlayerControlButton = (props) => (
  <IconButton
    variant="ghost"
    color="gray"
    size="1"
    style={{ margin: 0 }}
    {...props}
  />
);

type Props = {};

const PlayerControlButtons = (props: Props) => {
  const sharedStyles = { width: "var(--space-6)", height: "var(--space-6)" };
  return (
    <Flex gap="1">
      <PlayerControlButton>
        <BsPlay style={sharedStyles} />
      </PlayerControlButton>
      <PlayerControlButton>
        <BsStop style={sharedStyles} />
      </PlayerControlButton>
      <PlayerControlButton>
        <BsRecord style={sharedStyles} />
      </PlayerControlButton>
    </Flex>
  );
};

export default PlayerControlButtons;
