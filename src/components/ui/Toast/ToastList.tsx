import * as React from "react";
import { Toast } from "@base-ui/react/toast";
import { sva } from "../../../../styled-system/css";
import { BiX } from "react-icons/bi";

const toastRecipe = sva({
  slots: ["root", "content", "title", "description", "close"],
  base: {
    root: {
      position: "fixed",
      right: 2,
      bottom: 2,
      left: "auto",
      zIndex: "calc(1000 - var(--toast-index))",
      marginInlineEnd: 0,
      transformOrigin: "bottom",
      // Handling complex arbitrary CSS variables and transforms
      "--gap": "0.75rem",
      "--peek": "0.75rem",
      "--scale": "calc(max(0, 1 - (var(--toast-index) * 0.1)))",
      "--shrink": "calc(1 - var(--scale))",
      "--height": "var(--toast-frontmost-height, var(--toast-height))",
      "--offset-y":
        "calc(var(--toast-offset-y) * -1 + calc(var(--toast-index) * var(--gap) * -1) + var(--toast-swipe-movement-y))",
      transform:
        "translateX(var(--toast-swipe-movement-x)) translateY(calc(var(--toast-swipe-movement-y) - (var(--toast-index) * var(--peek)) - (var(--shrink) * var(--height)))) scale(var(--scale))",
      borderRadius: 3,
      borderWidth: "1.5px",
      borderColor: "gray.3",
      bg: "gray.2",
      color: "gray.11",
      userSelect: "none",
      height: "var(--height)",
      // Pseudo-elements and data attributes
      "&::after": {
        content: '""',
        position: "absolute",
        top: "100%",
        left: 0,
        height: "calc(var(--gap) + 1px)",
        width: "full",
      },
      "&[data-ending-style]": { opacity: 0 },
      "&[data-expanded]": {
        transform:
          "translateX(var(--toast-swipe-movement-x)) translateY(calc(var(--offset-y)))",
        height: "var(--toast-height)",
      },
      "&[data-limited]": { opacity: 0 },
      "&[data-starting-style]": { transform: "translateY(150%)" },
      // Transition logic
      _motionSafe: {
        transition:
          "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s, height 0.15s",
      },
    },
    content: {
      display: "flex",
      alignItems: "center",
      gap: "4",
      paddingInline: 4,
      paddingBlock: 3,
      overflow: "hidden",
      _motionSafe: {
        transition: "opacity 250ms ease-[cubic-bezier(0.22,1,0.36,1)]",
      },
      "&[data-behind]": { opacity: 0 },
      "&[data-expanded]": { opacity: 100 },
    },
    title: {
      fontSize: 2,
      fontWeight: "bold",
    },
    description: {
      fontSize: 2,
    },
    close: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "2",
      borderRadius: 3,
      borderWidth: "1.5px",
      borderColor: "gray.5",
      bg: {
        base: "gray.4",
        _hover: "gray.5",
        _active: "gray.3",
      },
      paddingInline: 2,
      paddingBlock: 2,
      fontFamily: "inherit",
      lineHeight: "none",
      whiteSpace: "nowrap",
      fontWeight: "normal",
      color: "gray.11",
      userSelect: "none",
      "&[data-disabled]": {
        borderColor: "gray.5",
        color: "gray.5",
      },
    },
  },
  variants: {
    color: {
      error: {
        root: {
          borderColor: "red.3",
          bg: "red.2",
          color: "red.11",
        },
        close: {
          borderColor: "red.5",
          bg: {
            base: "red.4",
            _hover: "red.5",
            _active: "red.3",
          },
        },
      },
    },
  },
});

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => {
    const isError = toast.data.type == "error";
    const classes = toastRecipe({ color: isError ? "error" : undefined });

    return (
      <Toast.Root key={toast.id} toast={toast} className={classes.root}>
        <Toast.Content className={classes.content}>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Toast.Title className={classes.title} />
            <Toast.Description className={classes.description} />
          </div>
          <Toast.Close className={classes.close}>
            <BiX />
          </Toast.Close>
        </Toast.Content>
      </Toast.Root>
    );
  });
}

export default ToastList;
