import React from "react";
import type { TrackClipComponentProps } from "../../TrackClip/types";
import { useAtomValue } from "jotai";
import { midiSequencesAtom } from "../../../../store/media";

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
  const midiSequences = useAtomValue(midiSequencesAtom);
  const midiSequence = midiSequences.find(
    (allSequence) => allSequence.id == clip_id,
  );
  console.log("midiSequence clip new", midiSequences, clip_id, midiSequence);

  return <div>MIDISequenceClip</div>;
};

export default MIDISequenceClip;
