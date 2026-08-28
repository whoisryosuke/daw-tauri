import React, { CSSProperties, PropsWithChildren } from "react";
import { css } from "../../../../styled-system/css";
import Text from "../../ui/Typography/Text";
import { VscTriangleDown } from "react-icons/vsc";

const containerStyle = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  transform: "translateX(-50%) translateY(-2px)",
  color: "gray.10",
  gap: 1,
});
const textStyle = css({
  fontSize: 1,
  // fontFamily: "mono",
  pointerEvents: "none",
  userSelect: "none",
  lineHeight: 1,
});

type Props = {};

const TimeMarker = ({ children }: PropsWithChildren<Props>) => {
  return (
    <div className={containerStyle}>
      <Text className={textStyle}>{children}</Text>
      <Text className={textStyle}>|</Text>
    </div>
  );
};

export default TimeMarker;
