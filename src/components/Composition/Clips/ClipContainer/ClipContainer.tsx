import React, { type PropsWithChildren } from "react";
import type { Clip } from "../../../../store/composition";
import { Stack } from "../../../../../styled-system/jsx";
import Text from "../../../ui/Typography/Text";
import { css, cx } from "../../../../../styled-system/css";
import { ColorPalette } from "../../../../../styled-system/tokens";

const containerStyle = css({
  backgroundColor: "colorPalette.2",
});

type Props = Clip & {
  x: number;
  width: number;
  color: ColorPalette;
};

const ClipContainer = ({
  name,
  color = "blue",
  children,
  width,
  x,
}: PropsWithChildren<Props>) => {
  const colorStyle = css({
    colorPalette: color,
  });
  return (
    <Stack
      direction="column"
      className={cx(containerStyle, colorStyle)}
      style={{
        width: width,
        left: x,
      }}
    >
      <Text size="1">{name}</Text>
      {children}
    </Stack>
  );
};

ClipContainer.defaultProps = {
  color: "blue",
};

export default ClipContainer;
