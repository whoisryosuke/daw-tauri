import type { Preset } from "@pandacss/types";
import { breakpoints } from "./tokens/breakpoints";
import { containerSizes } from "./tokens/containers";
import { keyframes } from "./tokens/keyframes";
import { tokens } from "./tokens/tokens";
import { fontsSemantic, textStyles } from "./tokens/typography";
import { semanticColors } from "./tokens/colors";
import textRecipe from "./recipes/text.recipe";
import buttonRecipe from "./recipes/button.recipe";

const definePreset = <T extends Preset>(config: T) => config;

export const designSystemPreset = definePreset({
  name: "daw-preset",
  theme: {
    keyframes,
    breakpoints,
    tokens,
    textStyles,
    containerSizes,
    recipes: {
      text: textRecipe,
      button: buttonRecipe,
    },
    semanticTokens: {
      colors: semanticColors,
      fonts: fontsSemantic,
    },
  },
});

export default designSystemPreset;
