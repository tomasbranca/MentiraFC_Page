import { useRef } from "react";
import NewsCard from "../../../components/NewsCard/NewsCard";
import "./CompactCarousel.css";

import { useScrollCarousel } from "./hooks/useScrollCarousel";
import type { NewsItem } from "../../../../types/models";

type CompactCarouselProps = {
  items?: NewsItem[];
};

const CompactCarousel = ({ items = [] }: CompactCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { activeIndex, handleScroll } = useScrollCarousel();

  if (!items.length) return null;

  return (
    <div className="w-full">
      {/* Carrusel */}
      <div
        ref={scrollRef}
        onScroll={() => handleScroll(scrollRef.current)}
        className="
          flex
          gap-4
          overflow-x-auto
          scroll-smooth
          snap-x snap-mandatory
          pb-4 px-1
          no-scrollbar
        "
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="
              snap-start
              shrink-0
              w-[85%]
              h-40
            "
          >
            <NewsCard item={item} variant="compact" />
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-2">
        {items.map((_, i) => (
          <div
            key={i}
            className={`
              h-2 w-2 rounded-full transition-all
              ${i === activeIndex ? "bg-violet-600 w-4" : "bg-gray-400"}
            `}
          />
        ))}
      </div>
    </div>
  );
};

export default CompactCarousel;
