import { useState, type Dispatch, type SetStateAction } from "react";

type UseCarouselResult = {
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  next: () => void;
  prev: () => void;
};

export const useCarousel = (length = 0): UseCarouselResult => {
  const [activeIndex, setActiveIndex] = useState(0);

  const next = () => {
    if (length <= 0) return;
    setActiveIndex((p) => (p + 1) % length);
  };

  const prev = () => {
    if (length <= 0) return;
    setActiveIndex((p) => (p - 1 + length) % length);
  };

  return {
    activeIndex,
    setActiveIndex,
    next,
    prev,
  };
};
