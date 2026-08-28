import { Slider as BaseSlider, SliderRootProps } from "@base-ui/react/slider";
import {
  css,
  cx,
  RecipeVariantProps,
  sva,
} from "../../../../styled-system/css";
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
      colorPalette: "gray",
    },
    control: { display: "flex", width: "full", alignItems: "center", gap: "2" },
    track: {
      h: "1",
      w: "full",
      bg: "gray.6",
      userSelect: "none",
      borderRadius: 1,
    },
    indicator: {
      bg: "colorPalette.11",
      userSelect: "none",
      borderRadius: 1,
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
    alpha: {
      true: {
        track: {
          bg: "colorPalette.alpha-9",
        },
        indicator: {
          colorPalette: "gray",
          bg: "colorPalette.alpha-9",
          userSelect: "none",
        },
        thumb: {
          bg: {
            base: "colorPalette.7",
            _hover: "colorPalette.8",
            _active: "colorPalette.6",
          },
        },
      },
    },
  },
});

type SliderVariants = RecipeVariantProps<typeof slider>;

type Props = SliderRootProps &
  SliderVariants & {
    className?: string;
    color?: ColorPalette;
  };

export default function Slider({
  className,
  color = "gray",
  alpha,
  ...props
}: Props) {
  const classes = slider({ alpha });
  const colorStyle = css({
    colorPalette: color,
  });

  return (
    <BaseSlider.Root
      className={cx(classes.root, className, colorStyle)}
      {...props}
    >
      <BaseSlider.Control className={classes.control}>
        <BaseSlider.Track className={classes.track}>
          <BaseSlider.Indicator className={cx(classes.indicator)} />
          <BaseSlider.Thumb className={classes.thumb} aria-label="Volume" />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
