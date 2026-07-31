export const SURFACE_VARIANTS = {
  variant: {
    default: {
      container: {
        bg: {
          base: "colorPalette.5",
          _hover: "colorPalette.6",
          _active: "colorPalette.4",
        },
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
};
