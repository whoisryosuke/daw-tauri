import React, { HTMLProps, useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { webGPUManagerStore } from "../../../../store/webgpu";
import OscilloscopeWaveform from "./OscilloscopeWaveform";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

type Props = HTMLProps<HTMLCanvasElement> & {};

const OscilloscopeWaveformViz = ({ ...props }: Props) => {
  const manager = useAtomValue(webGPUManagerStore);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viz = useRef<OscilloscopeWaveform | null>(null);
  const listenerRef = useRef<UnlistenFn>(null);
  const data = useRef<Float32Array>(new Float32Array(128 * 2));

  // Get waveform data from Rust backend
  useEffect(() => {
    const attachEvents = async () => {
      listenerRef.current = await listen("waveform", (event) => {
        // data.current = event.payload as number[];
        // We get waveform data as a stream of "amplitude" of wave
        const amplitude = event.payload as number[];
        // We convert that to X/Y points for the renderer
        const newData = new Float32Array(amplitude.length * 2);
        amplitude.forEach((y, i) => {
          newData[i * 2] = i / amplitude.length;
          newData[i * 2 + 1] = y;
        });
        data.current = newData;

        // Update vertex buffer with new data
        if (viz.current) {
          viz.current.update(data.current);
          viz.current.render();
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
      //@TODO: Cleanup renderer
    };
  }, [manager]);

  return <canvas ref={canvasRef} {...props} />;
};

export default OscilloscopeWaveformViz;
