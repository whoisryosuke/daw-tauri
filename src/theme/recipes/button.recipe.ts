import { defineSlotRecipe } from "@pandacss/dev";

const button = defineSlotRecipe({
  className: "button",
  slots: ["container", "icon"],
  base: {
    container: {
      display: "flex",
      colorPalette: "gray",
      whiteSpace: "nowrap",
      alignItems: "center",

      color: {
        base: "colorPalette.11",
        _hover: "colorPalette.12",
        _active: "colorPalette.12",
      },
    },
    icon: {},
  },
  variants: {
    variant: {
      default: {
        container: {
          bgLinear: "to-b",
          gradientFrom: {
            base: "colorPalette.5",
            _hover: "colorPalette.7",
            _active: "colorPalette.3",
          },
          gradientTo: {
            base: "colorPalette.4",
            _hover: "colorPalette.5",
            _active: "colorPalette.5",
          },

          borderWidth: "1.5px",
          borderStyle: "solid",
          borderColor: {
            base: "colorPalette.6",
            _hover: "colorPalette.8",
            _active: "colorPalette.8",
          },

          // bg: {
          //   base: "colorPalette.5",
          //   _hover: "colorPalette.6",
          //   _active: "colorPalette.4",
          // },
        },
      },
      outline: {
        container: {
          borderWidth: "1.5px",
          borderStyle: "solid",
          borderColor: {
            base: "colorPalette.5",
            _hover: "colorPalette.6",
            _active: "colorPalette.4",
          },
        },
      },
      ghost: {},
    },
    size: {
      small: {
        container: {
          px: 2,
          py: 1,
          borderRadius: 2,

          fontSize: 2,
        },
      },
      medium: {
        container: {
          px: 3,
          py: 2,
          borderRadius: 3,

          fontSize: 3,
        },
      },
      large: {
        container: {
          px: 4,
          py: 3,
          borderRadius: 4,

          fontSize: 4,
        },
      },
      xl: {
        container: {
          px: 5,
          py: 4,
          borderRadius: 5,

          fontSize: 5,
        },
      },
    },
  },
});

export default button;
