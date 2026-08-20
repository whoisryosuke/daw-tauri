import React, { MouseEventHandler, type JSX } from "react";
import {
  clipsAtom,
  compositionAtom,
  selectedTrackClipAtom,
  type TrackClipData,
} from "../../../store/composition";
import { useAtom, useAtomValue } from "jotai";
import type { TrackClipComponent } from "./types";
import MIDISequenceClip from "../Clips/MIDISequenceClip/MIDISequenceClip";
import SampleClip from "../Clips/SampleClip/SampleClip";
import ClipContainer from "../Clips/ClipContainer/ClipContainer";
import mapRange from "../../../utils/map";

const DefaultClip = () => <div>Error</div>;

type Props = TrackClipData & {
  width: number;
};

const TrackClip = ({
  id,
  clip_id: clipId,
  start_time: startTime,
  enabled,
  range: trackClipRange,
  width,
}: Props) => {
  const [selectedTrackClip, setSelectedTrackClip] = useAtom(
    selectedTrackClipAtom,
  );
  const { range } = useAtomValue(compositionAtom);
  const clips = useAtomValue(clipsAtom);
  const currentClip = clips.find((clip) => clip.id == clipId);
  const isTrackClipSelected = selectedTrackClip == id;

  const handleSelectTrackClip = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    console.log("clicked!");
    setSelectedTrackClip(id);
  };

  console.log("is track clip selected?", selectedTrackClip);

  if (currentClip) {
    let ClipComponent: TrackClipComponent = DefaultClip;
    switch (currentClip?.type) {
      case "Midi":
        ClipComponent = MIDISequenceClip;
        break;
      case "Sample":
        ClipComponent = SampleClip;
        break;
    }
    const x = mapRange(startTime, range[0], range[1], 0, width);
    const clipWidth = mapRange(
      trackClipRange
        ? trackClipRange[1] - trackClipRange[0]
        : currentClip.duration,
      range[0],
      range[1],
      0,
      width,
    );

    return (
      <ClipContainer
        trackId={id}
        {...currentClip}
        x={x}
        width={clipWidth}
        range={trackClipRange}
        onClick={handleSelectTrackClip}
        selected={isTrackClipSelected}
      >
        <ClipComponent
          {...currentClip}
          width={clipWidth}
          range={trackClipRange}
        />
      </ClipContainer>
    );
  }
  return <div>Clip error</div>;
};

export default TrackClip;
