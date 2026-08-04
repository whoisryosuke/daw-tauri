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

// Assuming numbers are 0-1
type GraphData = number[];
const DEFAULT_AUDIO_HEIGHT = 128;

type Props = ComponentPropsWithoutRef<"canvas"> & {
  data: number[];
  animated?: boolean;
  fps?: number;
};

const Waveform = ({ data, animated, fps, ...props }: Props) => {
  const colorMode = useAtomValue(colorModeStore);

  const bgColor = colorMode === "dark" ? "#111111ff" : "#fcfcfcff";
  const lineColor = colorMode === "dark" ? "#0090ffff" : "#0090ffff";
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

      // Get audio data
      // if (!data.current) return;

      // Clear drawing
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = lineColor;
      for (let i = 0; i < canvasWidth; i++) {
        const index = Math.floor(mapRange(i, 0, canvasWidth, 0, data.length));
        const x = i;
        // We scale the audio values to 0-1 to make it easier
        const amplitude = mapRange(data[index], -1, 1, 0, 1) * 10 - 4.5;
        const y = (amplitude * canvasHeight) / 2 + canvasHeight / 4;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

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
