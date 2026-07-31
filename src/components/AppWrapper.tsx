import type { PropsWithChildren } from "react";
// Fonts
import "@fontsource-variable/instrument-sans/wght.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/700.css";

type Props = {
  theme?: "light" | "dark";
  // uiScale?: UIScaleThemes;
};

const AppWrapper = ({ theme, children }: PropsWithChildren<Props>) => {
  return <div className={theme == "dark" ? "dark" : ""}>{children}</div>;
};

export default AppWrapper;
