import { Select } from "@radix-ui/themes";
import React from "react";
import type { SelectItem } from "../types";

type Props = Select.RootProps & {
  items: SelectItem[];
};

const SelectSimple = ({ items, ...props }: Props) => {
  return (
    <Select.Root {...props}>
      <Select.Trigger
        variant="ghost"
        color="gray"
        style={{
          background: "var(--gray-4)",
          margin: "var(--space-0-5)",
          border: 0,
        }}
      />
      <Select.Content variant="solid">
        {items.map((item) => (
          <Select.Item value={item.value}>{item.title}</Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
};

export default SelectSimple;
