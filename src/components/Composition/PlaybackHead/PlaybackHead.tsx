import React, { CSSProperties, useEffect, useRef } from "react";
import { sva } from "../../../../styled-system/css";
import { usePlaybackTime } from "../../../hooks/usePlaybackTime";
import { useAtomValue } from "jotai/react";
import { compositionAtom } from "../../../store/composition";
import mapRange from "../../../utils/map";
import { VscTriangleDown } from "react-icons/vsc";
import { ColorToken } from "../../../../styled-system/tokens";
import { motion, useMotionValue, useTransform } from "motion/react";

const lineColor: ColorToken = "gray.6";

const styles = sva({
  slots: ["container", "line", "marker"],
  base: {
    container: {
      position: "absolute",
      top: 0,
      left: 0,

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
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame>>(null);
  const { getTime } = usePlaybackTime();
  const { range } = useAtomValue(compositionAtom);
  const classes = styles();
  const x = useMotionValue(0);
  // TODO: Create global state of play/pause
  const isPlaying = true;

  // Map the time (in seconds) to a horizontal position on timeline
  const translateX = useTransform(x, [range[0], range[1]], [0, containerWidth]);

  const animate = () => {
    const time = getTime();

    x.set(time);

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  return (
    <motion.div className={classes.container} style={{ x: translateX }}>
      <div className={classes.line} />
      <div className={classes.marker}>
        <VscTriangleDown />
      </div>
    </motion.div>
  );
};

export default PlaybackHead;
