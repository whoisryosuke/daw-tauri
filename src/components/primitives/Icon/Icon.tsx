import React from "react";
import type { AppIcons } from "./icons";
import ICONS from "./icons";

type Props = {
  icon: AppIcons;
};

const Icon = ({ icon, ...props }: Props) => {
  const IconComponent = icon in ICONS ? ICONS[icon] : ICONS["samples"];

  return <IconComponent {...props} />;
};

export default Icon;
