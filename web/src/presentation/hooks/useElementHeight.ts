import { useCallback, useEffect, useRef, useState } from "react";

export const useElementHeight = <TElement extends HTMLElement>() => {
  const cleanupRef = useRef<(() => void) | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  const ref = useCallback((element: TElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (!element) {
      setHeight(null);
      return;
    }

    const updateHeight = () => {
      setHeight(element.getBoundingClientRect().height);
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeight);
      cleanupRef.current = () =>
        window.removeEventListener("resize", updateHeight);

      return;
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    window.addEventListener("resize", updateHeight);

    cleanupRef.current = () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  useEffect(
    () => () => {
      cleanupRef.current?.();
    },
    []
  );

  return { height, ref };
};
