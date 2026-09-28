import React from "react";
import type { TrackClipComponentProps } from "../../TrackClip/types";
import { useAtomValue } from "jotai";
import { midiSequencesAtom } from "../../../../store/media";
import MIDISequenceClipViz from "./MIDISequenceClipViz";
import { sampleRateAtom } from "../../../../store/composition";

type Props = TrackClipComponentProps & {};

const MIDISequenceClip = ({
  id,
  name,
  clip_id,
  width,
  range,
  duration,
  colorPalette,
}: Props) => {
  const sampleRate = useAtomValue(sampleRateAtom);
  const midiSequences = useAtomValue(midiSequencesAtom);
  const midiSequence = midiSequences.find(
    (allSequence) => allSequence.id == clip_id,
  );
  console.log("midiSequence clip", midiSequence);

  return (
    <div>
      {midiSequence && (
        <MIDISequenceClipViz
          {...midiSequence}
          duration={duration}
          sampleRate={sampleRate}
          width={width}
          height={100}
          colorPalette={colorPalette}
        />
      )}
    </div>
  );
};

export default MIDISequenceClip;
