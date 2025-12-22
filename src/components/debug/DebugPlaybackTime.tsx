import { Box, Heading, Text } from "@radix-ui/themes";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";

type Props = {};

const DebugPlaybackTime = (props: Props) => {
  const [sampleRate, setSampleRate] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const listenerRef = useRef<UnlistenFn>(null);

  useEffect(() => {
    const getSampleRate = async () => {
      const newSampleRate = await invoke("get_sample_rate");
      console.log("sample rate", newSampleRate);
      setSampleRate(newSampleRate);
    };

    getSampleRate();
  }, []);

  useEffect(() => {
    const attachEvents = async () => {
      listenerRef.current = await listen("playback_time", (event) => {
        setPlaybackTime(event.payload as number);
      });
    };

    attachEvents();

    return () => {
      if (listenerRef.current) listenerRef.current();
    };
  });

  console.log(
    "playback time",
    playbackTime,
    sampleRate,
    playbackTime / sampleRate
  );
  return (
    <Box m="2">
      <Heading as="h3">Playback Time</Heading>
      <Text>
        {playbackTime > 0 ? (playbackTime / sampleRate).toFixed(2) : 0}
      </Text>
    </Box>
  );
};

export default DebugPlaybackTime;
