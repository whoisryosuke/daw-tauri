import { invoke } from "@tauri-apps/api/core";
import { useAtomValue } from "jotai";
import React, { useEffect, useState } from "react";
import {
  Clip,
  compositionAtom,
  TrackClipData,
} from "../../../../store/composition";
import Waveform from "../../../viz/Waveform";

type Props = {
  path: string;
  width: number;
  duration: Clip["duration"];
  range: TrackClipData["range"];
};

const SampleClipWaveform = ({
  path,
  width,
  duration,
  range: clipRange,
}: Props) => {
  const { range } = useAtomValue(compositionAtom);
  const [buffer, setBuffer] = useState<number[][]>([]);

  const fetchBuffer = async () => {
    console.log("clip path for waveform", path);
    const newBuffer = await invoke<number[][]>("get_sample_waveform", {
      path,
      size: 512,
    });

    setBuffer(newBuffer);
  };

  useEffect(() => {
    fetchBuffer();
  }, [width, range, clipRange]);

  const bufferRange = clipRange ? clipRange : [0, duration];

  return (
    <Waveform
      data={buffer}
      width={width}
      height={100}
      duration={duration}
      range={bufferRange}
    />
  );
};

export default SampleClipWaveform;
