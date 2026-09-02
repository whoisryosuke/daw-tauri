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

type DrawSideProps = {
  ctx: CanvasRenderingContext2D;
  canvasHeight: number;
  channelCount: number;
  channelIndex: number;
  canvasWidth: number;
  startIndex: number;
  endIndex: number;
  channelData: number[];
};

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
  const fillColor = colorMode === "dark" ? "#0090ffff" : "#0090ffff";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(
    null,
  );
  const prevTime = useRef(0);

  /**
   * Draw a single channel's waveform data as a mirrored shape (similar to Ableton).
   * Also calculates max peaks for amplitude - better for timeline zooming.
   */
  const drawChannel = ({
    ctx,
    canvasHeight,
    channelCount,
    channelIndex,
    canvasWidth,
    startIndex,
    endIndex,
    channelData,
  }: DrawSideProps) => {
    const height = canvasHeight / channelCount;
    const offset = height * channelIndex;
    const centerY = offset + height / 2;
    const ampScale = height / 2; // max deviation from center in px

    const samplesPerPixel = Math.max(1, (endIndex - startIndex) / canvasWidth);

    // Since we need to loop over the same data twice,
    // precompute the peak magnitude for each pixel column once.
    // Also calculates the amplitude as a "peak" using samples across a small range
    // to check for the "max" value across them all.
    // This ensures if we zoom out, we won't miss important peaks.
    const peaks: number[] = new Array(canvasWidth);
    for (let x = 0; x < canvasWidth; x++) {
      // The "range" - we get all samples between current canvas X pixel and next pixel
      const from = Math.floor(startIndex + x * samplesPerPixel);
      const to = Math.floor(startIndex + (x + 1) * samplesPerPixel);

      // Go through the range and find the peak
      let peak = 0;
      for (let i = from; i < to && i < channelData.length; i++) {
        const v = Math.abs(channelData[i] ?? 0);
        if (v > peak) peak = v;
      }

      // Fall back to a single sample if the range was empty
      if (to <= from) {
        peak = Math.abs(
          channelData[Math.min(from, channelData.length - 1)] ?? 0,
        );
      }
      peaks[x] = peak;
    }

    // Top side (left -> right)
    for (let x = 0; x < canvasWidth; x++) {
      const y = centerY - peaks[x] * ampScale;
      console.log("y", y);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    // Bottom side (right -> left) mirrors the top, closes the shape
    for (let x = canvasWidth - 1; x >= 0; x--) {
      const y = centerY + peaks[x] * ampScale;
      ctx.lineTo(x, y);
    }
  };

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
      // Draw each channel
      data.forEach((channelData, channelIndex) => {
        ctx.beginPath();
        ctx.fillStyle = fillColor;
        // ctx.lineWidth = 1.5;
        // ctx.strokeStyle = lineColor;
        drawChannel({
          ctx,
          canvasHeight,
          channelCount,
          channelIndex,
          canvasWidth,
          startIndex,
          endIndex,
          channelData,
        });

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
