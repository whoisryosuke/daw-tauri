import {
  type ComponentProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import mapRange from "../../utils/map";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { css } from "../../../styled-system/css";
import Panel from "../ui/Panel/Panel";
import OscilloscopeWaveformViz from "../../modules/webgpu/renderer/OscilloscopeWaveform/OscilloscopeWaveformViz";

const canvasWrapper = css({
  minWidth: 300,
});

type Props = {
  // waveform: number[];
  animated?: boolean;
  fps?: number;
};

/**
 * Renders waveform of timeline audio playback from Rust backend.
 * Does not render immediate audio playback.
 * Great for debugging or visualizing output signal to user.
 * @TODO: Add multi-channel support - signal is currently interleaved
 */
const PlaybackWaveformR2 = ({ animated = true, fps, ...props }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle resizing of container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;

        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <Panel ref={containerRef} className={canvasWrapper}>
      <OscilloscopeWaveformViz
        width={dimensions.width}
        height={dimensions.height}
      />
    </Panel>
  );
};

export default PlaybackWaveformR2;
