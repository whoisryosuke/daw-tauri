import React, { HTMLProps } from "react";
import type { SelectItem } from "../types";
import { cx } from "../../../styled-system/css";
import { button, ButtonVariant } from "../../../styled-system/recipes";

export type SelectProps = ButtonVariant &
  React.ComponentPropsWithoutRef<"select"> & {
    items: SelectItem[];
  };

const Select = ({
  children,
  className,
  items,
  variant = "default",
  size = "medium",
  ...props
}: SelectProps) => {
  const classes = button({ size, variant });
  return (
    <select className={cx(classes.container, className)} {...props}>
      {items.map((item) => (
        <option value={item.value}>{item.title}</option>
      ))}
    </select>
  );
};

export default Select;
