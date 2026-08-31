import {
  type ComponentProps,
  ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useRef,
} from "react";
import mapRange from "../../utils/map";
import { useAtomValue } from "jotai";
import { colorModeStore } from "../../store/theme";
import { Clip } from "../../store/composition";

type Props = ComponentPropsWithoutRef<"canvas"> & {
  data: number[][];
  animated?: boolean;
  fps?: number;
  duration: Clip["duration"];
  range: number[];
};

/**
 * Multi-channel waveform. Renders each channel stacked as a line graph.
 * Used for sample/audio clip previews.
 */
const Waveform = ({
  data,
  animated,
  fps,
  duration,
  range,
  ...props
}: Props) => {
  const colorMode = useAtomValue(colorModeStore);

  const bgColor = colorMode === "dark" ? "rgba(17, 17, 17, 0.0)" : "#fcfcfcff";
  const lineColor = colorMode === "dark" ? "#0090ffff" : "#0090ffff";
  const fillColor = colorMode === "dark" ? "#0090ff88" : "#0090ff66";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(
    null,
  );
  const prevTime = useRef(0);

  const draw = useCallback(
    (now: number) => {
      // Draw to a specific FPS if needed
      if (fps && animated) {
        const fpsInterval = 1000 / fps;
        const elapsed = now - prevTime.current;
        // If we haven't elapsed enough time, keep looping
        if (elapsed < fpsInterval) {
          return (animationRef.current = requestAnimationFrame(draw));
        } else {
          prevTime.current = now - (elapsed % fpsInterval);
        }
      }

      if (!canvasRef.current) return;
      const canvas = canvasRef.current;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Clip waveform to range
      const [start, end] = range;
      const sampleCount = data[0]?.length ?? 0;
      const startIndex = (start / duration) * sampleCount;
      const endIndex = (end / duration) * sampleCount;

      // Clear drawing
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const channelCount = data.length;
      data.forEach((channelData, channelIndex) => {
        ctx.beginPath();
        ctx.fillStyle = fillColor;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = lineColor;

        const height = canvasHeight / channelCount;
        const offset = height * channelIndex;

        for (let i = 0; i < canvasWidth; i++) {
          const index = Math.floor(
            mapRange(i, 0, canvasWidth, startIndex, endIndex),
          );

          const x = i;
          // We scale the audio values to 0-1 to make it easier
          const amplitude = mapRange(channelData[index], -1, 1, 0, 1);

          const y = amplitude * height + offset;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
        const centerY = height + offset;
        ctx.lineTo(canvasWidth, centerY);
        ctx.lineTo(0, centerY);

        ctx.closePath();
        ctx.fill();
      });

      if (animated) animationRef.current = requestAnimationFrame(draw);
    },
    [data, lineColor, bgColor, animated, fps, colorMode],
  );

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [draw, lineColor, bgColor, fps]);

  return <canvas ref={canvasRef} {...props} />;
};

export default Waveform;
