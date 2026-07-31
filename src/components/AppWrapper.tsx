import { useEffect, type PropsWithChildren } from "react";
// Fonts
import "@fontsource-variable/instrument-sans/wght.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/700.css";
import { useAtom } from "jotai";
import { colorModeStore } from "../store/theme";
import { css, cx } from "../../styled-system/css";

const colorStyle = css({
  color: "gray.12",
});

type Props = {
  theme?: "light" | "dark";
  // uiScale?: UIScaleThemes;
};

const AppWrapper = ({ theme, children }: PropsWithChildren<Props>) => {
  const [colorMode, setColorMode] = useAtom(colorModeStore);

  useEffect(() => {
    // Detect user's system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Set initial value based on system preference
    setColorMode(mediaQuery.matches ? "dark" : "light");

    // Listen for changes to system preference
    const handleChange = (e: MediaQueryListEvent) => {
      setColorMode(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);

    // Cleanup listener on unmount
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);
  return <div className={cx(theme ?? colorMode, colorStyle)}>{children}</div>;
};

export default AppWrapper;
