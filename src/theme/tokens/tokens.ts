import type { Tokens } from "@pandacss/types";
import { aspectRatios } from "./aspect-ratios";
import { borders } from "./borders";
import { colors } from "./colors";
import { animations } from "./keyframes";
import { shadows } from "./shadows";
import { sizes } from "./sizes";
import { spacing } from "./spacing";
import {
  fonts,
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
} from "./typography";
import depth from "./depth";

const defineTokens = <T extends Tokens>(v: T) => v;

export const tokens = defineTokens({
  aspectRatios,
  borders,
  easings: {
    default: { value: "cubic-bezier(0.4, 0, 0.2, 1)" },
    linear: { value: "linear" },
    in: { value: "cubic-bezier(0.4, 0, 1, 1)" },
    out: { value: "cubic-bezier(0, 0, 0.2, 1)" },
    "in-out": { value: "cubic-bezier(0.4, 0, 0.2, 1)" },
  },
  durations: {
    fastest: { value: "50ms" },
    faster: { value: "100ms" },
    fast: { value: "150ms" },
    normal: { value: "200ms" },
    slow: { value: "300ms" },
    slower: { value: "400ms" },
    slowest: { value: "500ms" },
  },
  radii: {
    0: { value: "0" },
    1: { value: "0.125rem" },
    2: { value: "0.25rem" },
    3: { value: "0.375rem" },
    4: { value: "0.5rem" },
    5: { value: "0.75rem" },
    6: { value: "1rem" },
    7: { value: "1.5rem" },
    8: { value: "2rem" },
    full: { value: "9999px" },
  },
  fontWeights,
  lineHeights,
  fonts,
  letterSpacings,
  fontSizes,
  shadows,
  colors,
  blurs: {
    0: { value: "4px" },
    1: { value: "8px" },
    2: { value: "12px" },
    3: { value: "16px" },
    4: { value: "24px" },
    5: { value: "40px" },
    6: { value: "64px" },
  },
  spacing,
  sizes,
  animations,
  zIndex: depth,
});
