import React, { HTMLProps } from "react";
import type { SelectItem } from "../types";
import { cva, cx, RecipeVariantProps, sva } from "../../../styled-system/css";
import { SURFACE_VARIANTS } from "../../theme/variants/surface";

const styles = sva({
  slots: ["container"],
  base: {
    container: {
      display: "flex",
      colorPalette: "gray",

      color: {
        base: "colorPalette.11",
        _hover: "colorPalette.12",
        _active: "colorPalette.9",
      },
    },
  },
  variants: {
    ...SURFACE_VARIANTS,
  },
});

export type SelectVariants = RecipeVariantProps<typeof styles>;
type Props = React.ComponentPropsWithoutRef<"select"> &
  SelectVariants & {
    items: SelectItem[];
  };

const Select = ({
  children,
  className,
  items,
  variant = "default",
  size = "medium",
  ...props
}: Props) => {
  const classes = styles({ size, variant });
  return (
    <select className={cx(classes.container, className)} {...props}>
      {items.map((item) => (
        <option value={item.value}>{item.title}</option>
      ))}
    </select>
  );
};

export default Select;
