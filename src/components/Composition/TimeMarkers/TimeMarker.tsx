import React, { CSSProperties, PropsWithChildren } from "react";
import { css } from "../../../../styled-system/css";
import Text from "../../ui/Typography/Text";
import { VscTriangleDown } from "react-icons/vsc";

const containerStyle = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  transform: "translateX(-50%)",
  color: "gray.9",
  gap: 0,
});
const textStyle = css({
  fontSize: 1,
  fontFamily: "mono",
  pointerEvents: "none",
  userSelect: "none",
});

type Props = {};

const TimeMarker = ({ children }: PropsWithChildren<Props>) => {
  return (
    <div className={containerStyle}>
      <Text className={textStyle}>{children}</Text>
      <VscTriangleDown size={8} />
    </div>
  );
};

export default TimeMarker;
