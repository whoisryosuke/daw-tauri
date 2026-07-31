import { defineConfig } from "@pandacss/dev";
import preset from "./src/theme/preset";

export default defineConfig({
  presets: [preset],

  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {},
  },

  // Generates JSX utilities with options of React, Preact, Qwik, Solid, Vue
  jsxFramework: "react",

  // The output directory for your css system
  outdir: "styled-system",

  // Ensure we get all colors dynamically
  staticCss: {
    css: [
      {
        properties: {
          colorPalette: [
            "tomato",
            "red",
            "crimson",
            "pink",
            "plum",
            "purple",
            "violet",
            "indigo",
            "blue",
            "cyan",
            "teal",
            "green",
            "grass",
            "orange",
            "brown",
            "sky",
            "mint",
            "lime",
            "yellow",
            "amber",
            "gray",
            "mauve",
            "slate",
            "sage",
            "olive",
            "sand",
            "bronze",
            "gold",
            "ruby",
            "iris",
            "jade",
          ],
        },
      },
    ],
  },
});
