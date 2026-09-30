import React, {
  ChangeEventHandler,
  KeyboardEventHandler,
  useRef,
  useState,
} from "react";
import { css, cx } from "../../../../styled-system/css";
import Text from "../../ui/Typography/Text";
import { updateTrackName } from "../../../services/composition";

const textStyle = css({
  fontSize: 1,
});
const headingStyle = css({
  userSelect: "none",
});

type Props = {
  id: string;
  name: string;
};

const TrackName = ({ id, name }: Props) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange: KeyboardEventHandler = (e) => {
    if (!inputRef.current || inputRef.current.value == "") return;

    // Cancelled? Don't save and go back to non-editing
    if (e.code == "Escape") {
      setEditing(false);
    }

    // Pressed enter? Confirm
    if (e.code == "Enter") {
      // Change track name
      updateTrackName(id, inputRef.current.value);
      setEditing(false);
    }
  };

  const handlStartEdit = () => {
    setEditing(true);
  };

  const handleBlur = () => {
    setEditing(false);
  };

  const render = editing ? (
    <input
      ref={inputRef}
      className={textStyle}
      defaultValue={name}
      onKeyDown={handleChange}
      onBlur={handleBlur}
    />
  ) : (
    <Text className={cx(headingStyle, textStyle)} onClick={handlStartEdit}>
      {name}
    </Text>
  );

  return render;
};

export default TrackName;
