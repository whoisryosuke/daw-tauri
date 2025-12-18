import React, {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MouseEventHandler,
  type SetStateAction,
} from "react";
import styles from "./ExpandablePanel.module.css";
import type { ExpandablePanelSize } from "./types";

type Props = {
  setSize: Dispatch<SetStateAction<ExpandablePanelSize>>;
};

const ExpandablePanelDragHandle = ({ setSize }: Props) => {
  const [dragging, setDragging] = useState(false);
  const mousePos = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  });

  const handleMouseUp = (e: MouseEvent) => {
    setDragging(false);
  };
  const handleMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
    mousePos.current.startX = e.clientX;
    mousePos.current.startY = e.clientY;
    mousePos.current.lastX = e.clientX;
    mousePos.current.lastY = e.clientY;

    setDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    mousePos.current.lastX = e.clientX;
    mousePos.current.lastY = e.clientY;

    // Measure distance
    const width = mousePos.current.lastX - mousePos.current.startX;
    console.log("dragging panel", e.clientX);
    // const height = mousePos.current.lastY - mousePos.current.startY;
    setSize((prev) => ({
      width: prev.width + width,
      height: prev.height,
      //   height: prev.height + height,
    }));

    // Since we synced -- reset the "start"
    mousePos.current.startX = e.clientX;
    mousePos.current.startY = e.clientY;
  };

  useEffect(() => {
    if (!dragging) return;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [dragging]);

  return <div className={styles.DragHandle} onMouseDown={handleMouseDown} />;
};

export default ExpandablePanelDragHandle;
