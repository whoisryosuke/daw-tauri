import type { JSX } from "react";
import type { Clip, TrackClipData } from "../../../store/composition";
import { ColorPalette } from "../../../../styled-system/tokens";

export type TrackClipComponentProps = Clip & {
  width: number;
  range: TrackClipData["range"];
  colorPalette: ColorPalette;
};
export type TrackClipComponent = (
  props: TrackClipComponentProps,
) => JSX.Element;
