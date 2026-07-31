import { defineRecipe } from "@pandacss/dev";

const textRecipe = defineRecipe({
  className: "text",
  base: {
    color: "inherit",
    fontWeight: "normal",
    lineHeight: 1.5,
    margin: 0,
    padding: 0,
  },
  variants: {
    fontFamily: {
      body: {
        fontFamily: "body",
      },
      mono: {
        fontFamily: "mono",
      },
    },
  },
});

export default textRecipe;
