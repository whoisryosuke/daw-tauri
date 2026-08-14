import { Toast } from "@base-ui/react";
import React from "react";
import { css } from "../../../../styled-system/css";

/**
 * Recipe for the Toast Button
 * Using cva because it is a single element with variants.
 */
const toastButton = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "2",
  borderRadius: 3,
  borderWidth: "1px",
  borderColor: "gray.3",
  bg: "gray.2",
  color: "gray.11",
  paddingInline: "3",
  paddingBlock: "0",
  fontFamily: "inherit",
  lineHeight: "none",
  whiteSpace: "nowrap",
  fontWeight: "normal",
  userSelect: "none",
  fontSize: "3",

  _disabled: {
    borderColor: "gray.5",
    color: "gray.5",
  },
});

export default function ToastButton() {
  const toastManager = Toast.useToastManager();
  const [count, setCount] = React.useState(0);

  function createToast() {
    setCount((prev) => prev + 1);
    toastManager.add({
      title: `Toast ${count + 1} created`,
      description: "This is a toast notification.",
      data: {
        type: count % 2 == 1 ? "error" : null,
      },
    });
  }

  return (
    <button type="button" className={toastButton} onClick={createToast}>
      Create toast
    </button>
  );
}
