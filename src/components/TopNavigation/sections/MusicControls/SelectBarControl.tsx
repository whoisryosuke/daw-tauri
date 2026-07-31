import React from "react";
import type { SelectItem } from "../../../types";
import SelectSimple, { SelectProps } from "../../../primitives/SelectSimple";

type Props = Omit<SelectProps, "items"> & {};

const SELECT_BAR_ITEMS: SelectItem[] = [
  {
    value: "8-bar",
    title: "8 Bars",
  },
  {
    value: "4-bar",
    title: "4 Bars",
  },
  {
    value: "2-bar",
    title: "2 Bars",
  },
  {
    value: "1-bar",
    title: "1 Bar",
  },
  {
    value: "1-2",
    title: "1/2",
  },
  {
    value: "1-2T",
    title: "1/2T",
  },
  {
    value: "1-4",
    title: "1/4",
  },
  {
    value: "1-8",
    title: "1/8",
  },
  {
    value: "1-16",
    title: "1/16",
  },
  {
    value: "1-16T",
    title: "1/16T",
  },
  {
    value: "1-32",
    title: "1/32",
  },
];

const SelectBarControl = ({ ...props }: Props) => {
  return (
    <SelectSimple
      defaultValue="1-bar"
      size="small"
      items={SELECT_BAR_ITEMS}
      {...props}
    />
  );
};

export default SelectBarControl;
