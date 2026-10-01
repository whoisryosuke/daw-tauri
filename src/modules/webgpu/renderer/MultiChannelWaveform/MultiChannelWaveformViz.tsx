import {
  type ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useAtomValue } from "jotai";
import { webGPUManagerStore } from "../../../../store/webgpu";
import { colorModeStore } from "../../../../store/theme";
import { semanticColors } from "../../../../theme/tokens/colors";
import type { ColorPalette } from "../../../../../styled-system/tokens";
import MultiChannelWaveform, { type RgbaFloat } from "./MultiChannelWaveform";

type Props = ComponentPropsWithoutRef<"canvas"> & {
  /** One array of samples (-1..1) per channel. Mono = 1 entry, stereo = 2. */
  data: number[][];
  duration: number;
  /** Visible window in seconds, same contract as the 2D Waveform. */
  range: [number, number] | number[];
  colorPalette?: ColorPalette;
  mirror?: boolean;
};

function parseHexRgba(hex: string): RgbaFloat {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3 || h.length === 4) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  const clamp = (v: number) =>
    Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
  return [clamp(r), clamp(g), clamp(b), clamp(a)];
}

/**
 * WebGPU multi-channel clip waveform. Drop-in replacement for the 2D
 * `<Waveform>` (same data/duration/range/colorPalette props).
 */
const MultiChannelWaveformViz = ({
  data,
  duration,
  range,
  colorPalette = "blue",
  mirror = true,
  width,
  height,
  ...canvasProps
}: Props) => {
  const manager = useAtomValue(webGPUManagerStore);
  const colorMode = useAtomValue(colorModeStore);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viz = useRef<MultiChannelWaveform | null>(null);

  const fillCss =
    (
      semanticColors[colorPalette as keyof typeof semanticColors]?.["10"]
        ?.value as Record<string, string> | undefined
    )?.[colorMode === "dark" ? "_dark" : "base"] ?? "#0090ffff";
  const fillColor = useMemo(() => parseHexRgba(fillCss), [fillCss]);

  // Latest props for lazy init (canvas may be 0x0 on first mount).
  // const propsRef = useRef({ data, duration, range, fillColor, mirror });
  // propsRef.current = { data, duration, range, fillColor, mirror };

  // Create on first use once manager + non-zero canvas are available.
  // Returns false while init must be deferred (0x0 canvas configures fail).
  const ensureViz = (): boolean => {
    if (viz.current) return true;
    if (!manager || !canvasRef.current) return false;
    if (canvasRef.current.width === 0 || canvasRef.current.height === 0) {
      return false;
    }
    // const p = propsRef.current;
    viz.current = new MultiChannelWaveform(manager, canvasRef.current, {
      mirror: mirror,
      fillColor: fillColor,
    });
    viz.current.setData(data);
    viz.current.setRange(range, duration);
    viz.current.render();
    return true;
  };

  // Init on manager; destroy on unmount / manager change.
  useEffect(() => {
    ensureViz();

    return () => {
      viz.current?.destroy();
      viz.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager]);

  // Props-driven updates: data comes from React, static full-file + range crop.
  useEffect(() => {
    if (!ensureViz() || !viz.current) return;
    viz.current.setFillColor(fillColor);
    viz.current.setMirror(mirror);
    viz.current.setData(data);
    viz.current.setRange(range, duration);
    viz.current.render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, range, duration, fillColor, mirror]);

  // Re-configure + re-render when the wrapper resizes the canvas.
  // React updates canvas.width/height via props; the WebGPU context
  // must be re-configured to pick up the new backing size.
  useEffect(() => {
    if (!ensureViz() || !viz.current) return;
    viz.current.resize();
    viz.current.render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  return (
    <canvas ref={canvasRef} width={width} height={height} {...canvasProps} />
  );
};

export default MultiChannelWaveformViz;
