import React from "react";
import Button, { ButtonProps } from "../../../ui/Button";

type Props = Omit<ButtonProps, "variant" | "size"> & {};

const ControlIconButton = (props: Props) => {
  return <Button {...props} variant="default" size="medium" />;
};

export default ControlIconButton;
