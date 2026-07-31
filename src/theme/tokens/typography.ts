import type { TextStyles, Tokens } from "@pandacss/types";

export const fontSizes: Tokens["fontSizes"] = {
  0: { value: "0.5rem" },
  1: { value: "0.75rem" },
  2: { value: "0.875rem" },
  3: { value: "1rem" },
  4: { value: "1.125rem" },
  5: { value: "1.25rem" },
  6: { value: "1.5rem" },
  7: { value: "1.875rem" },
  8: { value: "2.25rem" },
  9: { value: "3rem" },
  10: { value: "3.75rem" },
  11: { value: "4.5rem" },
  12: { value: "6rem" },
  13: { value: "8rem" },
};

export const fontWeights: Tokens["fontWeights"] = {
  thin: { value: "100" },
  extralight: { value: "200" },
  light: { value: "300" },
  normal: { value: "400" },
  medium: { value: "500" },
  semibold: { value: "600" },
  bold: { value: "700" },
  extrabold: { value: "800" },
  black: { value: "900" },
};

export const letterSpacings: Tokens["letterSpacings"] = {
  tighter: { value: "-0.05em" },
  tight: { value: "-0.025em" },
  normal: { value: "0em" },
  wide: { value: "0.025em" },
  wider: { value: "0.05em" },
  widest: { value: "0.1em" },
};

export const lineHeights: Tokens["lineHeights"] = {
  none: { value: "1" },
  tight: { value: "1.25" },
  snug: { value: "1.375" },
  normal: { value: "1.5" },
  relaxed: { value: "1.625" },
  loose: { value: "2" },
};

export const fonts: Tokens["fonts"] = {
  heading: {
    value: "'Instrument Sans Variable', sans-serif",
  },
  body: {
    value: "'Instrument Sans Variable', sans-serif",
  },
  mono: {
    value: "IBM Plex Mono, monospace",
  },
  sans: {
    value: [
      "ui-sans-serif",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      '"Noto Sans"',
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
      '"Noto Color Emoji"',
    ],
  },
  serif: {
    value: [
      "ui-serif",
      "Georgia",
      "Cambria",
      '"Times New Roman"',
      "Times",
      "serif",
    ],
  },
};

export const fontsSemantic = {
  body: {
    value: "{fonts.sans}",
  },
  heading: {
    value: "{fonts.sans}",
  },
  code: {
    value: "{fonts.mono}",
  },
};

export const textStyles: TextStyles = {
  xs: {
    value: {
      fontSize: "0.75rem",
      lineHeight: "calc(1 / 0.75)",
    },
  },
  sm: {
    value: {
      fontSize: "0.875rem",
      lineHeight: "calc(1.25 / 0.875)",
    },
  },
  md: {
    value: {
      fontSize: "1rem",
      lineHeight: "calc(1.5 / 1)",
    },
  },
  lg: {
    value: {
      fontSize: "1.125rem",
      lineHeight: "calc(1.75 / 1.125)",
    },
  },
  xl: {
    value: {
      fontSize: "1.25rem",
      lineHeight: "calc(1.75 / 1.25)",
    },
  },
  "2xl": {
    value: {
      fontSize: "1.5rem",
      lineHeight: "calc(2 / 1.5)",
    },
  },
  "3xl": {
    value: {
      fontSize: "1.875rem",
      lineHeight: "calc(2.25 / 1.875)",
    },
  },
  "4xl": {
    value: {
      fontSize: "2.25rem",
      lineHeight: "calc(2.5 / 2.25)",
    },
  },
  "5xl": {
    value: {
      fontSize: "3rem",
      lineHeight: "1",
    },
  },
  "6xl": {
    value: {
      fontSize: "3.75rem",
      lineHeight: "1",
    },
  },
  "7xl": {
    value: {
      fontSize: "4.5rem",
      lineHeight: "1",
    },
  },
  "8xl": {
    value: {
      fontSize: "6rem",
      lineHeight: "1",
    },
  },
  "9xl": {
    value: {
      fontSize: "8rem",
      lineHeight: "1",
    },
  },
};
