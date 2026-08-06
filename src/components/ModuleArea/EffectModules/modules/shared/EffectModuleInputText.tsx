import React, { PropsWithChildren } from "react";
import Text from "../../../../ui/Typography/Text";
import { css } from "../../../../../../styled-system/css";

const textStyle = css({
  color: "gray.11",
  fontSize: 2,
});

type Props = {};

const EffectModuleInputText = ({ children }: PropsWithChildren<Props>) => {
  return <Text className={textStyle}>{children}</Text>;
};

export default EffectModuleInputText;
