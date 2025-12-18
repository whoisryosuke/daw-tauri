import React from "react";
import { useAtomValue } from "jotai";
import type { TrackClipComponentProps } from "../../TrackClip/types";
import { samplesAtom } from "../../../../store/media";

type Props = TrackClipComponentProps & {};

const SampleClip = ({ id, name, data }: Props) => {
  const samples = useAtomValue(samplesAtom);
  const sample = samples.find((sampleItem) => sampleItem.id == data);

  if (sample) {
    return <div>{sample.name}</div>;
  }

  return <div>Error</div>;
};

export default SampleClip;
