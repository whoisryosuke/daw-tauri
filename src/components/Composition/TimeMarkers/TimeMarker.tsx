import React, { CSSProperties, PropsWithChildren } from "react";
import { css } from "../../../../styled-system/css";
import Text from "../../ui/Typography/Text";

const containerStyle = css({
  fontSize: 1,
  color: "gray.10",
  fontFamily: "mono",
});

type Props = {};

const TimeMarker = ({ children }: PropsWithChildren<Props>) => {
  return <Text className={containerStyle}>{children}</Text>;
};

export default TimeMarker;
