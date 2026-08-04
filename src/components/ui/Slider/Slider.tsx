import { Slider as BaseSlider, SliderRootProps } from "@base-ui/react/slider";
import { css, cx, sva } from "../../../../styled-system/css";
import { ColorPalette } from "../../../../styled-system/tokens";

// Define the slider recipe using sva for slots
const slider = sva({
  slots: ["root", "control", "track", "indicator", "thumb"],
  base: {
    root: {
      display: "flex",
      width: "100%",
      touchAction: "none",
      alignItems: "center",
      py: "3",
      userSelect: "none",
    },
    control: { display: "flex", width: "full", alignItems: "center", gap: "2" },
    track: {
      h: "1",
      w: "full",
      bg: "gray.6",
      userSelect: "none",
    },
    indicator: {
      colorPalette: "gray",
      bg: "colorPalette.11",
      userSelect: "none",
    },
    thumb: {
      width: "3",
      height: "3",
      bg: {
        base: "gray.9",
        _hover: "gray.11",
        _active: "gray.10",
      },
      borderRadius: 1,
      userSelect: "none",
      _focusVisible: {
        outline: "2px solid",
        outlineOffset: "2",
        outlineColor: "gray.9",
      },
    },
  },
  variants: {
    // Add any variants here if needed
  },
});

type Props = SliderRootProps & {
  className?: string;
  color?: ColorPalette;
};

export default function Slider({ className, color = "gray", ...props }: Props) {
  const classes = slider();
  const colorStyle = css({
    colorPalette: color,
  });

  return (
    <BaseSlider.Root className={cx(classes.root, className)} {...props}>
      <BaseSlider.Control className={classes.control}>
        <BaseSlider.Track className={classes.track}>
          <BaseSlider.Indicator className={cx(classes.indicator, colorStyle)} />
          <BaseSlider.Thumb className={classes.thumb} aria-label="Volume" />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
