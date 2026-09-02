import React from "react";
import { css } from "../../../../styled-system/css";

/**
 * Get total number of blocks and block width for drawing musical grid.
 * @param duration Total time of composition
 * @param subdivision Number of times we subdivide a second (usually 4, 8, 16)
 * @param totalWidth Total width of container
 * @returns
 */
function generateMusicalGrid(
  duration: number,
  subdivision: number,
  totalWidth: number,
) {
  const totalBlocks = duration * subdivision;
  const blockWidth = totalWidth / totalBlocks;

  return {
    totalBlocks,
    blockWidth,
  };
}

const gridContainer = css({
  position: "absolute",
  top: 0,
  left: 0,
  height: "100%",
});

const lineStyle = css({
  stroke: "gray.5",
  strokeWidth: 0.5,

  "&[data-alt='true']": {
    stroke: "gray.6",
    strokeWidth: 1,
  },
});

type Props = {
  width: number;
  duration: number;
};

/**
 * Render a musical grid using SVG. Draws a line every second,
 * and lines breaking up each second into equal blocks (like 4 "blocks" per second).
 */
const MusicalGrid = ({ width, duration }: Props) => {
  // @TODO: Create a mapping between zoom + subdivisions (more zoom = more subdivisions)
  // or just change to preset levels (I think Ableton does this)
  const subdivisionLevel = 4;
  const { totalBlocks, blockWidth } = generateMusicalGrid(
    duration,
    subdivisionLevel,
    width,
  );

  const renderLines = new Array(totalBlocks).fill(0).map((_, i) => {
    const isBar = i % subdivisionLevel == 0 && i !== 0;
    return (
      <line
        key={i}
        x1={i * blockWidth}
        y1="0"
        x2={i * blockWidth}
        y2="100%"
        data-alt={isBar}
        className={lineStyle}
      />
    );
  });

  return (
    <svg className={gridContainer} style={{ width }}>
      {renderLines}
    </svg>
  );
};

export default MusicalGrid;
