import React from "react";
import { css, cx, sva } from "../../../../styled-system/css";
import { Popover } from "@base-ui/react";
import depth from "../../../theme/tokens/depth";
import COLOR_PALETTE_OPTIONS from "../../../theme/tokens/colorPalette";
import TrackColorPopoverButton from "./TrackColorPopoverButton";
import { Stack } from "../../../../styled-system/jsx";
import panelStyle from "../../../theme/styles/panel.style";
import { TrackData } from "../../../store/composition";
import Panel from "../../ui/Panel/Panel";

export const popoverStyles = sva({
  slots: ["trigger", "popup", "content", "arrow", "title", "description"],
  base: {
    popup: {
      position: "relative",
      display: "flex",
      height: "var(--popup-height, auto)",
      width: "var(--popup-width, auto)",
      maxWidth: "250px",
      flexDirection: "column",
      gap: "1",
      transformOrigin: "var(--transform-origin)",
      outline: "none",
      _motionSafe: {
        transitionProperty: "scale, opacity",
        transitionDuration: "100ms",
        transitionTimingFunction: "ease-out",
      },
      "&[data-starting-style]": {
        transform: "scale(0.98)",
        opacity: 0,
      },
      "&[data-ending-style]": {
        transform: "scale(0.98)",
        opacity: 0,
      },
    },
    content: {
      color: "gray.11",
      p: 3,
      boxShadow: "0.15rem 0.15rem 0.5rem rgba(0,0,0,0.3)",
    },
    arrow: {
      position: "relative",
      display: "block",
      width: "3",
      height: "1.5",
      overflow: "clip",
      "&[data-side='top']": {
        bottom: "-6px",
        transform: "rotate(180deg)",
      },
      "&[data-side='bottom']": {
        top: "-6px",
      },
      "&[data-side='left']": {
        right: "-9px",
        transform: "rotate(90deg)",
      },
      "&[data-side='right']": {
        left: "-9px",
        transform: "rotate(-90deg)",
      },
      _before: {
        content: "''",
        position: "absolute",
        bottom: 0,
        left: "50%",
        width: "calc(6px * sqrt(2))",
        height: "calc(6px * sqrt(2))",
        bg: "gray.10",
        transform: "translate(-50%, 50%) rotate(45deg)",
      },
    },
    title: {
      fontSize: "2",
    },
    description: {
      fontSize: "1",
      color: "gray.8",
    },
  },
});

type Props = {
  color: TrackData["color"];
  handleChangeColor: (newColor: TrackData["color"]) => void;
};

const TrackColorPopover = ({ color, handleChangeColor }: Props) => {
  const classes = popoverStyles();

  const colorButtons = COLOR_PALETTE_OPTIONS.map((colorPalette) => (
    <TrackColorPopoverButton
      colorPalette={colorPalette}
      selected={color == colorPalette}
      handleChangeColor={handleChangeColor}
    />
  ));

  return (
    <Popover.Portal>
      <Popover.Positioner sideOffset={8} style={{ zIndex: depth.popup.value }}>
        <Popover.Popup className={cx(classes.popup)}>
          <Popover.Arrow className={classes.arrow} />
          <Panel className={classes.content}>
            <Popover.Title className={classes.title}>
              Select a color
            </Popover.Title>
            <Popover.Description className={classes.description}>
              <Stack flexDir="row" flexWrap="wrap">
                {colorButtons}
              </Stack>
            </Popover.Description>
          </Panel>
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  );
};

export default TrackColorPopover;
