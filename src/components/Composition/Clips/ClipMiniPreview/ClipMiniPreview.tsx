import React from "react";
import Text from "../../../ui/Typography/Text";
import Heading from "../../../ui/Typography/Heading";
import { Stack } from "../../../../../styled-system/jsx";
import { Clip } from "../../../../store/composition";
import { css, cx } from "../../../../../styled-system/css";
import Icon from "../../../primitives/Icon/Icon";

const containerStyle = css({
  p: 4,
  borderRadius: 4,
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "gray.4",
  userSelect: "none",
});

const iconStyle = css({
  color: "gray.10",
});

const labelStyle = css({
  color: "gray.8",
  fontSize: 1,
  fontFamily: "mono",
});
const titleStyle = css({
  maxWidth: "200px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  color: {
    base: "gray.11",
    _groupHover: "gray.12",
  },
  fontSize: 2,
  textWrap: "nowrap",
  textOverflow: "ellipsis",

  _motionSafe: {
    transitionProperty: "color",
    transitionTimingFunction: "ease-in-out",
    transitionDuration: "slow",
  },
});
const durationStyle = css({
  color: {
    base: "gray.10",
    _groupHover: "gray.11",
  },
  fontSize: 1,
  fontFamily: "mono",

  _motionSafe: {
    transitionProperty: "color",
    transitionTimingFunction: "ease-in-out",
    transitionDuration: "slow",
  },
});

type Props = Pick<Clip, "name" | "duration"> & {};

const ClipMiniPreview = ({ name, duration }: Props) => {
  return (
    <Stack className={cx("group", containerStyle)} gap={1}>
      <Text className={labelStyle}>Selected Clip</Text>
      <Stack flexDir="row" alignItems="center">
        <Icon icon="samples" className={iconStyle} />
        <Text className={titleStyle} title={name}>
          {name}
        </Text>
        <Text className={durationStyle}>{duration.toFixed(2)}s</Text>
      </Stack>
    </Stack>
  );
};

export default ClipMiniPreview;
