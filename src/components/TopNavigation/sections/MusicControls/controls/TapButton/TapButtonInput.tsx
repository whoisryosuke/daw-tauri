import { useAtom } from "jotai/react";
import React, {
  ChangeEventHandler,
  KeyboardEventHandler,
  useEffect,
  useRef,
  useState,
} from "react";
import { bpmAtom } from "../../../../../../store/composition";
import { css, cx } from "../../../../../../../styled-system/css";
import { button } from "../../../../../../../styled-system/recipes";

const containerStyle = css({
  "&:focus-within": {
    outlineWidth: "1.5px",
    outlineStyle: "solid",
    outlineColor: "gray.8",
  },
});
const inputStyle = css({
  fieldSizing: "content",
  minWidth: "6ch",

  userSelect: "initial",

  "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
    WebkitAppearance: "none",
    margin: 0,
  },
  "&:focus": {
    outline: 0,
  },
});

type Props = {};

const TapButtonInput = (props: Props) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [BPM, setBPM] = useAtom(bpmAtom);

  const styles = button({ variant: "default", size: "small" });

  const handleClick = () => {
    console.log("toggle edit mode");
    if (editing) return;
    setEditing(true);
  };

  useEffect(() => {
    if (editing) {
      if (inputRef.current) inputRef.current.focus();
    }
  }, [editing]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const newValue = parseFloat(e.currentTarget.value);
    console.log("new value", newValue, Number.isNaN(newValue));
    if (!Number.isNaN(newValue)) setBPM(newValue);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key == "Enter" || e.key == "Escape" || e.key == "Return") {
      setEditing(false);
    }
  };

  const handleBlur = () => {
    setEditing(false);
  };

  return (
    <div className={cx(styles.container, containerStyle)} onClick={handleClick}>
      <input
        ref={inputRef}
        type="number"
        pattern="[0-9]*"
        className={cx(inputStyle)}
        value={editing ? BPM : BPM.toFixed(2)}
        readOnly={!editing}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
    </div>
  );
};

export default TapButtonInput;
