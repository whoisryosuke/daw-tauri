import React, { useEffect } from "react";

export type HotkeyModifier = "shift" | "ctrl";

/**
 * For the "key" to our mapping, we use the format:
 * ctrl+shift+key in that exact order
 */
type HotkeyKey = string;

// @TODO: Hardcoded for now - but ideally needs to be dynamic
const HOTKEY_MAP: Record<HotkeyKey, VoidFunction> = {
  c: () => console.log("c pressed"),
  "ctrl+g": () => console.log("ctrl+g pressed"),
};

type Props = {};

const Hotkeys = (props: Props) => {
  // If pressed key is our target key then set to true
  function downHandler({
    ctrlKey,
    shiftKey,
    metaKey,
    key,
    stopPropagation,
    preventDefault,
    stopImmediatePropagation,
  }: KeyboardEvent): void {
    // Logic to parse event (e.g., checking event.ctrlKey + event.key)
    // For simplicity, we'll check exact matches for this example
    const pressed = [];
    if (ctrlKey || metaKey) pressed.push("ctrl");
    if (shiftKey) pressed.push("shift");
    if (!["Control", "Meta", "Shift"].includes(key)) {
      pressed.push(key.toLowerCase());
    }

    const currentCombo = pressed.join("+");

    if (currentCombo in HOTKEY_MAP) {
      const hotkey = HOTKEY_MAP[currentCombo];

      stopPropagation();
      preventDefault();
      stopImmediatePropagation();
      hotkey();
    }
  }

  // Add event listeners for keypress
  useEffect(() => {
    if (typeof window == "undefined") return;

    window.addEventListener("keydown", downHandler);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("keydown", downHandler);
    };
  }, []);

  return <></>;
};

export default Hotkeys;
