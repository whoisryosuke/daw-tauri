import React from "react";
import { useAtomValue } from "jotai";
import type { TrackClipComponentProps } from "../../TrackClip/types";
import { samplesAtom } from "../../../../store/media";
import SampleClipWaveform from "./SampleClipWaveform";
import { ColorPalette } from "../../../../../styled-system/tokens";

type Props = TrackClipComponentProps & {
  colorPalette: ColorPalette;
};

const SampleClip = ({
  id,
  name,
  clip_id: data,
  width,
  range,
  duration,
  colorPalette,
}: Props) => {
  const samples = useAtomValue(samplesAtom);
  const sample = samples.find((sampleItem) => sampleItem.path == data);

  if (sample) {
    return (
      <div>
        <SampleClipWaveform
          path={sample.path}
          width={width}
          range={range}
          duration={duration}
          colorPalette={colorPalette}
        />
      </div>
    );
  }

  return <div>Error</div>;
};

export default SampleClip;
