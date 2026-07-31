import React from "react";
import Button, { ButtonProps } from "../../../ui/Button";

type Props = ButtonProps & {};

const ControlButton = (props: Props) => {
  return <Button size="small" {...props} />;
};

export default ControlButton;
