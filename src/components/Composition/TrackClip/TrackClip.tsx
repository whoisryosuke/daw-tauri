import React, { type JSX } from "react";
import {
  clipsAtom,
  compositionAtom,
  type TrackClipData,
} from "../../../store/composition";
import { useAtomValue } from "jotai";
import type { TrackClipComponent } from "./types";
import MIDISequenceClip from "../Clips/MIDISequenceClip/MIDISequenceClip";
import SampleClip from "../Clips/SampleClip/SampleClip";
import ClipContainer from "../Clips/ClipContainer/ClipContainer";
import mapRange from "../../../utils/map";

const DefaultClip = () => <div>Error</div>;

type Props = TrackClipData & {
  width: number;
};

const TrackClip = ({ clipId, startTime, enabled, width }: Props) => {
  const { range } = useAtomValue(compositionAtom);
  const clips = useAtomValue(clipsAtom);
  const currentClip = clips.find((clip) => clip.id == clipId);

  if (currentClip) {
    let ClipComponent: TrackClipComponent = DefaultClip;
    switch (currentClip?.type) {
      case "midi":
        ClipComponent = MIDISequenceClip;
        break;
      case "sample":
        ClipComponent = SampleClip;
        break;
    }
    const x = mapRange(startTime, range[0], range[1], 0, width);
    const clipWidth = mapRange(
      currentClip.duration,
      range[0],
      range[1],
      0,
      width
    );
    console.log("clip width", clipWidth, currentClip.duration);

    return (
      <ClipContainer {...currentClip} x={x} width={clipWidth}>
        <ClipComponent {...currentClip} />
      </ClipContainer>
    );
  }
  return <div>Clip error</div>;
};

export default TrackClip;
