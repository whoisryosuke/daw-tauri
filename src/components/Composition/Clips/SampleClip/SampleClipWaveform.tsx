import { invoke } from "@tauri-apps/api/core";
import { useAtomValue } from "jotai";
import React, { useEffect, useState } from "react";
import { compositionAtom } from "../../../../store/composition";
import LineGraph from "../../../LineGraph";
import Waveform from "../../../viz/Waveform";

type Props = {
  path: string;
  width: number;
};

const SampleClipWaveform = ({ path, width }: Props) => {
  const { range } = useAtomValue(compositionAtom);
  const [buffer, setBuffer] = useState<number[]>([]);

  const fetchBuffer = async () => {
    console.log("clip path for waveform", path);
    const newBuffer = await invoke<number[]>("get_sample_waveform", {
      path,
      size: 1000,
    });

    setBuffer(newBuffer);
  };

  useEffect(() => {
    fetchBuffer();
  }, [width, range]);

  return <Waveform data={buffer} width={width} height={100} />;
};

export default SampleClipWaveform;
