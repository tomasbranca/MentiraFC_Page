import { useEffect, useState, type RefObject } from "react";

export const useElementHeight = <TElement extends HTMLElement>(
  ref: RefObject<TElement | null>
) => {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const updateHeight = () => {
      setHeight(element.getBoundingClientRect().height);
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeight);

      return () => window.removeEventListener("resize", updateHeight);
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [ref]);

  return height;
};
