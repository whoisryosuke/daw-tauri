import Heading from "@/components/primitives/Heading";
import Stack from "@/components/primitives/Stack";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ControlButton from "../../../shared/ControlButton/ControlButton";

type Props = {};

const TapButton = (props: Props) => {
  const [BPM, setBPM] = useState(0);
  const lastTapTime = useRef(0);
  const THRESHOLD_MS = 16; // one frame

  const [taps, setTaps] = useState<number[]>([]);

  const tap = () => {
    const now = Date.now();

    // Because keyboards update input 1 key at a time
    // we wait a tiny amount of time to avoid "duplicate" taps.
    // Without this BPM would 2x for 2 keyboard keys pressed, 3x for 3, etc.
    if (now - lastTapTime.current > THRESHOLD_MS) {
      lastTapTime.current = now;
      setTaps((prev) => {
        // If we have more than 5, remove last item (aka first in array)
        const filteredPrev = prev.length > 5 ? prev.slice(1) : prev;
        // @TODO: Maybe remove really old ones?
        return [...filteredPrev, Date.now()];
      });
    }
  };

  const calculateBPM = useCallback(() => {
    // Average time between last 4 taps
    if (taps.length < 2) return 0;
    let intervals = [];
    for (let i = taps.length - 1; i > Math.max(0, taps.length - 5); i--) {
      intervals.push((taps[i] - taps[i - 1]) / 1000);
    }
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const bpm = 60 / avgInterval;
    return bpm;
  }, [taps]);

  useEffect(() => {
    const newBPM = calculateBPM();
    setBPM(newBPM);
  }, [taps, calculateBPM]);

  const handleClick = () => {
    tap();
  };

  return (
    <>
      <ControlButton
        style={{
          fontVariantNumeric: "tabular-nums",
        }}
        onClick={handleClick}
      >
        Tap
      </ControlButton>
      <ControlButton>
        {BPM.toFixed(2)}
        {/* <span
          style={{
            fontVariantNumeric: "tabular-nums",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          000.00
        </span> */}
      </ControlButton>
    </>
  );
};

export default TapButton;
