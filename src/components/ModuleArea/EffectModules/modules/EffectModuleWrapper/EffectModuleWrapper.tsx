import React, { PropsWithChildren } from "react";
import Heading from "../../../../ui/Typography/Heading";
import { cx, sva } from "../../../../../../styled-system/css";
import { Stack } from "../../../../../../styled-system/jsx";

const styles = sva({
  slots: ["container", "title", "content"],
  base: {
    container: {
      minWidth: "150px",
      height: "100%",
      backgroundColor: "gray.4",
      borderRadius: 2,
      overflow: "hidden",
    },
    title: {
      width: "100%",
      backgroundColor: "gray.2",
      color: "gray.10",
      fontSize: 2,
      fontFamily: "body",
      py: 1,
      px: 2,
    },
    content: {
      px: 3,
      py: 2,
    },
  },
});

type Props = {
  title: string;
  className?: string;
};

const EffectModuleWrapper = ({
  title,
  children,
  className,
  ...props
}: PropsWithChildren<Props>) => {
  const classes = styles();
  return (
    <Stack className={cx(classes.container, className)}>
      <div className={classes.title}>
        <h5>{title}</h5>
      </div>
      <div className={classes.content}>{children}</div>
    </Stack>
  );
};

export default EffectModuleWrapper;
