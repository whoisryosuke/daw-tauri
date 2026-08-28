import { Input } from "@base-ui/react";
import React, { ChangeEvent } from "react";
import { sva } from "../../../../styled-system/css";
import { Stack } from "../../../../styled-system/jsx";

const styles = sva({
  slots: ["container", "icon", "input"],
  base: {
    container: {
      borderRadius: 4,
      bgLinear: "to-b",
      gradientFrom: {
        base: "gray.4",
        _hover: "gray.5",
      },
      gradientTo: {
        base: "gray.5",
        _hover: "gray.6",
      },
      p: 2,

      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "gray.6",

      color: "gray.12",

      "&:focus-within": {
        outlineWidth: "1.5px",
        outlineStyle: "solid",
        outlineColor: "gray.8",
      },

      _motionSafe: {
        transitionProperty: "background-color, color, border-color",
        transitionTimingFunction: "ease-in-out",
        transitionDuration: "slow",
      },
    },
    input: {
      bg: "transparent",

      outline: "none",
    },
  },
});

type Props = {
  search: string;
  setSearchTerm: (search: string) => void;
};

const MediaSearch = ({ search, setSearchTerm }: Props) => {
  const classes = styles();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.currentTarget.value);
  };

  return (
    <Stack className={classes.container} gap={0}>
      <input
        className={classes.input}
        value={search}
        onChange={handleChange}
        placeholder="Search"
      />
    </Stack>
  );
};

export default MediaSearch;
