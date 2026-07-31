import React, { HTMLProps, PropsWithChildren, ReactElement } from "react";
import { css, cx, RecipeVariantProps, sva } from "../../../styled-system/css";
import { ColorPalette } from "../../../styled-system/tokens";
import { SURFACE_VARIANTS } from "../../theme/variants/surface";

const styles = sva({
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
        _active: "colorPalette.9",
      },
    },
    icon: {},
  },
  variants: {
    ...SURFACE_VARIANTS,
  },
});

export type ButtonVariants = RecipeVariantProps<typeof styles>;

export type ButtonProps = ButtonVariants &
  React.ComponentPropsWithoutRef<"button"> & {
    icon?: ReactElement;
    colorPalette?: ColorPalette;
  };

const Button = ({
  icon,
  children,
  variant = "default",
  size = "medium",
  className,
  colorPalette,
  ...props
}: PropsWithChildren<ButtonProps>) => {
  const classes = styles({ variant, size });
  const colorStyle = colorPalette && css({ colorPalette });
  return (
    <button className={cx(classes.container, colorStyle, className)} {...props}>
      {icon && <span className={classes.icon}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
