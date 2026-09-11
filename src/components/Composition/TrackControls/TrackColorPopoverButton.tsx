import React from "react";
import { css, cx } from "../../../../styled-system/css";
import { ColorPalette } from "../../../../styled-system/tokens";
import { TrackData } from "../../../store/composition";

const colorButtonStyle = css({
  borderRadius: 1,
  width: "20px",
  height: "20px",
  bgColor: {
    base: "colorPalette.6",
    _hover: "colorPalette.8",
    _active: "colorPalette.7",
  },
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: {
    base: "colorPalette.9",
    _hover: "colorPalette.11",
    _active: "colorPalette.10",
  },
  _motionSafe: {
    transitionProperty: "background-color, border-color",
    transitionTimingFunction: "ease-in-out",
    transitionDuration: "fast",
  },

  "&[data-selected='true']": {
    bgColor: "colorPalette.9",
    borderColor: "blue.10",
    borderWidth: "2px",
    boxShadow: "0px 0px 4px {colors.blue.10}",
  },
});

type Props = {
  colorPalette: ColorPalette;
  selected: boolean;
  handleChangeColor: (newColor: TrackData["color"]) => void;
};

const TrackColorPopoverButton = ({
  colorPalette,
  selected,
  handleChangeColor,
}: Props) => {
  const colorStyle = colorPalette && css({ colorPalette });

  const handleClick = () => {
    handleChangeColor(colorPalette);
  };

  return (
    <button
      className={cx(colorStyle, colorButtonStyle)}
      data-selected={selected}
      onClick={handleClick}
    />
  );
};

export default TrackColorPopoverButton;
