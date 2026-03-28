import { useState } from "react";

export const useCarousel = (length = 0) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const next = () => {
    setActiveIndex((p) => (p + 1) % length);
  };

  const prev = () => {
    setActiveIndex((p) => (p - 1 + length) % length);
  };

  return {
    activeIndex,
    setActiveIndex,
    next,
    prev,
  };
};