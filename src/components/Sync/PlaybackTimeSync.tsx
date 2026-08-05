import React, { useEffect, useRef } from "react";
import { playbackTimeAtom, sampleRateAtom } from "../../store/composition";
import { useAtom, useSetAtom } from "jotai";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

type Props = {};

const PlaybackTimeSync = (props: Props) => {
  const setSampleRate = useSetAtom(sampleRateAtom);
  const setPlaybackTime = useSetAtom(playbackTimeAtom);

  const listenerRef = useRef<UnlistenFn>(null);

  /**
   * Sync the sample rate.
   * @TODO: Happens on initial load - but should refresh if audio device changes.
   */
  useEffect(() => {
    const getSampleRate = async () => {
      const newSampleRate = (await invoke("get_sample_rate")) as number;
      console.log("sample rate", newSampleRate);
      setSampleRate(newSampleRate);
    };

    getSampleRate();
  }, []);

  /**
   * Sync the playback time.
   * This subscribes to the backend events on initial load.
   */
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
  return <></>;
};

export default PlaybackTimeSync;
