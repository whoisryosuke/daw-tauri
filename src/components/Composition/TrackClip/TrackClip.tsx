import React, { type JSX } from "react";
import { clipsAtom, type TrackClipData } from "../../../store/composition";
import { useAtomValue } from "jotai";
import type { TrackClipComponent } from "./types";
import MIDISequenceClip from "../Clips/MIDISequenceClip/MIDISequenceClip";
import SampleClip from "../Clips/SampleClip/SampleClip";
import ClipContainer from "../Clips/ClipContainer/ClipContainer";

const DefaultClip = () => <div>Error</div>;

type Props = TrackClipData & {};

const TrackClip = ({ clipId, startTime, enabled }: Props) => {
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

    return (
      <ClipContainer {...currentClip}>
        <ClipComponent {...currentClip} />
      </ClipContainer>
    );
  }
  return <div>Clip error</div>;
};

export default TrackClip;
