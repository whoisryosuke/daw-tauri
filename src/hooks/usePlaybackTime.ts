import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

export function usePlaybackTime() {
  const [sampleRate, setSampleRate] = useState(0);
  const [timeInFrames, setTimeInFrames] = useState(0);
  const listenerRef = useRef<UnlistenFn>(null);

  useEffect(() => {
    const getSampleRate = async () => {
      const newSampleRate = (await invoke("get_sample_rate")) as number;
      console.log("sample rate", newSampleRate);
      setSampleRate(newSampleRate);
    };

    getSampleRate();
  }, []);

  useEffect(() => {
    const attachEvents = async () => {
      listenerRef.current = await listen("playback_time", (event) => {
        setTimeInFrames(event.payload as number);
      });
    };

    attachEvents();

    return () => {
      if (listenerRef.current) listenerRef.current();
    };
  });

  const time = timeInFrames / sampleRate;

  return { sampleRate, timeInFrames, time };
}
