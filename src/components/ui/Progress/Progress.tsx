import React from "react";
import {
  Progress as BaseProgress,
  ProgressRootProps,
} from "@base-ui/react/progress";
import { sva } from "../../../../styled-system/css";

export const progressStyles = sva({
  slots: ["root", "label", "value", "track", "indicator"],
  base: {
    root: {
      display: "grid",
      maxWidth: "full",
      flex: 1,
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      rowGap: "2",
    },
    label: {
      fontSize: "3",
      fontWeight: "normal",
      color: "gray.9",
    },
    value: {
      textAlign: "right",
      fontSize: "3",
      color: "gray.9",
    },
    track: {
      gridColumn: "span 2 / span 2",
      height: "1",
      overflow: "hidden",
      backgroundColor: "gray.2",
      borderRadius: 2,
    },
    indicator: {
      backgroundColor: "blue.6",
      transitionProperty: "width",
      transitionDuration: "500ms",
    },
  },
});

type Props = ProgressRootProps & {
  title?: string;
};

const Progress = ({ title, ...props }: Props) => {
  const classes = progressStyles();
  return (
    <BaseProgress.Root className={classes.root} {...props}>
      {title && (
        <BaseProgress.Label className={classes.label}>
          {title}
        </BaseProgress.Label>
      )}
      <BaseProgress.Value className={classes.value} />
      <BaseProgress.Track className={classes.track}>
        <BaseProgress.Indicator className={classes.indicator} />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
};

export default Progress;
