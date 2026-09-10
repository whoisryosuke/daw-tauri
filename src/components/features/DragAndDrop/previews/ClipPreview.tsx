import React from "react";
import { css } from "../../../../../styled-system/css";
import Icon from "../../../primitives/Icon/Icon";
import { DragTypes } from "../../../../constants/drag";

const iconContainerStyle = css({
  padding: 2,
  borderWidth: "1px",
  borderStyle: "solid",

  bgLinear: "to-b",
  gradientFrom: {
    base: "blue.3",
    _hover: "blue.3",
  },
  gradientTo: {
    base: "blue.4",
    _hover: "blue.5",
  },
  color: "blue.12",

  borderColor: "blue.4",
});
const containerStyle = css({
  width: "100%",
  textAlign: "center",
  display: "flex",
  justifyContent: "center",

  padding: 2,
  borderWidth: "1px",
  borderStyle: "solid",

  bgLinear: "to-b",
  gradientFrom: {
    base: "blue.3",
    _hover: "blue.3",
  },
  gradientTo: {
    base: "blue.4",
    _hover: "blue.5",
  },
  color: "blue.12",

  borderColor: "blue.4",
  borderRadius: 4,
});
const iconStyle = css({
  margin: "auto",
});

type Props = {
  dragType: DragTypes;
};

const ClipPreview = ({ dragType }: Props) => {
  const iconName = dragType == "CLIP" ? "samples" : "effects";
  return (
    <div className={containerStyle}>
      <Icon icon={iconName} className={iconStyle} />
    </div>
  );
};

export default ClipPreview;
