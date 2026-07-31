import React from "react";
import Button, { ButtonProps } from "../../../ui/Button";

type Props = ButtonProps & {};

const ControlIconButton = (props: Props) => {
  return <Button {...props} />;
};

export default ControlIconButton;
