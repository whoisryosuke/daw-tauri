import React, { HTMLProps, useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { webGPUManagerStore } from "../../../../store/webgpu";
import OscilloscopeWaveform from "./OscilloscopeWaveform";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

const INITIAL_SAMPLES = 128;

type Props = HTMLProps<HTMLCanvasElement> & {};

function createFlatLine(samples: number): Float32Array {
  // Flat y=0 line spread across x 0..1 so the first frame is visible
  // (all-zeros would stack every point at (-1, 0)).
  const data = new Float32Array(samples * 2);
  for (let i = 0; i < samples; i++) {
    data[i * 2] = i / (samples - 1);
    data[i * 2 + 1] = 0;
  }
  return data;
}

const OscilloscopeWaveformViz = ({ width, height, ...props }: Props) => {
  const manager = useAtomValue(webGPUManagerStore);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viz = useRef<OscilloscopeWaveform | null>(null);
  const listenerRef = useRef<UnlistenFn | null>(null);
  const data = useRef<Float32Array>(createFlatLine(INITIAL_SAMPLES));

  // Get waveform data from Rust backend
  useEffect(() => {
    const attachEvents = async () => {
      listenerRef.current = await listen("waveform", (event) => {
        // We get waveform data as a stream of "amplitude" of wave
        const amplitude = event.payload as number[];
        if (amplitude.length === 0) return;
        // We convert that to X/Y points for the renderer
        const newData = new Float32Array(amplitude.length * 2);
        amplitude.forEach((y, i) => {
          newData[i * 2] = i / (amplitude.length - 1);
          newData[i * 2 + 1] = y;
        });
        data.current = newData;

        // Update vertex buffer with new data
        if (viz.current) {
          viz.current.update(data.current);
        }
      });
    };

    attachEvents();

    return () => {
      if (listenerRef.current) listenerRef.current();
    };
  }, []);

  useEffect(() => {
    if (!manager || !canvasRef.current) return;
    // Defer init until the wrapper (e.g. PlaybackWaveformR2) reports a
    // non-zero size — configuring a 0x0 canvas causes Dawn
    // ValidateTextureDescriptor / swapchain errors.
    if (canvasRef.current.width === 0 || canvasRef.current.height === 0) return;
    // Initialize viz
    if (!viz.current) {
      viz.current = new OscilloscopeWaveform(
        manager,
        canvasRef.current,
        data.current,
      );
    }

    // Render once
    viz.current.render();

    return () => {
      viz.current?.destroy();
      viz.current = null;
    };
  }, [manager]);

  // Re-configure + re-render when the wrapper resizes the canvas.
  // React updates canvas.width/height via props; the WebGPU context
  // must be re-configured to pick up the new backing size.
  useEffect(() => {
    if (!viz.current || !canvasRef.current) return;
    if (canvasRef.current.width === 0 || canvasRef.current.height === 0) return;
    viz.current.resize();
    viz.current.render();
  }, [width, height]);

  return <canvas ref={canvasRef} width={width} height={height} {...props} />;
};

export default OscilloscopeWaveformViz;
