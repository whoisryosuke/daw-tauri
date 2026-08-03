import React from "react";
import { useAtomValue } from "jotai";
import type { TrackClipComponentProps } from "../../TrackClip/types";
import { samplesAtom } from "../../../../store/media";
import SampleClipWaveform from "./SampleClipWaveform";

type Props = TrackClipComponentProps & {};

const SampleClip = ({ id, name, clip_id: data, width }: Props) => {
  const samples = useAtomValue(samplesAtom);
  const sample = samples.find((sampleItem) => sampleItem.path == data);

  if (sample) {
    return (
      <div>
        <SampleClipWaveform path={sample.path} width={width} />
      </div>
    );
  }

  return <div>Error</div>;
};

export default SampleClip;
