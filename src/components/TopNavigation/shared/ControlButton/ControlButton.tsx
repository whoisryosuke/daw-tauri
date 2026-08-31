import React from "react";
import Button, { ButtonProps } from "../../../ui/Button";

type Props = Omit<ButtonProps, "size" | "variant"> & {};

const ControlButton = (props: Props) => {
  return <Button {...props} size="small" variant="default" />;
};

export default ControlButton;
