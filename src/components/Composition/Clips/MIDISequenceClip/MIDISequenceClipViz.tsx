import React, { useCallback, useEffect, useRef } from "react";
import { MIDISequence } from "../../../../store/media";
import { semanticColors } from "../../../../theme/tokens/colors";
import { useAtomValue } from "jotai";
import { colorModeStore } from "../../../../store/theme";
import { ColorPalette } from "../../../../../styled-system/tokens";

type Props = MIDISequence & {
  sampleRate: number;
  colorPalette: ColorPalette;
  width: number;
  height: number;
};

const MIDISequenceClipViz = ({
  duration,
  notes,
  colorPalette,
  ...props
}: Props) => {
  const colorMode = useAtomValue(colorModeStore);
  const bgColor = colorMode === "dark" ? "rgba(17, 17, 17, 0.0)" : "#fcfcfcff";
  const lineColor = colorMode === "dark" ? "#0090ffff" : "#0090ffff";
  const fillColor =
    colorMode === "dark"
      ? semanticColors[colorPalette]["10"].value._dark
      : semanticColors[colorPalette]["10"].value.base;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(
    null,
  );

  const { highest, lowest } = notes.reduce(
    (acc, item) => {
      if (item.midi > acc.highest) acc.highest = item.midi;
      if (item.midi < acc.lowest) acc.lowest = item.midi;
      return acc;
    },
    { highest: -Infinity, lowest: Infinity },
  );
  const laneCount = highest - lowest;

  const draw = useCallback(
    (now: number) => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Clear drawing
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const height = canvasHeight / laneCount;
      ctx.fillStyle = fillColor;

      // Draw
      notes.map((note) => {
        const x = (note.time / duration) * canvasWidth;
        const y = Math.abs((note.midi - highest) / laneCount) * canvasHeight;
        const noteDuration = note.duration ?? duration - note.time;
        const width = (noteDuration / duration) * canvasWidth;
        ctx.fillRect(x, y, width, height);
      });
    },
    [notes, duration, bgColor, colorMode, colorPalette],
  );

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [draw, notes, duration, bgColor, colorMode, colorPalette]);

  return <canvas ref={canvasRef} {...props} />;
};

export default MIDISequenceClipViz;
