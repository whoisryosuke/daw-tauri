import React, { CSSProperties } from "react";
import { sva } from "../../../../styled-system/css";
import { usePlaybackTime } from "../../../hooks/usePlaybackTime";
import { useAtomValue } from "jotai/react";
import { compositionAtom } from "../../../store/composition";
import mapRange from "../../../utils/map";
import { VscTriangleDown } from "react-icons/vsc";
import { ColorToken } from "../../../../styled-system/tokens";

const lineColor: ColorToken = "gray.6";

const styles = sva({
  slots: ["container", "line", "marker"],
  base: {
    container: {
      position: "absolute",
      top: 0,
      left: 0,
      transform: "translateX(var(--x))",

      height: "100%",
    },
    line: {
      position: "absolute",
      bottom: 0,
      left: 0,
      width: "1px",
      height: "calc(100% - 10px)",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: lineColor,
    },
    marker: {
      position: "absolute",
      top: 0,
      left: -2,

      color: lineColor,
    },
  },
});

type Props = {
  containerWidth: number;
};

const PlaybackHead = ({ containerWidth }: Props) => {
  const { time } = usePlaybackTime();
  const { range } = useAtomValue(compositionAtom);
  const classes = styles();

  const x = mapRange(time, range[0], range[1], 0, containerWidth);
  return (
    <div
      className={classes.container}
      style={{ "--x": `${x}px` } as CSSProperties}
    >
      <div className={classes.line} />
      <div className={classes.marker}>
        <VscTriangleDown />
      </div>
    </div>
  );
};

export default PlaybackHead;
