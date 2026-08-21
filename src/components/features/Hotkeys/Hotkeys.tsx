import React, { useEffect } from "react";
import { deleteSelectedTrackClip } from "../../../services/composition";

export type HotkeyModifier = "shift" | "ctrl";

/**
 * For the "key" to our mapping, we use the format:
 * ctrl+shift+key in that exact order
 */
type HotkeyKey = string;

// @TODO: Hardcoded for now - but ideally needs to be dynamic
// @TODO: Also consider - scopes. Enable only if scope is active (good for delete clip vs delete node)
const HOTKEY_MAP: Record<HotkeyKey, VoidFunction> = {
  delete: () => deleteSelectedTrackClip(),
};

type Props = {};

const Hotkeys = (props: Props) => {
  // If pressed key is our target key then set to true
  function downHandler(e: KeyboardEvent): void {
    // Logic to parse event (e.g., checking event.ctrlKey + event.key)
    // For simplicity, we'll check exact matches for this example
    const pressed = [];
    if (e.ctrlKey || e.metaKey) pressed.push("ctrl");
    if (e.shiftKey) pressed.push("shift");
    if (!["Control", "Meta", "Shift"].includes(e.key)) {
      pressed.push(e.key.toLowerCase());
    }

    const currentCombo = pressed.join("+");

    if (currentCombo in HOTKEY_MAP) {
      const hotkey = HOTKEY_MAP[currentCombo];

      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();
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
