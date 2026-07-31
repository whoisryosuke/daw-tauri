import React, { HTMLProps, PropsWithChildren, ReactElement } from "react";
import { css, cx, RecipeVariantProps, sva } from "../../../styled-system/css";
import { ColorPalette } from "../../../styled-system/tokens";
import { button, ButtonVariant } from "../../../styled-system/recipes";

export type ButtonProps = ButtonVariant &
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
  const classes = button({ variant, size });
  const colorStyle = colorPalette && css({ colorPalette });
  return (
    <button className={cx(classes.container, colorStyle, className)} {...props}>
      {icon && <span className={classes.icon}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
