import {
  MouseEventHandler,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

export type MouseDelta = { x: number; y: number };
export type useDragHandleCallback = (delta: MouseDelta) => void;

export function useDragHandle(callback: useDragHandleCallback) {
  const [dragging, setDragging] = useState(false);

  // Use a ref for the callback to prevent the useEffect from
  // re-running every time the parent component re-renders
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const mousePos = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  });

  const handleMouseUp = useCallback((e: MouseEvent) => {
    setDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const deltaX = e.clientX - mousePos.current.lastX;
    const deltaY = e.clientY - mousePos.current.lastY;

    callbackRef.current({
      x: deltaX,
      y: deltaY,
    });

    // Update last position to the current position for the next frame
    mousePos.current.lastX = e.clientX;
    mousePos.current.lastY = e.clientY;
  }, []);

  const handleMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();

    mousePos.current.startX = e.clientX;
    mousePos.current.startY = e.clientY;
    mousePos.current.lastX = e.clientX;
    mousePos.current.lastY = e.clientY;

    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  return { dragging, handleMouseDown };
}
