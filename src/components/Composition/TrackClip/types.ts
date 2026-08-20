import type { JSX } from "react";
import type { Clip, TrackClipData } from "../../../store/composition";

export type TrackClipComponentProps = Clip & {
  width: number;
  range: TrackClipData["range"];
};
export type TrackClipComponent = (
  props: TrackClipComponentProps,
) => JSX.Element;
