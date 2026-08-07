import { useEffect, type PropsWithChildren } from "react";
// Fonts
import "@fontsource-variable/instrument-sans/wght.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/700.css";
import { useAtom } from "jotai";
import { ColorMode, colorModeStore } from "../store/theme";
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

  const setColorModeOnBody = (newColorMode: ColorMode) => {
    const body = document.getElementsByTagName("body")[0];
    if (newColorMode == "dark" && !body.classList.contains("dark"))
      body.classList.add("dark");

    if (newColorMode == "light" && body.classList.contains("dark"))
      body.classList.remove("dark");
  };

  useEffect(() => {
    // Detect user's system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Set initial value based on system preference
    setColorMode(mediaQuery.matches ? "dark" : "light");

    // Listen for changes to system preference
    const handleChange = (e: MediaQueryListEvent) => {
      const newColorMode = e.matches ? "dark" : "light";
      setColorMode(newColorMode);
    };

    mediaQuery.addEventListener("change", handleChange);

    // Cleanup listener on unmount
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    setColorModeOnBody(colorMode);
  }, [colorMode]);

  return <div className={cx(theme ?? colorMode, colorStyle)}>{children}</div>;
};

export default AppWrapper;
