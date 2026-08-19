import { useEffect, useRef, useState, useCallback } from "react";

export type MouseDelta = { x: number; y: number };
export type useDragHandleCallback = (delta: MouseDelta) => void;

export function useDragHandle(callback: useDragHandleCallback) {
  const [dragging, setDragging] = useState(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const mousePos = useRef({
    lastX: 0,
    lastY: 0,
  });

  const targetRef = useRef<HTMLElement | null>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging) return;

      const deltaX = e.clientX - mousePos.current.lastX;
      const deltaY = e.clientY - mousePos.current.lastY;

      callbackRef.current({
        x: deltaX,
        y: deltaY,
      });

      mousePos.current.lastX = e.clientX;
      mousePos.current.lastY = e.clientY;
    },
    [dragging],
  );

  const handlePointerUp = useCallback((e: PointerEvent) => {
    setDragging(false);
    // Release the capture
    if (targetRef.current) {
      targetRef.current.releasePointerCapture(e.pointerId);
      targetRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Prevent the dnd-kit clip drag from triggering
      e.stopPropagation();

      // Capture the pointer
      // It forces all move/up events to this element even if the mouse leaves it.
      e.currentTarget.setPointerCapture(e.pointerId);
      targetRef.current = e.currentTarget;

      mousePos.current.lastX = e.clientX;
      mousePos.current.lastY = e.clientY;

      setDragging(true);
    },
    [],
  );

  useEffect(() => {
    if (dragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging, handlePointerMove, handlePointerUp]);

  return { dragging, handlePointerDown };
}
