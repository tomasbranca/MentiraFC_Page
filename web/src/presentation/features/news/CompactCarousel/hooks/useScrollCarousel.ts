import { useState } from "react";

export const useScrollCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const calculateIndex = (container: HTMLDivElement | null) => {
    if (!container) return 0;

    const scrollLeft = container.scrollLeft;
    const firstChild = container.firstElementChild;

    const width =
      firstChild instanceof HTMLElement
        ? firstChild.offsetWidth
        : container.offsetWidth;

    if (!width) return 0;

    return Math.round(scrollLeft / width);
  };

  const handleScroll = (container: HTMLDivElement | null) => {
    const index = calculateIndex(container);
    setActiveIndex(index);
  };

  return {
    activeIndex,
    handleScroll,
  };
};
