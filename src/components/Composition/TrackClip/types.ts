import type { JSX } from "react";
import type { Clip } from "../../../store/composition";

export type TrackClipComponentProps = Clip & {
  width: number;
};
export type TrackClipComponent = (
  props: TrackClipComponentProps
) => JSX.Element;
