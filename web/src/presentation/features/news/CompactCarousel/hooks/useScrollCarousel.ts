// @ts-nocheck
import { useState } from "react";

export const useScrollCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const calculateIndex = (container) => {
    if (!container) return 0;

    const scrollLeft = container.scrollLeft;
    const firstChild = container.firstElementChild;

    const width =
      firstChild?.offsetWidth || container.offsetWidth;

    if (!width) return 0;

    return Math.round(scrollLeft / width);
  };

  const handleScroll = (container) => {
    const index = calculateIndex(container);
    setActiveIndex(index);
  };

  return {
    activeIndex,
    handleScroll,
  };
};